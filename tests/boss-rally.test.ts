import { updateBossRage } from "../src/sim/boss-rage";
import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { distance, pathLength, pointOnPath } from "../src/sim/path";
import type { Enemy, LevelDef } from "../src/sim/types";

const DT = 1 / 30;
const path = [
  { x: -1, z: 1 },
  { x: 4, z: 1 },
  { x: 4, z: 2 },
  { x: -1, z: 2 },
  { x: 18, z: 2 },
];

function level(overrides: Partial<LevelDef> = {}): LevelDef {
  return {
    id: "boss-rally-test",
    name: "Boss rally test",
    subtitle: "TEST",
    description: "A deterministic boss-rule scenario.",
    width: 20,
    depth: 5,
    path,
    blocked: [],
    startCoins: 0,
    waves: [
      {
        title: "Rally",
        reward: 0,
        groups: [
          { kind: "boss", count: 1, gap: 0.1 },
          { kind: "raider", count: 1, gap: 0.1 },
          { kind: "runner", count: 2, gap: 0.1 },
        ],
      },
    ],
    accent: "#ffffff",
    ...overrides,
  };
}

function step(game: Game, seconds: number) {
  for (let i = 0; i < seconds * 30; i += 1) game.tick(DT);
}

function placeOnPath(enemy: Enemy, route: LevelDef["path"], at: number) {
  enemy.distance = at;
  Object.assign(enemy, pointOnPath(route, at));
}

describe("Roadwarden rally", () => {
  it("warns for one second, rallies by route distance, and combines speed before slow", () => {
    const scenario = level({ requiresBossDefeat: true });
    const game = new Game(scenario);
    expect(game.startWave()).toBe(true);
    while (game.state.enemies.length < 4) game.tick(DT);
    const boss = game.state.enemies.find((enemy) => enemy.kind === "boss")!;
    const rat = game.state.enemies.find((enemy) => enemy.kind === "raider")!;
    const [nearRunner, acrossBendRunner] = game.state.enemies.filter(
      (enemy) => enemy.kind === "runner",
    );

    const firstRallyAt = boss.nextRallyAt!;
    while (game.state.clock < firstRallyAt - 1) game.tick(DT);
    placeOnPath(boss, scenario.path, 1.5);
    placeOnPath(rat, scenario.path, 3.5);
    placeOnPath(nearRunner, scenario.path, 3.6);
    placeOnPath(acrossBendRunner, scenario.path, 7.5);
    nearRunner.spawnedAt = game.state.clock - 4;
    nearRunner.evasionCycle = { downSeconds: 2, upSeconds: 3 };
    nearRunner.slowUntil = game.state.clock + 2;
    while (game.state.clock < firstRallyAt) game.tick(DT);

    expect(game.state.clock + 1e-8).toBeGreaterThanOrEqual(boss.spawnedAt + 7);
    expect(rat.rallyUntil).toBeGreaterThan(game.state.clock);
    expect(nearRunner.rallyUntil).toBeGreaterThan(game.state.clock);
    expect(acrossBendRunner.rallyUntil).toBeUndefined();
    expect(boss.rallyUntil).toBeUndefined();
    expect(distance(boss, acrossBendRunner)).toBeLessThan(3);
    expect(Math.abs(boss.distance - acrossBendRunner.distance)).toBeGreaterThan(
      3,
    );

    const events = game.drainEvents();
    expect(events.some((event) => event.type === "rally-warning")).toBe(true);
    expect(events.find((event) => event.type === "rally")?.value).toBe(2);

    const ralliedDistance = nearRunner.distance;
    game.tick(DT);
    expect(nearRunner.distance - ralliedDistance).toBeCloseTo(
      1.25 * 1.25 * 0.48 * DT,
      5,
    );

    nearRunner.evasionCycle = undefined;
    nearRunner.slowUntil = 0;
    const rallyUntil = nearRunner.rallyUntil!;
    while (game.state.clock + DT < rallyUntil - 1e-8) game.tick(DT);
    const beforeExpiry = nearRunner.distance;
    game.tick(DT);
    expect(game.state.clock + 1e-8).toBeGreaterThanOrEqual(rallyUntil);
    expect(nearRunner.distance - beforeExpiry).toBeCloseTo(1.25 * 1.25 * DT, 5);
    const expiredDistance = nearRunner.distance;
    game.tick(DT);
    expect(nearRunner.distance - expiredDistance).toBeCloseTo(1.25 * DT, 5);
  });

  it("makes escape a loss with lives remaining only when the level requires defeat", () => {
    const required = new Game(
      level({
        width: 12,
        path: [
          { x: -1, z: 1 },
          { x: 10, z: 1 },
        ],
        requiresBossDefeat: true,
        waves: [
          {
            title: "Roadwarden",
            reward: 0,
            groups: [{ kind: "boss", count: 1, gap: 1 }],
          },
        ],
      }),
    );
    required.startWave();
    step(required, 30);
    expect(required.state.phase).toBe("lost");
    expect(required.state.lives).toBeGreaterThan(0);

    const optional = new Game(
      level({
        width: 12,
        path: [
          { x: -1, z: 1 },
          { x: 10, z: 1 },
        ],
        waves: [
          {
            title: "Ordinary boss wave",
            reward: 0,
            groups: [{ kind: "boss", count: 1, gap: 1 }],
          },
        ],
      }),
    );
    optional.startWave();
    step(optional, 30);
    expect(optional.state.phase).toBe("won");
    expect(optional.state.lives).toBeGreaterThan(0);
  });

  it("does not let the final wave complete without killing the required boss", () => {
    const missing = new Game(
      level({
        width: 4,
        path: [
          { x: -1, z: 1 },
          { x: 1, z: 1 },
        ],
        requiresBossDefeat: true,
        waves: [
          {
            title: "Missing boss",
            reward: 0,
            groups: [{ kind: "raider", count: 1, gap: 1 }],
          },
        ],
      }),
    );
    missing.startWave();
    step(missing, 5);
    expect(missing.state.phase).toBe("lost");
    expect(missing.state.lives).toBeGreaterThan(0);
  });

  it("stops future rallies after the Roadwarden falls", () => {
    const final = level({ requiresBossDefeat: true });
    const game = new Game(final);
    game.startWave();
    while (game.state.enemies.length < 4) game.tick(DT);
    const boss = game.state.enemies.find((enemy) => enemy.kind === "boss")!;
    const firstRallyAt = boss.nextRallyAt!;
    while (game.state.clock < firstRallyAt) game.tick(DT);
    expect(game.drainEvents().some((event) => event.type === "rally")).toBe(
      true,
    );

    boss.hp = 1;
    game.state.shots.push({
      id: 999,
      x: boss.x,
      z: boss.z,
      source: { x: boss.x, z: boss.z },
      targetId: boss.id,
      kind: "bolt",
      damage: 10,
      life: 1,
      duration: 1,
      target: { x: boss.x, z: boss.z },
    });
    game.tick(DT);
    expect(boss.alive).toBe(false);
    expect(game.state.killsByKind.boss).toBe(1);
    expect(boss.nextRallyAt).toBe(firstRallyAt + 10);

    const nextPulseAt = boss.nextRallyAt!;
    while (game.state.clock < nextPulseAt) game.tick(DT);
    const laterEvents = game.drainEvents();
    expect(laterEvents.some((event) => event.type === "rally")).toBe(false);
    expect(laterEvents.some((event) => event.type === "rally-warning")).toBe(
      false,
    );
  });

  it("gives village loss precedence over a boss kill on the same update", () => {
    const final = level({ requiresBossDefeat: true });
    const game = new Game(final);
    game.startWave();
    while (game.state.enemies.length < 4) game.tick(DT);
    const boss = game.state.enemies.find((enemy) => enemy.kind === "boss")!;
    const runner = game.state.enemies.find((enemy) => enemy.kind === "runner")!;
    runner.distance = pathLength(final.path) - 0.001;
    Object.assign(runner, pointOnPath(final.path, runner.distance));
    boss.hp = 1;
    game.state.lives = 1;
    game.state.shots.push({
      id: 999,
      x: boss.x,
      z: boss.z,
      source: { x: boss.x, z: boss.z },
      targetId: boss.id,
      kind: "bolt",
      damage: 10,
      life: 1,
      duration: 1,
      target: { x: boss.x, z: boss.z },
    });

    game.tick(DT);
    expect(game.state.phase).toBe("lost");
    expect(game.state.killsByKind.boss).toBe(0);
    expect(boss.hp).toBe(1);
  });
});

describe("Roadwarden rage cycles", () => {
  function setup() {
    const game = new Game(level());
    game.startWave();
    while (!game.state.enemies.length) game.tick(DT);
    return { game, boss: game.state.enemies[0] };
  }
  it("accumulates damage, escalates on time, resets and requires fresh damage", () => {
    const { game, boss } = setup();
    const update = (clock: number) =>
      updateBossRage(boss, clock, game.bossRage);
    boss.hp = boss.maxHp * 0.95;
    update(1);
    expect(boss.rage?.phase).toBe(0);
    boss.hp = boss.maxHp * 0.9;
    update(2);
    expect(boss.rage?.phase).toBe(1);
    update(4.99);
    expect(boss.rage?.phase).toBe(1);
    update(5);
    expect(boss.rage?.phase).toBe(2);
    boss.hp = boss.maxHp * 0.65;
    update(6);
    expect(boss.rage?.phaseUntil).toBe(9);
    update(9);
    expect(boss.rage?.phase).toBe(0);
    update(10);
    expect(boss.rage?.phase).toBe(0);
    boss.hp -= boss.maxHp * 0.1;
    update(11);
    expect(boss.rage?.phase).toBe(1);
    update(14);
    expect(boss.rage?.phase).toBe(2);
    update(18);
    expect(boss.rage?.phase).toBe(0);
  });
  it.each([0, 1, 2] as const)(
    "enters permanent rage at exactly 25%% from phase %i",
    (phase) => {
      const { game, boss } = setup();
      boss.rage!.phase = phase;
      boss.rage!.phaseUntil = 2;
      boss.hp = boss.maxHp / 4;
      updateBossRage(boss, 1, game.bossRage);
      expect(boss.rage).toMatchObject({ phase: 2, permanent: true });
      updateBossRage(boss, 100, game.bossRage);
      expect(boss.rage?.phase).toBe(2);
    },
  );
  it("preserves full Turtle slow in every phase and freezes cycle timers on pause", () => {
    const { game, boss } = setup();
    for (const [phase, multiplier] of [
      [0, 1],
      [1, 1.35],
      [2, 1.6],
    ] as const) {
      boss.rage!.phase = phase;
      boss.rage!.phaseUntil = game.state.clock + 10;
      for (const slowed of [false, true]) {
        boss.slowUntil = slowed ? game.state.clock + 5 : 0;
        const before = boss.distance;
        game.tick(DT);
        expect(boss.distance - before).toBeCloseTo(
          game.enemies.boss.speed *
            multiplier *
            (slowed ? game.rules.slowScale : 1) *
            DT,
          8,
        );
      }
    }
    game.pause();
    const before = structuredClone(boss);
    const clock = game.state.clock;
    step(game, 10);
    expect(boss).toEqual(before);
    expect(game.state.clock).toBe(clock);
  });
  it("uses actual post-armor damage and escalates in the same hit that triggers it", () => {
    const { game, boss } = setup();
    const hit = (damage: number) => {
      game.state.shots.push({
        id: 999,
        x: boss.x,
        z: boss.z,
        source: { x: boss.x, z: boss.z },
        targetId: boss.id,
        kind: "bolt",
        damage,
        life: 1,
        duration: 1,
        target: { x: boss.x, z: boss.z },
      });
      game.tick(DT);
    };
    hit(110);
    expect(boss.rage?.phase).toBe(0);
    hit(122);
    expect(boss.rage?.phase).toBe(1);
    expect(boss.hp).toBe(boss.maxHp - 220);
  });
});
