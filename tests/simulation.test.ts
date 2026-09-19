import { describe, expect, it } from "vitest";
import { TOWERS } from "../src/content/catalog";
import { lanternPass } from "../src/content/lantern-pass";
import { Game } from "../src/sim/game";
import type { LevelDef, Point } from "../src/sim/types";

const DT = 1 / 30;

function makeLevel(overrides: Partial<LevelDef> = {}): LevelDef {
  return {
    id: "simulation-test",
    name: "Simulation test",
    subtitle: "TEST",
    description: "A deterministic level used to exercise one rule at a time.",
    width: 20,
    depth: 8,
    path: [
      { x: -1, z: 3 },
      { x: 18, z: 3 },
    ],
    blocked: [],
    startCoins: 175,
    waves: [
      {
        title: "One test wave",
        reward: 25,
        groups: [{ kind: "raider", count: 1, gap: 1 }],
      },
    ],
    accent: "#ffffff",
    ...overrides,
  };
}

function runFor(game: Game, seconds: number): void {
  const steps = Math.ceil(seconds / DT);
  for (let i = 0; i < steps; i += 1) game.tick(DT);
}

function runUntil(
  game: Game,
  condition: () => boolean,
  maxSeconds: number,
): number {
  const steps = Math.ceil(maxSeconds / DT);
  for (let i = 0; i <= steps; i += 1) {
    if (condition()) return i * DT;
    game.tick(DT);
  }
  throw new Error(`condition did not become true within ${maxSeconds}s`);
}

function pointNearPath(): Point {
  return { x: 1, z: 1 };
}

function startAndRun(game: Game, maxSeconds = 30): number {
  expect(game.startWave()).toBe(true);
  return runUntil(
    game,
    () => game.state.phase === "won" || game.state.phase === "lost",
    maxSeconds,
  );
}

describe("Game simulation", () => {
  it("pays one wave boundary exactly once using the pre-payout balance", () => {
    const game = new Game(
      makeLevel({
        startCoins: 199,
        waves: [
          {
            title: "Payout boundary",
            reward: 25,
            groups: [{ kind: "raider", count: 1, gap: 1 }],
          },
        ],
      }),
    );

    startAndRun(game, 30);

    expect(game.state.phase).toBe("won");
    expect(game.state.lastPayout).toEqual({
      interest: 19,
      trade: 0,
      reward: 25,
      total: 44,
    });
    expect(game.state.coins).toBe(243);
    expect(
      game.drainEvents().filter((event) => event.type === "payout"),
    ).toHaveLength(1);

    const settledCoins = game.state.coins;
    runFor(game, 5);
    expect(game.state.coins).toBe(settledCoins);
    expect(game.drainEvents()).toEqual([]);
  });

  it("builds, upgrades, and sells a tower with the documented costs and refund", () => {
    const game = new Game(lanternPass);
    const p = pointNearPath();

    expect(game.place("bolt", p)).toBe(true);
    const tower = game.state.towers[0];
    expect(game.state.coins).toBe(135);
    expect(game.upgrade(tower.id)).toBe(true);
    expect(tower.level).toBe(2);
    expect(tower.spent).toBe(95);
    expect(game.state.coins).toBe(80);
    expect(game.upgrade(tower.id)).toBe(false);

    expect(game.sell(tower.id)).toBe(true);
    expect(game.state.towers).toHaveLength(0);
    expect(game.state.coins).toBe(141);
    expect(game.sell(tower.id)).toBe(false);
  });

  it("rejects a purchase that cannot be funded and does not mutate the board", () => {
    const game = new Game(makeLevel({ startCoins: 39 }));
    expect(game.place("bolt", pointNearPath())).toBe(false);
    expect(game.state.coins).toBe(39);
    expect(game.state.towers).toHaveLength(0);
  });

  it("moves enemies to the endpoint, applies their leak value, and still settles a nonfatal wave", () => {
    const game = new Game(
      makeLevel({
        width: 4,
        path: [
          { x: -1, z: 1 },
          { x: 1, z: 1 },
        ],
        waves: [
          {
            title: "Armored leak",
            reward: 7,
            groups: [{ kind: "armored", count: 1, gap: 1 }],
          },
        ],
      }),
    );

    startAndRun(game, 10);

    expect(game.state.phase).toBe("won");
    expect(game.state.lives).toBe(10);
    expect(game.state.lastPayout?.reward).toBe(7);
    expect(
      game.drainEvents().filter((event) => event.type === "leak"),
    ).toHaveLength(1);
  });

  it("freezes combat time and economy while paused, then resumes normally", () => {
    const game = new Game(makeLevel());
    expect(game.startWave()).toBe(true);
    runFor(game, 0.5);
    const clock = game.state.clock;
    const lives = game.state.lives;
    const enemyDistances = game.state.enemies.map((enemy) => enemy.distance);
    const coins = game.state.coins;

    game.pause();
    expect(game.state.phase).toBe("paused");
    for (let i = 0; i < 40; i += 1) game.advance(0.25);
    expect(game.state.clock).toBe(clock);
    expect(game.state.lives).toBe(lives);
    expect(game.state.coins).toBe(coins);
    expect(game.state.enemies.map((enemy) => enemy.distance)).toEqual(
      enemyDistances,
    );

    game.pause();
    expect(game.state.phase).toBe("wave");
    runUntil(
      game,
      () => game.state.phase === "won" || game.state.phase === "lost",
      30,
    );
    expect(game.state.lastPayout).not.toBeNull();
  });

  it("forecasts the active wave during combat and pause, then the next wave in preparation", () => {
    const game = new Game(
      makeLevel({
        path: [
          { x: -1, z: 1 },
          { x: 1, z: 1 },
        ],
        waves: [
          {
            title: "Current forecast",
            reward: 11,
            groups: [{ kind: "raider", count: 1, gap: 1 }],
          },
          {
            title: "Next forecast",
            reward: 22,
            groups: [{ kind: "raider", count: 1, gap: 1 }],
          },
        ],
      }),
    );

    expect(game.forecast().reward).toBe(11);
    expect(game.startWave()).toBe(true);
    expect(game.forecast().reward).toBe(11);

    game.pause();
    expect(game.forecast().reward).toBe(11);
    for (let i = 0; i < 10; i += 1) game.advance(0.25);
    expect(game.forecast().reward).toBe(11);

    game.pause();
    runUntil(game, () => game.state.phase === "preparation", 10);
    expect(game.state.wave).toBe(1);
    expect(game.forecast().reward).toBe(22);
  });

  it("ignores nonfinite and nonpositive fixed-step input without corrupting combat time", () => {
    const game = new Game(makeLevel());
    expect(game.startWave()).toBe(true);

    game.tick(Number.NaN);
    game.tick(Number.POSITIVE_INFINITY);
    game.tick(-1);

    expect(game.state.clock).toBe(0);
    expect(game.state.enemies).toEqual([]);
    game.tick(DT);
    expect(game.state.clock).toBeCloseTo(DT, 8);
  });

  it("expires a net slow and restores the enemy to its normal movement speed", () => {
    const game = new Game(
      makeLevel({
        path: [
          { x: 0, z: 3 },
          { x: 18, z: 3 },
        ],
        waves: [
          {
            title: "Slow expiry",
            reward: 0,
            groups: [{ kind: "runner", count: 1, gap: 1 }],
          },
        ],
      }),
    );
    expect(game.place("net", pointNearPath())).toBe(true);
    const net = game.state.towers[0];
    expect(game.startWave()).toBe(true);

    runUntil(
      game,
      () => (game.state.enemies[0]?.slowUntil ?? 0) > game.state.clock,
      3,
    );
    const enemy = game.state.enemies[0];
    expect(enemy).toBeDefined();
    const slowUntil = enemy.slowUntil;
    game.sell(net.id);

    const slowDistance = enemy.distance;
    game.tick(DT);
    expect(enemy.distance - slowDistance).toBeCloseTo(1.25 * 0.48 * DT, 5);

    runUntil(game, () => game.state.clock >= slowUntil + DT, 6);
    const normalDistance = enemy.distance;
    game.tick(DT);
    expect(enemy.distance - normalDistance).toBeCloseTo(1.25 * DT, 5);
  });

  it("targets the enemy furthest along the path", () => {
    const game = new Game(
      makeLevel({
        path: [
          { x: 0, z: 3 },
          { x: 18, z: 3 },
        ],
        waves: [
          {
            title: "Target order",
            reward: 0,
            groups: [{ kind: "raider", count: 2, gap: 0.1 }],
          },
        ],
      }),
    );
    expect(game.place("bolt", pointNearPath())).toBe(true);
    game.state.towers[0].cooldown = 1;
    expect(game.startWave()).toBe(true);
    runFor(game, 1.1);

    const shot = game.state.shots[0];
    expect(shot).toBeDefined();
    const expectedTarget = [...game.state.enemies].sort(
      (a, b) => b.distance - a.distance || a.id - b.id,
    )[0].id;
    expect(shot.targetId).toBe(expectedTarget);
  });

  it("ends in victory and a fresh replay starts with no transient state", () => {
    const level = makeLevel();
    const game = new Game(level, "supply", true);
    startAndRun(game, 30);
    expect(game.state.phase).toBe("won");
    expect(game.state.stars).toBe(2);

    const replay = new Game(level, "supply", true);
    expect(replay.state.phase).toBe("preparation");
    expect(replay.state.wave).toBe(0);
    expect(replay.state.clock).toBe(0);
    expect(replay.state.coins).toBe(level.startCoins + 45 + 70);
    expect(replay.state.towers).toEqual([]);
    expect(replay.state.enemies).toEqual([]);
    expect(replay.state.lastPayout).toBeNull();
    expect(replay.startWave()).toBe(true);
  });

  it("ends in defeat when leaks consume all lives and does not pay a result reward", () => {
    const level = makeLevel({
      width: 4,
      path: [
        { x: -1, z: 1 },
        { x: 1, z: 1 },
      ],
      waves: [
        {
          title: "Defeat",
          reward: 40,
          groups: [{ kind: "boss", count: 2, gap: 0.1 }],
        },
      ],
    });
    const game = new Game(level);
    expect(game.startWave()).toBe(true);
    runUntil(game, () => game.state.phase === "lost", 20);

    expect(game.state.lives).toBe(0);
    expect(game.state.lastPayout).toBeNull();
    expect(
      game.drainEvents().filter((event) => event.type === "payout"),
    ).toHaveLength(0);
    expect(game.startWave()).toBe(false);

    const replay = new Game(level);
    expect(replay.state.phase).toBe("preparation");
    expect(replay.state.lives).toBe(12);
    expect(replay.state.coins).toBe(level.startCoins);
    expect(replay.state.towers).toEqual([]);
  });

  it("applies reach, supply, thrift, and nets card effects to actual play values", () => {
    const normal = new Game(lanternPass, "reach");
    expect(normal.place("bolt", pointNearPath())).toBe(true);
    const placed = normal.state.towers[0];
    expect(normal.range(placed)).toBeCloseTo(TOWERS.bolt.range * 1.18, 6);

    const supply = new Game(lanternPass, "supply");
    expect(supply.state.coins).toBe(220);

    const thrift = new Game(lanternPass, "thrift");
    expect(thrift.place("bolt", pointNearPath())).toBe(true);
    expect(thrift.upgrade(thrift.state.towers[0].id)).toBe(true);
    expect(thrift.state.towers[0].spent).toBe(84);

    function slowDuration(card: "nets" | "reach"): number {
      const game = new Game(
        makeLevel({
          path: [
            { x: 0, z: 3 },
            { x: 18, z: 3 },
          ],
          waves: [
            {
              title: "Card slow",
              reward: 0,
              groups: [{ kind: "runner", count: 1, gap: 1 }],
            },
          ],
        }),
        card,
      );
      expect(game.place("net", pointNearPath())).toBe(true);
      expect(game.startWave()).toBe(true);
      runUntil(
        game,
        () => (game.state.enemies[0]?.slowUntil ?? 0) > game.state.clock,
        3,
      );
      return game.state.enemies[0].slowUntil - game.state.clock;
    }

    expect(slowDuration("nets")).toBeCloseTo(4.5, 5);
    expect(slowDuration("reach")).toBeCloseTo(3, 5);
  });

  it("pays a trade structure at the wave boundary and leaves its level intact", () => {
    const game = new Game(
      makeLevel({
        startCoins: 100,
        waves: [
          {
            title: "Trade payout",
            reward: 7,
            groups: [{ kind: "raider", count: 1, gap: 1 }],
          },
        ],
      }),
    );
    expect(game.place("trade", { x: 1, z: 1 })).toBe(true);
    const lodge = game.state.towers[0];
    expect(game.startWave()).toBe(true);
    runUntil(
      game,
      () => game.state.phase === "won" || game.state.phase === "lost",
      30,
    );

    expect(lodge.level).toBe(1);
    expect(game.state.lastPayout).toEqual({
      interest: 4,
      trade: 12,
      reward: 7,
      total: 23,
    });
    expect(game.state.coins).toBe(68);
  });
});
