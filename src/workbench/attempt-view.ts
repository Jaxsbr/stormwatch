import { Battlefield } from "../render/battlefield";
import { Sound } from "../audio/sound";
import { battleStats, displayedWave } from "../ui/battle-ui";
import { button } from "../ui/game-chrome";
import { BattleSelection } from "../ui/battle-selection";
import { DefenderPopups } from "../ui/defender-popups";
import type { Game } from "../sim/game";
import type { GameEvent } from "../sim/types";
import type { LegalCommand } from "./commands";
import { AttemptArtReadiness } from "./attempt-art-readiness";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export interface AttemptViewOptions {
  label: string;
  command(command: LegalCommand): boolean;
  step(): GameEvent[];
  onExit(): void;
  onRestart(): void;
  onFinish(): void;
  onBranch?(): boolean;
  isReplayLocked?(): boolean;
  isPreparationHeld?(): boolean;
  onContinueReplay?(): boolean;
}

/** Presentation adapter only. The caller owns the immutable attempt and evidence. */
export function mountAttempt(
  host: HTMLElement,
  game: Game,
  options: AttemptViewOptions,
) {
  const selection = new BattleSelection(game, (command) =>
    options.command(command),
  );
  let speed = 1;
  let disposed = false;
  let finished = false;
  let last = performance.now();
  let accumulator = 0;
  const artReadiness = new AttemptArtReadiness();
  const sound = new Sound();
  sound.setMuted(true);
  sound.unlock();

  host.innerHTML = `<main class="battle-screen popup-battle workbench-attempt"><header class="battle-header"><div class="battle-brand"><strong>${escape(game.level.name)}</strong><small>${escape(options.label)}</small></div>${battleStats(game.level.waves.length)}<div class="battle-tools">${button("speed", "1×", "icon-button")}${button("pause", "Pause", "quiet")}${button("restart", "Restart", "quiet")}${button("exit", "Workbench", "quiet")}</div></header><div class="battle-middle"><section class="battlefield"><div id="canvas-host"></div><div class="defender-popup-root"></div><div id="wave-countdown" class="wave-countdown" hidden></div><div class="wb-attempt-notice" role="status"></div><div class="wb-boss" hidden></div></section><aside class="battle-aside"><div class="wave-controls">${button("start", "Start first wave", "primary")}${options.onBranch ? button("branch", "Take manual control at preparation", "quiet") : ""}${options.onContinueReplay ? button("continue-replay", "Continue replay", "quiet") : ""}</div></aside></div></main>`;
  const startButton = host.querySelector<HTMLButtonElement>(
    '[data-action="start"]',
  )!;
  startButton.disabled = true;
  startButton.textContent = "Preparing art…";
  host
    .querySelector(".wave-controls")!
    .insertAdjacentHTML(
      "beforeend",
      button("retry-art", "Retry art loading", "quiet", "hidden"),
    );
  let field: Battlefield | undefined;
  const canvasHost = host.querySelector<HTMLElement>("#canvas-host")!;
  try {
    field = new Battlefield(canvasHost);
    field.load(game.level);
  } catch (error) {
    sound.pause(true);
    field?.dispose();
    field = undefined;
    canvasHost.textContent = `Unable to draw battlefield: ${String(error)}`;
    host
      .querySelector('[data-action="exit"]')!
      .addEventListener("click", options.onExit);
    return () => {
      disposed = true;
      sound.pause(true);
    };
  }

  const notice = (text: string) => {
    host.querySelector(".wb-attempt-notice")!.textContent = text;
  };
  const act = (command: LegalCommand) => {
    const accepted = options.command(command);
    if (!accepted)
      notice("Command rejected: check crowns, placement and available tools.");
    update();
    return accepted;
  };
  const popups = new DefenderPopups(
    host.querySelector<HTMLElement>(".defender-popup-root")!,
    selection,
    (point) => field!.project(point),
    (_action, accepted) => {
      if (!accepted)
        notice("Command rejected: check gold, placement and available tools.");
      update();
    },
    () => !artReadiness.ready || (options.isReplayLocked?.() ?? false),
  );
  const bindField = (current: Battlefield) => {
    current.onMiss = () => {
      selection.close();
      popups.update();
    };
    current.onPick = (point) => {
      if (!artReadiness.ready || options.isReplayLocked?.()) return;
      popups.pick(point);
      update();
    };
  };
  bindField(field);
  const watchArt = (current: Battlefield, request: number) => {
    void (async () => {
      try {
        await current.artReady(game.level);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        if (
          disposed ||
          field !== current ||
          !artReadiness.settle(request, "ready")
        )
          return;
        notice("");
        update();
      } catch {
        if (
          disposed ||
          field !== current ||
          !artReadiness.settle(request, "failed")
        )
          return;
        notice("Battle art could not load. Retry to continue.");
        update();
      }
    })();
  };
  const retryArt = () => {
    if (artReadiness.status !== "failed") return;
    selection.close();
    field?.dispose();
    field = undefined;
    canvasHost.replaceChildren();
    const request = artReadiness.begin();
    notice("Preparing battle art…");
    try {
      const next = new Battlefield(canvasHost);
      next.load(game.level);
      field = next;
      bindField(next);
      watchArt(next, request);
    } catch (error) {
      field?.dispose();
      field = undefined;
      canvasHost.replaceChildren();
      notice(
        `Unable to draw battlefield: ${String(error)}. Retry art loading.`,
      );
      artReadiness.settle(request, "failed");
    }
    update();
  };
  function update() {
    const state = game.state;
    const text = (selector: string, value: string) => {
      const node = host.querySelector(selector);
      if (node && node.textContent !== value) node.textContent = value;
    };
    text("#coins", String(state.coins));
    text("#lives", `${state.lives} / ${state.maxLives}`);
    text(
      "#wave",
      `${displayedWave(state, game.level.waves.length)} / ${game.level.waves.length}`,
    );
    text(
      '[data-action="pause"]',
      state.phase === "paused" ? "Resume" : "Pause",
    );
    const countdown = host.querySelector<HTMLElement>("#wave-countdown")!;
    countdown.hidden =
      state.phase !== "preparation" || state.nextWaveCountdown === null;
    countdown.textContent = `Next wave in ${Math.ceil(state.nextWaveCountdown ?? 0)} · preparation follows real time`;
    const start = host.querySelector<HTMLButtonElement>(
      '[data-action="start"]',
    )!;
    const replayLocked = options.isReplayLocked?.() ?? false;
    const artStatus = artReadiness.status;
    start.disabled =
      !artReadiness.ready || replayLocked || state.phase !== "preparation";
    start.textContent = !artReadiness.ready
      ? artStatus === "failed"
        ? "Battle art unavailable"
        : "Preparing art…"
      : state.phase === "won"
        ? "Victory"
        : state.phase === "lost"
          ? "Defeat"
          : state.phase === "paused"
            ? "Paused"
            : state.phase === "wave"
              ? `${state.enemies.length} on the trail`
              : state.wave
                ? "Start next wave early"
                : "Start first wave";
    host.querySelector<HTMLButtonElement>('[data-action="retry-art"]')!.hidden =
      artStatus !== "failed";
    const boss = state.enemies.find((enemy) => enemy.kind === "boss");
    const bossPanel = host.querySelector<HTMLElement>(".wb-boss")!;
    bossPanel.hidden = !boss;
    if (boss)
      bossPanel.textContent = `${game.enemies.boss.name} · ${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    if (!game.canAct()) selection.close();
    popups.update();
    const branch = host.querySelector<HTMLButtonElement>(
      '[data-action="branch"]',
    );
    const held = options.isPreparationHeld?.() ?? false;
    host.querySelector<HTMLButtonElement>('[data-action="pause"]')!.disabled =
      !artReadiness.ready || held;
    const continueButton = host.querySelector<HTMLButtonElement>(
      '[data-action="continue-replay"]',
    );
    if (continueButton) continueButton.disabled = !artReadiness.ready || !held;
    if (held && artReadiness.ready)
      notice(
        "Replay held at the selected wave preparation. Continue replay or take manual control; the preparation countdown is frozen.",
      );
    if (branch)
      branch.disabled =
        !artReadiness.ready || !replayLocked || state.phase !== "preparation";
  }
  watchArt(field, artReadiness.begin());
  host.onclick = (event) => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action]",
    )?.dataset.action;
    if (!action) return;
    if (action === "retry-art") {
      retryArt();
      return;
    }
    if (
      !artReadiness.ready &&
      ["start", "pause", "branch", "continue-replay"].includes(action)
    ) {
      notice(
        artReadiness.status === "failed"
          ? "Battle art could not load. Retry to continue."
          : "Preparing battle art…",
      );
      return;
    }
    if ((options.isReplayLocked?.() ?? false) && action === "start") {
      notice(
        "Replay controls are locked. Take manual control at preparation to change the defense.",
      );
      return;
    }
    if (action === "start") {
      act({ type: "start" });
      selection.close();
    } else if (action === "pause") {
      act({ type: "pause" });
      sound.pause(game.state.phase === "paused");
    } else if (action === "speed") {
      speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
      host.querySelector('[data-action="speed"]')!.textContent = `${speed}×`;
    } else if (action === "restart") options.onRestart();
    else if (action === "exit") options.onExit();
    else if (action === "continue-replay") {
      if (options.onContinueReplay?.()) notice("Replay continued.");
    } else if (action === "branch")
      notice(
        options.onBranch?.()
          ? "Manual control: prior replay retained."
          : "Branch unavailable at this preparation point.",
      );
    update();
  };
  let lastPhase = game.state.phase;
  function frame(now: number) {
    if (disposed) return;
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!artReadiness.canAdvance || options.isPreparationHeld?.())
      accumulator = 0;
    else if (game.state.phase !== "paused") {
      accumulator += elapsed;
      while (accumulator >= 1 / 30) {
        const steps = game.state.phase === "preparation" ? 1 : speed;
        for (let count = 0; count < steps; count++) {
          if (options.isPreparationHeld?.()) break;
          if (count > 0 && game.state.phase === "preparation") break;
          for (const event of options.step()) sound.play(event.type);
        }
        if (options.isPreparationHeld?.()) {
          accumulator = 0;
          break;
        }
        accumulator -= 1 / 30;
      }
    }
    if (game.state.phase === "wave" && lastPhase === "preparation")
      selection.close();
    lastPhase = game.state.phase;
    field?.update(
      game,
      selection.selected,
      elapsed,
      selection.point
        ? { point: selection.point, kind: selection.kind }
        : undefined,
    );
    update();
    if (
      !finished &&
      (game.state.phase === "won" || game.state.phase === "lost")
    ) {
      finished = true;
      options.onFinish();
      notice(
        `${game.state.phase === "won" ? "Victory" : "Defeat"} · ${game.state.lives} hearts · ${game.state.coins} crowns. Evidence retained; no family progress awarded.`,
      );
      sound.pause(true);
    }
    requestAnimationFrame(frame);
  }
  update();
  requestAnimationFrame(frame);
  return () => {
    disposed = true;
    artReadiness.invalidate();
    host.onclick = null;
    popups.destroy();
    field?.dispose();
    sound.pause(true);
  };
}
