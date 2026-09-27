import "../style.css";
import "../ui/game-chrome.css";
import "../ui/button-skin.css";
import "../ui/battle-ui.css";
import "./style.css";
import {
  CANONICAL_CONTENT,
  compileLevel,
  configurationIdentity,
  resolveConfiguration,
  validateContent,
  type AuthoringContent,
} from "../config/configuration";
import { compileSpawnSchedule } from "../sim/spawn-schedule";
import {
  DraftStore,
  forkDraft,
  exportExperiments,
  importExperiments,
  type DraftRevision,
} from "./drafts";
import { mountAttempt } from "./attempt-view";
import { resolveScenario as inspectScenario } from "./scenarios";
// The browser and headless runner share this session; it owns commands and evidence.
import {
  AttemptSession,
  runScenario,
  compareScenarios,
  searchScenario,
  type Scenario,
  type RunReport,
} from "./runs";

const root = document.querySelector<HTMLElement>("#workbench")!;
const attemptHost = document.querySelector<HTMLElement>("#attempt-host")!;
const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const json = (value: unknown) => JSON.stringify(value, null, 2);
const clone = <T>(value: T): T => structuredClone(value);
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
let storage: Storage | undefined;
try {
  storage = localStorage;
} catch {
  /* DraftStore exposes unavailable storage. */
}
const store = new DraftStore(storage);
let content = clone(CANONICAL_CONTENT);
let revision: DraftRevision | null = null;
let levelId = content.levels[0].id;
let waveId = content.levels.find((level) => level.id === levelId)!.waves[0].id;
let message = "Ready to tune. Your changes stay in a local draft.";
let error = "";
let disposeAttempt: (() => void) | undefined;
let lastReport: RunReport | undefined;
let replayTrace: import("./commands").RecordedCommand[] | undefined;
let lastAttemptContent: AuthoringContent | undefined;
let lastAttemptScenario: Scenario | undefined;
let lastAttemptRevision: DraftRevision | null = null;
let runBusy = false;
let runControls = {
  policy: "coverage-first",
  goal: "encounter-win",
  noLoss: false,
  cadence: 30,
  limit: 600,
  budget: 12,
};
let renderedSelection = "";
let workspace = "tune";
let dirty = false;
let pendingNavigation: (() => void) | undefined;
let lastEvidence: unknown;
let inspectedScenario: unknown;
let evidenceSummary = "";
let invalidEditor: HTMLInputElement | HTMLTextAreaElement | undefined;
function feedback() {
  root.querySelectorAll(".wb-field-error").forEach((node) => node.remove());
  root
    .querySelectorAll('[aria-describedby="wb-field-error"]')
    .forEach((node) => node.removeAttribute("aria-describedby"));
  if (error && invalidEditor) {
    const note = document.createElement("small");
    note.className = "wb-field-error";
    note.id = "wb-field-error";
    note.textContent = error;
    invalidEditor.after(note);
    invalidEditor.setAttribute("aria-describedby", note.id);
  }
  root.querySelectorAll<HTMLElement>(".wb-feedback").forEach((node) => {
    node.textContent = error || message;
    node.classList.toggle("wb-error", Boolean(error));
  });
  root.querySelectorAll(".wb-save-state").forEach((node) => {
    node.setAttribute("data-state", dirty ? "dirty" : "saved");
    node.textContent = dirty
      ? "Unsaved changes"
      : revision
        ? "Saved locally"
        : "Released settings";
  });
  root.querySelectorAll<HTMLElement>(".wb-pending").forEach((node) => {
    node.hidden = !pendingNavigation;
  });
}
function switchWorkspace(next: string) {
  workspace = next;
  if (next === "tune" && scenario.difficultyCandidate) {
    delete scenario.difficultyCandidate;
    root.querySelector<HTMLSelectElement>("#difficulty-candidate")!.value = "";
    message =
      "Tune uses your current draft. Alternate recipes remain available in Test setup.";
    updatePreview();
  }
  root.querySelectorAll<HTMLElement>("[data-panel]").forEach((node) => {
    node.hidden = node.dataset.panel !== next;
  });
  root
    .querySelectorAll<HTMLElement>('[role="tab"][data-workspace]')
    .forEach((node) => {
      node.setAttribute(
        "aria-selected",
        String(node.dataset.workspace === next),
      );
    });
}
function navigate(action: () => void) {
  if (dirty) {
    pendingNavigation = action;
    error = "Save or discard your changes before switching.";
    feedback();
    return;
  }
  action();
}

let scenario: Scenario = {
  id: uid("scenario"),
  levelId,
  mode: "encounter",
  progression: "first-arrival",
  difficulty: "normal",
  seed: 42,
};
const numberInput = (key: string, label: string, value: number, step = "1") =>
  `<label>${esc(label)}<input data-field="${key}" type="number" value="${value}" step="${step}" min="0" ></label>`;
function currentLevel() {
  return content.levels.find((level) => level.id === levelId)!;
}
function currentWave() {
  return currentLevel().waves.find((wave) => wave.id === waveId)!;
}
function difference(
  before: unknown,
  after: unknown,
  prefix = "",
): { field: string; before: unknown; after: unknown }[] {
  if (json(before) === json(after)) return [];
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    return [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].flatMap((key) =>
      difference(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        prefix ? `${prefix}.${key}` : key,
      ),
    );
  }
  return [{ field: prefix, before, after }];
}
function mapPreview() {
  const level = inspectScenario(content, scenario).configuration.level;
  const size = 22;
  const path = level.path
    .map((point) => `${(point.x + 1) * size},${(point.z + 1) * size}`)
    .join(" ");
  return `<svg class="wb-map" role="img" aria-label="${esc(level.name)} map and route" viewBox="0 0 ${(level.width + 2) * size} ${(level.depth + 2) * size}">${Array.from({ length: level.depth }, (_, z) => Array.from({ length: level.width }, (_, x) => `<rect x="${(x + 1) * size - 8}" y="${(z + 1) * size - 8}" width="16" height="16" rx="2" fill="#2d4130"/>`).join("")).join("")}<polyline points="${path}" fill="none" stroke="#b49c6d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>${level.blocked.map((point) => `<circle cx="${(point.x + 1) * size}" cy="${(point.z + 1) * size}" r="7" fill="#5e6955"/>`).join("")}<text x="${(level.path[0].x + 1) * size + 5}" y="${(level.path[0].z + 1) * size - 10}" fill="#e5bf72" font-size="9">Arrival</text></svg>`;
}
function timeline() {
  const configuration = inspectScenario(content, scenario).configuration;
  const wave = configuration.level.waves.find((entry) => entry.id === waveId)!;
  const schedule = compileSpawnSchedule(
    wave,
    configuration.rules.initialSpawnDelay,
  );
  const last = schedule.at(-1)?.at ?? 0;
  const colors = {
    raider: "#e7bd75",
    runner: "#91bcb4",
    armored: "#afb5c1",
    boss: "#e98f6a",
  };
  const kinds = (["raider", "runner", "armored", "boss"] as const).filter(
    (kind) => schedule.some((spawn) => spawn.kind === kind),
  );
  const total = kinds
    .map(
      (kind) =>
        `${schedule.filter((spawn) => spawn.kind === kind).length} ${configuration.enemies[kind].name}`,
    )
    .filter((_, i) => schedule.some((spawn) => spawn.kind === kinds[i]))
    .join(" · ");
  const rows = schedule
    .map((spawn) => {
      const guard = spawn.shieldCycle
        ? `Guard ${spawn.shieldCycle.downSeconds}s after appearance, ${spawn.shieldCycle.upSeconds}s up / ${spawn.shieldCycle.downSeconds}s down`
        : spawn.kind === "raider"
          ? "Default guard: first at 1.1s, 2s up / 3s down"
          : "";
      const evade = spawn.evasionCycle
        ? `Evade ${spawn.evasionCycle.downSeconds}s after appearance, ${spawn.evasionCycle.upSeconds}s active (warning 0.6s before)`
        : "";
      return `<tr><td>${esc(spawn.groupId)} #${spawn.ordinal + 1}</td><td>${esc(configuration.enemies[spawn.kind].name)}</td><td>${spawn.at.toFixed(3)}s</td><td>${spawn.tick} · ${(spawn.tick / 30).toFixed(3)}s</td><td>${esc(guard || evade || (spawn.kind === "boss" ? `Rally after ${configuration.rules.boss.firstRallySeconds}s, every ${configuration.rules.boss.rallyIntervalSeconds}s` : "—"))}</td></tr>`;
    })
    .join("");
  return `<p>${schedule.length} enemies · ${esc(total)}<br>Last scheduled spawn: <strong>${last.toFixed(2)}s</strong>. Clearing depends on combat and travel.</p><div class="wb-timeline-scroll"><svg class="wb-timeline" role="img" aria-label="Enemy spawn timeline, individual appearances by kind" viewBox="0 0 440 ${Math.max(90, kinds.length * 30 + 50)}">${kinds.map((kind, row) => `<text x="8" y="${28 + row * 30}" fill="${colors[kind]}" font-size="12">${esc(configuration.enemies[kind].name)}</text><line x1="120" y1="${24 + row * 30}" x2="420" y2="${24 + row * 30}" stroke="#394f3b"/>`).join("")}${schedule.map((spawn) => `<circle cx="${120 + (spawn.at / Math.max(1, last)) * 300}" cy="${24 + kinds.indexOf(spawn.kind) * 30}" r="3" fill="${colors[spawn.kind]}"><title>${esc(spawn.groupId)} · ${spawn.at.toFixed(3)}s nominal · tick ${spawn.tick}</title></circle>`).join("")}<text x="120" y="${kinds.length * 30 + 24}" fill="#b9c6b8" font-size="12">0s</text><text x="420" text-anchor="end" y="${kinds.length * 30 + 24}" fill="#b9c6b8" font-size="12">${last.toFixed(1)}s</text></svg></div><details><summary>Individual spawn and ability windows</summary><div class="wb-scroll"><table class="wb-table"><thead><tr><th>Packet / enemy</th><th>Kind</th><th>Nominal</th><th>Fixed tick / appearance</th><th>Spawn-relative ability</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
function packetControls() {
  const numeric = (
    path: string,
    label: string,
    value: number | undefined,
    fallback?: number,
  ) =>
    `<label>${esc(label)}<input type="number" data-packet-field="${path}" data-original="${value ?? ""}" value="${value ?? ""}" placeholder="${fallback === undefined ? "Default" : `Default ${fallback}`}" step="any"></label>`;
  return currentWave()
    .packets.map(
      (packet, p) =>
        `<div class="wb-packet">${packet.groups
          .map((group, g) => {
            const base = `packets.${p}.groups.${g}`;
            return `<div class="wb-group"><h3>${esc(content.enemies[group.kind].name)}</h3><div class="wb-params wb-common">${numeric(`${base}.count`, "Number of enemies", group.count)}${numeric(`${base}.gap`, "Time between enemies (s)", group.gap)}</div><details><summary>More timing options</summary><div class="wb-params">${numeric(`${base}.batchSize`, "Enemies per batch", group.batchSize, 1)}${numeric(`${base}.batchStagger`, "Time within a batch (s)", group.batchStagger, 0)}${numeric(`${base}.delayBefore`, "Wait before group (s)", group.delayBefore, 0)}${numeric(`${base}.movementScale`, "Movement multiplier", group.movementScale, 1)}${group.kind === "raider" ? numeric(`${base}.shieldCycle.upSeconds`, "Guard up (s)", group.shieldCycle?.upSeconds, 2) + numeric(`${base}.shieldCycle.downSeconds`, "Guard down / first delay (s)", group.shieldCycle?.downSeconds, 3) : ""}${group.kind === "runner" ? numeric(`${base}.evasionCycle.upSeconds`, "Evade active (s)", group.evasionCycle?.upSeconds) + numeric(`${base}.evasionCycle.downSeconds`, "Evade down (s)", group.evasionCycle?.downSeconds) : ""}</div><p class="wb-muted">Applies to this enemy group. Blank optional values use defaults. A default Rat first guards at 1.1s; custom cycles need both values.</p></details></div>`;
          })
          .join(
            "",
          )}<details><summary>Repeat this sequence</summary><div class="wb-params">${numeric(`packets.${p}.repeat`, "Repetitions", packet.repeat, 1)}${numeric(`packets.${p}.repeatDelayBefore`, "Wait before repeat (s)", packet.repeatDelayBefore, 0)}</div></details></div>`,
    )
    .join("");
}
function effectiveInspector() {
  const resolved = inspectScenario(content, scenario);
  const configuration = resolved.configuration;
  const baseline = resolveConfiguration(CANONICAL_CONTENT, levelId);
  const flattened = (value: unknown, path = ""): [string, unknown][] =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value).flatMap(([key, item]) =>
          flattened(item, path ? `${path}.${key}` : key),
        )
      : [[path, value]];
  const current = flattened({
    startCoins:
      configuration.level.startCoins +
      (resolved.assist ? configuration.rules.assistCrowns : 0),
    lives: resolved.initialLives,
    availableTowers: configuration.level.availableTowers,
    unlockedUpgrades: resolved.unlockedUpgrades,
    card: resolved.card,
    healthScale: configuration.level.healthScale ?? 1,
    enemyRewardScale: configuration.level.enemyRewardScale ?? 1,
    towers: configuration.towers,
    enemies: configuration.enemies,
    rules: configuration.rules,
  });
  const defaults = new Map(
    flattened({
      startCoins: baseline.level.startCoins,
      lives: baseline.rules.normalLives,
      availableTowers: baseline.level.availableTowers,
      unlockedUpgrades: [],
      card: "none",
      healthScale: baseline.level.healthScale ?? 1,
      enemyRewardScale: baseline.level.enemyRewardScale ?? 1,
      towers: baseline.towers,
      enemies: baseline.enemies,
      rules: baseline.rules,
    }),
  );
  const origin = (field: string) => {
    const overrides = scenario.overrides;
    if (
      (field === "startCoins" && overrides?.coins !== undefined) ||
      (field === "lives" && overrides?.lives !== undefined) ||
      (field === "availableTowers" && overrides?.towers) ||
      (field === "unlockedUpgrades" && overrides?.upgrades) ||
      (field === "card" && overrides?.card)
    )
      return "Explicit scenario override";
    if (["availableTowers", "unlockedUpgrades", "card"].includes(field))
      return `Progression: ${scenario.progression}`;
    if (
      ["startCoins", "lives"].includes(field) &&
      scenario.difficulty === "assist"
    )
      return "Assist baseline";
    return scenario.difficultyCandidate
      ? `Named difficulty recipe: ${scenario.difficultyCandidate.id}`
      : revision
        ? `Editor revision: ${revision.id}`
        : "Released recipe";
  };
  return `<div class="wb-scroll"><table class="wb-table"><thead><tr><th>Setting</th><th>Effective attempt value</th><th>Released baseline</th><th>Scope / origin</th></tr></thead><tbody>${current.map(([field, value]) => `<tr><td>${esc(field)}</td><td class="${json(value) === json(defaults.get(field)) ? "" : "changed"}">${esc(value)}</td><td>${esc(defaults.get(field))}</td><td>${field.startsWith("rules") ? "Gameplay rule" : field.startsWith("towers") || field.startsWith("enemies") ? "Global catalog" : "Encounter"} · ${esc(origin(field))}</td></tr>`).join("")}</tbody></table></div>`;
}
function attemptSummary() {
  const resolved = inspectScenario(content, scenario);
  const config = resolved.configuration;
  const crowns =
    config.level.startCoins + (resolved.assist ? config.rules.assistCrowns : 0);
  return `Effective attempt: ${crowns} starting crowns · ${resolved.initialLives} hearts · defenders ${esc((config.level.availableTowers ?? ["bolt", "stone", "net"]).map((kind) => config.towers[kind].name).join(", "))} · upgrade permissions ${esc(resolved.unlockedUpgrades.join(", ") || "none")} · advantage ${esc(resolved.card)}.`;
}
function playSetupSummary() {
  const resolved = inspectScenario(content, scenario);
  const scope =
    scenario.mode === "wave" ? "Selected wave only" : "Starts at wave 1";
  const custom =
    Object.keys(scenario.overrides ?? {}).length > 0 ||
    (scenario.formation?.length ?? 0) > 0;
  const crowns =
    resolved.configuration.level.startCoins +
    (resolved.assist ? resolved.configuration.rules.assistCrowns : 0);
  return `${scope} · ${scenario.difficulty === "assist" ? "Assist" : "Normal"} · ${scenario.progression === "replay" ? "Earned tools" : "First-arrival tools"}${custom ? ` · Custom setup: ${crowns} crowns before purchases, ${resolved.initialLives} hearts${scenario.formation?.length ? ", starting defenders" : ""}` : ""}`;
}
function previewOrigin() {
  return esc(
    scenario.difficultyCandidate
      ? `named difficulty recipe ${scenario.difficultyCandidate.id}`
      : revision
        ? `Local draft: ${revision.name}`
        : "Released settings",
  );
}
function resultSummary() {
  if (!lastReport)
    return `<div class="wb-result"><h3>Ready for a first try</h3><p>Play this draft to record what happened.</p></div>`;
  const isCurrent =
    lastAttemptContent &&
    configurationIdentity(lastAttemptContent) ===
      configurationIdentity(content) &&
    json(lastReport.scenario) === json(scenario) &&
    !dirty;
  return `<div class="wb-result"><p>${esc(evidenceSummary)}</p><p class="wb-kicker">LAST PLAYTEST · ${isCurrent ? "CURRENT SAVED SETTINGS" : "EARLIER SETTINGS"}</p><h3>${lastReport.success ? "Target reached" : lastReport.phase === "lost" ? "Lost" : "Stopped before target"}</h3><div class="wb-metrics"><span><strong>${lastReport.lives}</strong> hearts left</span><span><strong>${lastReport.initialLives - lastReport.lives}</strong> hearts lost</span><span><strong>${lastReport.coins}</strong> crowns</span><span><strong>${lastReport.seconds.toFixed(1)}s</strong> played</span></div><p class="wb-muted">${esc(lastAttemptRevision?.name ?? "Released settings")} · ${esc(content.levels.find((level) => level.id === lastReport?.scenario.levelId)?.name ?? lastReport.scenario.levelId)}</p><details><summary>Full test evidence</summary><pre class="wb-code">${esc(json(lastEvidence ?? lastReport))}</pre></details></div>`;
}
function render() {
  const selection = `${levelId}:${waveId}`;
  const openSections = new Map<string, boolean>();
  const occurrences = new Map<string, number>();
  if (renderedSelection === selection) {
    for (const detail of root.querySelectorAll<HTMLDetailsElement>("details")) {
      const label = detail.querySelector(":scope > summary")?.textContent ?? "";
      const ordinal = occurrences.get(label) ?? 0;
      occurrences.set(label, ordinal + 1);
      openSections.set(`${label}:${ordinal}`, detail.open);
    }
  }
  renderedSelection = selection;
  const level = currentLevel();
  const wave = currentWave();
  const changes = difference(CANONICAL_CONTENT, content);
  const bundle = store.bundle;
  root.innerHTML = `<div class="wb-shell"><header class="wb-header"><div><p class="wb-kicker">STORMWATCH · V2</p><h1>Designer workbench</h1></div><div class="wb-status">Local drafts · game progress kept separate<br>${store.status.durable ? "Saved in this browser" : esc(store.status.error ?? "In memory only; export to preserve")}</div></header><div class="wb-tabs" role="tablist" aria-label="Workbench workspace">${[
    ["tune", "Tune"],
    ["test", "Test"],
    ["experiments", "Experiments"],
  ]
    .map(
      ([id, name]) =>
        `<button role="tab" data-workspace="${id}" aria-selected="${workspace === id}">${name}</button>`,
    )
    .join(
      "",
    )}</div><div class="wb-layout"><nav class="wb-register" aria-label="Encounter and wave"><h2>Choose a wave</h2>${content.levels.map((entry, index) => `<details ${entry.id === levelId ? "open" : ""}><summary>${index + 1}. ${esc(entry.name)}</summary>${entry.waves.map((entryWave, waveIndex) => `<button data-select-level="${esc(entry.id)}" data-select-wave="${esc(entryWave.id)}" aria-current="${entry.id === levelId && entryWave.id === waveId}">${waveIndex + 1}. ${esc(entryWave.title)}</button>`).join("")}</details>`).join("")}</nav><main class="wb-content"><div class="wb-context"><div><p class="wb-kicker">${esc(level.name)}</p><h2>${esc(wave.title)}</h2></div><span class="wb-badge wb-save-state">${dirty ? "Unsaved changes" : revision ? "Saved locally" : "Released settings"}</span></div><div class="wb-pending" ${pendingNavigation ? "" : "hidden"}><p>Keep your changes before switching?</p><button data-action="save-switch">Save &amp; continue</button><button data-action="discard-switch">Discard &amp; continue</button><button data-action="cancel-switch">Keep editing</button></div><section data-panel="tune" ${workspace === "tune" ? "" : "hidden"}><div class="wb-mobile-actions"><button class="primary" data-action="play">Save &amp; play</button></div><div class="wb-intro"><h2>Make the next wave feel right.</h2><p>Choose a wave, adjust a setting, then play it. Your changes stay in a local draft.</p></div><div class="wb-edit-layout"><div class="wb-editor"><h2>Tune this wave</h2><div class="wb-row">${numberInput("startCoins", "Encounter starting crowns", level.startCoins)}${numberInput("reward", "Wave-end crowns", wave.reward)}</div>${packetControls()}<p id="tune-setup" class="wb-setup">${esc(playSetupSummary())} · <button data-workspace="test">Test setup</button></p><div class="wb-actions"><button class="primary" data-action="play">Save &amp; play</button><button data-action="apply">Save draft</button></div><div class="wb-feedback" role="status">${esc(error || message)}</div><details><summary>Encounter modifiers &amp; design notes</summary><div class="wb-row">${numberInput("healthScale", "Encounter health multiplier", level.healthScale ?? 1, "0.05")}${numberInput("enemyRewardScale", "Enemy reward multiplier", level.enemyRewardScale ?? 1, "0.05")}</div><label>Intended lesson<input id="lesson" value="${esc(wave.lesson ?? "")}"></label><label>Intended outcome<input id="target-outcome" value="${esc(wave.targetOutcome ?? "")}"></label></details><details><summary>Advanced wave recipe</summary><label>Selected wave packets · preserve IDs and order<textarea id="packet-editor" class="wb-recipe">${esc(json(wave.packets))}</textarea></label></details><details><summary>Supported catalog and gameplay parameters · explicit global authored scope</summary><p>Changes here propose canonical catalog/rule edits. Scenario resources and formations below are separate experiments.</p><label>Defender catalog<textarea id="tower-editor" >${esc(json(content.towers))}</textarea></label><label>Enemy catalog<textarea id="enemy-editor" >${esc(json(content.enemies))}</textarea></label><label>Implemented gameplay rules<textarea id="rule-editor" >${esc(json(content.rules))}</textarea></label></details><details><summary>Effective settings and released defaults</summary><div id="attempt-effective">${effectiveInspector()}</div></details><details><summary>Review changed authored values (${changes.length})</summary><ul>${changes.map((change) => `<li><strong>${esc(change.field)}</strong>: ${esc(typeof change.before === "object" ? "Previous structure" : change.before)} → ${esc(typeof change.after === "object" ? "Updated structure" : change.after)}</li>`).join("") || "<li>No saved changes yet.</li>"}</ul><details><summary>Technical diff</summary><pre class="wb-code">${esc(json(changes))}</pre></details></details></div><aside class="wb-preview"><p class="wb-kicker">LIVE PREVIEW</p><h2>How this wave arrives</h2><div id="attempt-timeline">${timeline()}</div><details><summary>Trail map</summary><div id="attempt-map">${mapPreview()}</div><p>${esc(level.description)}</p></details><p class="wb-muted">Preview: <span id="preview-origin">${previewOrigin()}</span></p><div id="tune-result">${resultSummary()}</div></aside></div></section><section class="wb-card" data-panel="test" ${workspace === "test" ? "" : "hidden"}><h2>Try your changes</h2><div id="scenario-inspection">${inspectedScenario ? `<details open><summary>Resolved test setup</summary><pre class="wb-code">${esc(json(inspectedScenario))}</pre></details>` : ""}</div><p>Play the current draft with normal difficulty and first-arrival tools, or customize the setup below.</p><p class="wb-muted" id="attempt-summary">${attemptSummary()}</p><details><summary>Customize test setup</summary><div class="wb-row"><label>Attempt scope<select id="mode"><option value="encounter" ${scenario.mode === "encounter" ? "selected" : ""}>Full encounter · reachable setup</option><option value="wave" ${scenario.mode === "wave" ? "selected" : ""}>Selected wave · synthetic setup</option></select></label><label>Discovery capabilities<select id="progression"><option value="first-arrival" ${scenario.progression === "first-arrival" ? "selected" : ""}>First arrival · prior discoveries</option><option value="replay" ${scenario.progression === "replay" ? "selected" : ""}>Replay · all earned tools</option></select></label><label>Difficulty baseline<select id="difficulty"><option value="normal" ${scenario.difficulty === "normal" ? "selected" : ""}>Normal</option><option value="assist" ${scenario.difficulty === "assist" ? "selected" : ""}>Assist · existing extra crowns/hearts</option></select></label><label>Named design-only difficulty recipe<select id="difficulty-candidate"><option value="">Current authored revision</option>${bundle.revisions.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === scenario.difficultyCandidate?.id ? "selected" : ""}>${esc(entry.name)}</option>`).join("")}</select></label><label>Seed<input id="seed" type="number" value="${scenario.seed}" step="1"></label></div><p>Named draft recipes are design-only difficulty candidates. Difficulty changes never grant discoveries. A selected-wave wallet or formation does not establish affordability through earlier waves.</p><div class="wb-grid"><label>Explicit overrides · towers, upgrades, card, coins, lives<textarea id="scenario-overrides">${esc(json(scenario.overrides ?? {}))}</textarea></label><label>Starting formation · legal purchases from declared wallet<textarea id="formation">${esc(json(scenario.formation ?? []))}</textarea></label></div></details><div class="wb-row"><button class="primary" data-action="play">Save &amp; play</button></div><div class="wb-feedback" role="status">${esc(error || message)}</div><div id="test-result">${resultSummary()}</div><details><summary>Automated tests &amp; comparisons</summary><p>Policies use legal commands. Results disclose cadence, spending assumptions and limits. Success is completion of the selected target; an unsuccessful bounded search does not prove impossibility.</p><div class="wb-row"><label>Policy<select id="policy"><option value="coverage-first" ${runControls.policy === "coverage-first" ? "selected" : ""}>Coverage spending</option><option value="upgrades-first" ${runControls.policy === "upgrades-first" ? "selected" : ""}>Upgrades first</option><option value="finale-mixed" ${runControls.policy === "finale-mixed" ? "selected" : ""}>Mixed control</option></select></label><label>Goal<select id="goal"><option value="encounter-win" ${runControls.goal === "encounter-win" ? "selected" : ""}>Win encounter</option><option value="wave-clear" ${runControls.goal === "wave-clear" ? "selected" : ""}>Clear selected wave</option></select></label><label>No lives lost<input id="no-loss" type="checkbox" ${runControls.noLoss ? "checked" : ""}></label><label>Decision cadence (ticks)<input id="cadence" type="number" value="${runControls.cadence}" min="1"></label><label>Simulated limit (s)<input id="time-limit" type="number" value="${runControls.limit}" min="1"></label><label>Search budget (plans)<input id="budget" type="number" value="${runControls.budget}" min="1" max="64"></label></div><div class="wb-row"><button data-action="run">Run policy</button><button data-action="compare">Compare released / draft with matched policy</button><button data-action="search">Bounded goal search</button></div></details></section><section class="wb-card" data-panel="experiments" ${workspace === "experiments" ? "" : "hidden"}><h2>Your experiments</h2><p>Save a name, revisit an earlier version, or move experiments between browsers.</p><div class="wb-row"><label>Draft name<input id="draft-name" value="${esc(revision?.name ?? `${level.name} rhythm candidate`)}"></label><button class="primary" data-action="fork">Save named draft</button><label>Saved revision<select id="saved-revision"><option value="">Choose revision</option>${bundle.revisions.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === revision?.id ? "selected" : ""}>${esc(entry.name)} · version ${bundle.revisions.indexOf(entry) + 1}</option>`).join("")}</select></label><button data-action="baseline">Released baseline</button></div><p class="wb-muted">${changes.length} changed authored paths · ${esc(revision?.name ?? "Working from released settings")}</p><details><summary>Saved test setups &amp; evidence</summary><div class="wb-row"><button data-action="save-scenario">Save scenario</button><button data-action="inspect-scenario">Inspect resolved scenario</button><label>Saved command trace<select id="saved-trace"><option value="">Choose trace</option>${bundle.traces.map((entry) => `<option value="${esc(entry.id)}">Recording ${bundle.traces.indexOf(entry) + 1} · ${esc(content.levels.find((level) => level.id === entry.levelId)?.name ?? entry.levelId)}</option>`).join("")}</select></label><label>Saved result<select id="saved-result"><option value="">Choose result</option>${bundle.results.map((entry) => `<option value="${esc(entry.id)}">Playtest ${bundle.results.indexOf(entry) + 1} · ${esc(content.levels.find((level) => level.id === entry.levelId)?.name ?? entry.levelId)}</option>`).join("")}</select></label><button data-action="replay" ${replayTrace ? "" : "disabled"}>Replay last commands</button><label>Saved scenario<select id="saved-scenario"><option value="">Choose scenario</option>${bundle.scenarios.map((entry) => `<option value="${esc(entry.id)}">Setup ${bundle.scenarios.indexOf(entry) + 1} · ${esc(content.levels.find((level) => level.id === entry.levelId)?.name ?? entry.levelId)}</option>`).join("")}</select></label></div></details><details><summary>Export, import &amp; promotion</summary><p>Browser saving preserves experiments. Export transfers them. Promotion previews a scoped canonical diff and rejects a stale released baseline. It never commits, publishes or turns a synthetic formation into production content.</p><div class="wb-row"><button data-action="export">Export experiments</button><label>Import validated experiments<input id="import-file" type="file" accept="application/json,.json"></label><button data-action="promotion" >Review promotion instructions</button></div><p class="wb-muted">Local command: <code>npm run workbench:promote -- experiments.json REVISION selection.json</code>. Preview first; apply only after reviewing the selected authored scope.</p></details><div class="wb-feedback" role="status">${esc(error || message)}</div></section></main></div></div>`;
  occurrences.clear();
  for (const detail of root.querySelectorAll<HTMLDetailsElement>("details")) {
    const label = detail.querySelector(":scope > summary")?.textContent ?? "";
    const ordinal = occurrences.get(label) ?? 0;
    occurrences.set(label, ordinal + 1);
    const saved = openSections.get(`${label}:${ordinal}`);
    if (saved !== undefined) detail.open = saved;
  }
  root.onclick = onClick;
  root.onkeydown = (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      '[role="tab"][data-workspace]',
    );
    if (
      !button ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const tabs = [
      ...root.querySelectorAll<HTMLElement>('[role="tab"][data-workspace]'),
    ];
    const current = tabs.indexOf(button);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
            tabs.length;
    event.preventDefault();
    switchWorkspace(tabs[index].dataset.workspace!);
    tabs[index].focus();
  };
  root.oninput = (event) => {
    const field = event.target as HTMLInputElement;
    if (
      field.matches(
        "[data-field], [data-packet-field], #packet-editor, #tower-editor, #enemy-editor, #rule-editor, #lesson, #target-outcome, #draft-name, #scenario-overrides, #formation, #seed",
      )
    ) {
      dirty = true;
      updatePreview();
    }
  };
  root.querySelector<HTMLSelectElement>("#saved-revision")!.onchange = (
    event,
  ) => {
    const id = (event.target as HTMLSelectElement).value;
    const saved = store.bundle.revisions.find((entry) => entry.id === id);
    if (saved) {
      (event.target as HTMLSelectElement).value = revision?.id ?? "";
      navigate(() => {
        revision = saved;
        content = clone(saved.content);
        ensureSelection();
        render();
      });
    }
  };
  for (const id of [
    "difficulty-candidate",
    "difficulty",
    "mode",
    "progression",
  ])
    root.querySelector<HTMLSelectElement>(`#${id}`)!.onchange = () => {
      try {
        scenario = readScenario();
        error = "";
        message =
          "Effective attempt preview refreshed; editor revision retained.";
        root.querySelector("#attempt-timeline")!.innerHTML = timeline();
        root.querySelector("#attempt-map")!.innerHTML = mapPreview();
        root.querySelector("#attempt-effective")!.innerHTML =
          effectiveInspector();
        root.querySelector("#attempt-summary")!.innerHTML = attemptSummary();
        root.querySelector("#preview-origin")!.innerHTML = previewOrigin();
        updatePreview();
      } catch (cause) {
        error = String(cause);
        const select = root.querySelector<HTMLSelectElement>(`#${id}`)!;
        select.value =
          id === "difficulty-candidate"
            ? (scenario.difficultyCandidate?.id ?? "")
            : scenario[id as "difficulty" | "mode" | "progression"];
      }
      feedback();
    };
  root.querySelector<HTMLSelectElement>("#saved-scenario")!.onchange = (
    event,
  ) => {
    const saved = store.bundle.scenarios.find(
      (entry) => entry.id === (event.target as HTMLSelectElement).value,
    );
    if (saved) {
      navigate(() => {
        const savedRevision = store.bundle.revisions.find(
          (entry) => entry.id === saved.revisionId,
        )!;
        revision = savedRevision;
        content = clone(savedRevision.content);
        scenario = clone(saved.scenario as Scenario);
        levelId = scenario.levelId;
        waveId =
          scenario.waveId ??
          content.levels.find((entry) => entry.id === levelId)!.waves[0].id;
        render();
      });
    }
  };
  const restoreEvidence = (
    record: import("./drafts").ExperimentRecord,
    report?: RunReport,
  ) => {
    const savedRevision = store.bundle.revisions.find(
      (entry) => entry.id === record.revisionId,
    )!;
    const setup =
      report?.scenario ??
      (record.scenario as Scenario) ??
      (store.bundle.scenarios.find((entry) => entry.id === record.scenarioId)
        ?.scenario as Scenario);
    revision = savedRevision;
    content = clone(savedRevision.content);
    scenario = clone(setup);
    levelId = scenario.levelId;
    waveId = scenario.waveId ?? currentLevel().waves[0].id;
    replayTrace = clone(
      report?.trace ??
        (record.commands as import("./commands").RecordedCommand[]),
    );
    lastAttemptContent = clone(content);
    lastAttemptScenario = clone(scenario);
    lastAttemptRevision = revision;
    lastReport = report;
    message =
      "Saved evidence selected. Replay starts a fresh attempt with the recorded configuration.";
    render();
  };
  root.querySelector<HTMLSelectElement>("#saved-trace")!.onchange = (event) => {
    const record = store.bundle.traces.find(
      (entry) => entry.id === (event.target as HTMLSelectElement).value,
    );
    if (record) navigate(() => restoreEvidence(record));
  };
  root.querySelector<HTMLSelectElement>("#saved-result")!.onchange = (
    event,
  ) => {
    const record = store.bundle.results.find(
      (entry) => entry.id === (event.target as HTMLSelectElement).value,
    );
    if (record)
      navigate(() => restoreEvidence(record, record.report as RunReport));
  };
  root.querySelector<HTMLInputElement>("#import-file")!.onchange = async (
    event,
  ) => {
    try {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const imported = importExperiments(await file.text());
      navigate(() => {
        store.replace(imported);
        render();
      });
      message =
        "Validated experiments imported. Select a saved revision or scenario.";
      error = "";
    } catch (cause) {
      error = String(cause);
    }
    feedback();
  };
}
function ensureSelection() {
  if (!content.levels.some((level) => level.id === levelId))
    levelId = content.levels[0].id;
  if (!currentLevel().waves.some((wave) => wave.id === waveId))
    waveId = currentLevel().waves[0].id;
}
function readScenario(): Scenario {
  const value = (id: string) =>
    root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!.value;
  const mode = value("mode") as Scenario["mode"];
  const next = {
    id: scenario.id,
    levelId,
    mode,
    progression: value("progression") as Scenario["progression"],
    difficulty: value("difficulty") as Scenario["difficulty"],
    seed: Number(value("seed")),
    overrides: JSON.parse(value("scenario-overrides")),
    formation: JSON.parse(value("formation")),
    ...(mode === "wave" ? { waveId } : {}),
  };
  const candidate = store.bundle.revisions.find(
    (entry) => entry.id === value("difficulty-candidate"),
  );
  if (candidate)
    Object.assign(next, {
      difficultyCandidate: {
        id: candidate.id,
        content: clone(candidate.content),
      },
    });
  if (!Object.keys(next.overrides).length)
    delete (next as { overrides?: unknown }).overrides;
  inspectScenario(content, next);
  return next;
}
function saveRevision(nextContent: AuthoringContent, name: string) {
  validateContent(nextContent);
  const next: DraftRevision = revision
    ? { ...revision, id: uid("revision"), name, content: clone(nextContent) }
    : forkDraft(CANONICAL_CONTENT, uid("revision"), name);
  if (!revision) next.content = clone(nextContent);
  const bundle = store.bundle;
  bundle.revisions.push(next);
  store.replace(bundle);
  revision = next;
  content = clone(next.content);
}
function preserveScenario() {
  if (!revision) saveRevision(content, "Released baseline experiment");
  const bundle = store.bundle;
  const record = {
    id: uid("scenario"),
    revisionId: revision!.id,
    levelId,
    ...(scenario.waveId ? { waveId: scenario.waveId } : {}),
    scenario: clone(scenario),
  };
  bundle.scenarios.push(record);
  store.replace(bundle);
  return record;
}
function saveReport(
  report: RunReport,
  session?: AttemptSession,
  evidence?: unknown,
) {
  const record = preserveScenario();
  const bundle = store.bundle;
  bundle.results.push({
    ...record,
    id: uid("result"),
    scenarioId: record.id,
    report,
    ...(evidence ? { evidence } : {}),
  });
  if (session)
    bundle.traces.push({
      ...record,
      id: uid("trace"),
      scenarioId: record.id,
      commands: clone(session.trace),
    });
  store.replace(bundle);
  lastReport = report;
  message = "Playtest saved. Adjust your draft and try again.";
  lastEvidence = undefined;
  evidenceSummary = "";
  replayTrace = clone(report.trace);
  lastAttemptContent = clone(content);
  lastAttemptScenario = clone(report.scenario);
  lastAttemptRevision = revision;
}
function launch(replay = false) {
  if (replay && lastAttemptContent && lastAttemptScenario) {
    content = clone(lastAttemptContent);
    scenario = clone(lastAttemptScenario);
    revision = lastAttemptRevision;
    levelId = scenario.levelId;
    ensureSelection();
  } else scenario = readScenario();
  const commandsToReplay = replay ? replayTrace : undefined;
  const session = new AttemptSession(content, scenario);
  if (commandsToReplay)
    session.replay(commandsToReplay, { stopAtPreparationWaveId: waveId });
  lastAttemptContent = clone(content);
  lastAttemptScenario = clone(scenario);
  lastAttemptRevision = revision;
  root.hidden = true;
  attemptHost.hidden = false;
  const close = () => {
    disposeAttempt?.();
    disposeAttempt = undefined;
    attemptHost.hidden = true;
    root.hidden = false;
    render();
  };
  disposeAttempt = mountAttempt(attemptHost, session.game, {
    label: `${revision?.name ?? "Released"} · ${session.synthetic ? (scenario.mode === "wave" ? "Synthetic isolated wave" : "Full encounter · overridden setup") : "Full encounter"} · ${scenario.progression}`,
    command: (command) => session.command(command),
    isReplayLocked: () => session.replayLocked,
    isPreparationHeld: () => session.preparationHeld,
    ...(replay ? { onContinueReplay: () => session.continueReplay() } : {}),
    step: () => session.step(),
    onExit: () => {
      saveReport(
        session.report(
          scenario.mode === "wave"
            ? { type: "wave-clear", waveId: scenario.waveId }
            : { type: "encounter-win" },
        ),
        session,
      );
      close();
    },
    onRestart: () => {
      disposeAttempt?.();
      attemptHost.hidden = true;
      root.hidden = false;
      render();
      launch();
    },
    onFinish: () => {
      saveReport(
        session.report(
          scenario.mode === "wave"
            ? { type: "wave-clear", waveId: scenario.waveId }
            : { type: "encounter-win" },
        ),
        session,
      );
    },
    ...(replay
      ? {
          onBranch: () => {
            return session.branch();
          },
        }
      : {}),
  });
}
function focusInvalidEditor() {
  if (!invalidEditor) return;
  let parent = invalidEditor.parentElement;
  while (parent && parent !== root) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
    parent = parent.parentElement;
  }
  // A hidden Tune editor may be the cause of an action from another workspace.
  if (invalidEditor.closest('[data-panel="tune"]')) switchWorkspace("tune");
  invalidEditor.focus();
}
function editorJson(id: string, label: string) {
  try {
    return JSON.parse(root.querySelector<HTMLTextAreaElement>(`#${id}`)!.value);
  } catch {
    invalidEditor = root.querySelector<HTMLTextAreaElement>(`#${id}`)!;
    invalidEditor.setAttribute("aria-invalid", "true");
    throw new Error(
      `${label} contains invalid JSON. Correct it before saving; all your inputs are retained.`,
    );
  }
}
function collectEdits() {
  invalidEditor = undefined;
  root
    .querySelectorAll("[aria-invalid]")
    .forEach((node) => node.removeAttribute("aria-invalid"));
  const reject = (input: HTMLInputElement, message: string): never => {
    invalidEditor = input;
    input.setAttribute("aria-invalid", "true");
    throw new Error(message);
  };
  for (const input of root.querySelectorAll<HTMLInputElement>(
    "[data-field], [data-packet-field]",
  )) {
    const key = input.dataset.field ?? input.dataset.packetField ?? "";
    const required =
      Boolean(input.dataset.field) ||
      key.endsWith(".count") ||
      key.endsWith(".gap");
    if (input.value === "" && !required) continue;
    const value = Number(input.value);
    const label = input.parentElement?.firstChild?.textContent ?? "Value";
    if (input.value.trim() === "" || !Number.isFinite(value))
      reject(input, `${label} needs a number.`);
    if (key.endsWith(".count") && (!Number.isInteger(value) || value < 1))
      reject(input, "Number of enemies must be a whole number of at least 1.");
    if (
      ["startCoins", "reward"].includes(key) &&
      (!Number.isInteger(value) || value < 0)
    )
      reject(input, `${label} must be a whole number of at least 0.`);
    if (value < 0) reject(input, `${label} must be at least 0.`);
  }
  const next = clone(content);
  const level = next.levels.find((entry) => entry.id === levelId)!;
  const wave = level.waves.find((entry) => entry.id === waveId)!;
  for (const field of root.querySelectorAll<HTMLInputElement>("[data-field]")) {
    const key = field.dataset.field!;
    if (key === "reward") wave.reward = Number(field.value);
    else
      (level as unknown as Record<string, unknown>)[key] = Number(field.value);
  }
  const packetJson =
    root.querySelector<HTMLTextAreaElement>("#packet-editor")!.value;
  const packetJsonChanged = packetJson !== json(currentWave().packets);
  const packetFieldsChanged = [
    ...root.querySelectorAll<HTMLInputElement>("[data-packet-field]"),
  ].some((input) => input.value !== input.dataset.original);
  if (packetJsonChanged && packetFieldsChanged)
    throw new Error(
      "Wave recipe and wave controls both changed. Use one editor at a time: restore either the JSON or the changed controls before saving.",
    );
  wave.packets = editorJson("packet-editor", "Advanced wave recipe");
  for (const input of root.querySelectorAll<HTMLInputElement>(
    "[data-packet-field]",
  )) {
    if (input.value === input.dataset.original) continue;
    const parts = input.dataset.packetField!.split(".");
    let target: Record<string, unknown> = wave as unknown as Record<
      string,
      unknown
    >;
    for (const key of parts.slice(0, -1)) {
      if (target[key] === undefined) target[key] = {};
      if (!target[key] || typeof target[key] !== "object")
        throw new Error(
          `Packet field ${input.dataset.packetField} no longer exists; refresh the recipe.`,
        );
      target = target[key] as Record<string, unknown>;
    }
    const key = parts.at(-1)!;
    if (input.value === "") delete target[key];
    else target[key] = Number(input.value);
  }
  const lesson = root.querySelector<HTMLInputElement>("#lesson")!.value;
  const outcome =
    root.querySelector<HTMLInputElement>("#target-outcome")!.value;
  if (lesson) wave.lesson = lesson;
  else delete wave.lesson;
  if (outcome) wave.targetOutcome = outcome;
  else delete wave.targetOutcome;
  next.towers = editorJson("tower-editor", "Global defender catalog");
  next.enemies = editorJson("enemy-editor", "Global enemy catalog");
  next.rules = editorJson("rule-editor", "Global gameplay rules");
  validateContent(next);
  return next;
}
function commitEdits() {
  const next = collectEdits();
  const previous = content;
  try {
    content = next;
    scenario = readScenario();
  } finally {
    content = previous;
  }
  if (!revision || dirty || json(next) !== json(content)) {
    saveRevision(
      next,
      root.querySelector<HTMLInputElement>("#draft-name")!.value ||
        `${currentLevel().name} draft`,
    );
  }
  dirty = false;
  message = "Draft saved locally. Ready to play.";
  error = "";
  feedback();
}
function updatePreview() {
  const savedContent = content;
  const savedScenario = scenario;
  try {
    content = collectEdits();
    scenario = readScenario();
    root.querySelector("#attempt-timeline")!.innerHTML = timeline();
    root.querySelector("#attempt-map")!.innerHTML = mapPreview();
    root.querySelector("#attempt-effective")!.innerHTML = effectiveInspector();
    root.querySelector("#attempt-summary")!.innerHTML = attemptSummary();
    root.querySelector("#tune-setup")!.innerHTML =
      `${esc(playSetupSummary())} · <button data-workspace="test">Test setup</button>`;
    root.querySelector("#preview-origin")!.textContent =
      scenario.difficultyCandidate
        ? `Alternate test recipe: ${scenario.difficultyCandidate.id}. Tune edits are separate.`
        : dirty
          ? "Your current edits (not saved yet)"
          : (revision?.name ?? "Released settings");
    error = "";
    message = dirty
      ? "Unsaved changes. Save & play will test these settings."
      : message;
  } catch (cause) {
    error = `Preview paused: ${cause instanceof Error ? cause.message : String(cause)}. Your input is retained.`;
    root.querySelector("#preview-origin")!.textContent =
      "Last valid preview. Fix the highlighted input to update it.";
  } finally {
    content = savedContent;
    scenario = savedScenario;
  }
  feedback();
  for (const result of root.querySelectorAll("#tune-result, #test-result"))
    result.innerHTML = resultSummary();
}
async function onClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest<HTMLElement>("button");
  if (!target) return;
  if (target.dataset.workspace) {
    switchWorkspace(target.dataset.workspace);
    return;
  }
  if (target.dataset.action === "cancel-switch") {
    pendingNavigation = undefined;
    error = "";
    feedback();
    return;
  }
  if (
    target.dataset.action === "discard-switch" ||
    target.dataset.action === "save-switch"
  ) {
    try {
      if (target.dataset.action === "save-switch") commitEdits();
      dirty = false;
      const next = pendingNavigation;
      pendingNavigation = undefined;
      error = "";
      next?.();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      feedback();
      focusInvalidEditor();
    }
    return;
  }
  if (target.dataset.selectLevel) {
    navigate(() => {
      levelId = target.dataset.selectLevel!;
      waveId = target.dataset.selectWave!;
      scenario = {
        ...scenario,
        id: uid("scenario"),
        levelId,
        ...(scenario.mode === "wave" ? { waveId } : {}),
      };
      render();
    });
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  try {
    error = "";
    if (action === "fork") {
      commitEdits();
      message = "Named draft saved. Released content is unchanged.";
    } else if (action === "baseline") {
      navigate(() => {
        content = clone(CANONICAL_CONTENT);
        revision = null;
        message = "Released baseline selected.";
        ensureSelection();
        render();
      });
      return;
    } else if (action === "apply") {
      commitEdits();
    } else if (action === "play" || action === "replay") {
      if (action === "play") {
        if (workspace === "tune") {
          root.querySelector<HTMLSelectElement>(
            "#difficulty-candidate",
          )!.value = "";
          delete scenario.difficultyCandidate;
        }
        commitEdits();
      } else if (dirty) {
        navigate(() => launch(true));
        return;
      }
      launch(action === "replay");
      return;
    } else if (action === "save-scenario") {
      commitEdits();
      scenario = readScenario();
      preserveScenario();
      message = "Scenario saved independently of family progress.";
    } else if (action === "inspect-scenario") {
      scenario = readScenario();
      inspectedScenario = inspectScenario(collectEdits(), scenario);
      root.querySelector("#scenario-inspection")!.innerHTML =
        `<details open><summary>Resolved test setup</summary><pre class="wb-code">${esc(json(inspectedScenario))}</pre></details>`;
      message = "Resolved test setup is shown above.";
      feedback();
      return;
    } else if (action === "export") {
      const blob = new Blob([exportExperiments(store.bundle)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "stormwatch-experiments.json";
      anchor.click();
      URL.revokeObjectURL(url);
      message =
        "Saved experiments exported. Unsaved edits stay in this browser.";
      feedback();
      return;
    } else if (action === "promotion") {
      commitEdits();
      message = `Export the bundle, then preview:\nnpm run workbench:promote -- stormwatch-experiments.json ${revision!.id} selection.json\nselection.json: {"levels":["${levelId}"]}\nCatalog/rule scope requires explicit CLI selection. Review the diff before --apply. Scenario overrides, traces and results remain utility data.`;
    } else if (["run", "compare", "search"].includes(action)) {
      if (runBusy) return;
      commitEdits();
      runBusy = true;
      scenario = readScenario();
      const policy = root.querySelector<HTMLSelectElement>("#policy")!.value;
      const goal = {
        type: root.querySelector<HTMLSelectElement>("#goal")!.value,
        waveId,
        noLivesLost: root.querySelector<HTMLInputElement>("#no-loss")!.checked,
      };
      const settings = {
        policyId: policy,
        cadenceTicks: Number(
          root.querySelector<HTMLInputElement>("#cadence")!.value,
        ),
        maxTicks: Math.round(
          Number(root.querySelector<HTMLInputElement>("#time-limit")!.value) *
            30,
        ),
        goal: goal as import("./runs").Goal,
      };
      const budget = Number(
        root.querySelector<HTMLInputElement>("#budget")!.value,
      );
      runControls = {
        policy,
        goal: goal.type,
        noLoss: goal.noLivesLost,
        cadence: settings.cadenceTicks,
        limit: settings.maxTicks / 30,
        budget,
      };
      message = "Running deterministic legal-command evidence…";
      render();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      try {
        if (action === "compare") {
          const comparison = compareScenarios(
            CANONICAL_CONTENT,
            content,
            scenario,
            settings,
          );
          saveReport(comparison.after, undefined, { comparison });
          lastEvidence = comparison;
          evidenceSummary = `Matched comparison: released ${comparison.before.success ? "reached target" : "missed target"}, draft ${comparison.after.success ? "reached target" : "missed target"}. Hearts ${comparison.before.lives} → ${comparison.after.lives}; leaks ${comparison.before.leaks} → ${comparison.after.leaks}; rejected commands ${comparison.invalidatedCommands.length}.`;
          message = "Comparison complete. Open full test evidence for details.";
        } else if (action === "search") {
          const search = searchScenario(
            content,
            scenario,
            settings.goal,
            budget,
            settings.maxTicks,
          );
          if (search.report)
            saveReport(search.report, undefined, {
              search: { ...search, report: undefined },
            });
          lastEvidence = search;
          evidenceSummary = search.found
            ? "A legal defense plan reached the target; replay its recorded commands to inspect it."
            : "No successful plan within the search budget. This does not prove the target is impossible.";
          message = search.found
            ? "Search found a recorded plan."
            : "No plan found within this search budget.";
        } else {
          const report = runScenario(content, scenario, settings);
          saveReport(report);
          message =
            "Observed policy result saved. Human feel and device behavior remain separate evidence.";
        }
      } finally {
        runBusy = false;
      }
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
    runBusy = false;
    feedback();
    focusInvalidEditor();
    return;
  }
  render();
}
render();
