import "../../src/style.css";
import "../../src/ui/battle-ui.css";
import "../../src/ui/button-skin.css";
import { loadRuntimeContent } from "../../src/config/runtime-content";
// Install the candidate before importing adapters which derive content registries.
await loadRuntimeContent("/game-content.json");
const [
  { CANONICAL_CONTENT },
  { Battlefield },
  { BattleSelection },
  { DefenderPopups },
  { progressionContext },
  { freshSave, recordVictoryOutcome },
  { createAttempt, play },
  { enemyInspection },
] = await Promise.all([
  import("../../src/config/configuration"),
  import("../../src/render/battlefield"),
  import("../../src/ui/battle-selection"),
  import("../../src/ui/defender-popups"),
  import("../../src/content/progression"),
  import("../../src/persistence/save"),
  import("./strategies"),
  import("../../src/ui/enemy-inspection"),
]);
const style = document.createElement("style");
style.textContent = `body{background:#15221e;color:#fff0cd;overflow:auto}#app{height:auto;min-height:100dvh}.fixture-header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px}.fixture-header a{color:#e6cf9f}.fixture-header strong{flex:1}button{min-height:44px;padding:8px 12px;font:inherit;background:#263d32;color:#fff0cd;border:1px solid #9c9668;border-radius:8px}.fixture-label{margin:4px 8px;font:13px system-ui}#field{width:100%;height:calc(100dvh - 112px);min-height:280px;position:relative}#canvas-host{position:absolute;inset:0}#status{position:absolute;top:8px;left:8px;pointer-events:none;background:#15221ee0;padding:8px;border-radius:8px;font:15px system-ui}#bosses{position:absolute;top:8px;right:8px;pointer-events:none;background:#15221ee0;padding:8px;font:14px system-ui}#inspection{position:absolute;z-index:5000;inset:100px 15%;padding:20px;background:#15221ef5;overflow:auto;border:1px solid #ccb582;border-radius:16px}.enemy-inspection{margin-bottom:20px}.enemy-inspection h3{margin:0}.enemy-inspection p{font:16px/1.5 system-ui}`;
document.head.append(style);
const params = new URLSearchParams(location.search),
  id = params.get("map") ?? "mosswater-01";
const content = CANONICAL_CONTENT,
  context = progressionContext(content);
let save = freshSave(context);
// Each entry entitlement is earned by an actual preceding won Game, never a recorded-victory shortcut.
for (const prior of context.levelIds) {
  if (prior === id) break;
  const report = play(content, prior, save);
  if (report.phase !== "won")
    throw new Error(
      `Candidate policy cannot reach ${id}: ${prior} ${report.phase}`,
    );
  save = recordVictoryOutcome(save, prior, 1, context).save;
}
const game = createAttempt(content, id, save);
if (params.has("finale")) {
  if (id !== "mosswater-05")
    throw new Error("Finale shortcut is only defined for encounter 5");
  const report = play(content, id, save);
  let index = 0;
  // Stop before wave-five start, after its legal preparation purchases.
  replay: for (let tick = 0; tick < 36000; tick++) {
    while (index < report.trace.length && report.trace[index].tick === tick) {
      const c = report.trace[index++].command;
      if (c.type === "start" && game.state.wave === 4) break replay;
      const accepted =
        c.type === "place"
          ? game.place(c.kind, c.point)
          : c.type === "upgrade"
            ? game.upgrade(c.id)
            : c.type === "start"
              ? game.startWave()
              : false;
      if (!accepted) throw new Error("Recorded legal finale build diverged");
    }
    game.tick(1 / 30);
    game.drainEvents();
  }
}
document.querySelector("#title")!.textContent =
  game.level.name + (params.has("finale") ? " — earned finale formation" : "");
const field = new Battlefield(
  document.querySelector<HTMLElement>("#canvas-host")!,
);
field.load(game.level);
field.setGridVisible(true);
await field.artReady(game.level);
const selection = new BattleSelection(game);
const popups = new DefenderPopups(
  document.querySelector<HTMLElement>("#defender-popups")!,
  selection,
  (p) => field.project(p),
  () => update(),
);
field.onPick = (p) => popups.pick(p);
field.onMiss = () => {
  selection.close();
  popups.update();
};
function update() {
  document.querySelector("#status")!.textContent =
    `${game.state.coins} gold · ${game.state.lives} hearts · ${game.state.phase} · wave ${game.state.wave}/${game.level.waves.length} · next payout ${game.level.waves[game.state.wave]?.reward ?? 0}`;
  document.querySelector("#bosses")!.textContent = game.state.enemies
    .filter((e) => e.kind === "boss" && e.alive)
    .map((e) => `${e.routeId}: ${Math.ceil(e.hp)} / ${e.maxHp}`)
    .join(" | ");
  document.querySelector<HTMLButtonElement>("#start")!.disabled =
    game.state.phase !== "preparation";
  document.querySelector("#pause")!.textContent =
    game.state.phase === "paused" ? "Resume" : "Pause";
  popups.update();
}
let previous = performance.now(),
  accumulator = 0;
function frame(now: number) {
  const dt = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  accumulator += dt;
  while (accumulator >= 1 / 30) {
    if (game.state.phase !== "preparation") game.tick(1 / 30);
    accumulator -= 1 / 30;
  }
  field.update(
    game,
    selection.selected,
    dt,
    selection.point
      ? { point: selection.point, kind: selection.kind }
      : undefined,
  );
  game.drainEvents();
  update();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.querySelector<HTMLButtonElement>("#start")!.onclick = () =>
  game.startWave();
document.querySelector<HTMLButtonElement>("#pause")!.onclick = () =>
  game.pause();
document.querySelector<HTMLButtonElement>("#retry")!.onclick = () =>
  location.reload();
const inspection = document.querySelector<HTMLElement>("#inspection")!;
document.querySelector<HTMLButtonElement>("#inspect")!.onclick = () => {
  if (inspection.hidden) {
    if (game.state.phase !== "paused") game.pause();
    inspection.innerHTML =
      enemyInspection(game.level, game.enemies) +
      '<button id="close-inspection">Close inspection</button>';
    inspection.hidden = false;
    document.querySelector<HTMLButtonElement>("#close-inspection")!.onclick =
      () => {
        inspection.hidden = true;
        document.querySelector<HTMLElement>("#inspect")!.focus();
      };
    document.querySelector<HTMLElement>("#close-inspection")!.focus();
  } else inspection.hidden = true;
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !inspection.hidden) {
    inspection.hidden = true;
    document.querySelector<HTMLElement>("#inspect")!.focus();
  }
});
Object.assign(window, { mosswaterFeedback: { game, field, save, content } });
