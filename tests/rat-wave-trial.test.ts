import { describe, expect, it } from "vitest";
import { lanternPass } from "../src/content/lantern-pass";
import { Game } from "../src/sim/game";
import type { WaveGroupDef } from "../src/sim/types";

const DT = 1 / 30;

function trial(group: WaveGroupDef): Game {
  const game = new Game({
    ...lanternPass,
    width: 32,
    path: [
      { x: -1, z: 3 },
      { x: 31, z: 3 },
    ],
    waves: [{ title: "Test pattern", reward: 0, groups: [group] }],
  });
  game.startWave();
  return game;
}

function step(game: Game, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / DT); i += 1) game.tick(DT);
}

describe("Rat Raider five-wave trial", () => {
  it("starts Lantern Pass with a small build budget while preserving tower prices", () => {
    const squirrels = new Game(lanternPass);
    expect(squirrels.state.coins).toBe(100);
    expect(squirrels.place("bolt", { x: 3, z: 0 })).toBe(true);
    expect(squirrels.place("bolt", { x: 4, z: 0 })).toBe(true);
    expect(squirrels.state.coins).toBe(20);

    const discovery = new Game(lanternPass);
    expect(discovery.place("stone", { x: 3, z: 0 })).toBe(false);
    expect(discovery.place("net", { x: 3, z: 0 })).toBe(false);
  });

  it("matches the selected five-wave sequence", () => {
    expect(lanternPass.waves).toHaveLength(5);
    // Owner-promoted opening: four groups of five, with a wait before each group.
    expect(lanternPass.waves[0].groups).toHaveLength(4);
    expect(
      lanternPass.waves[0].groups.map((group) => group.delayBefore),
    ).toEqual([5, 5, 5, 5]);
    expect(
      lanternPass.waves.map((wave) => {
        const group = wave.groups[0];
        return {
          kind: group.kind,
          count: group.count,
          gap: group.gap,
          batchSize: group.batchSize ?? 1,
          batchStagger: group.batchStagger ?? 0,
          up: group.shieldCycle?.upSeconds,
          down: group.shieldCycle?.downSeconds,
          movementScale: group.movementScale ?? 1,
        };
      }),
    ).toEqual([
      {
        kind: "raider",
        count: 5,
        gap: 2.5,
        batchSize: 1,
        batchStagger: 0,
        up: 3,
        down: 5,
        movementScale: 1,
      },
      {
        kind: "raider",
        count: 23,
        gap: 2,
        batchSize: 1,
        batchStagger: 0,
        up: 3,
        down: 5,
        movementScale: 1,
      },
      {
        kind: "raider",
        count: 20,
        gap: 3,
        batchSize: 2,
        batchStagger: 0.3,
        up: 3,
        down: 5,
        movementScale: 0.75,
      },
      {
        kind: "raider",
        count: 23,
        gap: 3,
        batchSize: 1,
        batchStagger: 0,
        up: 3,
        down: 5,
        movementScale: 1,
      },
      {
        kind: "raider",
        count: 20,
        gap: 2,
        batchSize: 2,
        batchStagger: 0.3,
        up: 3,
        down: 5,
        movementScale: 0.75,
      },
    ]);
  });

  it("starts custom guard cycles unguarded, then follows the requested up/down timing", () => {
    const game = trial({
      kind: "raider",
      count: 1,
      gap: 1,
      shieldCycle: { upSeconds: 2, downSeconds: 8 },
    });

    step(game, 8.9);
    const rat = game.state.enemies[0];
    expect(rat.shieldRaised).toBe(true);
    step(game, 1.9);
    expect(rat.shieldRaised).toBe(false);
    step(game, 8.1);
    expect(rat.shieldRaised).toBe(true);
  });

  it("stagger-spawns pairs at the batch interval and counts total rats", () => {
    const game = trial({
      kind: "raider",
      count: 6,
      gap: 3,
      batchSize: 2,
      batchStagger: 0.3,
    });

    step(game, 1.2);
    expect(game.state.enemies).toHaveLength(2);
    expect(
      game.state.enemies[1].spawnedAt - game.state.enemies[0].spawnedAt,
    ).toBeCloseTo(0.3, 1);
    step(game, 3);
    expect(game.state.enemies).toHaveLength(4);
    expect(
      game.state.enemies[2].spawnedAt - game.state.enemies[0].spawnedAt,
    ).toBeCloseTo(3, 1);
    step(game, 3);
    expect(game.state.enemies).toHaveLength(6);
  });

  it("applies reduced movement to each rat without changing the base catalog speed", () => {
    const regular = trial({ kind: "raider", count: 1, gap: 1 });
    const slow = trial({
      kind: "raider",
      count: 1,
      gap: 1,
      movementScale: 0.75,
    });

    step(regular, 4.7);
    step(slow, 4.7);

    expect(slow.state.enemies[0].distance).toBeCloseTo(
      regular.state.enemies[0].distance * 0.75,
      1,
    );
  });

  it("keeps the five-wave trial valid as a normal level definition", () => {
    expect(() => new Game(lanternPass)).not.toThrow();
  });
});
