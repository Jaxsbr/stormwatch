import { describe, expect, it } from "vitest";
import { lanternPass } from "../src/content/lantern-pass";
import { INTER_WAVE_COUNTDOWN_SECONDS, Game } from "../src/sim/game";

const DT = 1 / 30;

function gameWithTwoQuickWaves() {
  return new Game({
    ...lanternPass,
    path: [
      { x: -1, z: 3 },
      { x: 0, z: 3 },
    ],
    waves: [1, 2].map((wave) => ({
      title: `Wave ${wave}`,
      reward: 0,
      groups: [{ kind: "raider" as const, count: 1, gap: 1 }],
    })),
  });
}

function step(game: Game, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) game.tick(DT);
}

function clearFirstWave(game: Game) {
  expect(game.startWave()).toBe(true);
  for (let i = 0; i < 300 && game.state.phase === "wave"; i++) game.tick(DT);
  expect(game.state.phase).toBe("preparation");
  expect(game.state.wave).toBe(1);
  expect(game.state.nextWaveCountdown).toBe(INTER_WAVE_COUNTDOWN_SECONDS);
}

describe("between-wave countdown", () => {
  it("only starts after wave one, then starts wave two automatically after five seconds", () => {
    const game = gameWithTwoQuickWaves();
    step(game, 8);
    expect(game.state.phase).toBe("preparation");
    expect(game.state.wave).toBe(0);
    expect(game.state.nextWaveCountdown).toBeNull();

    clearFirstWave(game);
    step(game, 4.9);
    expect(game.state.phase).toBe("preparation");
    expect(game.state.nextWaveCountdown).toBeCloseTo(0.1, 5);
    step(game, 0.2);
    expect(game.state.phase).toBe("wave");
    expect(game.state.wave).toBe(2);
    expect(game.state.nextWaveCountdown).toBeNull();
  });

  it("freezes while paused and lets the player start the next wave immediately", () => {
    const game = gameWithTwoQuickWaves();
    clearFirstWave(game);
    step(game, 2);
    const remaining = game.state.nextWaveCountdown;
    expect(remaining).toBeCloseTo(3, 5);

    game.pause();
    step(game, 8);
    expect(game.state.phase).toBe("paused");
    expect(game.state.nextWaveCountdown).toBe(remaining);

    game.pause();
    expect(game.state.phase).toBe("preparation");
    expect(game.startWave()).toBe(true);
    expect(game.state.phase).toBe("wave");
    expect(game.state.wave).toBe(2);
    expect(game.state.nextWaveCountdown).toBeNull();
  });
});
