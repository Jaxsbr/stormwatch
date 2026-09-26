import { describe, expect, it } from "vitest";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";
import { Game } from "../src/sim/game";

const positions = [
  { x: 0, z: 4 },
  { x: 3, z: 2 },
  { x: 6, z: 2 },
  { x: 9, z: 5 },
  { x: 2, z: 6 },
  { x: 9, z: 4 },
  { x: 5, z: 4 },
  { x: 7, z: 2 },
  { x: 3, z: 4 },
  { x: 9, z: 2 },
  { x: 7, z: 5 },
  { x: 2, z: 4 },
];
function attempt(upgradesFirst: boolean, poor = false) {
  const game = new Game(rainstoneCrossing, "none", false, 42, {
    unlockedUpgrades: ["bolt"],
  });
  let next = 0;
  let elapsed = 0;
  const waves: { wave: number; lives: number; coins: number; time: number }[] =
    [];
  while (
    elapsed < 400 &&
    game.state.phase !== "won" &&
    game.state.phase !== "lost"
  ) {
    if (!poor) {
      const tower = game.state.towers.find((tower) => tower.level === 1);
      if (upgradesFirst && game.state.towers.length >= 3 && tower)
        game.upgrade(tower.id);
      else if (next < positions.length && game.place("bolt", positions[next]))
        next++;
      else if (tower) game.upgrade(tower.id);
    } else if (!game.state.towers.length) game.place("bolt", { x: 0, z: 1 });
    if (game.state.phase === "preparation") {
      if (game.state.wave)
        waves.push({
          wave: game.state.wave,
          lives: game.state.lives,
          coins: game.state.coins,
          time: game.state.clock,
        });
      game.startWave();
    }
    game.tick(1 / 30);
    elapsed += 1 / 30;
  }
  return {
    phase: game.state.phase,
    lives: game.state.lives,
    waves: game.state.wave,
    duration: game.state.clock,
    bank: game.state.coins,
    towers: game.state.towers.length,
    upgraded: game.state.towers.filter((tower) => tower.level === 2).length,
    checkpoints: waves,
  };
}
describe("Rainstone's earned-tool strategies", () => {
  it.each([false, true])(
    "clears three mixed waves with upgrades-first=%s",
    (upgradesFirst) => {
      const result = attempt(upgradesFirst);

      expect(result.phase).toBe("won");
      expect(result.waves).toBe(3);
      expect(result.duration).toBeGreaterThan(180);
      expect(result.duration).toBeLessThan(400);
    },
  );
  it("loses with poor coverage and delayed spending", () => {
    expect(attempt(false, true).phase).toBe("lost");
  });
});
