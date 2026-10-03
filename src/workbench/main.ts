import { mountBoardEditor } from "./board-editor";
import "../style.css";
import "../ui/game-chrome.css";
import "../ui/button-skin.css";
import "../ui/battle-ui.css";
import "./style.css";
import "./workspace.css";
import {
  artPath,
  backdropVisuals,
  enemyVisuals,
} from "../content/encounter-visuals";
import {
  CANONICAL_CONTENT,
  configurationIdentity,
  waveAbilities,
  ABILITY_DEFAULTS,
  validateContent,
  type AuthoringContent,
  type LevelRecipe,
} from "../config/configuration";
import {
  authoredGeometry,
  useRouteLayout,
  routesForEditor,
} from "./route-authoring";
import { routePreview } from "../ui/route-preview";
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
  promoteAllWorkingChanges,
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
  armored: "Iron boar",
  boss: "Roadwarden",
};
const images = Object.fromEntries(
  Object.entries(enemyVisuals).map(([kind, visual]) => [
    kind,
    `/${artPath(visual.briefing)}`,
  ]),
);
const level = () => draft.content.levels.find((l) => l.id === draft.levelId)!;
const wave = () => level().waves.find((w) => w.id === draft.waveId)!;
const playable = () => wave().packets.some((p) => p.groups.length);
const identity = () =>
  configurationIdentity({
    level: { ...level(), waves: [wave()] },
    towers: {
      ...gameContent.towers,
      stone: {
        ...gameContent.towers.stone,
        poisonDamage: draft.content.towers.stone.poisonDamage,
      },
    },
    enemies: {
      ...gameContent.enemies,
      armored: {
        ...gameContent.enemies.armored,
        poisonImmune: draft.content.enemies.armored.poisonImmune,
      },
    },
    rules: gameContent.rules,
    abilityDefaults: draft.content.abilityDefaults,
    geometry: authoredGeometry(draft.content, level()),
  });
function pendingPromotion(all = false) {
  try {
    return (
      configurationIdentity(
        (all ? promoteAllWorkingChanges : promoteWorkingWave)(
          draft.base,
          draft,
        ),
      ) !== configurationIdentity(draft.base)
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
    promote.textContent = saving ? "Promoting…" : "Promote wave";
  }
  const promoteAll = root.querySelector<HTMLButtonElement>(
    '[data-action="promote-all"]',
  );
  if (promoteAll)
    promoteAll.disabled =
      saving || !connected || !pendingPromotion(true) || !validSettings();
  const play = root.querySelector<HTMLButtonElement>('[data-action="play"]');
  if (play) play.disabled = saving || !playable() || !validSettings();
  const refresh = root.querySelector<HTMLButtonElement>(
    '[data-action="refresh-config"]',
  );
  if (refresh) refresh.hidden = !error.includes("changed in game config");
  const state = root.querySelector("#promotion-state");
  if (state)
    state.textContent = pendingPromotion()
      ? "Selected wave has draft changes"
      : pendingPromotion(true)
        ? "Other draft changes remain"
        : "All changes promoted";
  const result = root.querySelector("#play-result");
  if (result)
    result.textContent = lastPlay
      ? `${lastPlay.identity === identity() ? "Last playtest" : "Earlier playtest"}: ${lastPlay.text}`
      : "";
}
function validSettings(focus = false) {
  const invalid = [
    ...root.querySelectorAll<HTMLInputElement>(
      "[data-field], [data-ability-timing], [data-poison-setting], [data-poison-damage]",
    ),
  ].find(
    (input) =>
      !input.validity.valid ||
      (!input.hasAttribute("data-poison-damage") && !input.value.trim()),
  );
  if (invalid && focus) {
    invalid.closest<HTMLDetailsElement>("details")!.open = true;
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
function editorLevel(): LevelRecipe {
  const { routeLayoutId: _reference, ...map } = level();
  return { ...map, ...authoredGeometry(draft.content, level()) };
}
function mapPreview() {
  return routePreview(authoredGeometry(draft.content, level()));
}
function routeControls(map: LevelRecipe) {
  const layout = draft.content.routeLayouts?.find(
    (l) => l.id === map.routeLayoutId,
  );
  const routes = routesForEditor(draft.content, map);
  return `<label>Shared route layout<select id="route-layout-picker"><option value="" ${layout ? "" : "selected"}>Map's own layout</option>${(draft.content.routeLayouts ?? []).map((l) => `<option value="${esc(l.id)}" ${layout?.id === l.id ? "selected" : ""}>${esc(l.id)}</option>`).join("")}</select></label><fieldset><legend>${layout ? `Edit shared ${esc(layout.id)}` : "Edit map routes"}</legend><p>${layout ? "Changes affect every map using this layout." : "Changes affect this map only."} Each line is an x,z waypoint. All routes remain fixed.</p>${routes.map((r) => `<label>${esc(r.id)} waypoints<textarea data-route-path="${esc(r.id)}" rows="10">${r.path.map((p) => `${p.x},${p.z}`).join("\n")}</textarea></label>`).join("")}<button type="button" data-action="apply-route-paths">Apply ${layout ? "shared" : "map"} routes</button></fieldset>`;
}
function backdropPicker(map: LevelRecipe) {
  return `<label>Painted backdrop<select id="backdrop-picker">${map.visual?.backdrop ? "" : '<option value="" selected disabled>Choose a backdrop</option>'}${Object.keys(
    backdropVisuals,
  )
    .map(
      (id) =>
        `<option value="${esc(id)}" ${id === map.visual?.backdrop ? "selected" : ""}>${esc(id)}</option>`,
    )
    .join("")}</select></label>`;
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
  const abilities = waveAbilities(current);
  const defaults = draft.content.abilityDefaults ?? ABILITY_DEFAULTS;
  const globalsOpen =
    root.querySelector<HTMLDetailsElement>("#ability-settings")?.open ?? false;
  const matchedLayout =
    draft.base.levels.find(
      (l) =>
        configurationIdentity(layoutShape(l)) ===
        configurationIdentity(layoutShape(map)),
    )?.id ?? "";
  root.innerHTML = `<main class="wb-shell ws-shell"><header class="wb-header"><div><p class="wb-eyebrow">STORMWATCH</p><h1>Designer workbench</h1></div><span id="draft-status" role="status"></span></header>
  <section class="ws-workspace"><div class="ws-picker-bar"><label>Map<select id="map-picker">${draft.content.levels.map((l) => `<option value="${esc(l.id)}" ${l.id === map.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label><button data-action="new-map">+ Map</button><label>Wave<select id="wave-picker">${map.waves.map((w, i) => `<option value="${esc(w.id)}" ${w.id === current.id ? "selected" : ""}>${i + 1}. ${esc(w.title)}</option>`).join("")}</select></label><button data-action="new-wave">+ Wave</button></div>
  <div class="ws-heading"><div><h2>Shape the arrivals.</h2><p>Move enemy groups, shape their rhythm, then try the wave.</p></div><div class="ws-actions"><button data-action="play">Playtest</button><button data-action="promote">Promote wave</button><button data-action="promote-all" class="primary">Promote all changes</button></div></div>
  <div class="ws-save-line"><span id="promotion-state"></span><span>Promote wave saves only this wave, its map and board settings, referenced route layout, shared abilities and poison settings. Promote all changes saves edits across every board, map and wave.</span></div>
  <div id="workspace-message" class="wb-feedback" role="status"></div><button data-action="refresh-config" hidden>Keep draft with latest game config</button>
  ${playable() ? '<section id="wave-canvas" aria-label="Visual wave editor"></section>' : `<section class="ws-empty"><h3>Add your first enemy group</h3><p>Choose an enemy, then shape the group on the timeline.</p><div class="wg-palette">${palette()}</div></section>`}
  <fieldset class="ws-abilities"><legend>Abilities for this wave</legend><label><input type="checkbox" data-ability="ratShield" ${abilities.ratShield ? "checked" : ""}/> Rat shield <small data-timing-summary="ratShield">${defaults.ratShield.upSeconds}s shielded / ${defaults.ratShield.downSeconds}s exposed</small></label><label><input type="checkbox" data-ability="weaselEvade" ${abilities.weaselEvade ? "checked" : ""}/> Weasel evade <small data-timing-summary="weaselEvade">${defaults.weaselEvade.upSeconds}s evading / ${defaults.weaselEvade.downSeconds}s exposed</small></label></fieldset>
  <p id="play-result" class="ws-play-result"></p>
  <details id="ability-settings" class="ws-settings" ${globalsOpen ? "open" : ""}><summary>Shared ability settings</summary><p>Applies to every wave with the ability on. Promote saves these changes too.</p><div class="ws-settings-grid">${(["ratShield", "weaselEvade"] as const).map((key) => `<fieldset><legend>${key === "ratShield" ? "Rat shield" : "Weasel evade"}</legend>${(["upSeconds", "downSeconds"] as const).map((phase) => `<label>${phase === "upSeconds" ? "Active" : "Exposed"} (seconds)<input type="number" min="0.05" step="0.05" required data-ability-timing="${key}" data-phase="${phase}" aria-label="${key === "ratShield" ? "Rat shield" : "Weasel evade"} ${phase === "upSeconds" ? "active" : "exposed"} seconds" value="${defaults[key][phase]}"/></label>`).join("")}</fieldset>`).join("")}<fieldset><legend>Boss rage</legend>${(["angrySpeedScale", "ragingSpeedScale"] as const).map((key) => `<label>${key === "angrySpeedScale" ? "Angry" : "Raging"} · speed multiplier<input type="number" min="1" step="0.05" required data-boss-rage="${key}" value="${(defaults.bossRage ?? ABILITY_DEFAULTS.bossRage)[key]}"/></label>`).join("")}${(["triggerDamagePercent", "angrySeconds", "ragingSeconds"] as const).map((key) => `<label>${key === "triggerDamagePercent" ? "Damage to trigger (% max HP)" : key === "angrySeconds" ? "Angry duration (seconds)" : "Full rage duration (seconds)"}<input type="number" min="0.05" ${key === "triggerDamagePercent" ? 'max="100"' : ""} step="0.05" required data-boss-rage="${key}" value="${defaults.bossRage?.[key] ?? ABILITY_DEFAULTS.bossRage[key]}"/></label>`).join("")}<p>Permanent full rage at 25% health.</p></fieldset><fieldset><legend>Skunk poison and Boar tough skin</legend>${(["durationSeconds", "tickSeconds"] as const).map((key) => `<label>${key === "durationSeconds" ? "Poison duration" : "Tick cadence"} (seconds)<input type="number" min="0.05" step="0.05" data-poison-setting="${key}" value="${(defaults.skunkPoison ?? ABILITY_DEFAULTS.skunkPoison)[key]}"/></label>`).join("")}<label>Poison damage per tick (blank: off)<input type="number" min="0.1" step="0.1" data-poison-damage value="${draft.content.towers.stone.poisonDamage ?? ""}"/></label><label><input type="checkbox" data-poison-immune ${draft.content.enemies.armored.poisonImmune ? "checked" : ""}/> Boar: permanent poison immunity</label><p>Blast follows armor and shields. Poison bypasses both. Impact evasion avoids blast and attachment; later evasion cannot avoid ticks. Refresh keeps the stronger poison.</p></fieldset></div></details>
  <details id="map-settings" class="ws-settings" ${settingsOpen ? "open" : ""}><summary>Map &amp; wave settings</summary><div class="ws-settings-grid"><label>Map name<input data-field="name" value="${esc(map.name)}" required/></label><label>Wave name<input data-field="title" value="${esc(current.title)}" required/></label><label>Map layout<select id="layout-picker">${matchedLayout ? "" : '<option value="">Custom layout</option>'}${draft.base.levels.map((l) => `<option value="${esc(l.id)}" ${l.id === matchedLayout ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label><label>Starting crowns<input data-field="startCoins" type="number" min="0" step="1" value="${map.startCoins}"/></label><label>Wave reward<input data-field="reward" type="number" min="0" step="1" value="${current.reward}"/></label><label><input type="checkbox" id="required-bosses" ${map.requiresBossDefeat ? "checked" : ""}/> Require every finale boss defeated</label>${routesForEditor(draft.content, map).length === 1 ? `<label><input type="checkbox" id="travel-time-targeting" ${map.routes || map.routeLayoutId ? "checked" : ""}/> Prioritize remaining travel time</label>` : ""}${routeControls(map)}${mapPreview()}</div></details>
  </section><dialog id="create-dialog"><form id="create-form"><h2 id="create-title"></h2><label>Name<input id="create-name" required maxlength="100" autocomplete="off"/></label><label id="create-layout-label">Starting layout<select id="create-layout">${draft.base.levels.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}</select></label><div class="ws-dialog-actions"><button type="button" data-action="cancel-create">Cancel</button><button class="primary" type="submit">Create</button></div></form></dialog></main>`;
  root
    .querySelector("#map-settings .ws-settings-grid")
    ?.insertAdjacentHTML("beforeend", backdropPicker(map));
  const boardHost = document.createElement("section");
  root.querySelector(".ws-workspace")!.append(boardHost);
  mountBoardEditor(
    boardHost,
    () => draft,
    (next) => {
      draft = next;
      error = "";
      message =
        "Board draft saved. Review the order and positions before promotion.";
      persist();
      render();
      root.querySelector<HTMLDetailsElement>("#board-settings")!.open = true;
    },
    fail,
  );
  if (playable())
    canvas = mountWaveCanvas(root.querySelector<HTMLElement>("#wave-canvas")!, {
      level: editorLevel(),
      wave: current,
      initialDelay: draft.content.rules.initialSpawnDelay,
      onChange(next) {
        error = "";
        message = "";
        const index = level().waves.findIndex((w) => w.id === draft.waveId);
        level().waves[index] = clone(next);
        const enabled = waveAbilities(next);
        root
          .querySelectorAll<HTMLInputElement>("[data-ability]")
          .forEach((input) => {
            input.checked =
              enabled[input.dataset.ability as "ratShield" | "weaselEvade"];
          });
        persist();
      },
    });
  root
    .querySelectorAll<HTMLInputElement>("[data-ability-timing]")
    .forEach((input) => {
      input.oninput = () => {
        if (!input.validity.valid || !input.value.trim()) {
          error =
            "Ability timing must be at least 0.05 seconds, in 0.05-second steps.";
          feedback();
          return;
        }
        const key = input.dataset.abilityTiming as "ratShield" | "weaselEvade";
        const phase = input.dataset.phase as "upSeconds" | "downSeconds";
        draft.content.abilityDefaults ??= clone(ABILITY_DEFAULTS);
        draft.content.abilityDefaults[key][phase] = Number(input.value);
        const cycle = draft.content.abilityDefaults[key];
        root.querySelector(`[data-timing-summary="${key}"]`)!.textContent =
          `${cycle.upSeconds}s ${key === "ratShield" ? "shielded" : "evading"} / ${cycle.downSeconds}s exposed`;
        error = "";
        message = "";
        persist();
      };
    });
  root
    .querySelectorAll<HTMLInputElement>("[data-boss-rage]")
    .forEach((input) => {
      input.onchange = () => {
        const key = input.dataset
          .bossRage as keyof typeof ABILITY_DEFAULTS.bossRage;
        const rage = {
          ...ABILITY_DEFAULTS.bossRage,
          ...draft.content.abilityDefaults?.bossRage,
          [key]: Number(input.value),
        };
        if (
          !input.validity.valid ||
          !input.value.trim() ||
          rage.ragingSpeedScale < rage.angrySpeedScale
        ) {
          error =
            "Use positive timings and damage up to 100%; speeds must be at least 1× with raging no slower than angry.";
          feedback();
          return;
        }
        draft.content.abilityDefaults ??= clone(ABILITY_DEFAULTS);
        draft.content.abilityDefaults.bossRage = rage;
        error = "";
        message = "";
        persist();
      };
    });
  root
    .querySelectorAll<HTMLInputElement>(
      "[data-poison-setting], [data-poison-damage], [data-poison-immune]",
    )
    .forEach((input) => {
      input.oninput = () => {
        const previous = clone(draft.content);
        draft.content.abilityDefaults ??= clone(ABILITY_DEFAULTS);
        const settings = (draft.content.abilityDefaults.skunkPoison ??= clone(
          ABILITY_DEFAULTS.skunkPoison,
        ));
        if (input.dataset.poisonSetting)
          settings[input.dataset.poisonSetting as keyof typeof settings] =
            Number(input.value);
        else if (input.hasAttribute("data-poison-damage"))
          draft.content.towers.stone.poisonDamage = input.value.trim()
            ? Number(input.value)
            : undefined;
        else draft.content.enemies.armored.poisonImmune = input.checked;
        try {
          if (
            !input.validity.valid ||
            (!input.hasAttribute("data-poison-immune") &&
              !input.hasAttribute("data-poison-damage") &&
              !input.value.trim())
          )
            throw new Error("Enter valid positive poison settings.");
          validateWorkingDraft(draft);
          error = "";
          message = "";
          persist();
        } catch (failure) {
          draft.content = previous;
          error = String(failure);
          feedback();
        }
      };
    });
  root.querySelectorAll<HTMLInputElement>("[data-ability]").forEach((input) => {
    input.onchange = () => {
      const key = input.dataset.ability as "ratShield" | "weaselEvade";
      wave().abilities = { ...waveAbilities(wave()), [key]: input.checked };
      error = "";
      message = "";
      canvas?.refresh(wave(), editorLevel());
      persist();
    };
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
  const targeting = root.querySelector<HTMLInputElement>(
    "#travel-time-targeting",
  );
  if (targeting)
    targeting.onchange = () => {
      try {
        const next = clone(draft),
          map = next.content.levels.find((l) => l.id === next.levelId)!;
        const routes = routesForEditor(next.content, map);
        if (targeting.checked) {
          map.routes = clone(routes);
          map.path = [];
          delete map.routeLayoutId;
        } else {
          map.path = clone(routes[0].path);
          delete map.routes;
          delete map.routeLayoutId;
          for (const wave of map.waves)
            for (const packet of wave.packets)
              for (const group of packet.groups) delete group.routeId;
        }
        draft = validateWorkingDraft(next);
        error = "";
        message = "";
        persist();
        render();
      } catch (cause) {
        fail(cause);
      }
    };
  root.querySelector<HTMLInputElement>("#required-bosses")!.onchange = (
    event,
  ) => {
    try {
      const next = clone(draft);
      next.content.levels.find(
        (l) => l.id === next.levelId,
      )!.requiresBossDefeat = (event.target as HTMLInputElement).checked;
      draft = validateWorkingDraft(next);
      error = "";
      message = "";
      persist();
    } catch (cause) {
      fail(cause);
    }
  };
  root.querySelector<HTMLSelectElement>("#route-layout-picker")!.onchange = (
    event,
  ) => {
    try {
      const id = (event.target as HTMLSelectElement).value;
      const next = clone(draft),
        map = next.content.levels.find((l) => l.id === next.levelId)!;
      if (id) useRouteLayout(next.content, map, id);
      else {
        Object.assign(map, authoredGeometry(next.content, map));
        delete map.routeLayoutId;
        if (map.routes) map.path = [];
      }
      draft = validateWorkingDraft(next);
      persist();
      render();
    } catch (cause) {
      fail(cause);
    }
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
  root.querySelector<HTMLSelectElement>("#backdrop-picker")!.onchange = (
    event,
  ) => {
    try {
      const next = clone(draft);
      next.content.levels.find((entry) => entry.id === next.levelId)!.visual = {
        backdrop: (event.target as HTMLSelectElement).value,
      };
      draft = validateWorkingDraft(next);
      error = "";
      message = "Backdrop updated. Playtest to review it.";
      persist();
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
        canvas?.refresh(wave(), editorLevel());
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
async function promote(all = false) {
  if (saving || !connected || (!all && !playable()) || !validSettings(true))
    return;
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
    const response = await fetch(
      all ? "/__workbench/promote-all" : "/__workbench/promote",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workbench-Token": token,
        },
        body: JSON.stringify(submitted),
      },
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Promotion failed.");
    validateContent(result.content);
    gameContent = clone(result.content);
    draft = rebaseAfterPromotion(submitted, result.content);
    error = "";
    message = all
      ? "Promoted all map, wave and shared ability changes. Reload the game to play your changes."
      : `Promoted ${wave().title} only, plus map and board settings, referenced route layout, shared abilities and poison settings.${pendingPromotion(true) ? " Other draft changes remain." : ""} Reload the game to play your changes.`;
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
      if (action === "apply-route-paths") {
        const next = clone(draft);
        const map = next.content.levels.find((l) => l.id === next.levelId)!;
        const layout = next.content.routeLayouts?.find(
          (l) => l.id === map.routeLayoutId,
        );
        const routes = routesForEditor(next.content, map);
        for (const input of root.querySelectorAll<HTMLTextAreaElement>(
          "[data-route-path]",
        )) {
          const route = routes.find((r) => r.id === input.dataset.routePath)!;
          route.path = input.value
            .trim()
            .split(/\n/)
            .map((line) => {
              const parts = line.split(",").map((p) => p.trim());
              if (parts.length !== 2 || parts.some((p) => !p))
                throw new Error("Use one x,z waypoint per line.");
              return { x: Number(parts[0]), z: Number(parts[1]) };
            });
        }
        if (layout) layout.routes = routes;
        else if (map.routes) map.routes = routes;
        else map.path = routes[0].path;
        draft = validateWorkingDraft(next);
        error = "";
        message = "Routes updated. Playtest before promoting.";
        persist();
        render();
      } else if (action === "play") {
        error = "";
        play();
      } else if (action === "promote") await promote();
      else if (action === "promote-all") await promote(true);
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
