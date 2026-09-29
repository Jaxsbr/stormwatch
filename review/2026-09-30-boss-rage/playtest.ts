import { Battlefield } from "../../src/render/battlefield";
import { CANONICAL_CONTENT } from "../../src/config/configuration";
import { AttemptSession, runScenario } from "../../src/workbench/runs";
import { bossRagePhase } from "../../src/sim/boss-rage";
const scenario = {
  id: "boss-rage-review",
  levelId: "the-last-lantern",
  mode: "encounter",
  progression: "first-arrival",
  difficulty: "normal",
  seed: 42,
} as const;
const plan = runScenario(CANONICAL_CONTENT, scenario, {
  policyId: "finale-mixed",
  maxTicks: 30000,
});
const session = new AttemptSession(CANONICAL_CONTENT, scenario);
session.replay(plan.trace, {
  stopAtPreparationWaveId: "the-last-lantern-wave-6",
});
while (!session.preparationHeld && session.tickIndex < plan.ticks)
  session.step();
const game = session.game;
const field = new Battlefield(document.querySelector<HTMLElement>("#field")!);
field.load(game.level);
const capture = document.createElement("canvas");
capture.width = 1280;
capture.height = 720;
const ctx = capture.getContext("2d")!;
const log: unknown[] = [];
let running = false,
  accumulator = 0,
  previous = performance.now(),
  phase = -1;
let recorder: MediaRecorder | undefined;
const chunks: Blob[] = [];
let completed: Blob | undefined;
let finishAt = Infinity;
function frame(now: number) {
  const dt = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  if (running && game.state.phase !== "won" && game.state.phase !== "lost") {
    accumulator += dt;
    while (accumulator >= 1 / 30) {
      const events = session.step();
      accumulator -= 1 / 30;
      events
        .filter((e) => e.type === "rally")
        .forEach((e) =>
          log.push({
            clock: game.state.clock,
            type: e.type,
            recipients: e.value,
          }),
        );
      const boss = game.state.enemies.find((e) => e.kind === "boss");
      if (boss && bossRagePhase(boss) !== phase) {
        phase = bossRagePhase(boss);
        log.push({
          clock: game.state.clock,
          phase,
          hp: boss.hp,
          maxHp: boss.maxHp,
          slow: boss.slowUntil > game.state.clock,
        });
      }
    }
  }
  field.update(game, null, dt);
  const boss = game.state.enemies.find((e) => e.kind === "boss");
  document.querySelector<HTMLProgressElement>("progress")!.value = boss
    ? boss.hp / boss.maxHp
    : 1;
  ctx.drawImage(field.renderer.domElement, 0, 0, 1280, 720);
  if (boss) {
    ctx.fillStyle = "#15221ee6";
    ctx.fillRect(420, 12, 440, 62);
    ctx.fillStyle = "#fff0cd";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("The Roadwarden", 640, 36);
    ctx.fillStyle = "#3d4540";
    ctx.fillRect(438, 48, 404, 12);
    ctx.fillStyle = "#ce6741";
    ctx.fillRect(438, 48, 404 * Math.max(0, boss.hp / boss.maxHp), 12);
    ctx.fillStyle = "#ffe1ac";
    for (const fraction of [1 / 4])
      ctx.fillRect(438 + 404 * fraction, 48, 2, 12);
  }
  if (running && (game.state.phase === "won" || game.state.phase === "lost")) {
    if (!Number.isFinite(finishAt)) {
      finishAt = now + 2000;
      log.push({ outcome: game.state.phase, clock: game.state.clock });
    }
    if (now >= finishAt) {
      running = false;
      recorder?.stop();
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.querySelector<HTMLButtonElement>("#start")!.onclick = () => {
  if (running) return;
  const stream = capture.captureStream(30);
  recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 8_000_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.onstop = () => {
    completed = new Blob(chunks, { type: recorder!.mimeType });
    stream.getTracks().forEach((t) => t.stop());
  };
  recorder.start();
  session.continueReplay();
  running = true;
};
Object.assign(window, {
  bossReview: {
    game,
    session,
    field,
    log,
    plan,
    get completed() {
      return completed;
    },
    get ready() {
      return !running && session.preparationHeld;
    },
  },
});
