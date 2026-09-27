import { Battlefield } from "../render/battlefield";
import { LEVELS } from "../content/levels";
import { Game } from "../sim/game";
import { CANONICAL_CONTENT } from "../config/configuration";
import { AttemptSession, runScenario } from "../workbench/runs";
import type { Scenario } from "../workbench/scenarios";

// Actual render lifecycle, deliberately accelerated simulation and synthetic
// toolbar-height changes. This cannot reproduce Android system navigation UI.
const root = document.querySelector<HTMLDivElement>("#qa")!;
root.innerHTML = `<style>body{margin:0;background:#142825;color:#f5e5c0;font:14px system-ui}button{min-height:44px}#field{width:1024px;max-width:100%;height:520px}pre{white-space:pre-wrap}</style><h1>Retry and viewport resource audit</h1><p>Two Lantern → Rainstone → Last Lantern → retry cycles; synthetic viewport changes. Desktop measurements, not tablet qualification.</p><button id="run">Run lifecycle audit</button><button id="chapter">Run full chapter and boss retry audit</button><button id="download" disabled>Download audit</button><div id="field"></div><pre id="results">Ready</pre>`;
const host = document.querySelector<HTMLElement>("#field")!;
const output = document.querySelector("#results")!;
const button = document.querySelector<HTMLButtonElement>("#run")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const chapter = document.querySelector<HTMLButtonElement>("#chapter")!;
const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
let report: unknown;

type ResourceSample = {
  cycle: number;
  phase: string;
  wave: number;
  level: string;
  peakGeometry: number;
  peakTextures: number;
  worstFrameWorkMs: number;
  geometry: number;
  textures: number;
  programs: number;
  canvasPixels: number;
  heapBytes: number | null;
};
async function run(fullChapter = false) {
  const samples: ResourceSample[] = [];
  const intervals: number[] = [];
  let releasedContexts = 0;
  let redundantBufferResizes = 0;
  let invalid = document.hidden;
  const hidden = () => {
    if (document.hidden) invalid = true;
  };
  document.addEventListener("visibilitychange", hidden);
  try {
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const index of [0, 1, 2, 2]) {
        const field = new Battlefield(host);
        const scenario: Scenario = {
          id: "lifecycle-audit",
          levelId: LEVELS[index].id,
          mode: "encounter",
          progression: "first-arrival",
          difficulty: "normal",
          seed: 42,
        };
        const plan = fullChapter
          ? runScenario(CANONICAL_CONTENT, scenario, {
              policyId: ["lantern-growth", "coverage-first", "finale-mixed"][
                index
              ],
            })
          : undefined;
        const session = plan
          ? new AttemptSession(CANONICAL_CONTENT, scenario)
          : undefined;
        if (plan && session) session.replay(plan.trace);
        const game =
          session?.game ??
          new Game(LEVELS[index], "none", false, 42, {
            unlockedUpgrades: index ? ["bolt"] : [],
          });
        field.load(game.level);
        if (!session) {
          game.place("bolt", index === 0 ? { x: 3, z: 2 } : { x: 3, z: 3 });
          game.startWave();
        }
        const context = field.renderer.getContext();
        try {
          // Let asynchronous assets arrive; keep rendering actual actors.
          const start = performance.now();
          let previous = start;
          while (performance.now() - start < 1500) {
            if (!session) game.advance(1 / 30);
            field.update(game, null, 1 / 30);
            await frame();
            const now = performance.now();
            intervals.push(now - previous);
            previous = now;
          }
          let peakGeometry = field.renderer.info.memory.geometries;
          let peakTextures = field.renderer.info.memory.textures;
          let worstFrameWorkMs = 0;
          if (plan && session) {
            while (session.tickIndex < plan.ticks) {
              const workStart = performance.now();
              for (
                let tick = 0;
                tick < 30 && session.tickIndex < plan.ticks;
                tick++
              )
                session.step();
              // Include viewport animation during actual enemy bursts.
              host.style.height = `${Math.floor(session.tickIndex / 30) % 2 ? 520 : 560}px`;
              field.update(game, null, 1);
              peakGeometry = Math.max(
                peakGeometry,
                field.renderer.info.memory.geometries,
              );
              peakTextures = Math.max(
                peakTextures,
                field.renderer.info.memory.textures,
              );
              worstFrameWorkMs = Math.max(
                worstFrameWorkMs,
                performance.now() - workStart,
              );
              await frame();
              const now = performance.now();
              intervals.push(now - previous);
              previous = now;
            }
            if (game.state.phase !== plan.phase)
              throw new Error("Chapter replay diverged");
            if (game.state.phase !== (index < 2 ? "won" : "lost"))
              throw new Error("Chapter journey outcome changed");
            if (index === 2 && game.state.wave !== 6)
              throw new Error("Boss wave was not reached");
          }
          // Settle the final changed size before counting only no-op notifications.
          field.resize();
          const original = field.renderer.setSize.bind(field.renderer);
          let calls = 0;
          field.renderer.setSize = (...args) => {
            calls++;
            original(...args);
          };
          for (let n = 0; n < 20; n++) field.resize();
          redundantBufferResizes += calls;
          // Height alternation emulates available viewport changes, not OS bars.
          for (let n = 0; n < 12; n++) {
            host.style.height = `${n % 2 ? 520 : 560}px`;
            field.resize();
            game.advance(1 / 30);
            field.update(game, null, 1 / 30);
            await frame();
          }
          samples.push({
            cycle,
            phase: game.state.phase,
            wave: game.state.wave,
            peakGeometry,
            peakTextures,
            worstFrameWorkMs,
            level: game.level.id,
            geometry: field.renderer.info.memory.geometries,
            textures: field.renderer.info.memory.textures,
            programs: field.renderer.info.programs?.length ?? 0,
            canvasPixels:
              field.renderer.domElement.width *
              field.renderer.domElement.height,
            heapBytes:
              (
                performance as Performance & {
                  memory?: { usedJSHeapSize: number };
                }
              ).memory?.usedJSHeapSize ?? null,
          });
        } finally {
          field.dispose();
        }
        await frame();
        if (context.isContextLost()) releasedContexts++;
        output.textContent = JSON.stringify(
          { samples, releasedContexts, redundantBufferResizes },
          null,
          2,
        );
      }
    }
  } finally {
    document.removeEventListener("visibilitychange", hidden);
  }
  const sorted = intervals.sort((a, b) => a - b);
  const resourcePlateau =
    samples.length === 8 &&
    samples
      .slice(4)
      .every(
        (sample, i) =>
          sample.peakGeometry <= samples[i].peakGeometry &&
          sample.peakTextures <= samples[i].peakTextures,
      );
  report = {
    scenario: fullChapter
      ? "Fixed-tick full chapter policies, boss-wave loss/retry and synthetic viewport oscillation (accelerated, not physical performance)"
      : "Accelerated canonical openings, repeated renderer disposal and synthetic viewport-height oscillation",
    browser: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    engineRevision: __STORMWATCH_ENGINE_REVISION__,
    invalid,
    resourcePlateau,
    releasedContexts,
    expectedReleasedContexts: 8,
    redundantBufferResizes,
    expectedRedundantBufferResizes: 0,
    resourceSamples: samples,
    frameIntervals: {
      p95: sorted[Math.floor(sorted.length * 0.95)],
      worst: sorted.at(-1),
    },
    passed:
      !invalid &&
      resourcePlateau &&
      releasedContexts === 8 &&
      redundantBufferResizes === 0,
  };
  output.textContent = JSON.stringify(report, null, 2);
  download.disabled = false;
}
async function start(fullChapter: boolean) {
  button.disabled = chapter.disabled = download.disabled = true;
  report = undefined;
  try {
    await run(fullChapter);
  } catch (error) {
    output.textContent = String(error);
  } finally {
    button.disabled = chapter.disabled = false;
  }
}
button.addEventListener("click", () => void start(false));
chapter.addEventListener("click", () => void start(true));
download.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  link.download = "stormwatch-lifecycle.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
