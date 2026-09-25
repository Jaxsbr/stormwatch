import { describe, expect, it } from "vitest";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";
import { Game } from "../src/sim/game";

const DT = 1 / 30;
type Strategy = (game: Game, wave: number) => void;

interface AttemptResult {
  phase: Game["state"]["phase"];
  wave: number;
  lives: number;
  coins: number;
  duration: number;
}

const boltA = { x: 0, z: 4 };
const boltB = { x: 3, z: 2 };
const boltC = { x: 6, z: 2 };
const boltD = { x: 9, z: 5 };
const stoneA = { x: 2, z: 6 };
const stoneB = { x: 9, z: 4 };
const netA = { x: 7, z: 5 };
function runAttempt(card: "reach" | "none", strategy: Strategy): AttemptResult {
  const game = new Game(rainstoneCrossing, card, false, 42);
  for (let wave = 0; wave < rainstoneCrossing.waves.length; wave += 1) {
    strategy(game, wave);
    expect(game.startWave()).toBe(true);
    for (let i = 0; i < 240 * 30 && game.state.phase === "wave"; i += 1) {
      game.tick(DT);
    }
    if (game.state.phase === "won" || game.state.phase === "lost") break;
  }
  return {
    phase: game.state.phase,
    wave: game.state.wave,
    lives: game.state.lives,
    coins: game.state.coins,
    duration: game.state.clock,
  };
}

function spendingLed(game: Game, wave: number): void {
  if (wave === 0) {
    game.place("bolt", boltA);
    game.place("bolt", boltB);
    game.place("stone", stoneA);
  }
  if (wave === 1) {
    game.place("bolt", boltC);
    game.upgrade(game.state.towers[0].id);
  }
  if (wave === 2) {
    game.place("net", netA);
    game.upgrade(game.state.towers[1].id);
  }
  if (wave === 3) {
    game.place("bolt", boltD);
    game.upgrade(game.state.towers[2].id);
  }
  if (wave === 4) {
    game.place("stone", stoneB);
    game.upgrade(game.state.towers[3].id);
  }
  if (wave === 5) game.upgrade(game.state.towers[4].id);
  if (wave === 6) game.upgrade(game.state.towers[5].id);
}

describe("Rainstone Crossing strategy evidence", () => {
  it("supports a spending-led line through all eight waves with no leaks", () => {
    const result = runAttempt("reach", spendingLed);

    expect(result.phase).toBe("won");
    expect(result.wave).toBe(8);
    expect(result.lives).toBe(12);
    expect(result.duration).toBeGreaterThanOrEqual(240);
    expect(result.duration).toBeLessThanOrEqual(330);
  });
});
