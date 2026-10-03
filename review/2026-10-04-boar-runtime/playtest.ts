import { pointOnPath } from "../../src/sim/path";
import { routeFor } from "../../src/sim/routes";
import type { Enemy } from "../../src/sim/types";
import { loadRuntimeContent } from "../../src/config/runtime-content";
await loadRuntimeContent("/game-content.json");
const [
  { CANONICAL_CONTENT },
  { Battlefield },
  { progressionContext },
  { freshSave, recordVictoryOutcome },
  { createAttempt, play },
] = await Promise.all([
  import("../../src/config/configuration"),
  import("../../src/render/battlefield"),
  import("../../src/content/progression"),
  import("../../src/persistence/save"),
  import("../mosswater-encounters/strategies"),
]);
const params = new URLSearchParams(location.search),
  id = params.get("map") ?? "mosswater-04";
const context = progressionContext(CANONICAL_CONTENT);
let save = freshSave(context);
for (const prior of context.levelIds) {
  if (prior === id) break;
  const won = play(CANONICAL_CONTENT, prior, save);
  if (won.phase !== "won") throw Error(`Cannot legally reach ${id}`);
  save = recordVictoryOutcome(save, prior, 1, context).save;
}
const report = play(CANONICAL_CONTENT, id, save),
  game = createAttempt(CANONICAL_CONTENT, id, save);
let tick = 0,
  index = 0,
  paused = true,
  seek: false | "any" | "side" = false,
  immuneCount = 0,
  maxSlowedBoars = 0,
  damageCount = 0,
  maxBosses = 0,
  lastCue = "none",
  last = performance.now(),
  accumulator = 0;
function side(e: Enemy) {
  const next = pointOnPath(
    routeFor(game.level, e.routeId).path,
    e.distance + 0.02,
  );
  return Math.abs(next.z - e.z) <= Math.abs(next.x - e.x);
}
function advance() {
  while (index < report.trace.length && report.trace[index].tick === tick) {
    const c = report.trace[index++].command;
    const ok =
      c.type === "place"
        ? game.place(c.kind, c.point)
        : c.type === "upgrade"
          ? game.upgrade(c.id)
          : c.type === "start"
            ? game.startWave()
            : false;
    if (!ok) throw Error("Legal command replay diverged");
  }
  game.tick(1 / 30);
  tick++;
  const events = game.drainEvents();
  const immune = events.filter((e) => e.type === "immune");
  immuneCount += immune.length;
  maxSlowedBoars = Math.max(
    maxSlowedBoars,
    game.state.enemies.filter(
      (e) => e.kind === "armored" && e.slowUntil > game.state.clock,
    ).length,
  );
  damageCount += events.filter((e) => e.type === "hit").length;
  maxBosses = Math.max(
    maxBosses,
    game.state.enemies.filter((e) => e.kind === "boss").length,
  );
  if (immune.length) lastCue = `tick ${tick} · enemy ${immune[0].enemyId}`;
  if (
    seek &&
    immune.some(
      (event) =>
        seek === "any" ||
        game.state.enemies.some((e) => e.id === event.enemyId && side(e)),
    )
  ) {
    paused = true;
    seek = false;
  }
  if (game.state.phase === "won" || game.state.phase === "lost") {
    paused = true;
    seek = false;
  }
}
if (params.has("finale")) {
  if (id !== "mosswater-05") throw Error("Finale requires encounter 5");
  while (tick < 36000) {
    const upcoming = report.trace
      .slice(index)
      .find((c) => c.tick === tick && c.command.type === "start");
    if (upcoming && game.state.wave === 4) break;
    advance();
  }
}
const field = new Battlefield(document.querySelector<HTMLElement>("#field")!);
field.load(game.level);
await field.artReady(game.level);
function render() {
  field.update(game, null, 0);
  const boars = game.state.enemies.filter((e) => e.kind === "armored");
  const active = boars.filter(
    (e) =>
      e.immuneAt !== undefined &&
      game.state.clock - e.immuneAt >= 0 &&
      game.state.clock - e.immuneAt < 0.3,
  );
  document.querySelector("#status")!.textContent =
    `${game.level.name} · ${game.state.phase} · wave ${game.state.wave}/${game.level.waves.length} · ${game.state.clock.toFixed(2)} s · ${paused ? "paused" : "playing"}\nBoars ${boars.length} · active immunity cues ${active.length} (side ${active.filter(side).length}) · events: Immune ${immuneCount}, hits ${damageCount}, max slowed Boars ${maxSlowedBoars} · max simultaneous bosses ${maxBosses}\nLast immune: ${lastCue} · poison attached to Boars ${boars.filter((e) => e.poison).length}`;
  document.querySelector("#pause")!.textContent = paused ? "Play" : "Pause";
}
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused) {
    accumulator +=
      dt *
      Number((document.querySelector("#speed") as HTMLSelectElement).value);
    while (accumulator >= 1 / 30 && !paused) {
      advance();
      accumulator -= 1 / 30;
    }
  }
  render();
  requestAnimationFrame(frame);
}
document.querySelector<HTMLButtonElement>("#pause")!.onclick = () => {
  paused = !paused;
  seek = false;
  accumulator = 0;
};
document.querySelector<HTMLButtonElement>("#step")!.onclick = () => {
  paused = true;
  advance();
  render();
};
document.querySelector<HTMLButtonElement>("#next")!.onclick = () => {
  seek = "any";
  paused = false;
  for (let i = 0; i < 36000 && seek; i++) advance();
  paused = true;
  seek = false;
  render();
};
document.querySelector<HTMLButtonElement>("#retry")!.onclick = () =>
  location.reload();
render();
requestAnimationFrame(frame);

document.querySelector<HTMLButtonElement>("#side")!.onclick = () => {
  seek = "side";
  paused = false;
  for (let i = 0; i < 36000 && seek; i++) advance();
  paused = true;
  seek = false;
  render();
};
