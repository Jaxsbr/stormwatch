import "./style.css";
import "./ui/advantage-screen.css";
import "./ui/game-chrome.css";
import "./ui/button-skin.css";
import "./ui/battle-ui.css";
import "./ui/battle-menu.css";
import { BattleMenu } from "./ui/battle-menu";
import { battleStats, defenderPanel, displayedWave } from "./ui/battle-ui";
import { button, resultCard } from "./ui/game-chrome";
import { fitVisibleViewport } from "./ui/visible-viewport";
import { advanceBattleFrame } from "./ui/battle-clock";
import { advantageScreen } from "./ui/advantage-screen";
import { Game } from "./sim/game";
import type { CardId, Point, TowerKind } from "./sim/types";
import { TOWERS } from "./content/catalog";
import { LEVELS } from "./content/levels";
import {
  availableCards,
  initialCard,
  levelUnlocked,
} from "./content/progression";
import { Battlefield } from "./render/battlefield";
import { attachRecording } from "./render/recording";
import { towerPortrait, paintTowerPortraits } from "./render/portraits";
import { Sound } from "./audio/sound";
import { recordVictory, SAVE_KEY } from "./persistence/save";
import {
  loadProfiles,
  PROFILES_KEY,
  type PlayerSlot,
} from "./persistence/profiles";

const app = document.querySelector<HTMLDivElement>("#app")!;
function updateVisibleViewport() {
  fitVisibleViewport(document.documentElement.style, window);
}
updateVisibleViewport();
window.addEventListener("resize", updateVisibleViewport);
window.addEventListener("orientationchange", updateVisibleViewport);
window.visualViewport?.addEventListener("resize", updateVisibleViewport);
window.visualViewport?.addEventListener("scroll", updateVisibleViewport);
let profiles = loadProfiles(null, null);
try {
  profiles = loadProfiles(
    localStorage.getItem(PROFILES_KEY),
    localStorage.getItem(SAVE_KEY),
  );
} catch {
  /* Storage is optional; play continues in memory. */
}
let save = profiles.slots[profiles.active];
function initialCardForLevel(index: number): CardId {
  return initialCard(availableCards(LEVELS[index], save));
}
const sound = new Sound();
sound.musicVolume = save.music;
sound.effectsVolume = save.effects;
sound.muted = save.muted;
type Screen = "title" | "map" | "briefing" | "battle" | "result";
let screen: Screen = "title",
  levelIndex = 0,
  card: CardId = "none",
  game: Game | null = null,
  field: Battlefield | null = null,
  build: TowerKind | null = null,
  selected: number | null = null,
  settings = false,
  settingsPaused = false,
  resultSaved = false,
  resultUnlockedUpgrade = false,
  resultUnlockedTurtle = false,
  speed = 1;
let lastTime = 0,
  lastHud = 0,
  noticeUntil = 0;
let noticeText = "";
let lastDefeatLevelId: string | null = null;
let frameHandle = 0;
let battleMenu: BattleMenu | null = null;
let disposeRecording: (() => void) | undefined;
const frames: number[] = [];
const portrait = (index: number, cls = "") =>
  index < 3
    ? towerPortrait((["bolt", "stone", "net"] as const)[index])
    : `<img class="portrait character-portrait ${cls}" src="${import.meta.env.BASE_URL}art/v2/${["rat", "weasel", "boar", "badger"][index - 4]}-rig-v1/body.webp" alt="" aria-hidden="true">`;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);
function persist() {
  profiles.slots[profiles.active] = save;
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
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
    for (const animation of t.getAnimations()) {
      animation.currentTime = 0;
      animation.play();
    }
  }
}
function render() {
  battleMenu?.destroy();
  battleMenu = null;
  disposeRecording?.();
  disposeRecording = undefined;
  field?.dispose();
  field = null;
  settings = false;
  if (screen === "title")
    app.innerHTML = `<main class="title-screen"><div class="title-shade"></div><div class="title-top"><span></span>${button("settings", "Settings", "quiet")}</div><section class="title-copy"><h1>STORM<span>WATCH</span></h1>${button("map", "Play", "primary large")}</section></main>`;
  if (screen === "map")
    app.innerHTML = `<main class="menu-screen expedition"><section class="map-heading"><h1>Choose your crossing</h1><nav class="player-slots" aria-label="Player progress">${([0, 1] as const).map((slot) => `<button data-action="profile:${slot}" aria-pressed="${profiles.active === slot}">Player ${slot + 1}</button>`).join("")}</nav></section><div class="expedition-map"><div class="map-land"></div>${LEVELS.map(
      (l, i) => {
        const unlocked = levelUnlocked(LEVELS, i, save);
        return `<button class="map-node node-${i} ${unlocked ? "" : "locked"}" data-action="level:${i}" ${unlocked ? "" : "disabled"}><span class="node-medallion">${unlocked ? "♜" : "⌑"}</span><span class="node-number">0${i + 1}</span><strong>${l.name}</strong><span class="map-stars">${stars(save.stars[l.id] ?? 0)}</span><small>${unlocked ? "" : `Complete ${LEVELS[i - 1].name}`}</small></button>`;
      },
    ).join(
      "",
    )}</div><footer class="menu-footer">${button("title", "Back", "quiet")}</footer></main>`;
  if (screen === "briefing") {
    app.innerHTML = advantageScreen(
      LEVELS[levelIndex],
      availableCards(LEVELS[levelIndex], save),
      card,
      lastDefeatLevelId === LEVELS[levelIndex].id,
    );
  }
  if (screen === "battle") renderBattle();
  if (screen === "result" && game)
    app.innerHTML = `<main class="result-screen">${resultCard(game.state, resultUnlockedUpgrade ? [{ kind: "tower-upgrade", tower: "bolt" }] : resultUnlockedTurtle ? [{ kind: "tower-unlock", tower: "net" }] : [])}</main>`;
  void paintTowerPortraits(app);
  app.insertAdjacentHTML(
    "beforeend",
    '<div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-root"></div>',
  );
}
function renderBattle() {
  const l = LEVELS[levelIndex];
  const availableTowers =
    l.availableTowers ?? (Object.keys(TOWERS) as TowerKind[]);
  app.innerHTML = `<main class="battle-screen"><header class="battle-header"><div class="battle-brand"><div><strong>${l.name}</strong></div></div>${battleStats(l.waves.length)}<div class="battle-tools">${button("speed", "1×", "icon-button", 'aria-label="Game speed" id="speed"')}${button("menu", "Menu", "icon-button", 'aria-label="Menu" id="battle-menu"')}</div></header><div class="battle-middle"><section class="battlefield"><div id="canvas-host"></div><div id="wave-countdown" class="wave-countdown" role="status" aria-live="polite" hidden><span>Next wave in</span> <strong id="countdown-number">10</strong></div></section><aside class="battle-aside"><div class="wave-controls">${button("start", "Start first wave", "primary", 'id="start-wave"')}</div></aside></div><footer class="build-tray"><section id="selection-panel" class="selection-panel"></section><div class="tray-label"><strong id="build-label">Choose a structure</strong>${button("cancel", "Cancel", "quiet small", 'id="cancel" hidden')}</div><div class="tower-buttons">${availableTowers.map((k) => `<button class="tower-button" data-action="build:${k}" id="build-${k}">${portrait(TOWERS[k].sprite)}<span><strong>${TOWERS[k].name}</strong><small>${TOWERS[k].role}</small></span><b>${TOWERS[k].cost}<small> gold</small></b></button>`).join("")}</div></footer></main>`;
  try {
    field = new Battlefield(document.querySelector("#canvas-host")!);
    field.load(l);
    if (new URLSearchParams(location.search).has("record")) {
      disposeRecording = attachRecording(field.renderer.domElement);
    }
    field.onPick = pick;
    field.onHover = (p) => {
      if (build) field?.highlight(p, !!p && game!.canPlace(p));
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
  if (build) {
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
function clearBattleSelection() {
  build = null;
  selected = null;
  field?.highlight(null);
}
function beginWave() {
  game?.startWave();
  clearBattleSelection();
}
function refreshHud(now: number) {
  updateHud();
  lastHud = now;
}
function begin(assist = false) {
  if (!levelUnlocked(LEVELS, levelIndex, save)) {
    screen = "map";
    render();
    return;
  }
  if (
    card !== "none" &&
    !availableCards(LEVELS[levelIndex], save).includes(card)
  )
    card = "none";
  sound.pause(false);
  sound.unlock();
  game = new Game(LEVELS[levelIndex], card, assist, 42, {
    unlockedUpgrades: save.unlocked.includes("squirrel-upgrade")
      ? ["bolt"]
      : [],
  });
  build = null;
  selected = null;
  resultSaved = false;
  resultUnlockedUpgrade = false;
  resultUnlockedTurtle = false;
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
    l = game.level;
  text("coins", String(s.coins));
  text("lives", `${s.lives} / ${s.maxLives}`);
  text("wave", `${displayedWave(s, l.waves.length)} / ${l.waves.length}`);
  document
    .querySelector(".life-stat")
    ?.classList.toggle("critical", s.lives <= s.maxLives / 3);
  document
    .querySelector(".battle-screen")
    ?.classList.toggle("is-paused", s.phase === "paused");
  text(
    "build-label",
    build ? `Placing ${TOWERS[build].name}` : "Choose a structure",
  );
  document.getElementById("cancel")!.hidden = !build;
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
          : s.wave > 0
            ? `Start wave ${s.wave + 1} early`
            : "Start first wave";
  const countdown = document.getElementById("wave-countdown")!;
  const showCountdown =
    s.phase === "preparation" && s.nextWaveCountdown !== null;
  countdown.hidden = !showCountdown;
  if (showCountdown) {
    const seconds = Math.ceil(s.nextWaveCountdown!);
    text("countdown-number", String(seconds));
  }
  if (s.phase === "paused" && !battleMenu) openBattleMenu();
  for (const k of Object.keys(TOWERS) as TowerKind[]) {
    const el = document.querySelector<HTMLButtonElement>(`#build-${k}`);
    if (!el) continue;
    el.classList.toggle("selected", build === k);
    el.classList.toggle("unaffordable", s.coins < TOWERS[k].cost);
    el.disabled = !game.canAct();
    el.setAttribute("aria-pressed", String(build === k));
  }
  const t = s.towers.find((t) => t.id === selected),
    panel = document.getElementById("selection-panel")!;
  const content = t ? defenderPanel(game, t) : "";
  const inspecting = !!t && !build;
  panel.hidden = !inspecting;
  document
    .querySelector(".build-tray")!
    .classList.toggle("inspecting", inspecting);
  if (panel.dataset.content !== content) {
    const active = document.activeElement as HTMLElement | null;
    const focusedAction =
      active && panel.contains(active) ? active.dataset.action : undefined;
    panel.dataset.content = content;
    panel.innerHTML = content;
    void paintTowerPortraits(panel);
    if (focusedAction) {
      const replacement = [
        ...panel.querySelectorAll<HTMLButtonElement>("button"),
      ].find(
        (button) => button.dataset.action === focusedAction && !button.disabled,
      );
      (
        replacement ??
        panel.querySelector<HTMLButtonElement>('[data-action="inspect-close"]')
      )?.focus();
    }
  }
  if (s.phase === "won" || s.phase === "lost") showResult();
}
function showResult() {
  if (!game || screen !== "battle") return;
  const s = game.state,
    won = s.phase === "won";
  if (won && !resultSaved) {
    resultUnlockedUpgrade =
      game.level.id === "lantern-pass" &&
      !save.unlocked.includes("squirrel-upgrade");
    resultUnlockedTurtle =
      game.level.id === "rainstone-crossing" &&
      !save.unlocked.includes("turtle");
    save = recordVictory(save, game.level.id, s.stars);
    persist();
    resultSaved = true;
  }
  lastDefeatLevelId = won ? null : game.level.id;
  screen = "result";
  render();
  document.getElementById("result-title")?.focus();
}
function openBattleMenu() {
  if (!game || battleMenu || screen !== "battle") return;
  if (game.state.phase === "won" || game.state.phase === "lost") return;
  const root = document.getElementById("modal-root");
  if (!root) return;
  if (game.state.phase === "wave" || game.state.phase === "preparation")
    game.pause();
  sound.pause(true);
  document.querySelector<HTMLElement>(".battle-screen")!.inert = true;
  battleMenu = new BattleMenu(root, save);
  updateHud();
}
function closeBattleMenu() {
  battleMenu?.destroy();
  battleMenu = null;
  document.querySelector<HTMLElement>(".battle-screen")!.inert = false;
  if (game?.state.phase === "paused") game.pause();
  sound.pause(false);
  updateHud();
  document.getElementById("battle-menu")?.focus();
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
  if (action === "menu") {
    openBattleMenu();
    return;
  }
  if (action.startsWith("menu-")) {
    if (!battleMenu || battleMenu.transitioning) return;
    if (action === "menu-settings") void battleMenu.navigate("settings");
    if (action === "menu-back") void battleMenu.navigate("menu");
    if (action === "menu-quit") void battleMenu.navigate("quit");
    if (action === "menu-continue") closeBattleMenu();
    if (action === "menu-confirm-quit") {
      battleMenu.destroy();
      battleMenu = null;
      game = null;
      screen = "map";
      sound.pause(false);
      render();
    }
    return;
  }
  if (action === "settings") {
    settingsModal();
    return;
  }
  if (action === "close-settings") {
    closeSettings();
    return;
  }
  if (action === "profile" && screen === "map") {
    if (value !== "0" && value !== "1") return;
    profiles.active = Number(value) as PlayerSlot;
    save = profiles.slots[profiles.active];
    sound.musicVolume = save.music;
    sound.effectsVolume = save.effects;
    sound.muted = save.muted;
    sound.apply();
    sound.pause(false);
    levelIndex = 0;
    card = "none";
    lastDefeatLevelId = null;
    persist();
    render();
    return;
  }
  if (action === "title" || action === "map") {
    sound.pause(false);
    sound.unlock();
    screen = action;
    game = null;
    render();
    return;
  }
  if (action === "level") {
    const nextLevel = Number(value);
    if (!levelUnlocked(LEVELS, nextLevel, save)) return;
    levelIndex = nextLevel;
    card = initialCardForLevel(levelIndex);
    screen = "briefing";
    render();
    return;
  }
  if (action === "card") {
    if (
      value !== "none" &&
      !availableCards(LEVELS[levelIndex], save).includes(value as CardId)
    )
      return;
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
  if (action === "begin") {
    begin();
    return;
  }
  if (
    action === "assist" &&
    screen === "briefing" &&
    lastDefeatLevelId === LEVELS[levelIndex].id
  ) {
    begin(true);
    return;
  }
  if (!game) return;
  if (action === "build") {
    build = build === value ? null : (value as TowerKind);
    selected = null;
  }
  if (action === "inspect-close") selected = null;
  if (action === "cancel") {
    build = null;
    field?.highlight(null);
  }
  if (action === "start") {
    beginWave();
    sound.unlock();
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
  updateHud();
});
document.addEventListener("keydown", (e) => {
  if (orientationBlocked) return;
  if (battleMenu) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (battleMenu.transitioning) return;
      if (battleMenu.view !== "menu") void battleMenu.navigate("menu");
      else closeBattleMenu();
    }
    if (e.key === "Tab") {
      const targets = [
        ...document.querySelectorAll<HTMLElement>(
          "#modal-root .menu-page:not([hidden]):not([inert]) button, #modal-root .menu-page:not([hidden]):not([inert]) input",
        ),
      ];
      const first = targets[0],
        last = targets[targets.length - 1];
      if (!first) {
        e.preventDefault();
        return;
      }
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !targets.includes(document.activeElement as HTMLElement))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !targets.includes(document.activeElement as HTMLElement))
      ) {
        e.preventDefault();
        first.focus();
      }
    }
    return;
  }
  if (e.key === "Escape" && settings) {
    e.preventDefault();
    closeSettings();
    return;
  }
  if (e.key !== "Escape" && (e.target as HTMLElement).matches("input,button"))
    return;
  if (e.key === "Escape") {
    if (screen === "battle" && !build && selected === null) {
      openBattleMenu();
      return;
    }
    build = null;
    selected = null;
    field?.highlight(null);
    updateHud();
  }
  if (
    e.code === "Space" &&
    screen === "battle" &&
    !document.getElementById("modal-root")?.childElementCount
  ) {
    e.preventDefault();
    if (game?.state.phase === "preparation") {
      beginWave();
    } else openBattleMenu();
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
    const preparing = game.state.phase === "preparation";
    advanceBattleFrame(game, rawDt, speed);
    if (preparing && game.state.phase === "wave") {
      clearBattleSelection();
      refreshHud(now);
    }
    for (const e of game.drainEvents()) {
      sound.play(e.type);
      if (e.type === "payout") {
        toast(`Wave cleared · +${e.value} gold`);
      }
    }
    field.preferGround = !!build;
    field.update(game, selected, dt);
    if (now - lastHud > 100) {
      refreshHud(now);
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
