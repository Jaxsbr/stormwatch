import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { lanternPass } from "../src/content/lantern-pass";

const DT = 1 / 30;

function encounter() {
  return new Game({
    ...lanternPass,
    id: "rat-shield-review",
    width: 32,
    path: [
      { x: -1, z: 3 },
      { x: 30, z: 3 },
    ],
    waves: [
      {
        title: "One rat",
        reward: 0,
        groups: [{ kind: "raider" as const, count: 1, gap: 1 }],
      },
    ],
  });
}

function step(game: Game, seconds: number) {
  for (let tick = 0; tick < seconds * 30; tick++) game.tick(DT);
}

describe("Rat Raider shield", () => {
  it("raises, lowers, and raises again while walking; pause holds its pose", () => {
    const game = encounter();
    expect(game.startWave()).toBe(true);
    step(game, 1);
    const rat = game.state.enemies[0];
    expect(rat.shieldRaised).toBe(false);

    step(game, 1);
    expect(rat.shieldRaised).toBe(true);
    const distance = rat.distance;
    game.pause();
    step(game, 2);
    expect(rat.shieldRaised).toBe(true);
    expect(rat.distance).toBe(distance);
    game.pause();

    step(game, 2);
    expect(rat.shieldRaised).toBe(false);
    step(game, 3);
    expect(rat.shieldRaised).toBe(true);
  });

  it("halves a guarded blow and reports a shield impact without an unprotected hit", () => {
    const guarded = encounter();
    guarded.startWave();
    step(guarded, 2);
    const rat = guarded.state.enemies[0];
    expect(rat.shieldRaised).toBe(true);
    guarded.drainEvents();
    expect(guarded.rescue({ x: 1, z: 3 })).toBe(true);
    expect(rat.hp).toBe(24);
    expect(rat.hitAt).toBe(-1);
    expect(rat.shieldHitAt).toBe(guarded.state.clock);
    expect(guarded.drainEvents().map((event) => event.type)).toContain(
      "shield-hit",
    );

    const unguarded = encounter();
    unguarded.startWave();
    step(unguarded, 1);
    unguarded.drainEvents();
    expect(unguarded.rescue({ x: 0, z: 3 })).toBe(true);
    expect(unguarded.state.kills).toBe(1);
    expect(unguarded.drainEvents().map((event) => event.type)).toContain("hit");
  });
});
