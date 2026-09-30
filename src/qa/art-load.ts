import { Battlefield } from "../render/battlefield";
import { LEVELS } from "../content/levels";
import { Game } from "../sim/game";

declare global {
  interface Window {
    __stormwatchArtLoad?: {
      level: string;
      artReadyMs: number;
      firstRenderedMs: number;
      missingArt: number;
      error?: string;
    };
  }
}

const root = document.querySelector<HTMLDivElement>("#qa")!;
root.innerHTML = '<div id="field" style="width:960px;height:540px"></div>';
const levelId = new URLSearchParams(location.search).get("level");
const level = LEVELS.find((candidate) => candidate.id === levelId) ?? LEVELS[0];
const start = performance.now();
const field = new Battlefield(document.querySelector<HTMLElement>("#field")!);
field.load(level);
const game = new Game(level);

try {
  await field.artReady(level);
  const artReadyMs = performance.now() - start;
  field.update(game, null, 0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  field.update(game, null, 0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  window.__stormwatchArtLoad = {
    level: level.id,
    artReadyMs,
    firstRenderedMs: performance.now() - start,
    missingArt: 0,
  };
} catch (error) {
  window.__stormwatchArtLoad = {
    level: level.id,
    artReadyMs: 0,
    firstRenderedMs: 0,
    missingArt: 1,
    error: String(error),
  };
}
