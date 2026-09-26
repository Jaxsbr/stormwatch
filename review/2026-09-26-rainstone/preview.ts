import { Game } from "../../src/sim/game";
import { rainstoneCrossing } from "../../src/content/rainstone-crossing";
import { Battlefield } from "../../src/render/battlefield";
import { attachRecording } from "../../src/render/recording";
const field = new Battlefield(
  document.querySelector<HTMLDivElement>("#field")!,
);
field.load(rainstoneCrossing);
let game: Game;
function reset(wave = 2) {
  game = new Game(rainstoneCrossing, "none", false, 42, {
    unlockedUpgrades: ["bolt"],
  });
  // Review only: begin at the selected wave with three base Squirrels and no extra tools.
  for (const point of [
    { x: 0, z: 4 },
    { x: 3, z: 2 },
    { x: 6, z: 2 },
  ])
    game.place("bolt", point);
  game.state.wave = wave - 1;
  game.startWave();
}
reset();
document.querySelector<HTMLButtonElement>("#reset")!.onclick = () => reset();
document.querySelector<HTMLButtonElement>("#opening")!.onclick = () => reset(1);
document.querySelector<HTMLButtonElement>("#finale")!.onclick = () => reset(4);
document.querySelector<HTMLButtonElement>("#pause")!.onclick = () =>
  game.pause();
attachRecording(field.renderer.domElement);
let last = performance.now();
function frame(now: number) {
  game.advance((now - last) / 1000);
  last = now;
  field.update(game, null, 1 / 30);
  document.querySelector("#state")!.textContent =
    `Wave ${game.state.wave} · ${game.state.phase} · ${game.state.clock.toFixed(1)}s · ${game.state.effects.filter((fx) => fx.kind === "evade").length} misses visible`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
