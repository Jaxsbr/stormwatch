import { Battlefield } from "../../src/render/battlefield";
import { Game } from "../../src/sim/game";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../../src/config/configuration";
import { backdropVisuals } from "../../src/content/encounter-visuals";
import board from "./board.json";
const host = document.querySelector<HTMLElement>("#field")!;
const field = new Battlefield(host);
let game: Game,
  ready = false,
  running = true,
  previous = performance.now();
// Review-only source; never registered or selected by canonical content.
backdropVisuals["poolbanks-original-review"] =
  "mossy-poolbanks-candidate-v1/original.webp";
async function load() {
  ready = false;
  const choice = (document.querySelector("#scene") as HTMLSelectElement).value;
  const content = structuredClone(CANONICAL_CONTENT);
  const id = ["candidate", "original"].includes(choice)
    ? content.levels[0].id
    : choice;
  if (["candidate", "original"].includes(choice)) {
    let l = content.levels[0];
    l.routeLayoutId = "twin-switchbacks";
    l.path = [];
    l.blocked = [];
    delete l.routes;
    l.visual = {
      backdrop:
        choice === "original"
          ? "poolbanks-original-review"
          : "mossy-poolbanks-candidate-v1",
    };
    const routes = content.routeLayouts!.find(
      (l) => l.id === "twin-switchbacks",
    )!.routes;
    for (const w of l.waves)
      for (const packet of w.packets)
        packet.groups.forEach(
          (g, i) => (g.routeId = routes[i % routes.length].id),
        );
  }
  const conf = resolveConfiguration(content, id);
  game = new Game(conf.level, "none", false, 42, { configuration: conf });
  field.load(game.level);
  await field.artReady(game.level);
  ready = true;
  const cells = Array.from({ length: 96 }, (_, i) => ({
    x: i % 12,
    z: Math.floor(i / 12),
  })).filter((p) => game.canPlace(p));
  document.querySelector("#status")!.textContent =
    `${cells.length} placeable cells · art loaded · scenery review only`;
}
document.querySelector("#scene")!.addEventListener("change", load);
document
  .querySelector("#start")!
  .addEventListener("click", () => game.startWave());
document
  .querySelector("#pause")!
  .addEventListener("click", () => (running = !running));
document.querySelector("#place")!.addEventListener("click", () => {
  for (const p of [
    { x: 1, z: 2 },
    { x: 3, z: 2 },
    { x: 8, z: 5 },
  ])
    if (game.canPlace(p)) game.place("bolt", p);
});
document.querySelectorAll<HTMLButtonElement>("[data-size]").forEach(
  (b) =>
    (b.onclick = () => {
      const [w, h] = b.dataset.size!.split(",");
      host.style.width = w + "px";
      host.style.height = h + "px";
      field.resize();
    }),
);
for (const [id, p] of Object.entries(board.visual.markers)) {
  const b = document.createElement("button");
  b.textContent = id.slice(-2);
  b.style.left = p.x + "%";
  b.style.top = p.y + "%";
  b.setAttribute("aria-label", id);
  document.querySelector("#board")!.append(b);
}
function frame(now: number) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (ready) {
    if (running) game.advance(dt);
    field.update(game, null, dt);
  }
  requestAnimationFrame(frame);
}
load().catch(
  (e) => (document.querySelector("#status")!.textContent = String(e)),
);
requestAnimationFrame(frame);
