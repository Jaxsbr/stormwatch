import { describe, expect, it } from "vitest";
import { ENEMIES } from "../src/content/catalog";
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
  { x: 5, z: 2 },
  { x: 8, z: 1 },
  { x: 11, z: 5 },
];

function step(game: Game, seconds: number) {
  for (let i = 0; i < seconds * 30; i += 1) game.tick(DT);
}

function waveProfile(checkpoints: ReturnType<typeof play>["checkpoints"]) {
  let previousTime = 0;
  let previousGold = 0;
  return checkpoints.map((checkpoint) => {
    const row = [
      checkpoint.wave,
      Math.round((checkpoint.time - previousTime) * 10) / 10,
      checkpoint.lives,
      checkpoint.leaks,
      checkpoint.bank,
      checkpoint.goldEarned - previousGold,
      checkpoint.towers,
      checkpoint.upgraded,
    ];
    previousTime = checkpoint.time;
    previousGold = checkpoint.goldEarned;
    return row;
  });
}

function play(strategy: "mixed" | "squirrels" | "mistake") {
  const game = new Game(theLastLantern, "none", false, 42, {
    unlockedUpgrades: ["bolt"],
  });
  const opening =
    strategy === "mixed"
      ? [
          { kind: "net" as const, site: buildSites[0] },
          { kind: "bolt" as const, site: buildSites[1] },
          { kind: "bolt" as const, site: buildSites[2] },
          { kind: "bolt" as const, site: buildSites[3] },
        ]
      : strategy === "squirrels"
        ? [
            { kind: "bolt" as const, site: buildSites[0] },
            { kind: "bolt" as const, site: buildSites[1] },
            { kind: "bolt" as const, site: buildSites[2] },
          ]
        : [
            { kind: "bolt" as const, site: { x: 0, z: 6 } },
            { kind: "bolt" as const, site: buildSites[1] },
            { kind: "bolt" as const, site: buildSites[2] },
          ];
  for (const tower of opening) game.place(tower.kind, tower.site);

  let nextSite = strategy === "mixed" ? 4 : 3;
  let lastRecordedWave = 0;
  let elapsed = 0;
  const checkpoints: {
    wave: number;
    lives: number;
    bank: number;
    time: number;
    goldEarned: number;
    leaks: number;
    towers: number;
    upgraded: number;
  }[] = [];
  while (
    elapsed < 900 &&
    game.state.phase !== "won" &&
    game.state.phase !== "lost"
  ) {
    if (
      game.state.phase === "preparation" &&
      game.state.wave > lastRecordedWave
    ) {
      checkpoints.push({
        wave: game.state.wave,
        lives: game.state.lives,
        bank: game.state.coins,
        time: game.state.clock,
        goldEarned: game.state.goldEarned,
        leaks: game.state.leaks,
        towers: game.state.towers.length,
        upgraded: game.state.towers.filter((tower) => tower.level === 2).length,
      });
      lastRecordedWave = game.state.wave;
    }
    if (strategy === "mixed") {
      const net = game.state.towers.find((tower) => tower.kind === "net");
      const upgrade = game.state.towers.find(
        (tower) => tower.kind === "bolt" && tower.level === 1,
      );
      if (upgrade && game.state.coins >= game.upgradeCost(upgrade)) {
        game.upgrade(upgrade.id);
      } else if (net && nextSite < buildSites.length) {
        if (game.place("bolt", buildSites[nextSite])) nextSite += 1;
      } else if (upgrade) {
        game.upgrade(upgrade.id);
      }
    } else {
      const upgrade = game.state.towers.find(
        (tower) => tower.kind === "bolt" && tower.level === 1,
      );
      if (upgrade) {
        if (game.state.coins >= game.upgradeCost(upgrade)) {
          game.upgrade(upgrade.id);
        }
      }
      if (!upgrade || game.state.coins < game.upgradeCost(upgrade)) {
        if (
          nextSite < buildSites.length &&
          game.place("bolt", buildSites[nextSite])
        ) {
          nextSite += 1;
        } else if (upgrade) {
          game.upgrade(upgrade.id);
        }
      }
    }
    if (game.state.phase === "preparation") {
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
      goldEarned: game.state.goldEarned,
      leaks: game.state.leaks,
      towers: game.state.towers.length,
      upgraded: game.state.towers.filter((tower) => tower.level === 2).length,
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
    kills: game.state.kills,
    killsByKind: game.state.killsByKind,
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

    expect(theLastLantern.waves).toHaveLength(6);
    expect(theLastLantern.requiresBossDefeat).toBe(true);
    expect(theLastLantern.startCoins).toBe(235);
    expect(ENEMIES.boss.hp).toBe(2200);
    const finalGroups = theLastLantern.waves[5].groups;
    const bossIndex = finalGroups.findIndex((group) => group.kind === "boss");
    const escortGroups = finalGroups.slice(bossIndex + 1);
    expect(escortGroups.map((group) => [group.kind, group.count])).toEqual([
      ["runner", 8],
      ["raider", 6],
      ["runner", 8],
      ["raider", 5],
      ["runner", 8],
    ]);
    let queuedAt = 0.7;
    const groupStarts = finalGroups.map((group) => {
      queuedAt += group.delayBefore ?? 0;
      const start = queuedAt;
      queuedAt += Math.ceil(group.count / (group.batchSize ?? 1)) * group.gap;
      return start;
    });
    expect(
      escortGroups.map(
        (_, index) =>
          Math.round(
            (groupStarts[bossIndex + 1 + index] - groupStarts[bossIndex]) * 10,
          ) / 10,
      ),
    ).toEqual([4.5, 20.7, 33.9, 50.1, 61.3]);
    expect(theLastLantern.availableTowers).toEqual(["bolt", "net"]);
    expect(game.place("stone", { x: 1, z: 0 })).toBe(false);
    expect(game.place("net", { x: 2, z: 0 })).toBe(true);
    expect(game.place("bolt", { x: 3, z: 0 })).toBe(true);
    expect(game.upgrade(game.state.towers[0].id)).toBe(false);
    expect(game.upgrade(game.state.towers[1].id)).toBe(true);
  });

  it("shows a net slowing a runner, freezing on pause, and expiring cleanly", () => {
    const game = new Game({
      ...theLastLantern,
      waves: [
        {
          title: "Net feedback",
          reward: 0,
          groups: [{ kind: "runner", count: 1, gap: 1 }],
        },
      ],
    });
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

  // Repeating damage-triggered rage changes final-wave timing; preserve the existing loss/pressure assertions.
  // Balance evidence refreshed for the owner-promoted September 29 wave tuning.
  it.each(["mixed", "squirrels"] as const)(
    "records wave-six pressure against the %s opening line",
    (strategy) => {
      const result = play(strategy);
      expect(result.phase).toBe("lost");
      expect(result.waves).toBe(6);
      expect(result.lives).toBe(6);
      expect(result.killsByKind.boss).toBe(0);
      expect(result.checkpoints).toHaveLength(6);
      expect(waveProfile(result.checkpoints)).toEqual(
        strategy === "mixed"
          ? [
              [1, 67.5, 12, 0, 55, 85, 5, 1],
              [2, 63, 12, 0, 60, 100, 6, 2],
              [3, 106.5, 12, 0, 67, 142, 8, 3],
              [4, 97.1, 12, 0, 60, 208, 12, 4],
              [5, 134.7, 12, 0, 84, 299, 12, 9],
              [6, 59.1, 6, 1, 36, 62, 12, 11],
            ]
          : [
              [1, 63.9, 12, 0, 50, 85, 4, 2],
              [2, 61, 12, 0, 30, 100, 7, 2],
              [3, 101, 12, 0, 52, 142, 10, 2],
              [4, 94.8, 12, 0, 70, 208, 12, 4],
              [5, 133.3, 12, 0, 39, 299, 12, 10],
              [6, 57.3, 6, 1, 46, 62, 12, 11],
            ],
      );
    },
  );

  it("also pressures a line with one poorly placed opening Squirrel", () => {
    const result = play("mistake");
    expect(result.phase).toBe("lost");
    expect(result.lives).toBe(6);
    expect(result.killsByKind.boss).toBe(0);
    expect(result.checkpoints).toHaveLength(6);
    expect(waveProfile(result.checkpoints)).toEqual([
      [1, 64.6, 12, 0, 50, 85, 4, 2],
      [2, 59.7, 12, 0, 30, 100, 7, 2],
      [3, 101.1, 12, 0, 52, 142, 10, 2],
      [4, 95.6, 12, 0, 70, 208, 12, 4],
      [5, 133.5, 12, 0, 39, 299, 12, 10],
      [6, 57.4, 6, 1, 46, 62, 12, 11],
    ]);
  });
});
