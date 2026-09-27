import "../style.css";
import "../ui/game-chrome.css";
import "../ui/button-skin.css";
import "../ui/battle-ui.css";
import "./style.css";
import "./workspace.css";
import {
  CANONICAL_CONTENT,
  configurationIdentity,
  validateContent,
  type AuthoringContent,
  type LevelRecipe,
} from "../config/configuration";
import { WORKBENCH_STORAGE_KEY } from "./drafts";
import { mountAttempt } from "./attempt-view";
import { mountWaveCanvas, clearWaveCanvasHistory } from "./wave-canvas";
import { AttemptSession } from "./runs";
import {
  WORKING_DRAFT_KEY,
  createWorkingDraft,
  validateWorkingDraft,
  createMap,
  createWave,
  setMapLayout,
  rebaseAfterPromotion,
  promoteWorkingWave,
  type WorkingDraft,
} from "./working-draft";

const root = document.querySelector<HTMLElement>("#workbench")!;
const attemptHost = document.querySelector<HTMLElement>("#attempt-host")!;
const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const clone = <T>(value: T): T => structuredClone(value);
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
let draft: WorkingDraft;
let gameContent = clone(CANONICAL_CONTENT);
let storage: Storage | undefined;
let token = "";
let connected = false;
let saving = false;
let durable = false;
let error = "";
let message = "";
let canvas: ReturnType<typeof mountWaveCanvas> | undefined;
let disposeAttempt: (() => void) | undefined;
let creation: "map" | "wave" = "map";
let lastPlay: { identity: string; text: string } | undefined;
const names = {
  raider: "Rat raider",
  runner: "Fleet weasel",
  armored: "Shield boar",
  boss: "Roadwarden",
};
const images = {
  raider: "/art/v2/rat-rig-v3/body.webp",
  runner: "/art/v2/weasel-rig-v1/body.webp",
  armored: "/art/v2/boar-rig-v1/body.webp",
  boss: "/art/v2/badger-rig-v1/body.webp",
};
const level = () => draft.content.levels.find((l) => l.id === draft.levelId)!;
const wave = () => level().waves.find((w) => w.id === draft.waveId)!;
const playable = () => wave().packets.some((p) => p.groups.length);
const identity = () =>
  configurationIdentity({
    level: { ...level(), waves: [wave()] },
    towers: gameContent.towers,
    enemies: gameContent.enemies,
    rules: gameContent.rules,
  });
function pendingPromotion() {
  try {
    return (
      configurationIdentity(promoteWorkingWave(draft.base, draft)) !==
      configurationIdentity(draft.base)
    );
  } catch {
    return true;
  }
}
function persist() {
  validateWorkingDraft(draft);
  durable = false;
  try {
    if (!storage) throw new Error("Browser storage is unavailable");
    storage.setItem(WORKING_DRAFT_KEY, JSON.stringify(draft));
    durable = true;
  } catch (cause) {
    error = `${cause instanceof Error ? cause.message : String(cause)}. This draft is only in memory; keep this page open.`;
  }
  feedback();
}
function feedback() {
  const status = root.querySelector<HTMLElement>("#draft-status");
  if (status)
    status.textContent = durable ? "Draft auto-saved" : "Draft not saved";
  const note = root.querySelector<HTMLElement>("#workspace-message");
  if (note) {
    note.textContent = error || message;
    note.classList.toggle("wb-error", !!error);
  }
  const promote = root.querySelector<HTMLButtonElement>(
    '[data-action="promote"]',
  );
  if (promote) {
    promote.disabled =
      saving ||
      !connected ||
      !playable() ||
      !pendingPromotion() ||
      !validSettings();
    promote.textContent = saving ? "Promoting…" : "Promote";
  }
  const play = root.querySelector<HTMLButtonElement>('[data-action="play"]');
  if (play) play.disabled = saving || !playable() || !validSettings();
  const refresh = root.querySelector<HTMLButtonElement>(
    '[data-action="refresh-config"]',
  );
  if (refresh) refresh.hidden = !error.includes("changed in game config");
  const state = root.querySelector("#promotion-state");
  if (state)
    state.textContent = pendingPromotion()
      ? "Draft changes"
      : "Matches game config";
  const result = root.querySelector("#play-result");
  if (result)
    result.textContent = lastPlay
      ? `${lastPlay.identity === identity() ? "Last playtest" : "Earlier playtest"}: ${lastPlay.text}`
      : "";
}
function validSettings(focus = false) {
  const invalid = [
    ...root.querySelectorAll<HTMLInputElement>("[data-field]"),
  ].find((input) => !input.validity.valid || !input.value.trim());
  if (invalid && focus) {
    root.querySelector<HTMLDetailsElement>("#map-settings")!.open = true;
    invalid.focus();
    invalid.reportValidity();
  }
  return !invalid;
}
function layoutShape(map: LevelRecipe) {
  return {
    width: map.width,
    depth: map.depth,
    path: map.path,
    blocked: map.blocked,
    accent: map.accent,
  };
}
function mapPreview() {
  const map = level();
  const points = map.path.map((p) => `${p.x + 0.5},${p.z + 0.5}`).join(" ");
  return `<svg class="ws-map-preview" viewBox="0 0 ${map.width} ${map.depth}" role="img" aria-label="Selected map route"><rect width="100%" height="100%" fill="#193b34"/><polyline points="${points}" fill="none" stroke="#dcc89d" stroke-width="0.45" stroke-linejoin="round"/>${map.blocked.map((p) => `<rect x="${p.x}" y="${p.z}" width="1" height="1" fill="#617859"/>`).join("")}</svg>`;
}
function palette() {
  return Object.entries(names)
    .map(
      ([kind, name]) =>
        `<button type="button" data-action="first-enemy" data-kind="${kind}"><img src="${images[kind as keyof typeof images]}" alt=""/>${name}</button>`,
    )
    .join("");
}
function render() {
  const settingsOpen =
    root.querySelector<HTMLDetailsElement>("#map-settings")?.open ?? false;
  canvas?.dispose();
  canvas = undefined;
  const map = level(),
    current = wave();
  const matchedLayout =
    draft.base.levels.find(
      (l) =>
        configurationIdentity(layoutShape(l)) ===
        configurationIdentity(layoutShape(map)),
    )?.id ?? "";
  root.innerHTML = `<main class="wb-shell ws-shell"><header class="wb-header"><div><p class="wb-eyebrow">STORMWATCH</p><h1>Designer workbench</h1></div><span id="draft-status" role="status"></span></header>
  <section class="ws-workspace"><div class="ws-picker-bar"><label>Map<select id="map-picker">${draft.content.levels.map((l) => `<option value="${esc(l.id)}" ${l.id === map.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label><button data-action="new-map">+ Map</button><label>Wave<select id="wave-picker">${map.waves.map((w, i) => `<option value="${esc(w.id)}" ${w.id === current.id ? "selected" : ""}>${i + 1}. ${esc(w.title)}</option>`).join("")}</select></label><button data-action="new-wave">+ Wave</button></div>
  <div class="ws-heading"><div><h2>Shape the arrivals.</h2><p>Move enemy groups, shape their rhythm, then try the wave.</p></div><div class="ws-actions"><button data-action="play">Playtest</button><button data-action="promote" class="primary">Promote</button></div></div>
  <div class="ws-save-line"><span id="promotion-state"></span><span>Promote saves this wave and its map settings to game config.</span></div>
  <div id="workspace-message" class="wb-feedback" role="status"></div><button data-action="refresh-config" hidden>Keep draft with latest game config</button>
  ${playable() ? '<section id="wave-canvas" aria-label="Visual wave editor"></section>' : `<section class="ws-empty"><h3>Add your first enemy group</h3><p>Choose an enemy, then shape the group on the timeline.</p><div class="wg-palette">${palette()}</div></section>`}
  <p id="play-result" class="ws-play-result"></p>
  <details id="map-settings" class="ws-settings" ${settingsOpen ? "open" : ""}><summary>Map &amp; wave settings</summary><div class="ws-settings-grid"><label>Map name<input data-field="name" value="${esc(map.name)}" required/></label><label>Wave name<input data-field="title" value="${esc(current.title)}" required/></label><label>Map layout<select id="layout-picker">${matchedLayout ? "" : '<option value="">Custom layout</option>'}${draft.base.levels.map((l) => `<option value="${esc(l.id)}" ${l.id === matchedLayout ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label><label>Starting crowns<input data-field="startCoins" type="number" min="0" step="1" value="${map.startCoins}"/></label><label>Wave reward<input data-field="reward" type="number" min="0" step="1" value="${current.reward}"/></label>${mapPreview()}</div></details>
  </section><dialog id="create-dialog"><form id="create-form"><h2 id="create-title"></h2><label>Name<input id="create-name" required maxlength="100" autocomplete="off"/></label><label id="create-layout-label">Starting layout<select id="create-layout">${draft.base.levels.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}</select></label><div class="ws-dialog-actions"><button type="button" data-action="cancel-create">Cancel</button><button class="primary" type="submit">Create</button></div></form></dialog></main>`;
  if (playable())
    canvas = mountWaveCanvas(root.querySelector<HTMLElement>("#wave-canvas")!, {
      level: map,
      wave: current,
      initialDelay: draft.content.rules.initialSpawnDelay,
      onChange(next) {
        error = "";
        message = "";
        const index = level().waves.findIndex((w) => w.id === draft.waveId);
        level().waves[index] = clone(next);
        persist();
      },
    });
  root.querySelector<HTMLSelectElement>("#map-picker")!.onchange = (event) => {
    draft.levelId = (event.target as HTMLSelectElement).value;
    draft.waveId = level().waves[0].id;
    error = "";
    message = "";
    persist();
    render();
  };
  root.querySelector<HTMLSelectElement>("#wave-picker")!.onchange = (event) => {
    draft.waveId = (event.target as HTMLSelectElement).value;
    error = "";
    message = "";
    persist();
    render();
  };
  root.querySelector<HTMLSelectElement>("#layout-picker")!.onchange = (
    event,
  ) => {
    try {
      draft = setMapLayout(draft, (event.target as HTMLSelectElement).value);
      error = "";
      message = "Layout updated. Playtest to try the new route.";
      persist();
      render();
    } catch (cause) {
      fail(cause);
    }
  };
  root.querySelectorAll<HTMLInputElement>("[data-field]").forEach((input) => {
    input.oninput = () => {
      try {
        input.setCustomValidity(input.value.trim() ? "" : "Enter a value.");
        if (!input.reportValidity() || !input.value.trim())
          throw new Error("Enter a valid name or whole number.");
        const next = clone(draft),
          nextMap = next.content.levels.find((l) => l.id === next.levelId)!,
          nextWave = nextMap.waves.find((w) => w.id === next.waveId)!;
        if (input.dataset.field === "name") nextMap.name = input.value;
        if (input.dataset.field === "title") nextWave.title = input.value;
        if (input.dataset.field === "startCoins")
          nextMap.startCoins = Number(input.value);
        if (input.dataset.field === "reward")
          nextWave.reward = Number(input.value);
        validateWorkingDraft(next);
        draft = next;
        error = "";
        message = "";
        persist();
        root.querySelector<HTMLOptionElement>(
          `#map-picker option:checked`,
        )!.textContent = level().name;
        root.querySelector<HTMLOptionElement>(
          `#wave-picker option:checked`,
        )!.textContent =
          `${level().waves.findIndex((w) => w.id === draft.waveId) + 1}. ${wave().title}`;
        canvas?.refresh(wave(), level());
      } catch (cause) {
        fail(cause);
      }
    };
  });
  root.querySelector<HTMLFormElement>("#create-form")!.onsubmit = (event) => {
    event.preventDefault();
    try {
      const name = root
        .querySelector<HTMLInputElement>("#create-name")!
        .value.trim();
      draft =
        creation === "map"
          ? createMap(
              draft,
              name,
              root.querySelector<HTMLSelectElement>("#create-layout")!.value,
              uid("map"),
              uid("wave"),
            )
          : createWave(draft, name, uid("wave"));
      error = "";
      message = "";
      clearWaveCanvasHistory();
      persist();
      render();
    } catch (cause) {
      fail(cause);
    }
  };
  feedback();
}
function fail(cause: unknown) {
  error = cause instanceof Error ? cause.message : String(cause);
  feedback();
}
function play() {
  if (!playable() || !validSettings(true)) return;
  // The playtest uses the same scoped candidate as promotion, including game catalogs.
  const content = promoteWorkingWave(gameContent, draft);
  const session = new AttemptSession(content, {
    id: "workbench-playtest",
    levelId: draft.levelId,
    waveId: draft.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  });
  const playedIdentity = identity();
  const close = () => {
    disposeAttempt?.();
    disposeAttempt = undefined;
    attemptHost.hidden = true;
    root.hidden = false;
    render();
  };
  const record = () => {
    const state = session.game.state;
    lastPlay = {
      identity: playedIdentity,
      text: `${state.phase === "won" ? "Wave cleared" : state.phase === "lost" ? "Defense fell" : "Stopped"} · ${state.lives} hearts left · ${Math.round(state.clock)}s`,
    };
  };
  root.hidden = true;
  attemptHost.hidden = false;
  disposeAttempt = mountAttempt(attemptHost, session.game, {
    label: `${wave().title} · Draft playtest`,
    command: (c) => session.command(c),
    step: () => session.step(),
    onExit: () => {
      record();
      close();
    },
    onFinish: record,
    onRestart: () => {
      close();
      play();
    },
  });
}
async function promote() {
  if (saving || !connected || !playable() || !validSettings(true)) return;
  persist();
  if (!durable)
    throw new Error("Save the draft successfully before promoting.");
  const submitted = clone(draft);
  saving = true;
  error = "";
  message = "";
  feedback();
  root.querySelector<HTMLElement>(".ws-workspace")!.inert = true;
  try {
    const response = await fetch("/__workbench/promote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Workbench-Token": token,
      },
      body: JSON.stringify(submitted),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Promotion failed.");
    validateContent(result.content);
    gameContent = clone(result.content);
    draft = rebaseAfterPromotion(submitted, result.content);
    error = "";
    message = `Promoted ${wave().title}. Reload the game to play your changes.`;
    persist();
  } finally {
    saving = false;
    render();
  }
}
root.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action]",
  );
  if (!button) return;
  const action = button.dataset.action;
  void (async () => {
    try {
      if (action === "play") {
        error = "";
        play();
      } else if (action === "promote") await promote();
      else if (action === "refresh-config") {
        const response = await fetch("/__workbench/config", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to refresh game config.");
        const result = await response.json();
        validateContent(result.content);
        gameContent = clone(result.content);
        token = result.token;
        draft.base = clone(gameContent);
        error = "";
        message =
          "Game config refreshed. Your draft edits are kept; review them before promoting over the latest settings.";
        persist();
        render();
      } else if (action === "new-map" || action === "new-wave") {
        creation = action === "new-map" ? "map" : "wave";
        root.querySelector("#create-title")!.textContent =
          creation === "map" ? "New map" : "New wave";
        root.querySelector<HTMLElement>("#create-layout-label")!.hidden =
          creation !== "map";
        root.querySelector<HTMLInputElement>("#create-name")!.value = "";
        root.querySelector<HTMLDialogElement>("#create-dialog")!.showModal();
      } else if (action === "cancel-create")
        root.querySelector<HTMLDialogElement>("#create-dialog")!.close();
      else if (action === "first-enemy") {
        const kind = button.dataset.kind as keyof typeof names;
        wave().packets = [
          {
            id: uid("sequence"),
            groups: [
              { id: uid("group"), kind, count: 3, batchSize: 1, gap: 1 },
            ],
          },
        ];
        error = "";
        message = "";
        persist();
        render();
      }
    } catch (cause) {
      fail(cause);
    }
  })();
});
async function start() {
  let baseline = clone(CANONICAL_CONTENT);
  try {
    const response = await fetch("/__workbench/config", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const result = await response.json();
    validateContent(result.content);
    baseline = result.content;
    token = result.token;
    connected = true;
  } catch {
    message =
      "Promotion needs the local workbench server. Start it with npm run dev:workbench.";
  }
  gameContent = clone(baseline);
  try {
    storage = localStorage;
  } catch {
    /* In-memory draft remains usable. */
  }
  try {
    const stored = storage?.getItem(WORKING_DRAFT_KEY);
    if (stored) draft = validateWorkingDraft(JSON.parse(stored));
    else {
      let legacy: AuthoringContent | undefined;
      const previous = storage?.getItem(WORKBENCH_STORAGE_KEY);
      if (previous) {
        try {
          const revisions = JSON.parse(previous).revisions;
          for (const entry of Array.isArray(revisions)
            ? [...revisions].reverse()
            : []) {
            try {
              validateContent(entry.content);
              legacy = entry.content;
              break;
            } catch {
              /* Continue to the most recent valid revision. */
            }
          }
        } catch {
          /* Preserve the archived experiments without importing invalid data. */
        }
      }
      draft = createWorkingDraft(baseline, legacy);
    }
    persist();
    render();
  } catch (cause) {
    root.innerHTML = `<main class="wb-shell ws-workspace"><h1>Unable to open your saved draft</h1><p>${esc(cause instanceof Error ? cause.message : cause)}</p><p>The stored draft has been preserved. Ask your agent to recover it before continuing.</p></main>`;
  }
}
void start();
