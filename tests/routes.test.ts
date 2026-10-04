import { legacyFirstBoard } from "./fixtures/first-board-content";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
  validateContent,
  compileLevel,
} from "../src/config/configuration";
import { Game } from "../src/sim/game";
import { levelRoutes, routeFor, DEFAULT_ROUTE_ID } from "../src/sim/routes";
import { pathLength, pointOnPath, onPath } from "../src/sim/path";
import { compileSpawnSchedule } from "../src/sim/spawn-schedule";
import { projectedPathSampler } from "../src/render/path-sampler";
import type { Enemy, WaveGroupDef } from "../src/sim/types";
import { layoutWave, editWave } from "../src/workbench/wave-graph";
import { authoredGeometry } from "../src/workbench/route-authoring";
import { routePreview } from "../src/ui/route-preview";

const DT = 1 / 30;
function content(
  groups: (WaveGroupDef & { id: string })[] = [
    { id: "a", kind: "raider", count: 1, gap: 0.1, routeId: "route-a" },
    {
      id: "b",
      kind: "raider",
      count: 1,
      gap: 0.1,
      routeId: "route-b",
      startTogether: true,
    },
  ],
) {
  const value = structuredClone(CANONICAL_CONTENT);
  const map = value.levels[0];
  map.routeLayoutId = "twin-switchbacks";
  map.path = [];
  map.blocked = [];
  map.width = 12;
  map.depth = 8;
  map.availableTowers = ["bolt", "stone", "net"];
  map.startCoins = 500;
  map.waves = [
    {
      id: "routes",
      title: "Route fixture",
      reward: 25,
      abilities: { ratShield: false, weaselEvade: false },
      packets: [{ id: "both", groups }],
    },
  ];
  return value;
}
function game(value = content()) {
  const config = resolveConfiguration(value);
  return new Game(config.level, "none", false, 42, { configuration: config });
}
function spawn(g: Game, count = 2) {
  g.startWave();
  for (let n = 0; n < 600 && g.state.enemies.length < count; n++) g.tick(DT);
  expect(g.state.enemies).toHaveLength(count);
  return g.state.enemies;
}
function place(g: Game, e: Enemy, travel: number) {
  e.distance = travel;
  Object.assign(e, pointOnPath(routeFor(g.level, e.routeId).path, travel));
}
function bosses() {
  const value = content([
    { id: "a", kind: "boss", count: 1, gap: 0.1, routeId: "route-a" },
    {
      id: "b",
      kind: "boss",
      count: 1,
      gap: 0.1,
      routeId: "route-b",
      startTogether: true,
    },
  ]);
  value.levels[0].requiresBossDefeat = true;
  return value;
}
describe("authored fixed routes", () => {
  it("resolves the exact approved shared geometry with both crossings and union occupancy", () => {
    const g = game();
    const routes = levelRoutes(g.level);
    expect(routes.map((r) => r.path.map((p) => [p.x, p.z]))).toEqual([
      [
        [-1, 1],
        [2, 1],
        [2, 7],
        [7, 7],
        [7, 5],
        [4, 5],
        [4, 4],
        [9, 4],
        [9, 1],
        [12, 1],
      ],
      [
        [-1, 6],
        [0, 6],
        [0, 3],
        [6, 3],
        [6, 1],
        [4, 1],
        [4, 0],
        [11, 0],
        [11, 6],
        [12, 6],
      ],
    ]);
    expect(routes.map((r) => [r.id, pathLength(r.path)])).toEqual([
      ["route-a", 31],
      ["route-b", 29],
    ]);
    expect(routes.map((r) => [r.path[0], r.path.at(-1)])).toEqual([
      [
        { x: -1, z: 1 },
        { x: 12, z: 1 },
      ],
      [
        { x: -1, z: 6 },
        { x: 12, z: 6 },
      ],
    ]);
    for (const p of [
      { x: 2, z: 3 },
      { x: 11, z: 1 },
      { x: 7, z: 6 },
      { x: 6, z: 2 },
    ]) {
      expect(onPath(g.level, p)).toBe(true);
      expect(g.canPlace(p)).toBe(false);
    }
    expect(g.canPlace({ x: 3, z: 2 })).toBe(true);
    const tiles = routes.map(
      (r) =>
        new Set(
          Array.from({ length: pathLength(r.path) + 1 }, (_, d) =>
            JSON.stringify(pointOnPath(r.path, d)),
          ),
        ),
    );
    expect(
      [...tiles[0]].filter((p) => tiles[1].has(p)).map((p) => JSON.parse(p)),
    ).toEqual([
      { x: 2, z: 3 },
      { x: 11, z: 1 },
    ]);
    for (const route of routes)
      for (let d = 0; d <= pathLength(route.path); d += 0.125) {
        const sample = projectedPathSampler(route.path, (p) => ({
          x: p.x * 96,
          y: p.z * 74,
        }));
        const p = pointOnPath(route.path, d);
        expect(sample(d)).toEqual({ x: p.x * 96, y: p.z * 74 });
      }
  });
  it("retains route identity through both crossings and shares hearts at both exits", () => {
    const g = game();
    const actors = spawn(g);
    const hearts = g.state.lives;
    expect(actors.map((e) => e.routeId)).toEqual(["route-a", "route-b"]);
    for (let n = 0; n < 1500; n++) {
      g.tick(DT);
      for (const e of actors) {
        expect(e.routeId).toBe(e === actors[0] ? "route-a" : "route-b");
        expect({ x: e.x, z: e.z }).toEqual(
          pointOnPath(routeFor(g.level, e.routeId).path, e.distance),
        );
      }
    }
    expect(g.state.lives).toBe(hearts - 2 * g.enemies.raider.leak);
    expect(g.state.leaks).toBe(2);
    expect(g.state.phase).toBe("won");
    expect(
      g
        .drainEvents()
        .filter((e) => e.type === "leak")
        .map((e) => e.routeId),
    ).toEqual(["route-b", "route-a"]);
  });
  it("uses current effective speed rather than furthest distance; stable IDs break equal estimates", () => {
    const value = content();
    value.towers.bolt.range = 100;
    const g = game(value);
    const [a, b] = spawn(g);
    place(g, a, 10);
    place(g, b, 8); // equal remaining distance
    expect(g.place("bolt", { x: 3, z: 2 })).toBe(true);
    a.slowUntil = g.state.clock + 10;
    g.tick(DT);
    expect(g.state.shots[0].targetId).toBe(b.id);
    g.state.shots = [];
    g.state.towers[0].cooldown = 0;
    a.slowUntil = 0;
    place(g, a, 10);
    place(g, b, 8);
    g.tick(DT);
    expect(g.state.shots[0].targetId).toBe(a.id);
  });
  it("opts a single explicit route into travel-time targeting while legacy path-only priority remains unchanged", () => {
    for (const explicit of [true, false]) {
      const value = content();
      const map = value.levels[0];
      delete map.routeLayoutId;
      const route = structuredClone(value.routeLayouts![0].routes[0]);
      if (explicit) map.routes = [route];
      else map.path = route.path;
      for (const group of map.waves[0].packets[0].groups) {
        if (explicit) group.routeId = route.id;
        else delete group.routeId;
      }
      value.towers.bolt.range = 100;
      const g = game(value);
      const [a, b] = spawn(g);
      place(g, a, 10);
      place(g, b, 8);
      a.slowUntil = g.state.clock + 10;
      g.place("bolt", { x: 3, z: 2 });
      g.tick(DT);
      expect(g.state.shots[0].targetId).toBe(explicit ? b.id : a.id);
    }
  });
  it("applies movement scale, active evade/rally and boss rage to the same threat estimate", () => {
    const value = content([
      { id: "a", kind: "boss", count: 1, gap: 0.1, routeId: "route-a" },
      {
        id: "b",
        kind: "runner",
        count: 1,
        gap: 0.1,
        routeId: "route-b",
        startTogether: true,
      },
    ]);
    value.towers.bolt.range = 100;
    value.levels[0].waves[0].abilities!.weaselEvade = true;
    const g = game(value);
    const [a, b] = spawn(g);
    g.place("bolt", { x: 3, z: 2 });
    a.hp = a.maxHp * 0.25;
    b.movementScale = 0.1;
    place(g, a, 10);
    place(g, b, 8);
    g.tick(DT);
    expect(a.rage?.phase).toBe(2);
    expect(g.state.shots[0].targetId).toBe(a.id);
    b.movementScale = 1;
    b.spawnedAt = g.state.clock - 3.2;
    b.rallyUntil = g.state.clock + 5;
    g.state.shots = [];
    g.state.towers[0].cooldown = 0;
    place(g, a, 10);
    place(g, b, 8);
    g.tick(DT);
    expect(b.evasion?.active).toBe(true);
    expect(g.state.shots[0].targetId).toBe(b.id);
    const before = b.distance;
    g.tick(DT);
    expect(b.distance - before).toBeCloseTo(
      g.enemies.runner.speed *
        Math.max(g.rules.evasionSpeedScale, g.rules.boss.speedScale) *
        DT,
      8,
    );
  });
  it("splash hits both routes at a crossing without changing either assignment", () => {
    const value = content();
    value.enemies.raider.speed = 0.001;
    value.towers.stone.range = 100;
    const g = game(value);
    const [a, b] = spawn(g);
    place(g, a, 5);
    place(g, b, 6);
    g.place("stone", { x: 3, z: 2 });
    g.tick(DT);
    expect(g.state.shots).toHaveLength(1);
    g.tick(g.state.shots[0].duration + DT);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
    expect([a.routeId, b.routeId]).toEqual(["route-a", "route-b"]);
  });
  it("keeps independent boss rage and rallies nearby escorts only on the same route", () => {
    const value = content([
      { id: "a", kind: "boss", count: 1, gap: 0.1, routeId: "route-a" },
      {
        id: "b",
        kind: "boss",
        count: 1,
        gap: 0.1,
        routeId: "route-b",
        startTogether: true,
      },
      { id: "ea", kind: "raider", count: 1, gap: 0.1, routeId: "route-a" },
      {
        id: "eb",
        kind: "raider",
        count: 1,
        gap: 0.1,
        routeId: "route-b",
        startTogether: true,
      },
    ]);
    const g = game(value);
    const [a, b, ea, eb] = spawn(g, 4);
    a.hp = a.maxHp * 0.25;
    g.tick(DT);
    expect(a.rage?.permanent).toBe(true);
    expect(b.rage?.phase).toBe(0);
    place(g, a, 5);
    place(g, b, 6);
    place(g, ea, 6);
    place(g, eb, 6);
    a.nextRallyAt = g.state.clock;
    b.nextRallyAt = g.state.clock + 10;
    g.tick(DT);
    expect(ea.rallyUntil).toBeGreaterThan(g.state.clock);
    expect(eb.rallyUntil).toBeUndefined();
    b.nextRallyAt = g.state.clock;
    g.tick(DT);
    expect(eb.rallyUntil).toBeGreaterThan(g.state.clock);
  });
  it("requires both simultaneous bosses to die before victory and pays once", () => {
    const value = bosses();
    value.towers.stone.range = 100;
    value.enemies.boss.speed = 0.001;
    const g = game(value);
    const [a, b] = spawn(g);
    expect(a.spawnedAt).toBe(b.spawnedAt);
    place(g, a, 5);
    place(g, b, 6);
    a.hp = 1;
    b.hp = 1;
    g.place("stone", { x: 3, z: 2 });
    g.tick(DT);
    g.tick(g.state.shots[0].duration + DT);
    expect(g.state.killsByKind.boss).toBe(2);
    expect(g.state.phase).toBe("won");
    g.tick(1);
    expect(g.drainEvents().filter((e) => e.type === "payout")).toHaveLength(1);
  });
  it("stays in the wave after one required boss dies and loses if the remaining twin escapes", () => {
    const value = bosses();
    value.towers.bolt.range = 100;
    const g = game(value);
    const [a, b] = spawn(g);
    a.hp = 1;
    place(g, a, 20);
    place(g, b, 1);
    g.place("bolt", { x: 3, z: 2 });
    g.tick(DT);
    expect(g.state.shots[0].targetId).toBe(a.id);
    g.tick(g.state.shots[0].duration + DT);
    expect(g.state.killsByKind.boss).toBe(1);
    expect(g.state.phase).toBe("wave");
    expect(g.drainEvents().some((e) => e.type === "win")).toBe(false);
    place(g, b, pathLength(routeFor(g.level, b.routeId).path) - 0.001);
    g.tick(DT);
    expect(g.state.phase).toBe("lost");
    expect(g.state.killsByKind.boss).toBe(1);
  });
  it.each(["route-a", "route-b"])(
    "loses when required boss escapes through %s before same-tick projectile impacts",
    (id) => {
      const g = game(bosses());
      const actors = spawn(g);
      const escaping = actors.find((e) => e.routeId === id)!;
      place(g, escaping, pathLength(routeFor(g.level, id).path) - 0.001);
      escaping.hp = 1;
      g.state.shots.push({
        id: 100,
        source: { x: 3, z: 2 },
        targetId: escaping.id,
        kind: "bolt",
        damage: 1000,
        life: 0,
        duration: DT,
        target: { x: escaping.x, z: escaping.z },
        x: 3,
        z: 2,
      });
      g.tick(DT);
      expect(g.state.phase).toBe("lost");
      expect(g.state.killsByKind.boss).toBe(0);
      expect(
        g
          .drainEvents()
          .filter((e) => ["leak", "loss"].includes(e.type))
          .map((e) => e.type),
      ).toEqual(["leak", "loss"]);
    },
  );
  it("pauses both actors and creates fresh route/rage state on replay", () => {
    const value = bosses();
    const g = game(value);
    spawn(g);
    g.state.enemies[0].hp = 1;
    g.tick(DT);
    g.pause();
    const state = structuredClone(g.state);
    g.tick(10);
    expect(g.state).toEqual(state);
    const replay = game(value);
    const actors = spawn(replay);
    expect(
      actors.every(
        (e) => e.hp === e.maxHp && !e.rallyUntil && e.rage?.phase === 0,
      ),
    ).toBe(true);
    g.pause();
    const distance = g.state.enemies[0].distance;
    g.tick(DT);
    expect(g.state.enemies[0].distance).toBeGreaterThan(distance);
  });
  it("rejects duplicate routes, malformed geometry, unknown layout/assignment and ambiguous geometry sources", () => {
    for (const mutate of [
      (v: ReturnType<typeof content>) => {
        v.routeLayouts![0].routes[1].id = "route-a";
      },
      (v: ReturnType<typeof content>) => {
        v.routeLayouts![0].routes[0].path[1].z = 2;
      },
      (v: ReturnType<typeof content>) => {
        v.levels[0].routeLayoutId = "missing";
      },
      (v: ReturnType<typeof content>) => {
        v.levels[0].waves[0].packets[0].groups[0].routeId = "missing";
      },
      (v: ReturnType<typeof content>) => {
        v.levels[0].path = [
          { x: 0, z: 0 },
          { x: 1, z: 0 },
        ];
      },
    ]) {
      const value = content();
      mutate(value);
      expect(() => validateContent(value)).toThrow();
    }
    const old = legacyFirstBoard();
    delete old.routeLayouts;
    const g = game(old);
    const [e] = spawn(g, 1);
    expect(e.routeId).toBe(DEFAULT_ROUTE_ID);
  });
  it("keeps schedule/timeline order and IDs while authoring simultaneous route groups and repeats", () => {
    const value = content();
    const map = value.levels[0];
    const wave = map.waves[0];
    wave.packets[0].repeat = 2;
    const compiled = compileLevel(
      map,
      value.abilityDefaults,
      value.routeLayouts,
    );
    const schedule = compileSpawnSchedule(compiled.waves[0]);
    expect(schedule.map((s) => [s.at, s.routeId, s.groupId])).toEqual([
      [0.7, "route-a", "both/1/a"],
      [0.7, "route-b", "both/1/b"],
      [0.7999999999999999, "route-a", "both/2/a"],
      [0.7999999999999999, "route-b", "both/2/b"],
    ]);
    const { _route: _, ...fields } = { ...map, _route: map.routeLayoutId };
    delete fields.routeLayoutId;
    const editor = { ...fields, ...authoredGeometry(value, map) };
    expect(layoutWave(editor, wave, 0.7).nodes.map((n) => n.start)).toEqual(
      schedule.map((s) => s.at),
    );
    const changed = editWave(
      editor,
      wave,
      0.7,
      { packetIndex: 0, groupIndex: 0 },
      { type: "route", id: "route-b" },
    );
    expect(changed.packets[0].groups[0]).toMatchObject({
      id: "a",
      routeId: "route-b",
    });
    expect(() =>
      editWave(
        editor,
        wave,
        0.7,
        { packetIndex: 0, groupIndex: 0 },
        { type: "together", enabled: true },
      ),
    ).toThrow("preceding");
    expect(routePreview(compiled)).toContain("2 fixed routes");
  });
});
