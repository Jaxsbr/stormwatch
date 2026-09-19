import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { lanternPass } from "../src/content/lantern-pass";

function encounter() {
  return new Game({
    ...lanternPass,
    path: [
      { x: 0, z: 3 },
      { x: 30, z: 3 },
    ],
    waves: [
      {
        title: "Effects",
        reward: 0,
        groups: [{ kind: "armored", count: 3, gap: 0.1 }],
      },
    ],
  });
}
function step(game: Game, seconds: number) {
  for (let i = 0; i < seconds * 30; i++) game.tick(1 / 30);
}

describe("combat effects and rescue", () => {
  it("stone impact damages an armored group inside its splash radius", () => {
    const game = encounter();
    game.place("stone", { x: 1, z: 2 });
    game.state.towers[0].cooldown = 1.2;
    game.startWave();
    step(game, 1.1);
    expect(game.state.enemies).toHaveLength(3);
    const before = game.state.enemies.map((e) => e.hp);
    step(game, 0.7);
    expect(game.state.enemies.every((e, i) => e.hp < before[i])).toBe(true);
    expect(game.state.enemies.every((e) => e.hp === 132)).toBe(true);
  });
  it("supply drop applies armored damage, slow and one heart, then rejects cooldown reuse", () => {
    const game = encounter();
    expect(game.rescue({ x: 0, z: 3 })).toBe(false);
    game.startWave();
    step(game, 1.1);
    game.state.lives = 8;
    expect(game.rescue({ x: 1, z: 3 })).toBe(true);
    expect(game.state.lives).toBe(9);
    expect(game.state.enemies.every((e) => e.hp === 94)).toBe(true);
    expect(
      game.state.enemies.every((e) => e.slowUntil > game.state.clock),
    ).toBe(true);
    expect(game.rescue({ x: 1, z: 3 })).toBe(false);
    expect(game.state.lives).toBe(9);
    expect(game.state.abilityUses).toBe(1);
    const ready = game.state.abilityReadyAt;
    game.pause();
    step(game, 45);
    expect(game.state.abilityReadyAt).toBe(ready);
    expect(game.rescue({ x: 1, z: 3 })).toBe(false);
  });
  it("assistance starts a fresh attempt with extra crowns and hearts", () => {
    const normal = new Game(lanternPass, "supply");
    const assist = new Game(lanternPass, "supply", true);
    expect(assist.state.coins - normal.state.coins).toBe(70);
    expect(assist.state.lives).toBe(20);
    expect(assist.state.towers).toEqual([]);
    expect(assist.state.wave).toBe(0);
  });
});
