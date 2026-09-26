import type { Game } from "../sim/game";

/** Combat can speed up; the between-wave decision window follows wall time. */
export function advanceBattleFrame(
  game: Game,
  realSeconds: number,
  speed: number,
) {
  if (
    game.state.phase === "preparation" &&
    game.state.nextWaveCountdown !== null
  ) {
    game.tick(realSeconds);
  } else {
    game.advance(Math.min(0.1, realSeconds) * speed);
  }
}
