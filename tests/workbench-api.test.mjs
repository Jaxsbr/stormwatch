import { afterEach, expect, it } from "vitest";
import { Readable } from "node:stream";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { workbenchApi, refreshGamePreview } from "../tools/workbench-api.mjs";
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
async function fixture(refresh = async () => {}) {
  const dir = await mkdtemp(join(tmpdir(), "workbench-api-"));
  const file = join(dir, "recipes.json");
  await writeFile(file, JSON.stringify(CANONICAL_CONTENT));
  const handler = workbenchApi(
    file,
    async () => ({
      validateContent,
      validateWorkingDraft,
      promoteWorkingWave,
    }),
    () => refresh(dir),
  );
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

it("refreshes the built game before reporting promotion success", async () => {
  const { dir, file, post } = await fixture(refreshGamePreview);
  await writeFile(
    join(dir, "index.html"),
    '<script type="module" src="/main.js"></script>',
  );
  await writeFile(
    join(dir, "main.js"),
    'import content from "./recipes.json"; document.body.textContent = JSON.stringify(content.levels[0].waves[0]);',
  );
  await refreshGamePreview(dir);
  const built = async () => {
    const assets = join(dir, "dist/assets");
    const files = (await readdir(assets)).filter((name) =>
      name.endsWith(".js"),
    );
    return (
      await Promise.all(
        files.map((name) => readFile(join(assets, name), "utf8")),
      )
    ).join("\n");
  };
  const original = await built();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  Object.assign(draft.content.levels[0].waves[0].packets[0].groups[0], {
    count: 7,
    gap: 1.95,
    delayBefore: 5.15,
  });
  expect(original).not.toContain("delayBefore:5.15");
  expect((await post(draft)).status).toBe(200);
  expect(await built()).toContain("delayBefore:5.15");
  expect(await built()).toContain("count:7,gap:1.95");
  expect(JSON.parse(await readFile(file, "utf8")).levels[0].waves[0]).toEqual(
    draft.content.levels[0].waves[0],
  );
});

it("reports when config was saved but refreshing the game failed", async () => {
  const { file, post } = await fixture(async () => {
    throw new Error("build failed");
  });
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].waves[0].reward += 1;
  const response = await post(draft);
  const result = await response.json();
  expect(response.status).toBe(200);
  expect(result.previewError).toContain(
    "Game config was saved, but the local game could not refresh",
  );
  expect(result.content).toEqual(JSON.parse(await readFile(file, "utf8")));
});
