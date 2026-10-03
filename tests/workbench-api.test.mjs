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
import { useRouteLayout } from "../src/workbench/route-authoring";
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

it("round trips poison controls through draft reload, Playtest, atomic promotion and uncached runtime reload", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.abilityDefaults.skunkPoison = {
    durationSeconds: 6,
    tickSeconds: 0.5,
  };
  draft.content.towers.stone.poisonDamage = 7;
  draft.content.enemies.armored.poisonImmune = false;
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "poison-roundtrip",
    levelId: restored.levelId,
    waveId: restored.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const oldAttempt = new AttemptSession(CANONICAL_CONTENT, scenario);
  const playtest = new AttemptSession(
    promoteWorkingWave(CANONICAL_CONTENT, restored),
    scenario,
  );
  expect((await post(restored)).status).toBe(200);
  let loaded;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json" },
    {
      writeHead(code, headers) {
        expect(code).toBe(200);
        expect(headers["Cache-Control"]).toContain("no-store");
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
  expect(reloaded.game.skunkPoison).toEqual({
    durationSeconds: 6,
    tickSeconds: 0.5,
  });
  expect(reloaded.game.towers.stone.poisonDamage).toBe(7);
  expect(reloaded.game.enemies.armored.poisonImmune).toBe(false);
  expect(reloaded.configurationIdentity).toBe(playtest.configurationIdentity);
  expect(oldAttempt.game.skunkPoison).toEqual(
    CANONICAL_CONTENT.abilityDefaults.skunkPoison,
  );
  expect(oldAttempt.game.towers.stone.poisonDamage).toBe(
    CANONICAL_CONTENT.towers.stone.poisonDamage,
  );
  expect(loaded.levels).toEqual(CANONICAL_CONTENT.levels);
  expect((await post(restored)).status).toBe(409);
});

it("round trips shared routes and simultaneous twin bosses through draft, Playtest, promotion and uncached reload", async () => {
  const { file, post } = await fixture();
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  const map = draft.content.levels[0];
  useRouteLayout(draft.content, map, "twin-switchbacks");
  map.requiresBossDefeat = true;
  draft.waveId = map.waves.at(-1).id;
  map.waves = [
    {
      id: draft.waveId,
      title: "Twin route acceptance",
      reward: 25,
      abilities: { ratShield: false, weaselEvade: false },
      packets: [
        {
          id: "twins",
          groups: [
            { id: "a", kind: "boss", count: 1, gap: 1, routeId: "route-a" },
            {
              id: "b",
              kind: "boss",
              count: 1,
              gap: 1,
              routeId: "route-b",
              startTogether: true,
            },
          ],
        },
      ],
    },
  ];
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "route-roundtrip",
    levelId: restored.levelId,
    waveId: restored.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const playtest = new AttemptSession(
    promoteAllWorkingChanges(CANONICAL_CONTENT, restored),
    scenario,
  );
  playtest.game.startWave();
  for (let n = 0; n < 30; n++) playtest.step();
  expect(playtest.game.state.enemies.map((e) => e.routeId)).toEqual([
    "route-a",
    "route-b",
  ]);
  expect(playtest.game.state.enemies[0].spawnedAt).toBe(
    playtest.game.state.enemies[1].spawnedAt,
  );
  expect((await post(restored, {}, true)).status).toBe(200);
  const oldRoutes = structuredClone(playtest.game.level.routes);
  let loaded, cache;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json?reload=route" },
    {
      writeHead(code, headers) {
        expect(code).toBe(200);
        cache = headers["Cache-Control"];
      },
      end(body) {
        loaded = JSON.parse(body);
      },
    },
    () => {
      throw new Error("Missing runtime content");
    },
  );
  expect(cache).toBe("no-store");
  const reloaded = new AttemptSession(loaded, scenario);
  expect(reloaded.configurationIdentity).toBe(playtest.configurationIdentity);
  expect(reloaded.game.level.routes).toEqual(oldRoutes);
  expect(loaded.levels.slice(1)).toEqual(CANONICAL_CONTENT.levels.slice(1));
  const rebased = rebaseAfterPromotion(restored, loaded);
  rebased.content.routeLayouts[0].routes[0].path[2].z = 6;
  rebased.content.routeLayouts[0].routes[0].path[3].z = 6;
  expect((await post(rebased)).status).toBe(200);
  const changed = JSON.parse(await readFile(file, "utf8"));
  expect(new AttemptSession(changed, scenario).game.level.routes).not.toEqual(
    oldRoutes,
  );
  expect(playtest.game.level.routes).toEqual(oldRoutes);
  const stale = await post(rebased);
  expect(stale.status).toBe(409);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(changed);
});

it("round trips authored board metadata through draft reload, real Playtest, scoped promotion and uncached runtime reload", async () => {
  const { file, post } = await fixture();
  const { resolveBoards } = await import("../src/content/boards");
  const { progressionContext } = await import("../src/content/progression");
  const { parseSave } = await import("../src/persistence/save");
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.boards = resolveBoards(draft.content);
  draft.content.boards[0].name = "Authored board fixture";
  draft.content.boards[0].visual.markers = Object.fromEntries(
    draft.content.boards[0].levelIds.map((id, i) => [
      id,
      { x: 20 + i * 25, y: 50 },
    ]),
  );
  const withPendingMap = createMap(
    draft,
    "Pending map",
    draft.levelId,
    "pending-map",
    "pending-wave",
  );
  withPendingMap.levelId = draft.levelId;
  withPendingMap.waveId = draft.waveId;
  withPendingMap.content.levels[1].waves[0].reward += 19; // unrelated pending change
  const reloaded = validateWorkingDraft(
    JSON.parse(JSON.stringify(withPendingMap)),
  );
  const session = new AttemptSession(
    promoteWorkingWave(CANONICAL_CONTENT, reloaded),
    {
      id: "board-round-trip",
      levelId: reloaded.levelId,
      waveId: reloaded.waveId,
      mode: "wave",
      progression: "first-arrival",
      difficulty: "normal",
      seed: 42,
    },
  );
  const before = session.game.level;
  const response = await post(reloaded);
  expect(response.status).toBe(200);
  const disk = JSON.parse(await readFile(file, "utf8"));
  expect(disk.boards).toEqual(draft.content.boards);
  expect(disk.levels.some(({ id }) => id === "pending-map")).toBe(false);
  expect(reloaded.content.boards[0].levelIds).toContain("pending-map");
  expect(disk.levels[1]).toEqual(CANONICAL_CONTENT.levels[1]);
  const runtime = runtimeContentMiddleware(file);
  let body, headers;
  await runtime(
    { method: "GET", url: "/game-content.json" },
    {
      writeHead(_status, h) {
        headers = h;
      },
      end(text) {
        body = text;
      },
    },
    () => {},
  );
  expect(headers["Cache-Control"]).toBe("no-store");
  const loaded = JSON.parse(body);
  const context = progressionContext(loaded);
  expect(context.boards[0].name).toBe("Authored board fixture");
  expect(
    parseSave(
      JSON.stringify({ version: 2, stars: { [loaded.levels[0].id]: 1 } }),
      context,
    ).viewedBoard,
  ).toBe(context.boards[0].id);
  expect(session.game.level).toEqual(before);
  expect((await post(reloaded)).status).toBe(409);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(disk);
});

it("promotes board, route and poison changes together without losing unrelated live content", async () => {
  const { file, post } = await fixture();
  const { resolveBoards } = await import("../src/content/boards");
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  const map = draft.content.levels[0];
  useRouteLayout(draft.content, map, "twin-switchbacks");
  draft.content.boards = resolveBoards(draft.content);
  draft.content.boards[0].name = "Combined capability acceptance";
  const layout = draft.content.routeLayouts.find(
    (l) => l.id === "twin-switchbacks",
  );
  layout.routes[0].path[2].z = 6;
  layout.routes[0].path[3].z = 6;
  draft.content.abilityDefaults.skunkPoison = {
    durationSeconds: 6,
    tickSeconds: 0.5,
  };
  draft.content.towers.stone.poisonDamage = 7;
  draft.content.enemies.armored.poisonImmune = false;
  const live = structuredClone(CANONICAL_CONTENT);
  live.levels[1].startCoins += 17;
  await writeFile(file, JSON.stringify(live));
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  const scenario = {
    id: "combined-capability-roundtrip",
    levelId: restored.levelId,
    waveId: restored.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  };
  const previous = new AttemptSession(CANONICAL_CONTENT, scenario);
  const playtest = new AttemptSession(
    promoteWorkingWave(live, restored),
    scenario,
  );
  expect((await post(restored)).status).toBe(200);
  let loaded;
  await runtimeContentMiddleware(file)(
    { method: "GET", url: "/game-content.json?reload=combined" },
    {
      writeHead(code, headers) {
        expect(code).toBe(200);
        expect(headers["Cache-Control"]).toBe("no-store");
      },
      end(body) {
        loaded = JSON.parse(body);
      },
    },
    () => {
      throw new Error("Missing combined runtime content");
    },
  );
  const reloaded = new AttemptSession(loaded, scenario);
  expect(resolveBoards(loaded)[0].name).toBe("Combined capability acceptance");
  expect(reloaded.game.level.routes).toHaveLength(2);
  expect(reloaded.game.level.routes[0].path[2].z).toBe(6);
  expect(reloaded.game.skunkPoison).toEqual({
    durationSeconds: 6,
    tickSeconds: 0.5,
  });
  expect(reloaded.game.towers.stone.poisonDamage).toBe(7);
  expect(reloaded.game.enemies.armored.poisonImmune).toBe(false);
  expect(reloaded.configurationIdentity).toBe(playtest.configurationIdentity);
  expect(loaded.levels[1].startCoins).toBe(live.levels[1].startCoins);
  expect(previous.game.level.routes).toBeUndefined();
  expect(previous.game.skunkPoison).toEqual(
    CANONICAL_CONTENT.abilityDefaults.skunkPoison,
  );
  expect((await post(restored)).status).toBe(409);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(loaded);
});

it.each(["moved marker", "removed ordered board"])(
  "retains %s intent across scoped promotion, draft reload and uncached game loading",
  async (change) => {
    const { file, post } = await fixture();
    const { resolveBoards } = await import("../src/content/boards");
    const base = structuredClone(CANONICAL_CONTENT);
    const first = resolveBoards(base)[0];
    base.boards = [
      { ...structuredClone(first), levelIds: first.levelIds.slice(0, 2) },
      {
        ...structuredClone(first),
        id: "second-board",
        levelIds: first.levelIds.slice(2),
      },
    ];
    for (const board of base.boards)
      board.visual.markers = Object.fromEntries(
        board.levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
      );
    const draft = createMap(
      createWorkingDraft(base),
      "Pending D",
      base.levels[0].id,
      "pending-d",
      "wave-d",
    );
    const live = structuredClone(base);
    if (change === "moved marker") {
      const moved = base.levels[1].id;
      draft.content.boards[0].visual.markers[moved] = { x: 31, y: 41 };
      draft.levelId = base.levels[2].id;
      draft.waveId = base.levels[2].waves[0].id;
      live.boards[0].levelIds.pop();
      delete live.boards[0].visual.markers[moved];
      live.boards.push({
        ...structuredClone(first),
        id: "third-board",
        levelIds: [moved],
        visual: {
          illustration: "expedition-map-v1",
          markers: { [moved]: { x: 80, y: 60 } },
        },
      });
    } else {
      draft.content.boards.reverse();
      draft.levelId = base.levels[0].id;
      draft.waveId = base.levels[0].waves[0].id;
      const removed = live.boards.pop().levelIds[0];
      live.levels = live.levels.filter(({ id }) => id !== removed);
    }
    draft.content.levels.find(
      ({ id }) => id === draft.levelId,
    ).waves[0].reward += 1;
    await writeFile(file, JSON.stringify(live));
    let reloaded = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
    const attempt = new AttemptSession(promoteWorkingWave(live, reloaded), {
      id: "board-intent-roundtrip",
      levelId: reloaded.levelId,
      waveId: reloaded.waveId,
      mode: "wave",
      progression: "first-arrival",
      difficulty: "normal",
      seed: 42,
    });
    expect((await post(reloaded)).status).toBe(200);
    const disk = JSON.parse(await readFile(file, "utf8"));
    reloaded = validateWorkingDraft(
      JSON.parse(JSON.stringify(rebaseAfterPromotion(reloaded, disk))),
    );
    expect((await post(reloaded)).status).toBe(200);
    reloaded = validateWorkingDraft(
      JSON.parse(
        JSON.stringify(
          rebaseAfterPromotion(
            reloaded,
            JSON.parse(await readFile(file, "utf8")),
          ),
        ),
      ),
    );
    reloaded.content.levels.find(
      ({ id }) => id === "pending-d",
    ).waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
    expect((await post(reloaded, {}, true)).status).toBe(409);
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(disk);
    let loaded;
    await runtimeContentMiddleware(file)(
      { method: "GET", url: "/game-content.json?reload=board-intent" },
      {
        writeHead(status, headers) {
          expect(status).toBe(200);
          expect(headers["Cache-Control"]).toBe("no-store");
        },
        end(body) {
          loaded = JSON.parse(body);
        },
      },
      () => {
        throw new Error("Missing runtime content");
      },
    );
    expect(loaded.boards).toEqual(live.boards);
    expect(loaded.levels.some(({ id }) => id === "pending-d")).toBe(false);
    expect(
      new AttemptSession(loaded, attempt.scenario).configurationIdentity,
    ).toBe(attempt.configurationIdentity);
  },
);
