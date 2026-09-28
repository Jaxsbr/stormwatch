import { Battlefield } from "../render/battlefield";
import { Sound } from "../audio/sound";
import { battleStats, displayedWave } from "../ui/battle-ui";
import { button } from "../ui/game-chrome";
import { BattleSelection } from "../ui/battle-selection";
import { DefenderPopups } from "../ui/defender-popups";
import type { Game } from "../sim/game";
import type { GameEvent } from "../sim/types";
import type { LegalCommand } from "./commands";

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
  const sound = new Sound();
  sound.setMuted(true);
  sound.unlock();

  host.innerHTML = `<main class="battle-screen popup-battle workbench-attempt"><header class="battle-header"><div class="battle-brand"><strong>${escape(game.level.name)}</strong><small>${escape(options.label)}</small></div>${battleStats(game.level.waves.length)}<div class="battle-tools">${button("speed", "1×", "icon-button")}${button("pause", "Pause", "quiet")}${button("restart", "Restart", "quiet")}${button("exit", "Workbench", "quiet")}</div></header><div class="battle-middle"><section class="battlefield"><div id="canvas-host"></div><div class="defender-popup-root"></div><div id="wave-countdown" class="wave-countdown" hidden></div><div class="wb-attempt-notice" role="status"></div><div class="wb-boss" hidden></div></section><aside class="battle-aside"><div class="wave-controls">${button("start", "Start first wave", "primary")}${options.onBranch ? button("branch", "Take manual control at preparation", "quiet") : ""}${options.onContinueReplay ? button("continue-replay", "Continue replay", "quiet") : ""}</div></aside></div></main>`;
  let field: Battlefield;
  try {
    field = new Battlefield(host.querySelector<HTMLElement>("#canvas-host")!);
    field.load(game.level);
  } catch (error) {
    sound.pause(true);
    host.querySelector("#canvas-host")!.textContent =
      `Unable to draw battlefield: ${String(error)}`;
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
    (point) => field.project(point),
    (_action, accepted) => {
      if (!accepted)
        notice("Command rejected: check gold, placement and available tools.");
      update();
    },
    () => options.isReplayLocked?.() ?? false,
  );
  field.onMiss = () => {
    selection.close();
    popups.update();
  };
  field.onPick = (point) => {
    if (options.isReplayLocked?.()) return;
    popups.pick(point);
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
    start.disabled = replayLocked || state.phase !== "preparation";
    start.textContent =
      state.phase === "won"
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
      held;
    const continueButton = host.querySelector<HTMLButtonElement>(
      '[data-action="continue-replay"]',
    );
    if (continueButton) continueButton.disabled = !held;
    if (held)
      notice(
        "Replay held at the selected wave preparation. Continue replay or take manual control; the preparation countdown is frozen.",
      );
    if (branch)
      branch.disabled = !replayLocked || state.phase !== "preparation";
  }
  host.onclick = (event) => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action]",
    )?.dataset.action;
    if (!action) return;
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
    if (options.isPreparationHeld?.()) accumulator = 0;
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
    field.update(
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
    host.onclick = null;
    popups.destroy();
    field.dispose();
    sound.pause(true);
  };
}
