import { theLastLantern } from "../../src/content/the-last-lantern";
import { Game } from "../../src/sim/game";
import { Battlefield } from "../../src/render/battlefield";
import type { LevelDef } from "../../src/sim/types";

const host = document.querySelector<HTMLElement>("#field")!;
const stateLabel = document.querySelector<HTMLElement>("#state")!;
const field = new Battlefield(host);
let game: Game;
let displayedWave: 1 | 4 = 1;
let lastFrame = 0;
let terminalSeconds = 0;

function startWave(wave: 1 | 4) {
  displayedWave = wave;
  const level: LevelDef = {
    ...theLastLantern,
    waves: [theLastLantern.waves[wave - 1]],
  };
  game = new Game(level, "nets", false, 42);
  for (const site of [{ x: 1, z: 4 }]) {
    if (!game.place("net", site))
      console.warn("Preview net placement rejected", site);
  }
  field.load(level);
  game.startWave();
  lastFrame = 0;
  terminalSeconds = 0;
  setState();
}

function setState() {
  const slowed = game.state.enemies.filter(
    (enemy) => enemy.slowUntil > game.state.clock,
  ).length;
  stateLabel.textContent = `Wave ${displayedWave} · ${game.state.phase} · ${game.state.lives} lives · ${slowed} slowed`;
}

document.querySelector("#wave1")!.addEventListener("click", () => startWave(1));
document.querySelector("#wave4")!.addEventListener("click", () => startWave(4));
document.querySelector("#pause")!.addEventListener("click", () => {
  game.pause();
  setState();
});

function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = lastFrame === 0 ? 0 : Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (game.state.phase === "won" || game.state.phase === "lost") {
    terminalSeconds += dt;
    if (terminalSeconds > 1.5) startWave(displayedWave);
  } else {
    game.advance(dt);
  }
  field.update(game, null, dt);
  setState();
}

startWave(1);
requestAnimationFrame(frame);
