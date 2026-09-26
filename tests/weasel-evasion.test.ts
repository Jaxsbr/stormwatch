import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import type { TowerKind } from "../src/sim/types";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";

const dt = 1 / 30;
function step(game: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 30); i++) game.tick(dt);
}
function trial(enabled: boolean, kind: TowerKind = "bolt") {
  const game = new Game({
    ...rainstoneCrossing,
    availableTowers: ["bolt", "net"],
    width: 40,
    path: [
      { x: -1, z: 3 },
      { x: 39, z: 3 },
    ],
    waves: [
      {
        title: "Evasion",
        reward: 0,
        groups: [
          {
            kind: "runner",
            count: 1,
            gap: 1,
            evasionCycle: enabled
              ? { downSeconds: 3, upSeconds: 2 }
              : undefined,
          },
        ],
      },
    ],
  });
  game.place(kind, { x: 2, z: 2 });
  game.startWave();
  return game;
}
describe("Weasel evasion through real attacks", () => {
  it("takes hits before its window, then evades arriving arrows without damage", () => {
    const game = trial(true);
    step(game, 3.6);
    const enemy = game.state.enemies[0];
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
    const hp = enemy.hp;
    game.drainEvents();
    step(game, 1.4);
    expect(enemy.hp).toBe(hp);
    expect(game.drainEvents().some((event) => event.type === "evade")).toBe(
      true,
    );
    expect(game.state.effects.some((effect) => effect.kind === "evade")).toBe(
      true,
    );
  });
  it("keeps first-wave Weasels hittable at the same age", () => {
    const game = trial(false);
    step(game, 3.6);
    const enemy = game.state.enemies[0];
    const hp = enemy.hp;
    step(game, 1.4);
    expect(enemy.hp).toBeLessThan(hp);
    expect(game.drainEvents().some((event) => event.type === "evade")).toBe(
      false,
    );
  });
  it("evades nets without refreshing slow, freezes on pause, and becomes hittable again", () => {
    const game = trial(true, "net");
    step(game, 3.8);
    const enemy = game.state.enemies[0];
    const hp = enemy.hp;
    const slowUntil = enemy.slowUntil;
    const distance = enemy.distance;
    game.pause();
    step(game, 4);
    expect(enemy.distance).toBe(distance);
    expect(enemy.hp).toBe(hp);
    game.pause();
    step(game, 1.2);
    expect(enemy.hp).toBe(hp);
    expect(enemy.slowUntil).toBe(slowUntil);
    expect(game.place("net", { x: 5, z: 2 })).toBe(true);
    step(game, 2.8);
    expect(enemy.hp).toBeLessThan(hp);
    expect(enemy.slowUntil).toBeGreaterThan(slowUntil);
    const replay = trial(true, "net");
    step(replay, 1);
    expect(replay.state.enemies[0].evadeAt).toBe(-1);
  });
});

it("authors quiet introductions, alternating pairs, and repeating mixed bursts through real spawns", () => {
  function arrivals(wave: number, seconds: number) {
    const game = new Game(rainstoneCrossing);
    game.state.wave = wave - 1;
    game.startWave();
    const seen = new Set<number>();
    const spawned: { kind: string; at: number }[] = [];
    for (let i = 0; i < seconds * 30; i++) {
      game.tick(dt);
      for (const enemy of game.state.enemies) {
        if (seen.has(enemy.id)) continue;
        seen.add(enemy.id);
        spawned.push({ kind: enemy.kind, at: enemy.spawnedAt });
      }
    }
    return spawned;
  }
  const opening = arrivals(1, 16);
  expect(opening.map((enemy) => enemy.kind)).toEqual([
    "raider",
    "raider",
    "raider",
    "raider",
    "raider",
    "raider",
    "runner",
    "runner",
    "runner",
    "runner",
  ]);
  expect(opening[6].at - opening[5].at).toBeCloseTo(3.5, 1);
  const alternating = arrivals(2, 7);
  expect(alternating.map((enemy) => enemy.kind)).toEqual([
    "raider",
    "runner",
    "raider",
    "runner",
  ]);
  const burst = arrivals(3, 8);
  expect(burst.map((enemy) => enemy.kind)).toEqual([
    "raider",
    "raider",
    "raider",
    "runner",
    "runner",
    "raider",
  ]);
  expect(burst[1].at - burst[0].at).toBeCloseTo(1, 1);
  expect(burst[5].at - burst[4].at).toBeCloseTo(3, 1);
});
