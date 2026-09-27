import { runtimeContentMiddleware } from "../tools/runtime-content.mjs";
import { afterEach, expect, it } from "vitest";
import { Readable } from "node:stream";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { workbenchApi } from "../tools/workbench-api.mjs";
import {
  CANONICAL_CONTENT,
  validateContent,
} from "../src/config/configuration";
import {
  createWorkingDraft,
  validateWorkingDraft,
  promoteWorkingWave,
} from "../src/workbench/working-draft";
const cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "workbench-api-"));
  const file = join(dir, "recipes.json");
  await writeFile(file, JSON.stringify(CANONICAL_CONTENT));
  const handler = workbenchApi(file, async () => ({
    validateContent,
    validateWorkingDraft,
    promoteWorkingWave,
  }));
  cleanups.push(() => rm(dir, { recursive: true, force: true }));
  const url = "http://127.0.0.1:4180";
  const request = async (method, path, body, headers = {}) => {
    const req = Object.assign(
      Readable.from(body === undefined ? [] : [JSON.stringify(body)]),
      {
        method,
        url: path,
        headers: { host: "127.0.0.1:4180", ...headers },
        socket: { remoteAddress: "127.0.0.1" },
      },
    );
    let status, result;
    await handler(
      req,
      {
        writeHead(code) {
          status = code;
        },
        end(text) {
          result = JSON.parse(text);
        },
      },
      () => {
        status = 404;
      },
    );
    return { status, json: async () => result };
  };
  const { token } = await (await request("GET", "/__workbench/config")).json();
  const post = (draft, extra = {}) =>
    request("POST", "/__workbench/promote", draft, {
      "content-type": "application/json",
      origin: url,
      "x-workbench-token": token,
      ...Object.fromEntries(
        Object.entries(extra).map(([key, value]) => [key.toLowerCase(), value]),
      ),
    });
  return { dir, file, url, post };
}
it("atomically promotes the selected wave, preserves unrelated edits, and rejects stale retry", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].waves[0].packets[0].groups[0].count = 3;
  draft.content.levels[0].waves[1].reward += 17;
  draft.content.levels[1].startCoins += 19;
  const response = await post(draft);
  expect(response.status).toBe(200);
  const disk = JSON.parse(await readFile(file, "utf8"));
  expect(disk.levels[0].waves[0].packets[0].groups[0].count).toBe(3);
  expect(disk.levels[0].waves[1]).toEqual(CANONICAL_CONTENT.levels[0].waves[1]);
  expect(disk.levels[1]).toEqual(CANONICAL_CONTENT.levels[1]);
  expect((await post(draft)).status).toBe(409);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(disk);
});
it("refuses cross-origin or unauthenticated writes without touching the file", async () => {
  const { file, post } = await fixture();
  const original = await readFile(file, "utf8");
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  expect(
    (await post(draft, { Origin: "https://elsewhere.example" })).status,
  ).toBe(403);
  expect((await post(draft, { "X-Workbench-Token": "wrong" })).status).toBe(
    403,
  );
  expect((await post({ ...draft, content: {} })).status).toBe(409);
  expect(await readFile(file, "utf8")).toBe(original);
});

it("promotion updates runtime JSON without touching the compiled game", async () => {
  const { dir, file, post } = await fixture();
  const bundle = join(dir, "game.js");
  await writeFile(bundle, "already-built-game");
  const handler = runtimeContentMiddleware(file);
  const get = async () => {
    let body, headers;
    await handler(
      { method: "GET", url: "/game-content.json?reload=1" },
      {
        writeHead(code, values) {
          expect(code).toBe(200);
          headers = values;
        },
        end(text) {
          body = text;
        },
      },
      () => {
        throw new Error("route was not handled");
      },
    );
    expect(headers["Cache-Control"]).toBe("no-store");
    return JSON.parse(body);
  };
  expect((await get()).levels[0].waves[0]).toEqual(
    CANONICAL_CONTENT.levels[0].waves[0],
  );
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  Object.assign(draft.content.levels[0].waves[0].packets[0].groups[0], {
    count: 7,
    gap: 1.95,
    delayBefore: 5.15,
  });
  expect((await post(draft)).status).toBe(200);
  expect((await get()).levels[0].waves[0]).toEqual(
    draft.content.levels[0].waves[0],
  );
  expect(await readFile(bundle, "utf8")).toBe("already-built-game");
});
