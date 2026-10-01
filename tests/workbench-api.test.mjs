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
  promoteAllWorkingChanges,
  createWave,
  createMap,
  rebaseAfterPromotion,
} from "../src/workbench/working-draft";
import { AttemptSession } from "../src/workbench/runs";
import { describeEncounter } from "../src/content/encounter-visuals";
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
    promoteAllWorkingChanges,
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
  const post = (draft, extra = {}, all = false) =>
    request(
      "POST",
      all ? "/__workbench/promote-all" : "/__workbench/promote",
      draft,
      {
        "content-type": "application/json",
        origin: url,
        "x-workbench-token": token,
        ...Object.fromEntries(
          Object.entries(extra).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ]),
        ),
      },
    );
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

it("promotes all edited waves and maps through runtime reload while preserving unrelated disk edits", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].waves[0].reward += 7;
  draft.content.levels[0].waves[1].reward += 9;
  draft.content.levels[1].startCoins += 11;
  const current = structuredClone(CANONICAL_CONTENT);
  current.levels[2].startCoins += 13;
  await writeFile(file, JSON.stringify(current));
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "round-trip",
    levelId: restored.levelId,
    waveId: restored.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const playtest = new AttemptSession(
    promoteWorkingWave(current, restored),
    scenario,
  );
  expect((await post(restored, {}, true)).status).toBe(200);
  let loaded;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json" },
    {
      writeHead(code) {
        expect(code).toBe(200);
      },
      end(body) {
        loaded = JSON.parse(body);
      },
    },
    () => {
      throw new Error("Missing runtime route");
    },
  );
  expect(loaded.levels[0].waves.slice(0, 2)).toEqual(
    draft.content.levels[0].waves.slice(0, 2),
  );
  expect(loaded.levels[1].startCoins).toBe(draft.content.levels[1].startCoins);
  expect(loaded.levels[2]).toEqual(current.levels[2]);
  const reloadedGame = new AttemptSession(loaded, scenario);
  expect(reloadedGame.configurationIdentity).toBe(
    playtest.configurationIdentity,
  );
  expect(reloadedGame.game.level).toEqual(playtest.game.level);
  const rebased = rebaseAfterPromotion(restored, loaded);
  expect(rebased.content).toEqual(rebased.base);
  const disk = await readFile(file, "utf8");
  expect((await post(draft, {}, true)).status).toBe(409);
  expect(await readFile(file, "utf8")).toBe(disk);
});
it("rejects all promotion atomically when another edited wave conflicts", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].waves[0].reward += 7;
  draft.content.levels[0].waves[1].reward += 9;
  const current = structuredClone(CANONICAL_CONTENT);
  current.levels[0].waves[1].reward += 12;
  await writeFile(file, JSON.stringify(current));
  const disk = await readFile(file, "utf8");
  expect((await post(draft, {}, true)).status).toBe(409);
  expect(await readFile(file, "utf8")).toBe(disk);
});

it("keeps an empty new wave in the draft instead of partially promoting all changes", async () => {
  const { file, post } = await fixture();
  const draft = createWave(
    createWorkingDraft(CANONICAL_CONTENT),
    "New wave",
    "new-empty-wave",
  );
  draft.content.levels[0].waves[0].reward += 5;
  const original = await readFile(file, "utf8");
  expect((await post(draft, {}, true)).status).toBe(409);
  expect(await readFile(file, "utf8")).toBe(original);
});

it("promotes every populated wave of a new map together", async () => {
  const { file, post } = await fixture();
  let draft = createMap(
    createWorkingDraft(CANONICAL_CONTENT),
    "New crossing",
    CANONICAL_CONTENT.levels[0].id,
    "new-crossing",
    "new-first",
  );
  draft.content.levels.at(-1).waves[0].packets = [
    { id: "rats", groups: [{ id: "rat", kind: "raider", count: 3, gap: 1 }] },
  ];
  draft = createWave(draft, "Second wave", "new-second");
  draft.content.levels.at(-1).waves[1].packets = [
    { id: "rats", groups: [{ id: "rat", kind: "raider", count: 4, gap: 2 }] },
  ];
  expect((await post(draft, {}, true)).status).toBe(200);
  const disk = JSON.parse(await readFile(file, "utf8"));
  expect(disk.levels.slice(0, -1)).toEqual(CANONICAL_CONTENT.levels);
  expect(disk.levels.at(-1)).toEqual(draft.content.levels.at(-1));
});

it("round trips a new map's visual choice through draft reload, Playtest, Promote and game reload", async () => {
  const { file, post } = await fixture();
  const draft = createMap(
    createWorkingDraft(CANONICAL_CONTENT),
    "New crossing",
    "lantern-pass",
    "new-crossing",
    "new-first",
  );
  const authored = draft.content.levels.at(-1);
  authored.visual = { backdrop: "rainstone" };
  authored.waves[0].packets = [
    { id: "rats", groups: [{ id: "rat", kind: "raider", count: 3, gap: 1 }] },
  ];
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "visual-roundtrip",
    levelId: "new-crossing",
    waveId: "new-first",
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const playtest = new AttemptSession(
    promoteAllWorkingChanges(CANONICAL_CONTENT, restored),
    scenario,
  );
  expect(describeEncounter(playtest.game.level).backdrop).toBe(
    "art/v2/rainstone-riverbank-v2/atlas.webp",
  );
  expect((await post(restored, {}, true)).status).toBe(200);
  let loaded;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json" },
    {
      writeHead(code) {
        expect(code).toBe(200);
      },
      end(body) {
        loaded = JSON.parse(body);
      },
    },
    () => {
      throw new Error("Missing runtime content");
    },
  );
  const reloaded = new AttemptSession(loaded, scenario);
  expect(describeEncounter(reloaded.game.level).backdrop).toBe(
    "art/v2/rainstone-riverbank-v2/atlas.webp",
  );
  expect(reloaded.configurationIdentity).toBe(playtest.configurationIdentity);
});

it("refuses to promote a map with an unapproved backdrop", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].visual = { backdrop: "missing" };
  const original = await readFile(file, "utf8");
  const response = await post(draft);
  expect(response.status).toBe(409);
  expect((await response.json()).error).toContain("lantern-pass");
  expect(await readFile(file, "utf8")).toBe(original);
});

it("round trips rage tuning through saved draft, Playtest, Promote and runtime reload", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.abilityDefaults.bossRage = {
    angrySpeedScale: 1.45,
    ragingSpeedScale: 1.95,
    triggerDamagePercent: 12,
    angrySeconds: 2,
    ragingSeconds: 5,
  };
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "rage-roundtrip",
    levelId: restored.levelId,
    waveId: restored.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const playtest = new AttemptSession(
    promoteWorkingWave(CANONICAL_CONTENT, restored),
    scenario,
  );
  expect((await post(restored)).status).toBe(200);
  let loaded;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json" },
    {
      writeHead(code) {
        expect(code).toBe(200);
      },
      end(body) {
        loaded = JSON.parse(body);
      },
    },
    () => {
      throw new Error("Missing runtime content");
    },
  );
  expect(loaded.levels).toEqual(CANONICAL_CONTENT.levels);
  const reloaded = new AttemptSession(loaded, scenario);
  expect(reloaded.game.bossRage).toEqual({
    angrySpeedScale: 1.45,
    ragingSpeedScale: 1.95,
    triggerDamagePercent: 12,
    angrySeconds: 2,
    ragingSeconds: 5,
  });
  expect(reloaded.configurationIdentity).toBe(playtest.configurationIdentity);
});
