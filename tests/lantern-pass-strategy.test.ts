import { describe, expect, it } from "vitest";
import { lanternPass } from "../src/content/lantern-pass";
import { Game } from "../src/sim/game";

const DT = 1 / 30;
const placements = [
  { x: 1, z: 4 },
  { x: 3, z: 2 },
  { x: 5, z: 2 },
  { x: 7, z: 5 },
  { x: 3, z: 0 },
  { x: 7, z: 4 },
  { x: 5, z: 0 },
];

function runAttempt() {
  const game = new Game(lanternPass, "none", false, 42, {
    unlockedUpgrades: [],
  });
  let nextPlacement = 0;
  for (let wave = 0; wave < lanternPass.waves.length; wave += 1) {
    const desired = wave === 0 ? 2 : 1;
    for (let count = 0; count < desired; count += 1) {
      const point = placements[nextPlacement];
      if (point && game.place("bolt", point)) nextPlacement += 1;
    }
    expect(game.startWave()).toBe(true);
    for (let i = 0; i < 240 * 30 && game.state.phase === "wave"; i += 1) {
      if (
        wave === 0 &&
        game.state.towers.length === 2 &&
        game.state.coins >= 40
      ) {
        expect(game.place("bolt", placements[nextPlacement])).toBe(true);
        nextPlacement += 1;
      }
      game.tick(DT);
    }
    if (game.state.phase === "won" || game.state.phase === "lost") break;
  }
  return game.state;
}

describe("Lantern Pass discovery balance", () => {
  it("can be cleared with Squirrels only while adding defenders across waves", () => {
    const result = runAttempt();
    expect(result.phase).toBe("won");
    expect(result.lives).toBe(12);
    expect(result.towers.every((tower) => tower.kind === "bolt")).toBe(true);
    expect(result.towers.every((tower) => tower.level === 1)).toBe(true);
    expect(result.towers.length).toBeGreaterThanOrEqual(6);
    expect(result.coins).toBeGreaterThanOrEqual(40);
  });
});
