import { describe, expect, it } from "vitest";
import { theLastLantern } from "../src/content/the-last-lantern";
import { Game } from "../src/sim/game";

const DT = 1 / 30;
const buildSites = [
  { x: 1, z: 2 },
  { x: 3, z: 2 },
  { x: 4, z: 0 },
  { x: 6, z: 6 },
  { x: 8, z: 4 },
  { x: 10, z: 4 },
  { x: 3, z: 7 },
  { x: 5, z: 6 },
  { x: 10, z: 1 },
];

function step(game: Game, seconds: number) {
  for (let i = 0; i < seconds * 30; i += 1) game.tick(DT);
}

function play(strategy: "mixed" | "squirrels" | "remote") {
  const game = new Game(theLastLantern, "none", false, 42, {
    unlockedUpgrades: ["bolt"],
  });
  const opening =
    strategy === "mixed"
      ? [
          { kind: "net" as const, site: buildSites[0] },
          { kind: "bolt" as const, site: buildSites[1] },
        ]
      : [
          { kind: "bolt" as const, site: buildSites[0] },
          { kind: "bolt" as const, site: buildSites[1] },
          { kind: "bolt" as const, site: buildSites[2] },
        ];
  for (const tower of opening) game.place(tower.kind, tower.site);

  let nextSite = strategy === "squirrels" ? 3 : 2;
  let lastRecordedWave = 0;
  let elapsed = 0;
  const checkpoints: {
    wave: number;
    lives: number;
    bank: number;
    time: number;
  }[] = [];
  while (
    elapsed < 500 &&
    game.state.phase !== "won" &&
    game.state.phase !== "lost"
  ) {
    if (strategy === "remote") {
      if (!game.state.towers.some((tower) => tower.kind === "net")) {
        game.place("net", { x: 10, z: 4 });
      }
    } else {
      if (
        nextSite < buildSites.length &&
        game.place("bolt", buildSites[nextSite])
      ) {
        nextSite += 1;
      } else {
        const upgrade = game.state.towers.find(
          (tower) => tower.kind === "bolt" && tower.level === 1,
        );
        if (upgrade) game.upgrade(upgrade.id);
      }
    }
    if (game.state.phase === "preparation") {
      if (game.state.wave > lastRecordedWave) {
        checkpoints.push({
          wave: game.state.wave,
          lives: game.state.lives,
          bank: game.state.coins,
          time: game.state.clock,
        });
        lastRecordedWave = game.state.wave;
      }
      game.startWave();
    }
    game.tick(DT);
    elapsed += DT;
  }
  if (game.state.wave > lastRecordedWave) {
    checkpoints.push({
      wave: game.state.wave,
      lives: game.state.lives,
      bank: game.state.coins,
      time: game.state.clock,
    });
  }
  return {
    phase: game.state.phase,
    waves: game.state.wave,
    lives: game.state.lives,
    bank: game.state.coins,
    time: game.state.clock,
    towers: game.state.towers,
    checkpoints,
  };
}

describe("The Last Lantern's first-board lessons", () => {
  it("opens with base Turtle and upgraded Squirrel access only", () => {
    const game = new Game(
      { ...theLastLantern, startCoins: 500 },
      "none",
      false,
      42,
      {
        unlockedUpgrades: ["bolt"],
      },
    );

    expect(theLastLantern.waves).toHaveLength(5);
    expect(theLastLantern.startCoins).toBe(120);
    expect(theLastLantern.availableTowers).toEqual(["bolt", "net"]);
    expect(game.place("stone", { x: 1, z: 0 })).toBe(false);
    expect(game.place("net", { x: 2, z: 0 })).toBe(true);
    expect(game.place("bolt", { x: 3, z: 0 })).toBe(true);
    expect(game.upgrade(game.state.towers[0].id)).toBe(false);
    expect(game.upgrade(game.state.towers[1].id)).toBe(true);
  });

  it("shows a net slowing a runner, freezing on pause, and expiring cleanly", () => {
    const game = new Game(theLastLantern);
    expect(game.place("net", { x: 2, z: 0 })).toBe(true);
    expect(game.startWave()).toBe(true);

    for (let i = 0; i < 30 * 20; i += 1) {
      game.tick(DT);
      if (game.state.enemies.some((e) => e.slowUntil > game.state.clock)) break;
    }
    const runner = game.state.enemies.find((e) => e.kind === "runner");
    expect(runner).toBeDefined();
    expect(runner!.slowUntil).toBeGreaterThan(game.state.clock);
    const net = game.state.towers.find((tower) => tower.kind === "net")!;
    net.cooldown = 30;

    const slowedDistance = runner!.distance;
    step(game, 1);
    expect(runner!.distance - slowedDistance).toBeCloseTo(1.25 * 0.48, 3);

    game.pause();
    const pausedClock = game.state.clock;
    const pausedDistance = runner!.distance;
    step(game, 1);
    expect(game.state.clock).toBe(pausedClock);
    expect(runner!.distance).toBe(pausedDistance);
    expect(runner!.slowUntil).toBeGreaterThan(game.state.clock);
    game.pause();

    step(game, runner!.slowUntil - game.state.clock);
    expect(runner!.slowUntil).toBeLessThanOrEqual(game.state.clock);
    const restoredDistance = runner!.distance;
    step(game, DT);
    expect(runner!.distance - restoredDistance).toBeCloseTo(1.25 * DT, 5);
  });

  it.each(["mixed", "squirrels"] as const)(
    "clears all five teaching waves using the %s line",
    (strategy) => {
      const result = play(strategy);
      expect(result.phase).toBe("won");
      expect(result.waves).toBe(5);
      expect(result.lives).toBeGreaterThan(0);
      expect(result.checkpoints).toHaveLength(5);
    },
  );

  it("shows how a late remote net falls short without damage support", () => {
    const result = play("remote");
    expect(result.phase).toBe("lost");
    expect(result.lives).toBe(0);
    expect(result.waves).toBe(4);
    expect(result.towers.filter((tower) => tower.kind === "bolt")).toHaveLength(
      3,
    );
    expect(result.towers.filter((tower) => tower.kind === "net")).toHaveLength(
      1,
    );
    expect(
      result.checkpoints.map((checkpoint, index) => [
        checkpoint.wave,
        Math.round(
          (checkpoint.time - (result.checkpoints[index - 1]?.time ?? 0)) * 10,
        ) / 10,
        checkpoint.lives,
        checkpoint.bank,
      ]),
    ).toEqual([
      [1, 52.5, 12, 3],
      [2, 29.6, 12, 55],
      [3, 64.5, 10, 109],
      [4, 45.5, 0, 129],
    ]);
  });
});
