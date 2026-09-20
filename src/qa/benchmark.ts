import { TimingProbe } from "./timing-probe";
import { Battlefield } from "../render/battlefield";
import { Game } from "../sim/game";
import { lanternPass } from "../content/lantern-pass";
import { ENEMIES } from "../content/catalog";
import { pathLength, pointOnPath } from "../sim/path";
import type { EnemyKind, TowerKind } from "../sim/types";

// Deliberately artificial rendering stress. Never imported by the playable game.
const root = document.querySelector<HTMLDivElement>("#qa")!;
root.innerHTML = `<style>body{margin:0;background:#142825;color:#f5e5c0;font:14px system-ui}header{height:110px;padding:12px;box-sizing:border-box;display:flex;gap:16px;align-items:center}button{min-height:44px;padding:10px}#field{height:calc(100vh - 110px)}#status{white-space:pre-wrap}#results{position:absolute;bottom:8px;left:8px;max-height:35vh;overflow:auto;background:#142825ed;font-size:11px;pointer-events:none}</style><header><div><b>Stormwatch · artificial stress fixture</b><br>Seed 42 · 60 enemies · 12 defenses · 3 lodges<br>150 combined shots/effects · 10s warmup + 180s × 3</div><button id="start">Run three benchmarks</button><button id="diagnostic">Run one diagnostic</button><button id="attribution">Run attribution diagnostic</button><button id="download" disabled>Download evidence</button><span id="status">Ready. Keep this tab visible.</span></header><div id="field"></div><pre id="results"></pre>`;
const field = new Battlefield(document.querySelector("#field")!);
field.profileTiming = true;
let game: Game;
let nextId = 100000;
let elapsed = 0;
let last = 0;
let running = false;
let run = 0;
let runLimit = 3;
let timingProbe: TimingProbe | undefined;
let samples: number[] = [];
let renderedIntervals: number[] = [];
let lastRendered = 0;
let invalid = false;
let transitions: { time: number; phase: string; payout: boolean }[] = [];
const results: unknown[] = [];
let peakEnemies = 0,
  peakEffects = 0;
let rescueCount = 0;
let previousWork = {
  totalMs: 0,
  renderMs: 0,
  rendered: false,
  rebuiltScene: false,
  phase: "idle",
  renderer: { ...field.frameProfile },
};
let rebuiltScene = false;
let renderSamples: number[] = [];
let workSamples: number[] = [];
let phaseSamples: {
  figures: number[];
  effects: number[];
  submission: number[];
} = {
  figures: [],
  effects: [],
  submission: [],
};
let longFrames: {
  intervalMs: number;
  elapsed: number;
  previousWork: typeof previousWork;
}[] = [];
const status = document.querySelector("#status")!;
function fixture() {
  rebuiltScene = true;
  game = new Game(
    { ...lanternPass, waves: [{ title: "Stress", reward: 30, groups: [] }] },
    "nets",
    false,
    42,
  );
  game.state.coins = 10000;
  const positions = [
    { x: 1, z: 2 },
    { x: 3, z: 2 },
    { x: 5, z: 2 },
    { x: 7, z: 2 },
    { x: 8, z: 2 },
    { x: 10, z: 2 },
    { x: 1, z: 4 },
    { x: 3, z: 4 },
    { x: 5, z: 4 },
    { x: 7, z: 4 },
    { x: 8, z: 4 },
    { x: 10, z: 4 },
    { x: 0, z: 1 },
    { x: 0, z: 5 },
    { x: 11, z: 5 },
  ];
  const placed = positions.map((p, i) =>
    game.place(
      i >= 12 ? "trade" : (["bolt", "stone", "net"] as TowerKind[])[i % 3],
      p,
    ),
  );
  if (placed.some((ok) => !ok))
    throw new Error("QA fixture placement rejected; stress counts are invalid");
  field.load(game.level);
  game.startWave();
  replenish();
}
function replenish() {
  const len = pathLength(game.level.path);
  while (game.state.enemies.length < 60) {
    const kind = (["raider", "runner", "armored", "boss"] as EnemyKind[])[
        Math.floor(game.random() * 4)
      ],
      distance = game.random() * (len - 3),
      hp = ENEMIES[kind].hp * 5;
    game.state.enemies.push({
      ...pointOnPath(game.level.path, distance),
      id: nextId++,
      kind,
      hp,
      maxHp: hp,
      distance,
      slowUntil: game.state.clock + (nextId % 3 === 0 ? 3 : 0),
      alive: true,
      hitAt: -1,
    });
  }
  while (game.state.effects.length + game.state.shots.length < 150) {
    const p = pointOnPath(game.level.path, game.random() * len);
    game.state.effects.push({
      ...p,
      id: nextId++,
      kind: nextId % 3 === 0 ? "splash" : "hit",
      age: 0,
      ttl: 0.3 + game.random() * 0.8,
    });
  }
  game.state.effects = game.state.effects.slice(
    0,
    Math.max(0, 150 - game.state.shots.length),
  );
  game.state.lives = 12;
}
function percentile(values: number[], fraction: number) {
  return (
    values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ??
    0
  );
}
function finishRun() {
  const ordered = [...samples].sort((a, b) => a - b);
  const renderedOrder = [...renderedIntervals].sort((a, b) => a - b);
  const defenses = game.state.towers.filter(
    (tower) => tower.kind !== "trade",
  ).length;
  const lodges = game.state.towers.filter(
    (tower) => tower.kind === "trade",
  ).length;
  results.push({
    run: run + 1,
    seed: 42,
    sampleCount: samples.length,
    renderedCadence: {
      sampleCount: renderedOrder.length,
      medianFps: 1000 / percentile(renderedOrder, 0.5),
      p95Ms: percentile(renderedOrder, 0.95),
      worstMs: renderedOrder.at(-1),
      framesOver100Ms: renderedOrder.filter((v) => v > 100).length,
    },
    medianFps: 1000 / percentile(ordered, 0.5),
    p95Ms: percentile(ordered, 0.95),
    worstMs: ordered.at(-1),
    framesOver100Ms: samples.filter((x) => x > 100).length,
    renderCpuP95Ms: percentile(
      [...renderSamples].sort((a, b) => a - b),
      0.95,
    ),
    frameWorkCpuP95Ms: percentile(
      [...workSamples].sort((a, b) => a - b),
      0.95,
    ),
    phaseCpuP95Ms: Object.fromEntries(
      Object.entries(phaseSamples).map(([name, values]) => [
        name,
        percentile(
          [...values].sort((a, b) => a - b),
          0.95,
        ),
      ]),
    ),
    longFrames,
    attribution: timingProbe?.stop(),
    cpuTimingNote:
      "Wall-clock elapsed time inside callbacks and render phases, not CPU execution time or asynchronous GPU completion. Long intervals include preceding work and browser scheduling.",
    peakEnemies,
    defenses,
    lodges,
    peakCombinedShotsEffects: peakEffects,
    rescueUses: rescueCount,
    transitions,
    invalidatedByHiddenTab: invalid,
    viewport: [innerWidth, innerHeight],
    pixelRatio: devicePixelRatio,
    userAgent: navigator.userAgent,
    renderer: field.renderer
      .getContext()
      .getParameter(field.renderer.getContext().VERSION),
    timestamp: new Date().toISOString(),
  });
  document.querySelector("#results")!.textContent = JSON.stringify(
    results,
    null,
    2,
  );
  timingProbe = undefined;
  run++;
  if (run === runLimit) {
    running = false;
    (document.querySelector("#attribution") as HTMLButtonElement).disabled =
      false;
    status.textContent = "Complete. Download evidence.";
    (document.querySelector("#download") as HTMLButtonElement).disabled = false;
    (document.querySelector("#start") as HTMLButtonElement).disabled = false;
    (document.querySelector("#diagnostic") as HTMLButtonElement).disabled =
      false;
  } else resetRun();
}
function resetRun() {
  elapsed = 0;
  samples = [];
  renderedIntervals = [];
  lastRendered = 0;
  renderSamples = [];
  workSamples = [];
  phaseSamples = { figures: [], effects: [], submission: [] };
  longFrames = [];
  invalid = false;
  transitions = [];
  peakEnemies = 0;
  peakEffects = 0;
  rescueCount = 0;
  fixture();
}
function frame(now: number) {
  const raw = last ? now - last : 0;
  last = now;
  if (running) {
    const workStart = performance.now();
    rebuiltScene = false;
    elapsed += raw / 1000;
    if (elapsed >= 10) {
      samples.push(raw);
      if (raw > 100)
        longFrames.push({ intervalMs: raw, elapsed, previousWork });
    }
    const stage = elapsed % 60;
    // Actual simulation resolves an empty wave, credits payout, and emits victory at each minute boundary.
    if (stage > 58.5) {
      if (game.state.phase === "wave") {
        game.state.enemies = [];
        game.state.shots = [];
        game.tick(1 / 30);
        transitions.push({
          time: elapsed,
          phase: game.state.phase,
          payout: !!game.state.lastPayout,
        });
      }
    } else {
      if (game.state.phase === "won") fixture();
      game.advance(Math.min(raw / 1000, 0.1));
      if (game.state.phase === "lost") game.state.phase = "wave";
      replenish();
      if (Math.floor(elapsed / 14) > rescueCount) {
        game.state.abilityReadyAt = 0;
        game.rescue({ x: 5, z: 1 });
        rescueCount++;
      }
      replenish();
    }
    game.drainEvents();
    const renderStart = performance.now();
    const rendered = true;
    if (rendered) {
      field.update(game, null, Math.min(raw / 1000, 0.1));
      if (elapsed >= 10 && lastRendered)
        renderedIntervals.push(now - lastRendered);
      lastRendered = now;
    }
    const renderMs = performance.now() - renderStart;
    peakEnemies = Math.max(peakEnemies, game.state.enemies.length);
    peakEffects = Math.max(
      peakEffects,
      game.state.shots.length + game.state.effects.length,
    );
    const nextStatus = `Run ${run + 1}/${runLimit} · ${elapsed < 10 ? "warmup" : "measuring"} ${elapsed.toFixed(0)}/190s\n${game.state.enemies.length} enemies · ${game.state.shots.length + game.state.effects.length} shots/effects · ${game.state.phase}${invalid ? " · INVALID: hidden tab" : ""}`;
    if (status.textContent !== nextStatus) status.textContent = nextStatus;
    previousWork = {
      totalMs: performance.now() - workStart,
      renderMs,
      rendered,
      rebuiltScene,
      phase: game.state.phase,
      renderer: rendered
        ? { ...field.frameProfile }
        : {
            figuresMs: 0,
            effectsMs: 0,
            submissionMs: 0,
            createdRigs: 0,
            drawCalls: 0,
          },
    };
    if (elapsed >= 10) {
      workSamples.push(previousWork.totalMs);
    }
    if (elapsed >= 10 && rendered) {
      renderSamples.push(renderMs);
      phaseSamples.figures.push(field.frameProfile.figuresMs);
      phaseSamples.effects.push(field.frameProfile.effectsMs);
      phaseSamples.submission.push(field.frameProfile.submissionMs);
    }
    timingProbe?.frame(raw, workStart, performance.now());
    if (elapsed >= 190) finishRun();
  }
  requestAnimationFrame(frame);
}
function startRuns(count: number, attribution = false) {
  runLimit = count;
  results.length = 0;
  run = 0;
  resetRun();
  timingProbe = attribution ? new TimingProbe() : undefined;
  running = true;
  (document.querySelector("#attribution") as HTMLButtonElement).disabled = true;
  last = 0;
  (document.querySelector("#start") as HTMLButtonElement).disabled = true;
  (document.querySelector("#diagnostic") as HTMLButtonElement).disabled = true;
  (document.querySelector("#download") as HTMLButtonElement).disabled = true;
}
document.querySelector("#start")!.addEventListener("click", () => startRuns(3));
document
  .querySelector("#diagnostic")!
  .addEventListener("click", () => startRuns(1));
document
  .querySelector("#attribution")!
  .addEventListener("click", () => startRuns(1, true));
document.querySelector("#download")!.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            scenario:
              "Artificial stress; raw requestAnimationFrame intervals, foreground tab, no CPU throttling",
            results,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  a.download = "stormwatch-performance.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running) invalid = true;
});
requestAnimationFrame(frame);
