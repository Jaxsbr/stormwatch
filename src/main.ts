import "./style.css";
import { escapeHtml } from "./ui/html";
import "./ui/advantage-screen.css";
import "./ui/game-chrome.css";
import "./ui/button-skin.css";
import "./ui/battle-ui.css";
import "./ui/battle-menu.css";
import "./ui/responsive-layout.css";
import "./ui/title-layout.css";
import "./ui/map-markers.css";
import { BattleSelection } from "./ui/battle-selection";
import { DefenderPopups } from "./ui/defender-popups";
import { BattleMenu } from "./ui/battle-menu";
import { battleStats, displayedWave } from "./ui/battle-ui";
import { button, resultCard } from "./ui/game-chrome";
import { fitVisibleViewport } from "./ui/visible-viewport";
import { advanceBattleFrame } from "./ui/battle-clock";
import { advantageScreen } from "./ui/advantage-screen";
import { Game } from "./sim/game";
import type { CardId, Point } from "./sim/types";
import { LEVELS } from "./content/levels";
import {
  availableCards,
  initialCard,
  levelUnlocked,
  levelForAttempt,
  type ResultReward,
} from "./content/progression";
import { Battlefield } from "./render/battlefield";
import { paintTowerPortraits } from "./render/portraits";
import { Sound } from "./audio/sound";
import { freshSave, recordVictoryOutcome, SAVE_KEY } from "./persistence/save";
import {
  loadProfiles,
  PROFILES_KEY,
  AVATARS,
  createProfile,
  type Avatar,
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
function fullscreenLabel() {
  return document.fullscreenEnabled
    ? document.fullscreenElement
      ? "Leave fullscreen"
      : "Enter fullscreen"
    : undefined;
}
document.addEventListener("fullscreenchange", () => {
  updateVisibleViewport();
  for (const control of document.querySelectorAll<HTMLButtonElement>(
    '[data-action="fullscreen"]',
  ))
    control.textContent = fullscreenLabel() ?? "Enter fullscreen";
});
let profiles = loadProfiles(null, null);
try {
  profiles = loadProfiles(
    localStorage.getItem(PROFILES_KEY),
    localStorage.getItem(SAVE_KEY),
  );
} catch {
  /* Storage is optional; play continues in memory. */
}
const activeProfile = () =>
  profiles.users.find((user) => user.id === profiles.active);
let save = activeProfile()?.progress ?? freshSave();
let editingProfile: string | null = null;
let profileEditorOpen = false;
let chosenAvatar: Avatar = "squirrel";
let profileName = "";
let deletingProfile: string | null = null;
function initialCardForLevel(index: number): CardId {
  return initialCard(availableCards(LEVELS[index], save));
}
const sound = new Sound();
sound.musicVolume = save.music;
sound.effectsVolume = save.effects;
sound.muted = save.muted;
type Screen = "title" | "map" | "briefing" | "battle" | "result" | "profiles";
let screen: Screen = "title",
  levelIndex = 0,
  card: CardId = "none",
  game: Game | null = null,
  field: Battlefield | null = null,
  selection: BattleSelection | null = null,
  settings = false,
  settingsPaused = false,
  resultSaved = false,
  resultFirstBoardComplete = false,
  resultRewards: ResultReward[] = [],
  speed = 1;
let lastTime = 0,
  lastHud = 0,
  noticeUntil = 0;
let noticeText = "";
let lastDefeatLevelId: string | null = null;
let frameHandle = 0;
let battleMenu: BattleMenu | null = null;
let popups: DefenderPopups | null = null;
let battleArtState: "loading" | "ready" | "failed" = "loading";
let disposeRecording: (() => void) | undefined;
const frames: number[] = [];
const stars = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);
function persist() {
  const current = activeProfile();
  if (current) current.progress = save;
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
function avatarImage(avatar: Avatar) {
  return `<img src="${import.meta.env.BASE_URL}art/profiles/${avatar}.webp" alt="${avatar}" class="user-avatar">`;
}
function selectCurrentProfile() {
  save = activeProfile()?.progress ?? freshSave();
  sound.musicVolume = save.music;
  sound.effectsVolume = save.effects;
  sound.muted = save.muted;
  sound.apply();
  levelIndex = 0;
  card = "none";
  lastDefeatLevelId = null;
  persist();
}
function profilesScreen() {
  const deleting = profiles.users.find((user) => user.id === deletingProfile);
  return `<main class="menu-screen profiles-screen"><header class="profile-heading"><h1>Profile</h1>${button("new-profile", "New profile", "primary")}</header><section class="profile-list" aria-label="Saved profiles">${profiles.users.length ? profiles.users.map((user) => `<article class="profile-row"><div class="profile-person">${avatarImage(user.avatar)}<strong>${escapeHtml(user.nickname)}</strong></div><div class="profile-actions">${button(`select-profile:${user.id}`, profiles.active === user.id ? "Continue" : "Play", "quiet")}${button(`edit-profile:${user.id}`, "Edit", "quiet")}${button(`delete-profile:${user.id}`, "Delete", "quiet danger")}</div></article>`).join("") : `<p class="profile-empty">Create your first profile to play.</p>`}</section><footer>${button("title", "Back", "quiet")}</footer>${profileEditorOpen ? `<dialog class="profile-dialog" aria-labelledby="profile-editor-title"><section class="profile-editor"><h2 id="profile-editor-title" tabindex="-1" autofocus>${editingProfile ? "Edit profile" : "New profile"}</h2><label for="profile-name">Your nickname</label><input id="profile-name" maxlength="24" required value="${escapeHtml(profileName)}" autocomplete="off" placeholder="Your nickname"><fieldset><legend>Choose your avatar</legend><div class="avatar-options">${AVATARS.map((avatar) => `<button type="button" data-action="avatar:${avatar}" aria-label="${avatar}" aria-pressed="${chosenAvatar === avatar}">${avatarImage(avatar)}</button>`).join("")}</div></fieldset><div class="profile-dialog-actions">${button("close-profile-editor", "Cancel", "quiet")}${button("save-profile", editingProfile ? "Save changes" : "Create profile", "primary")}</div></section></dialog>` : ""}${deleting ? `<dialog class="profile-dialog delete-dialog" aria-labelledby="delete-profile-title"><h2 id="delete-profile-title">Delete profile?</h2><p>Delete ${escapeHtml(deleting.nickname)} and all their progress? This cannot be undone.</p><div class="profile-dialog-actions">${button("cancel-delete", "Keep profile", "quiet", "autofocus")}${button(`confirm-delete:${deleting.id}`, "Delete profile", "quiet danger")}</div></dialog>` : ""}</main>`;
}
function render() {
  popups?.destroy();
  popups = null;
  battleMenu?.destroy();
  battleMenu = null;
  disposeRecording?.();
  disposeRecording = undefined;
  field?.dispose();
  field = null;
  settings = false;
  if (screen === "title")
    app.innerHTML = `<main class="title-screen"><div class="title-shade"></div><div class="title-top"><span></span>${button("settings", "Settings", "quiet")}</div><section class="title-copy"><h1>STORM<span>WATCH</span></h1>${activeProfile() ? `${button("map", "Play", "primary large title-play")}<button class="title-profile" data-action="profiles" aria-label="Swap profile">${avatarImage(activeProfile()!.avatar)}<span class="title-profile-copy"><strong>${escapeHtml(activeProfile()!.nickname)}</strong><small>Swap profile</small></span><span class="title-profile-chevron" aria-hidden="true">›</span></button>` : `<p class="profile-guidance">Choose your nickname and avatar to begin.</p>${button("new-profile", "Create your profile", "primary large")}`}</section></main>`;
  if (screen === "map")
    app.innerHTML = `<main class="menu-screen expedition"><section class="map-heading"><h1>Choose your crossing</h1></section><div class="expedition-map ${LEVELS.length > 3 ? "expanded-campaign" : ""}"><div class="map-land"></div>${LEVELS.map(
      (l, i) => {
        const unlocked = levelUnlocked(LEVELS, i, save);
        const completed = (save.stars[l.id] ?? 0) > 0;
        return `<button class="map-node node-${i} ${unlocked ? (completed ? "completed" : "current") : "locked"}" aria-label="${escapeHtml(l.name)}${completed ? ", " + (save.stars[l.id] ?? 0) + " stars earned" : unlocked ? ", next crossing" : ""}${unlocked ? "" : ": complete " + escapeHtml(LEVELS[i - 1].name) + " to unlock"}" title="${escapeHtml(l.name)}" data-action="level:${i}" ${unlocked ? "" : "disabled"}><span class="node-medallion">${unlocked ? "♜" : "⌑"}</span><span class="node-number">${String(i + 1).padStart(2, "0")}</span><strong>${escapeHtml(l.name)}</strong><span class="map-stars">${stars(save.stars[l.id] ?? 0)}</span><small>${unlocked ? "" : `Complete ${escapeHtml(LEVELS[i - 1].name)}`}</small></button>`;
      },
    ).join(
      "",
    )}</div><footer class="menu-footer">${button("title", "Back", "quiet")}</footer></main>`;
  if (screen === "briefing") {
    app.innerHTML = advantageScreen(
      levelForAttempt(LEVELS[levelIndex], save),
      availableCards(LEVELS[levelIndex], save),
      card,
      lastDefeatLevelId === LEVELS[levelIndex].id,
    );
  }
  if (screen === "profiles") app.innerHTML = profilesScreen();
  if (screen === "battle") renderBattle();
  if (screen === "result" && game)
    app.innerHTML = `<main class="result-screen">${resultCard(game.state, resultRewards, resultFirstBoardComplete)}</main>`;
  if (screen !== "title" && activeProfile()) {
    const user = activeProfile()!;
    const badge = `<span class="profile-badge" role="img" aria-label="Playing as ${escapeHtml(user.nickname)}" title="${escapeHtml(user.nickname)}">${avatarImage(user.avatar)}</span>`;
    const host =
      screen === "battle"
        ? app.querySelector(".battle-brand")
        : screen === "map"
          ? app.querySelector(".map-heading")
          : screen === "briefing"
            ? app.querySelector(".encounter-heading")
            : screen === "profiles"
              ? app.querySelector(".profile-heading")
              : app.querySelector(".result-heading");
    host?.insertAdjacentHTML("beforeend", badge);
  }
  const profileDialog = app.querySelector<HTMLDialogElement>(".profile-dialog");
  if (profileDialog) {
    profileDialog.showModal();
    profileDialog.addEventListener("cancel", () => {
      profileEditorOpen = false;
      deletingProfile = null;
      render();
    });
  }
  void paintTowerPortraits(app);
  app.insertAdjacentHTML(
    "beforeend",
    '<div id="toast" class="toast" role="status" aria-live="polite"></div><div id="modal-root"></div>',
  );
}
function renderBattle() {
  const l = game!.level;
  battleArtState = "loading";
  selection = new BattleSelection(game!);
  app.innerHTML = `<main class="battle-screen popup-battle"><header class="battle-header"><div class="battle-brand"><div><strong>${escapeHtml(l.name)}</strong></div></div>${battleStats(l.waves.length)}<div class="battle-tools">${button("speed", "1×", "icon-button", 'aria-label="Game speed" id="speed"')}${button("menu", "Menu", "icon-button", 'aria-label="Menu" id="battle-menu"')}</div></header><div class="battle-middle"><section class="battlefield"><div id="canvas-host"></div><div class="defender-popup-root" id="defender-popups"></div><div class="battle-placement-hint">Tap clear ground to place a defender</div><div id="battle-art-status" class="battle-art-status" role="status">Preparing battle art…</div><div id="wave-countdown" class="wave-countdown" role="status" aria-live="polite" hidden><span>Next wave in</span> <strong id="countdown-number">10</strong></div><section class="boss-health-panel" id="boss-health-panel" aria-label="Boss health" hidden><div><strong>The Roadwarden</strong><span id="boss-health-value"></span></div><div class="boss-health-track" id="boss-health-track" role="progressbar" aria-label="The Roadwarden's health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span id="boss-health-fill"></span></div></section></section><aside class="battle-aside"><div class="wave-controls">${button("start", "Preparing art…", "primary", 'id="start-wave" disabled')}</div></aside></div></main>`;
  try {
    field = new Battlefield(document.querySelector("#canvas-host")!);
    field.load(l);
    field.setGridVisible(save.showGrid);
    const loadingField = field;
    void field.artReady(l).then(
      async () => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        if (field !== loadingField || screen !== "battle") return;
        battleArtState = "ready";
        document.getElementById("battle-art-status")!.hidden = true;
        updateHud();
      },
      (error) => {
        if (field !== loadingField || screen !== "battle") return;
        battleArtState = "failed";
        document.getElementById("battle-art-status")!.textContent =
          "Battle art could not load. Retry to continue.";
        console.error(error);
        updateHud();
      },
    );
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("record")
    ) {
      const canvas = field.renderer.domElement;
      void import("./render/recording").then(({ attachRecording }) => {
        if (field?.renderer.domElement === canvas)
          disposeRecording = attachRecording(canvas);
      });
    }
    popups = new DefenderPopups(
      document.getElementById("defender-popups")!,
      selection,
      (p) => field!.project(p),
      (action, accepted) => {
        if (accepted) sound.play("ui");
        if (!accepted)
          toast("That action is unavailable. Check gold and clear ground.");
        if (accepted && action === "place")
          toast(`${game!.towers[selection!.kind].name} ready.`);
        updateHud();
      },
    );
    field.onPick = pick;
    field.onMiss = clearBattleSelection;
  } catch (error) {
    document.querySelector("#canvas-host")!.innerHTML =
      '<div class="render-error">Stormwatch needs WebGL to draw its battlefield. Enable hardware acceleration or try a current browser.</div>';
    console.error(error);
  }
  updateHud();
}
function pick(p: Point) {
  if (battleArtState !== "ready" || !game?.canAct()) return;
  popups?.pick(p);
  updateHud();
}
function clearBattleSelection() {
  selection?.close();
  popups?.update();
  field?.highlight(null);
}
function beginWave() {
  if (battleArtState !== "ready") return;
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
  game = new Game(levelForAttempt(LEVELS[levelIndex], save), card, assist, 42, {
    unlockedUpgrades: save.unlocked.includes("squirrel-upgrade")
      ? ["bolt"]
      : [],
  });
  selection = null;
  resultSaved = false;
  resultFirstBoardComplete = false;
  resultRewards = [];
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
  const boss = s.enemies.find((enemy) => enemy.alive && enemy.kind === "boss");
  const bossPanel = document.getElementById("boss-health-panel");
  const bossTrack = document.getElementById("boss-health-track");
  const bossFill = document.getElementById("boss-health-fill");
  if (bossPanel && bossTrack && bossFill) {
    bossPanel.hidden = !boss;
    if (boss) {
      const percent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      bossTrack.setAttribute("aria-valuenow", String(Math.round(percent)));
      bossFill.setAttribute("style", `width:${percent}%`);
      text(
        "boss-health-value",
        `${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`,
      );
    }
  }
  document
    .querySelector(".life-stat")
    ?.classList.toggle("critical", s.lives <= s.maxLives / 3);
  document
    .querySelector(".battle-screen")
    ?.classList.toggle("is-paused", s.phase === "paused");
  const start = document.querySelector<HTMLButtonElement>("#start-wave")!;
  const activeWave =
    s.phase === "wave" || (s.phase === "paused" && s.resumePhase === "wave");
  start.disabled = s.phase !== "preparation" || battleArtState === "loading";
  start.dataset.action = battleArtState === "failed" ? "retry-art" : "start";
  start.innerHTML =
    battleArtState === "failed"
      ? "Retry art loading"
      : battleArtState === "loading"
        ? "Preparing art…"
        : s.phase === "won"
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
  popups?.update();
  const hint = document.querySelector<HTMLElement>(".battle-placement-hint");
  if (hint) hint.hidden = !!selection?.point || selection?.selected != null;
  if (s.phase === "won" || s.phase === "lost") showResult();
}
function showResult() {
  if (!game || screen !== "battle") return;
  const s = game.state,
    won = s.phase === "won";
  if (won && !resultSaved) {
    const outcome = recordVictoryOutcome(save, game.level.id, s.stars);
    resultFirstBoardComplete = outcome.firstBoardComplete;
    resultRewards = outcome.rewards;
    save = outcome.save;
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
  clearBattleSelection();
  sound.pause(true);
  document.querySelector<HTMLElement>(".battle-screen")!.inert = true;
  battleMenu = new BattleMenu(root, save, fullscreenLabel());
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
  root.innerHTML = `<div class="modal-backdrop"><section class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title"><h2 id="settings-title">Settings</h2><label>Music <input data-setting="music" type="range" min="0" max="1" step="0.05" value="${save.music}"></label><label>Sound effects <input data-setting="effects" type="range" min="0" max="1" step="0.05" value="${save.effects}"></label><label class="mute-row"><input data-setting="muted" type="checkbox" ${save.muted ? "checked" : ""}> Mute all sound</label><label class="mute-row"><input data-setting="showGrid" type="checkbox" ${save.showGrid ? "checked" : ""}> Show placement grid</label><details class="game-credits"><summary>Credits</summary><p>Music: Treasure Hunter by TAD · CC0<br>Artwork generated for Stormwatch.</p></details>${fullscreenLabel() ? button("fullscreen", fullscreenLabel()!) : ""}${button("close-settings", "Back", "primary")}</section></div>`;
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
  if (el.id === "profile-name") {
    profileName = el.value;
    return;
  }
  if (!k) return;
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
  if (k === "showGrid") {
    save.showGrid = el.checked;
    field?.setGridVisible(save.showGrid);
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
  if (action === "fullscreen") {
    const change = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen({ navigationUI: "hide" });
    void change.catch(() =>
      toast("Fullscreen is unavailable in this browser."),
    );
    return;
  }
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
  if (
    action === "profiles" ||
    action === "new-profile" ||
    action === "edit-profile"
  ) {
    if (screen === "battle") return;
    profileEditorOpen = action !== "profiles";
    editingProfile = action === "edit-profile" ? value : null;
    const user = profiles.users.find((user) => user.id === editingProfile);
    profileName = user?.nickname ?? "";
    chosenAvatar = user?.avatar ?? "squirrel";
    deletingProfile = null;
    screen = "profiles";
    render();
    return;
  }
  if (screen === "profiles" && action !== "title" && action !== "map") {
    if (action === "close-profile-editor") {
      profileEditorOpen = false;
      render();
    }
    if (action === "avatar" && AVATARS.includes(value as Avatar)) {
      profileName =
        document.querySelector<HTMLInputElement>("#profile-name")?.value ??
        profileName;
      chosenAvatar = value as Avatar;
      for (const option of app.querySelectorAll<HTMLButtonElement>(
        ".avatar-options button",
      )) {
        option.setAttribute("aria-pressed", String(option === el));
      }
      // Keep the dialog intact: reopening it refocuses the nickname input.
      el.focus({ preventScroll: true });
    }
    if (action === "save-profile") {
      const input = document.querySelector<HTMLInputElement>("#profile-name");
      if (!input || !input.reportValidity()) return;
      try {
        const updated = createProfile(
          editingProfile ?? crypto.randomUUID(),
          input.value,
          chosenAvatar,
        );
        const existing = profiles.users.find(
          (user) => user.id === editingProfile,
        );
        if (existing) {
          existing.nickname = updated.nickname;
          existing.avatar = updated.avatar;
        } else profiles.users.push(updated);
        profiles.active = updated.id;
        selectCurrentProfile();
        profileEditorOpen = false;
        screen = "profiles";
        render();
      } catch (error) {
        toast((error as Error).message);
      }
    }
    if (
      action === "select-profile" &&
      profiles.users.some((user) => user.id === value)
    ) {
      profiles.active = value;
      selectCurrentProfile();
      screen = "title";
      render();
    }
    if (action === "delete-profile") {
      profileEditorOpen = false;
      deletingProfile = value;
      render();
    }
    if (action === "cancel-delete") {
      deletingProfile = null;
      render();
    }
    if (action === "confirm-delete" && deletingProfile === value) {
      profiles.users = profiles.users.filter((user) => user.id !== value);
      if (!activeProfile()) profiles.active = profiles.users[0]?.id ?? null;
      selectCurrentProfile();
      deletingProfile = null;
      editingProfile = null;
      profileName = "";
      render();
    }
    return;
  }
  if (action === "title" || action === "map") {
    sound.pause(false);
    sound.unlock();
    screen = action === "map" && !activeProfile() ? "profiles" : action;
    profileEditorOpen = screen === "profiles" && !activeProfile();
    game = null;
    render();
    return;
  }
  if (action === "level") {
    const nextLevel = Number(value);
    if (!levelUnlocked(LEVELS, nextLevel, save)) return;
    if (app.querySelector(".map-node.is-selecting")) return;
    const openBriefing = () => {
      if (screen !== "map" || !el.isConnected) return;
      levelIndex = nextLevel;
      card = initialCardForLevel(levelIndex);
      screen = "briefing";
      render();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      openBriefing();
    } else {
      el.classList.add("is-selecting");
      window.setTimeout(openBriefing, 160);
    }
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
  if (action === "retry-art") {
    render();
    return;
  }
  if (action === "start") {
    beginWave();
    sound.unlock();
  }
  if (action === "speed") {
    speed = speed === 1 ? 2 : 1;
    text("speed", `${speed}×`);
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
    if (
      screen === "battle" &&
      !selection?.point &&
      selection?.selected == null
    ) {
      openBattleMenu();
      return;
    }
    clearBattleSelection();
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
    field.update(
      game,
      selection?.selected ?? null,
      dt,
      selection?.point
        ? { point: selection.point, kind: selection.kind }
        : undefined,
    );
    if (now - lastHud > 100) {
      refreshHud(now);
    }
    if (import.meta.env.DEV && frames.length < 40000) frames.push(rawDt * 1000);
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
if (import.meta.env.DEV && new URLSearchParams(location.search).has("measure"))
  void import("./qa/load-report").then((m) => m.showLoadReport());
