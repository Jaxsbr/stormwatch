import "./style.css";
import "./ui/advantage-screen.css";
import "./ui/game-chrome.css";
import "./ui/button-skin.css";
import { button, resultCard } from "./ui/game-chrome";
import { advantageScreen } from "./ui/advantage-screen";
import { Game } from "./sim/game";
import type { CardId, Point, TowerKind } from "./sim/types";
import { TOWERS, CARDS } from "./content/catalog";
import { LEVELS } from "./content/levels";
import { refundFor, tradeIncome } from "./sim/economy";
import { Battlefield } from "./render/battlefield";
import { attachRecording } from "./render/recording";
import { towerPortrait, paintTowerPortraits } from "./render/portraits";
import { Sound } from "./audio/sound";
import {
  freshSave,
  parseSave,
  recordVictory,
  SAVE_KEY,
} from "./persistence/save";

const app = document.querySelector<HTMLDivElement>("#app")!;
let save = freshSave();
try {
  save = parseSave(localStorage.getItem(SAVE_KEY));
} catch {
  /* Storage is optional; play continues in memory. */
}
const sound = new Sound();
sound.musicVolume = save.music;
sound.effectsVolume = save.effects;
sound.muted = save.muted;
type Screen = "title" | "map" | "briefing" | "battle";
let screen: Screen = "title",
  levelIndex = 0,
  card: CardId = "reach",
  game: Game | null = null,
  field: Battlefield | null = null,
  build: TowerKind | null = null,
  selected: number | null = null,
  rescueMode = false,
  settings = false,
  settingsPaused = false,
  leavePaused = false,
  assisted = false,
  resultSaved = false,
  speed = 1;
let lastTime = 0,
  lastHud = 0,
  noticeUntil = 0;
let noticeText = "";
let frameHandle = 0;
let disposeRecording: (() => void) | undefined;
const frames: number[] = [];
const portrait = (index: number, cls = "") =>
  index < 4
    ? towerPortrait((["bolt", "stone", "net", "trade"] as const)[index])
    : `<img class="portrait character-portrait ${cls}" src="${import.meta.env.BASE_URL}art/v2/${["rat", "weasel", "boar", "badger"][index - 4]}-rig-v1/body.webp" alt="" aria-hidden="true">`;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);
function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    toast("Progress is kept for this visit. Browser storage is unavailable.");
  }
}
function toast(text: string) {
  noticeText = text;
  noticeUntil = performance.now() + 4000;
  const t = document.querySelector("#toast");
  if (t) {
    t.textContent = text;
    t.classList.add("visible");
  }
}
function render() {
  disposeRecording?.();
  disposeRecording = undefined;
  field?.dispose();
  field = null;
  settings = false;
  if (screen === "title")
    app.innerHTML = `<main class="title-screen"><div class="title-shade"></div><div class="title-top"><span></span>${button("settings", "Settings", "quiet")}</div><section class="title-copy"><h1>STORM<span>WATCH</span></h1>${button("map", "Play", "primary large")}</section></main>`;
  if (screen === "map")
    app.innerHTML = `<main class="menu-screen expedition"><section class="map-heading"><h1>Choose your crossing</h1></section><div class="expedition-map"><div class="map-land"></div>${LEVELS.map(
      (l, i) => {
        const unlocked = i === 0 || (save.stars[LEVELS[i - 1].id] ?? 0) > 0;
        return `<button class="map-node node-${i} ${unlocked ? "" : "locked"}" data-action="level:${i}" ${unlocked ? "" : "disabled"}><span class="node-medallion">${unlocked ? "♜" : "⌑"}</span><span class="node-number">0${i + 1}</span><strong>${l.name}</strong><span class="map-stars">${stars(save.stars[l.id] ?? 0)}</span><small>${unlocked ? "" : "Complete Lantern Pass"}</small></button>`;
      },
    ).join(
      "",
    )}</div><footer class="menu-footer">${button("title", "Back", "quiet")}</footer></main>`;
  if (screen === "briefing") {
    const cards = CARDS.filter(
      (c) => c.id !== "thrift" || save.unlocked.includes("thrift"),
    );
    app.innerHTML = advantageScreen(
      LEVELS[levelIndex],
      cards.map((c) => c.id),
      card,
    );
  }
  if (screen === "battle") renderBattle();
  void paintTowerPortraits(app);
  app.insertAdjacentHTML(
    "beforeend",
    '<div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-root"></div>',
  );
}
function renderBattle() {
  const l = LEVELS[levelIndex];
  app.innerHTML = `<main class="battle-screen"><header class="battle-header"><div class="battle-brand">${button("leave", "Map", "icon-button", 'aria-label="Return to map"')}<div><strong>${l.name}</strong></div></div><div class="hud-stats"><div class="stat"><span>GOLD</span><b id="coins">0</b></div><div class="stat"><span>VILLAGE</span><b id="lives">12 / 12</b></div><div class="stat"><span>WAVE</span><b id="wave">0 / ${l.waves.length}</b></div></div><div class="battle-tools">${button("speed", "1×", "icon-button", 'aria-label="Game speed" id="speed"')}${button("pause", "Pause", "icon-button", 'aria-label="Pause game" id="pause"')}${button("settings", "Settings", "icon-button", 'aria-label="Settings"')}</div></header><div class="battle-middle"><section class="battlefield"><div id="canvas-host"></div><div class="field-heading"><span class="eyebrow" id="phase-label">PREPARATION</span><p id="field-instruction">Choose a structure below, then tap open ground.</p></div><div id="field-message" class="field-message"></div><div id="pause-overlay" class="pause-overlay" hidden><div><h2>Paused</h2>${button("pause", "Resume", "primary")}</div></div><div id="result-overlay" class="result-overlay" hidden></div></section><aside class="battle-aside"><details class="economy-panel"><summary>Next payout <b id="forecast-summary">+0</b></summary><div class="payout-total"><b id="forecast-total">+0</b><span>projected gold</span></div><dl><div><dt>Wave reward</dt><dd id="forecast-reward">+0</dd></div><div><dt>Trading income</dt><dd id="forecast-trade">+0</dd></div><div><dt>Savings interest <span title="10% of savings, maximum 20 gold">ⓘ</span></dt><dd id="forecast-interest">+0</dd></div></dl></details><div class="wave-controls">${button("rescue", 'Supply drop <small id="rescue-status">Ready</small>', "rescue-button", 'id="rescue"')}${button("start", "Start wave", "primary", 'id="start-wave"')}</div></aside></div><footer class="build-tray"><section id="selection-panel" class="selection-panel"></section><div class="tray-label"><strong id="build-label">Choose a structure</strong>${button("cancel", "Cancel", "quiet small", 'id="cancel" hidden')}</div><div class="tower-buttons">${(Object.keys(TOWERS) as TowerKind[]).map((k) => `<button class="tower-button" data-action="build:${k}" id="build-${k}">${portrait(TOWERS[k].sprite)}<span><strong>${TOWERS[k].name}</strong><small>${TOWERS[k].role}</small></span><b>${TOWERS[k].cost}<small> gold</small></b></button>`).join("")}</div></footer></main>`;
  try {
    field = new Battlefield(document.querySelector("#canvas-host")!);
    field.load(l);
    if (new URLSearchParams(location.search).has("record")) {
      disposeRecording = attachRecording(field.renderer.domElement);
    }
    field.onPick = pick;
    field.onHover = (p) => {
      if (build || rescueMode)
        field?.highlight(p, !!p && (rescueMode || game!.canPlace(p)));
    };
  } catch (error) {
    document.querySelector("#canvas-host")!.innerHTML =
      '<div class="render-error">Stormwatch needs WebGL to draw its battlefield. Enable hardware acceleration or try a current browser.</div>';
    console.error(error);
  }
  updateHud();
}
function pick(p: Point) {
  if (!game) return;
  const s = game.state;
  if (!game.canAct()) return;
  if (rescueMode) {
    if (game.rescue(p)) {
      rescueMode = false;
      toast("Supplies delivered. Raiders slowed; one village heart restored.");
    } else toast("The supply drop is not ready.");
  } else if (build) {
    if (game.place(build, p)) {
      selected = s.towers[s.towers.length - 1].id;
      toast(`${TOWERS[build].name} ready.`);
    } else
      toast(
        game.canPlace(p)
          ? "Not enough gold."
          : "Choose clear ground beside the trail.",
      );
  } else {
    selected = s.towers.find((t) => t.x === p.x && t.z === p.z)?.id ?? null;
  }
  updateHud();
}
function begin(assist = false) {
  sound.pause(false);
  sound.unlock();
  assisted = assist;
  game = new Game(LEVELS[levelIndex], card, assist);
  build = null;
  selected = null;
  rescueMode = false;
  resultSaved = false;
  speed = 1;
  screen = "battle";
  render();
}
function text(id: string, value: string) {
  const el = document.getElementById(id);
  if (el && el.textContent !== value) el.textContent = value;
}
function updateHud() {
  if (screen !== "battle" || !game) return;
  const s = game.state,
    l = game.level,
    p = game.forecast();
  text("coins", String(s.coins));
  text("lives", `${s.lives} / ${s.maxLives}`);
  text("wave", `${s.wave} / ${l.waves.length}`);
  text("forecast-total", `+${p.total}`);
  text("forecast-summary", `+${p.total}`);
  text("forecast-reward", `+${p.reward}`);
  text("forecast-trade", `+${p.trade}`);
  text("forecast-interest", `+${p.interest}`);
  text(
    "phase-label",
    s.phase === "preparation"
      ? `PREPARE FOR WAVE ${s.wave + 1}`
      : s.phase === "wave"
        ? l.waves[s.wave - 1].title.toUpperCase()
        : s.phase.toUpperCase(),
  );
  text(
    "field-instruction",
    rescueMode
      ? "Tap the trail to deliver supplies and slow nearby raiders."
      : build
        ? `Tap open ground to place ${TOWERS[build].name.toLowerCase()}.`
        : s.phase === "preparation"
          ? ""
          : "",
  );
  text(
    "build-label",
    rescueMode
      ? "Aim your supply drop"
      : build
        ? `Placing ${TOWERS[build].name}`
        : "Choose a structure",
  );
  document.getElementById("cancel")!.hidden = !build && !rescueMode;
  const start = document.querySelector<HTMLButtonElement>("#start-wave")!;
  const activeWave =
    s.phase === "wave" || (s.phase === "paused" && s.resumePhase === "wave");
  start.disabled = s.phase !== "preparation";
  start.innerHTML =
    s.phase === "won"
      ? "Victory"
      : s.phase === "lost"
        ? "Defeat"
        : activeWave
          ? `${s.enemies.length} on the trail`
          : `Start wave ${s.wave + 1}`;
  const remaining = Math.max(0, Math.ceil(s.abilityReadyAt - s.clock));
  const rescue = document.querySelector<HTMLButtonElement>("#rescue")!;
  rescue.disabled = s.phase !== "wave" || remaining > 0;
  rescue.classList.toggle("active", rescueMode);
  text(
    "rescue-status",
    remaining ? `${remaining}s` : rescueMode ? "Tap the trail" : "Ready",
  );
  text("pause", s.phase === "paused" ? "Resume" : "Pause");
  document
    .getElementById("pause")!
    .setAttribute(
      "aria-label",
      s.phase === "paused" ? "Resume game" : "Pause game",
    );
  document.querySelector<HTMLButtonElement>("#pause")!.disabled =
    s.phase === "won" || s.phase === "lost";
  document.getElementById("pause-overlay")!.hidden = s.phase !== "paused";
  for (const k of Object.keys(TOWERS) as TowerKind[]) {
    const el = document.querySelector<HTMLButtonElement>(`#build-${k}`)!;
    el.classList.toggle("selected", build === k);
    el.classList.toggle("unaffordable", s.coins < TOWERS[k].cost);
    el.disabled = !game.canAct();
    el.setAttribute("aria-pressed", String(build === k));
  }
  const t = s.towers.find((t) => t.id === selected),
    panel = document.getElementById("selection-panel")!;
  const content = t
    ? `<div class="selected-heading">${portrait(TOWERS[t.kind].sprite)}<div><span class="eyebrow">LEVEL ${t.level} / 2</span><h3>${TOWERS[t.kind].name}</h3></div></div><p>${t.kind === "trade" ? `Pays ${tradeIncome([t])} gold after each wave.` : `${Math.round(TOWERS[t.kind].damage * (t.level === 2 ? 1.7 : 1))} damage · ${game.range(t).toFixed(1)} range${t.kind === "net" ? " · slows enemies" : ""}`}</p><div class="selection-actions">${button("upgrade", t.level === 2 ? "Fully upgraded" : `Upgrade · ${game.upgradeCost(t)}`, "secondary", `${t.level === 2 || s.coins < game.upgradeCost(t) || !game.canAct() ? "disabled" : ""}`)}${button("sell", `Sell · +${refundFor(t.spent)}`, "quiet", `${!game.canAct() ? "disabled" : ""}`)}${button("inspect-close", "Close", "quiet")}</div>`
    : "";
  const inspecting = !!t && !build && !rescueMode;
  panel.hidden = !inspecting;
  document
    .querySelector(".build-tray")!
    .classList.toggle("inspecting", inspecting);
  if (panel.dataset.content !== content) {
    panel.dataset.content = content;
    panel.innerHTML = content;
    void paintTowerPortraits(panel);
  }
  const message = document.getElementById("field-message")!;
  message.innerHTML =
    s.lastPayout && s.phase === "preparation"
      ? `<span>✓ Wave held</span> +${s.lastPayout.total} gold <small>${s.lastPayout.interest} interest · ${s.lastPayout.trade} trade · ${s.lastPayout.reward} reward</small>`
      : "";
  if (s.phase === "won" || s.phase === "lost") showResult();
}
function showResult() {
  if (!game) return;
  const s = game.state,
    won = s.phase === "won";
  if (won && !resultSaved) {
    save = recordVictory(save, game.level.id, s.stars);
    persist();
    resultSaved = true;
  }
  const el = document.getElementById("result-overlay")!;
  el.hidden = false;
  if (el.innerHTML) return;
  el.innerHTML = resultCard(s, levelIndex === 0, assisted);
}
function settingsModal() {
  settings = true;
  settingsPaused = !!game && game.state.phase === "wave";
  if (settingsPaused) game!.pause();
  sound.pause(true);
  const root = document.getElementById("modal-root")!;
  root.innerHTML = `<div class="modal-backdrop"><section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title"><h2 id="settings-title">Settings</h2><label>Music <input data-setting="music" type="range" min="0" max="1" step="0.05" value="${save.music}"></label><label>Sound effects <input data-setting="effects" type="range" min="0" max="1" step="0.05" value="${save.effects}"></label><label class="mute-row"><input data-setting="muted" type="checkbox" ${save.muted ? "checked" : ""}> Mute all sound</label><details class="game-credits"><summary>Credits</summary><p>Music: Treasure Hunter by TAD · CC0<br>Artwork generated for Stormwatch.</p></details>${button("close-settings", "Back", "primary")}</section></div>`;
  root.querySelector("input")?.focus();
}
function closeSettings() {
  settings = false;
  document.getElementById("modal-root")!.innerHTML = "";
  if (settingsPaused && game?.state.phase === "paused") game.pause();
  settingsPaused = false;
  sound.pause(game?.state.phase === "paused");
  updateHud();
}
app.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement,
    k = el.dataset.setting;
  if (k === "music") {
    save.music = Number(el.value);
    sound.musicVolume = save.music;
  }
  if (k === "effects") {
    save.effects = Number(el.value);
    sound.effectsVolume = save.effects;
  }
  if (k === "muted") {
    save.muted = el.checked;
    sound.setMuted(save.muted);
  }
  sound.apply();
  persist();
});
app.addEventListener("click", (e) => {
  const el = (e.target as Element).closest<HTMLElement>("[data-action]");
  if (!el || orientationBlocked) return;
  e.preventDefault();
  if ((el as HTMLButtonElement).disabled) return;
  const [action, value] = el.dataset.action!.split(":");
  sound.play("ui");
  if (action === "settings") {
    settingsModal();
    return;
  }
  if (action === "close-settings") {
    closeSettings();
    return;
  }
  if (action === "title" || action === "map") {
    sound.pause(false);
    sound.unlock();
    leavePaused = false;
    screen = action;
    game = null;
    render();
    return;
  }
  if (action === "level") {
    levelIndex = Number(value);
    card = "reach";
    screen = "briefing";
    render();
    return;
  }
  if (action === "card") {
    card = value as CardId;
    for (const option of app.querySelectorAll<HTMLButtonElement>(
      ".advantage-option",
    )) {
      option.setAttribute(
        "aria-pressed",
        String(option.dataset.action === `card:${card}`),
      );
    }
    return;
  }
  if (action === "begin" || action === "retry") {
    begin();
    return;
  }
  if (action === "assist") {
    begin(true);
    return;
  }
  if (!game) return;
  if (action === "leave") {
    leavePaused = false;
    if (game.state.phase === "wave") {
      game.pause();
      leavePaused = true;
    }
    sound.pause(true);
    document.getElementById("modal-root")!.innerHTML =
      `<div class="modal-backdrop"><section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="leave-title"><h2 id="leave-title">Leave this game?</h2><p>Gold and defenses will reset. Your progress is saved.</p>${button("map", "Leave", "primary")}${button("stay", "Stay", "secondary")}</section></div>`;
  }
  if (action === "stay") {
    document.getElementById("modal-root")!.innerHTML = "";
    if (leavePaused && game.state.phase === "paused") game.pause();
    leavePaused = false;
    sound.pause(game.state.phase === "paused");
  }
  if (action === "build") {
    build = build === value ? null : (value as TowerKind);
    rescueMode = false;
    selected = null;
  }
  if (action === "inspect-close") selected = null;
  if (action === "cancel") {
    build = null;
    rescueMode = false;
    field?.highlight(null);
  }
  if (action === "start") {
    game.startWave();
    build = null;
    field?.highlight(null);
    sound.unlock();
  }
  if (action === "pause") {
    game.pause();
    sound.pause(game.state.phase === "paused");
  }
  if (action === "speed") {
    speed = speed === 1 ? 2 : 1;
    text("speed", `${speed}×`);
  }
  if (action === "upgrade" && selected !== null) game.upgrade(selected);
  if (action === "sell" && selected !== null) {
    game.sell(selected);
    selected = null;
  }
  if (action === "rescue") {
    rescueMode = !rescueMode;
    build = null;
  }
  updateHud();
});
document.addEventListener("keydown", (e) => {
  if (orientationBlocked) return;
  if (e.key === "Escape" && settings) {
    e.preventDefault();
    closeSettings();
    return;
  }
  if ((e.target as HTMLElement).matches("input,button")) return;
  if (e.key === "Escape") {
    build = null;
    rescueMode = false;
    field?.highlight(null);
    updateHud();
  }
  if (
    e.code === "Space" &&
    screen === "battle" &&
    !document.getElementById("modal-root")?.childElementCount
  ) {
    e.preventDefault();
    if (game?.state.phase === "preparation") game.startWave();
    else game?.pause();
    sound.pause(game?.state.phase === "paused");
    updateHud();
  }
});
function resumeAudioIfAllowed() {
  if (
    !document.hidden &&
    !orientationBlocked &&
    !settings &&
    !document.getElementById("modal-root")?.childElementCount &&
    game?.state.phase !== "paused"
  )
    sound.pause(false);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game?.state.phase === "wave") {
      game.pause();
      updateHud();
    }
    sound.pause(true);
  } else resumeAudioIfAllowed();
});
const portraitScreen = matchMedia("(orientation: portrait)");
const orientationGuide = document.getElementById("orientation-guide")!;
let orientationBlocked = false;
let focusBeforeRotation: HTMLElement | null = null;
function syncOrientation() {
  const blocked = screen === "battle" && portraitScreen.matches;
  if (blocked !== orientationBlocked) {
    orientationBlocked = blocked;
    orientationGuide.hidden = !blocked;
    app.inert = blocked;
    if (blocked) {
      focusBeforeRotation = document.activeElement as HTMLElement;
      orientationGuide.focus();
    } else if (focusBeforeRotation?.isConnected) focusBeforeRotation.focus();
  }
  if (blocked) {
    if (game?.state.phase === "wave") {
      game.pause();
      updateHud();
    }
    sound.pause(true);
  }
}
function frame(now: number) {
  const rawDt = lastTime ? Math.max(0, (now - lastTime) / 1000) : 0;
  const dt = Math.min(0.1, rawDt);
  lastTime = now;
  syncOrientation();
  if (game && field) {
    game.advance(dt * speed);
    for (const e of game.drainEvents()) sound.play(e.type);
    field.preferGround = !!build || rescueMode;
    field.update(game, selected, dt);
    if (now - lastHud > 100) {
      updateHud();
      lastHud = now;
    }
    if (frames.length < 40000) frames.push(rawDt * 1000);
  }
  const toastEl = document.getElementById("toast");
  if (toastEl && now > noticeUntil) toastEl.classList.remove("visible");
  frameHandle = requestAnimationFrame(frame);
}
render();
frameHandle = requestAnimationFrame(frame);
// Explicit diagnostics are read-only and available only in development builds.
if (import.meta.env.DEV)
  Object.defineProperty(window, "stormwatch", {
    get: () => ({
      state: game ? structuredClone(game.state) : null,
      screen,
      level: levelIndex,
      frames: [...frames],
      project: (p: Point) => field?.project(p),
      renderer: field?.renderer.info,
    }),
  });
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(frameHandle);
  sound.pause(true);
});

window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    lastTime = 0;
    cancelAnimationFrame(frameHandle);
    frameHandle = requestAnimationFrame(frame);
    resumeAudioIfAllowed();
  }
});
if (new URLSearchParams(location.search).has("measure"))
  void import("./qa/load-report").then((m) => m.showLoadReport());
