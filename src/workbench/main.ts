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
let levelId = content.levels[2]?.id ?? content.levels[0].id;
let waveId = content.levels
  .find((level) => level.id === levelId)!
  .waves.at(-1)!.id;
let message =
  "Choose a wave, inspect its rhythm, then fork a named draft to edit.";
let error = "";
let disposeAttempt: (() => void) | undefined;
let lastReport: RunReport | undefined;
let replayTrace: import("./commands").RecordedCommand[] | undefined;
let lastAttemptContent: AuthoringContent | undefined;
let lastAttemptScenario: Scenario | undefined;
let lastAttemptRevision: DraftRevision | null = null;
let runBusy = false;
let scenario: Scenario = {
  id: uid("scenario"),
  levelId,
  mode: "encounter",
  progression: "first-arrival",
  difficulty: "normal",
  seed: 42,
};
const numberInput = (key: string, label: string, value: number, step = "1") =>
  `<label>${esc(label)}<input data-field="${key}" type="number" value="${value}" step="${step}" min="0" ${revision ? "" : "disabled"}></label>`;
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
  const kinds = ["raider", "runner", "armored", "boss"] as const;
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
  return `<p>${schedule.length} enemies · ${esc(total)}<br>Last scheduled spawn: <strong>${last.toFixed(2)}s</strong>. Clearing depends on combat and travel.</p><div class="wb-timeline-scroll"><svg class="wb-timeline" role="img" aria-label="Enemy spawn timeline, individual appearances by kind" viewBox="0 0 900 150">${kinds.map((kind, row) => `<text x="4" y="${22 + row * 26}" fill="${colors[kind]}" font-size="12">${esc(configuration.enemies[kind].name)}</text><line x1="145" y1="${18 + row * 26}" x2="880" y2="${18 + row * 26}" stroke="#394f3b"/>`).join("")}${schedule.map((spawn) => `<circle cx="${145 + (spawn.at / Math.max(1, last)) * 735}" cy="${18 + kinds.indexOf(spawn.kind) * 26}" r="3" fill="${colors[spawn.kind]}"><title>${esc(spawn.groupId)} · ${spawn.at.toFixed(3)}s nominal · tick ${spawn.tick}</title></circle>`).join("")}<text x="145" y="135" fill="#b9c6b8" font-size="11">0s</text><text x="850" y="135" fill="#b9c6b8" font-size="11">${last.toFixed(1)}s</text></svg></div><details><summary>Individual spawn and ability windows</summary><div class="wb-scroll"><table class="wb-table"><thead><tr><th>Packet / enemy</th><th>Kind</th><th>Nominal</th><th>Fixed tick / appearance</th><th>Spawn-relative ability</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
function packetControls() {
  const numeric = (
    path: string,
    label: string,
    value: number | undefined,
    fallback?: number,
  ) =>
    `<label>${esc(label)}<input type="number" data-packet-field="${path}" data-original="${value ?? ""}" value="${value ?? ""}" placeholder="${fallback === undefined ? "Inherited" : `Default ${fallback}`}" step="any" ${revision ? "" : "disabled"}></label>`;
  return currentWave()
    .packets.map(
      (packet, p) =>
        `<details class="wb-packet" open><summary>${esc(packet.id)} · ${packet.repeat ?? 1} repetition(s) · ${packet.groups.length} group(s)</summary><div class="wb-params">${numeric(`packets.${p}.repeat`, "Repetitions", packet.repeat, 1)}${numeric(`packets.${p}.repeatDelayBefore`, "Silence before repeated packet (s)", packet.repeatDelayBefore, 0)}</div>${packet.groups
          .map((group, g) => {
            const base = `packets.${p}.groups.${g}`;
            return `<div class="wb-group"><h3>${esc(content.enemies[group.kind].name)} · ${esc(group.id)}</h3><div class="wb-params">${numeric(`${base}.count`, "Count", group.count)}${numeric(`${base}.gap`, "Cadence (s)", group.gap)}${numeric(`${base}.batchSize`, "Batch size", group.batchSize, 1)}${numeric(`${base}.batchStagger`, "Batch stagger (s)", group.batchStagger, 0)}${numeric(`${base}.delayBefore`, "Preceding silence (s)", group.delayBefore, 0)}${numeric(`${base}.movementScale`, "Movement multiplier", group.movementScale, 1)}${group.kind === "raider" ? numeric(`${base}.shieldCycle.upSeconds`, "Guard up (s)", group.shieldCycle?.upSeconds, 2) + numeric(`${base}.shieldCycle.downSeconds`, "Guard down / first delay (s)", group.shieldCycle?.downSeconds, 3) : ""}${group.kind === "runner" ? numeric(`${base}.evasionCycle.upSeconds`, "Evade active (s)", group.evasionCycle?.upSeconds) + numeric(`${base}.evasionCycle.downSeconds`, "Evade down (s)", group.evasionCycle?.downSeconds) : ""}</div><p class="wb-muted">Scope: this wave group. Blank optional fields inherit defaults; an omitted Rat cycle uses first guard at 1.1s. Set both cycle values to enable an authored cycle.</p></div>`;
          })
          .join("")}</details>`,
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
function previewOrigin() {
  return esc(
    scenario.difficultyCandidate
      ? `named difficulty recipe ${scenario.difficultyCandidate.id}`
      : revision
        ? `editor revision ${revision.id}`
        : "released recipe",
  );
}
function render() {
  const level = currentLevel();
  const wave = currentWave();
  const changes = difference(CANONICAL_CONTENT, content);
  const bundle = store.bundle;
  root.innerHTML = `<div class="wb-shell"><header class="wb-header"><div><h1>Stormwatch · Designer workbench</h1><p>Author rhythm. Play the consequence. Keep the choice.</p></div><div class="wb-status">Local experiments · family profiles untouched<br>${store.status.durable ? "Browser storage available" : esc(store.status.error ?? "In memory only; export to preserve")}</div></header><div class="wb-layout"><nav class="wb-register" aria-label="Encounter and wave register"><h2>Expedition</h2>${content.levels.map((entry, index) => `<details ${entry.id === levelId ? "open" : ""}><summary>${index + 1}. ${esc(entry.name)}</summary>${entry.waves.map((entryWave, waveIndex) => `<button data-select-level="${esc(entry.id)}" data-select-wave="${esc(entryWave.id)}" aria-current="${entry.id === levelId && entryWave.id === waveId}">${waveIndex + 1}. ${esc(entryWave.title)}<small>${esc(entryWave.id)}</small></button>`).join("")}</details>`).join("")}</nav><main class="wb-content"><section class="wb-card"><span class="wb-badge">${revision ? `Draft · ${esc(revision.name)}` : "Released baseline"}</span><h2>${esc(level.name)} · ${esc(wave.title)}</h2><p>Lesson: ${esc(wave.lesson ?? "Unspecified")}<br>Intended outcome: ${esc(wave.targetOutcome ?? "Unspecified")} · observed evidence is recorded separately.</p><div class="wb-row"><label>Draft name<input id="draft-name" value="${esc(revision?.name ?? `${level.name} rhythm candidate`)}"></label><button class="primary" data-action="fork">Fork named draft</button><label>Saved revision<select id="saved-revision"><option value="">Choose revision</option>${bundle.revisions.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === revision?.id ? "selected" : ""}>${esc(entry.name)} · ${esc(entry.id)}</option>`).join("")}</select></label><button data-action="baseline">Released baseline</button></div><p class="wb-muted">Revision ${esc(revision?.id ?? configurationIdentity(content))} · ${changes.length} changed paths. Edits apply only to a new attempt.</p></section><section class="wb-card"><h2>Effective attempt rhythm and route</h2><p class="wb-muted">Preview origin: <span id="preview-origin">${previewOrigin()}</span>. The recipe editor below edits ${esc(revision?.name ?? "the released baseline")}; selecting a difficulty recipe changes the attempt preview.</p><div class="wb-grid"><div id="attempt-timeline">${timeline()}</div><div><div id="attempt-map">${mapPreview()}</div><p>${level.width} × ${level.depth} · ${esc(level.description)}</p></div></div></section><section class="wb-card"><h2>Recipe editor</h2><div class="wb-row">${numberInput("startCoins", "Encounter starting crowns", level.startCoins)}${numberInput("healthScale", "Encounter health multiplier", level.healthScale ?? 1, "0.05")}${numberInput("enemyRewardScale", "Enemy reward multiplier", level.enemyRewardScale ?? 1, "0.05")}${numberInput("reward", "Wave-end crowns", wave.reward)}</div><p class="wb-muted">Packets retain authored order. Repeat count and repetition silence stay readable. Count, gap (s), batch size/stagger (s), preceding silence (s), movement multiplier and supported guard/evasion cycles are editable below.</p>${packetControls()}<details><summary>Advanced packet recipe JSON · preserve IDs and order</summary><label>Selected wave packets · wave scope<textarea id="packet-editor" class="wb-recipe" ${revision ? "" : "disabled"}>${esc(json(wave.packets))}</textarea></label></details><div class="wb-row"><label>Intended lesson<input id="lesson" value="${esc(wave.lesson ?? "")}" ${revision ? "" : "disabled"}></label><label>Intended outcome<input id="target-outcome" value="${esc(wave.targetOutcome ?? "")}" ${revision ? "" : "disabled"}></label><button class="primary" data-action="apply" ${revision ? "" : "disabled"}>Validate and save new revision</button></div><details><summary>Supported catalog and gameplay parameters · explicit global authored scope</summary><p>Changes here propose canonical catalog/rule edits. Scenario resources and formations below are separate experiments.</p><label>Defender catalog<textarea id="tower-editor" ${revision ? "" : "disabled"}>${esc(json(content.towers))}</textarea></label><label>Enemy catalog<textarea id="enemy-editor" ${revision ? "" : "disabled"}>${esc(json(content.enemies))}</textarea></label><label>Implemented gameplay rules<textarea id="rule-editor" ${revision ? "" : "disabled"}>${esc(json(content.rules))}</textarea></label></details><details><summary>Effective settings and released defaults</summary><div id="attempt-effective">${effectiveInspector()}</div></details><details><summary>Review changed authored values (${changes.length})</summary><pre class="wb-code">${esc(json(changes))}</pre></details></section><section class="wb-card"><h2>Scenario and manual play</h2><p class="wb-muted" id="attempt-summary">${attemptSummary()}</p><div class="wb-row"><label>Attempt scope<select id="mode"><option value="encounter" ${scenario.mode === "encounter" ? "selected" : ""}>Full encounter · reachable setup</option><option value="wave" ${scenario.mode === "wave" ? "selected" : ""}>Selected wave · synthetic setup</option></select></label><label>Discovery capabilities<select id="progression"><option value="first-arrival" ${scenario.progression === "first-arrival" ? "selected" : ""}>First arrival · prior discoveries</option><option value="replay" ${scenario.progression === "replay" ? "selected" : ""}>Replay · all earned tools</option></select></label><label>Difficulty baseline<select id="difficulty"><option value="normal" ${scenario.difficulty === "normal" ? "selected" : ""}>Normal</option><option value="assist" ${scenario.difficulty === "assist" ? "selected" : ""}>Assist · existing extra crowns/hearts</option></select></label><label>Named design-only difficulty recipe<select id="difficulty-candidate"><option value="">Current authored revision</option>${bundle.revisions.map((entry) => `<option value="${esc(entry.id)}" ${entry.id === scenario.difficultyCandidate?.id ? "selected" : ""}>${esc(entry.name)}</option>`).join("")}</select></label><label>Seed<input id="seed" type="number" value="${scenario.seed}" step="1"></label></div><p>Named draft recipes are design-only difficulty candidates. Difficulty changes never grant discoveries. A selected-wave wallet or formation does not establish affordability through earlier waves.</p><div class="wb-grid"><label>Explicit overrides · towers, upgrades, card, coins, lives<textarea id="scenario-overrides">${esc(json(scenario.overrides ?? {}))}</textarea></label><label>Starting formation · legal purchases from declared wallet<textarea id="formation">${esc(json(scenario.formation ?? []))}</textarea></label></div><div class="wb-row"><button class="primary" data-action="play">Play fresh attempt</button><button data-action="save-scenario">Save scenario</button><button data-action="inspect-scenario">Inspect resolved scenario</button><label>Saved command trace<select id="saved-trace"><option value="">Choose trace</option>${bundle.traces.map((entry) => `<option value="${esc(entry.id)}">${esc(entry.id)}</option>`).join("")}</select></label><label>Saved result<select id="saved-result"><option value="">Choose result</option>${bundle.results.map((entry) => `<option value="${esc(entry.id)}">${esc(entry.id)}</option>`).join("")}</select></label><button data-action="replay" ${replayTrace ? "" : "disabled"}>Replay last commands</button><label>Saved scenario<select id="saved-scenario"><option value="">Choose scenario</option>${bundle.scenarios.map((entry) => `<option value="${esc(entry.id)}">${esc(entry.id)} · ${esc(entry.levelId)}</option>`).join("")}</select></label></div></section><section class="wb-card"><h2>Reproducible assistance</h2><p>Policies use legal commands. Results disclose cadence, spending assumptions and limits. Success is completion of the selected target; an unsuccessful bounded search does not prove impossibility.</p><div class="wb-row"><label>Policy<select id="policy"><option value="coverage-first">Coverage spending</option><option value="upgrades-first">Upgrades first</option><option value="finale-mixed">Mixed control</option></select></label><label>Goal<select id="goal"><option value="encounter-win">Win encounter</option><option value="wave-clear">Clear selected wave</option></select></label><label>No lives lost<input id="no-loss" type="checkbox"></label><label>Decision cadence (ticks)<input id="cadence" type="number" value="30" min="1"></label><label>Simulated limit (s)<input id="time-limit" type="number" value="600" min="1"></label><label>Search budget (plans)<input id="budget" type="number" value="12" min="1" max="64"></label></div><div class="wb-row"><button data-action="run">Run policy</button><button data-action="compare">Compare released / draft with matched policy</button><button data-action="search">Bounded goal search</button></div>${lastReport ? `<details open><summary>Last observed result</summary><pre class="wb-code">${esc(json(lastReport))}</pre></details>` : ""}</section><section class="wb-card"><h2>Preserve and promote</h2><p>Browser saving preserves experiments. Export transfers them. Promotion previews a scoped canonical diff and rejects a stale released baseline. It never commits, publishes or turns a synthetic formation into production content.</p><div class="wb-row"><button data-action="export">Export experiments</button><label>Import validated experiments<input id="import-file" type="file" accept="application/json,.json"></label><button data-action="promotion" ${revision ? "" : "disabled"}>Review promotion instructions</button></div><p class="wb-muted">Local command: <code>npm run workbench:promote -- experiments.json REVISION selection.json</code>. Preview first; apply only after reviewing the selected authored scope.</p></section><div class="wb-message" role="status">${esc(message)}</div>${error ? `<div class="wb-error" role="alert">${esc(error)}</div>` : ""}</main></div></div>`;
  root.onclick = onClick;
  root.querySelector<HTMLSelectElement>("#saved-revision")!.onchange = (
    event,
  ) => {
    const id = (event.target as HTMLSelectElement).value;
    const saved = store.bundle.revisions.find((entry) => entry.id === id);
    if (saved) {
      revision = saved;
      content = clone(saved.content);
      ensureSelection();
      render();
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
      } catch (cause) {
        error = String(cause);
        const select = root.querySelector<HTMLSelectElement>(`#${id}`)!;
        select.value =
          id === "difficulty-candidate"
            ? (scenario.difficultyCandidate?.id ?? "")
            : scenario[id as "difficulty" | "mode" | "progression"];
      }
      root.querySelector(".wb-message")!.textContent = error || message;
    };
  root.querySelector<HTMLSelectElement>("#saved-scenario")!.onchange = (
    event,
  ) => {
    const saved = store.bundle.scenarios.find(
      (entry) => entry.id === (event.target as HTMLSelectElement).value,
    );
    if (saved) {
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
    if (record) restoreEvidence(record);
  };
  root.querySelector<HTMLSelectElement>("#saved-result")!.onchange = (
    event,
  ) => {
    const record = store.bundle.results.find(
      (entry) => entry.id === (event.target as HTMLSelectElement).value,
    );
    if (record) restoreEvidence(record, record.report as RunReport);
  };
  root.querySelector<HTMLInputElement>("#import-file")!.onchange = async (
    event,
  ) => {
    try {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      store.replace(importExperiments(await file.text()));
      message =
        "Validated experiments imported. Select a saved revision or scenario.";
      error = "";
    } catch (cause) {
      error = String(cause);
    }
    render();
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
async function onClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest<HTMLElement>("button");
  if (!target) return;
  if (target.dataset.selectLevel) {
    levelId = target.dataset.selectLevel;
    waveId = target.dataset.selectWave!;
    scenario = {
      ...scenario,
      id: uid("scenario"),
      levelId,
      ...(scenario.mode === "wave" ? { waveId } : {}),
    };
    render();
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  try {
    error = "";
    if (action === "fork") {
      saveRevision(
        content,
        root.querySelector<HTMLInputElement>("#draft-name")!.value,
      );
      message = "Named draft saved. Released content is unchanged.";
    } else if (action === "baseline") {
      content = clone(CANONICAL_CONTENT);
      revision = null;
      message = "Released baseline selected.";
      ensureSelection();
    } else if (action === "apply") {
      const next = clone(content);
      const level = next.levels.find((entry) => entry.id === levelId)!;
      const wave = level.waves.find((entry) => entry.id === waveId)!;
      for (const field of root.querySelectorAll<HTMLInputElement>(
        "[data-field]",
      )) {
        const key = field.dataset.field!;
        if (key === "reward") wave.reward = Number(field.value);
        else
          (level as unknown as Record<string, unknown>)[key] = Number(
            field.value,
          );
      }
      wave.packets = JSON.parse(
        root.querySelector<HTMLTextAreaElement>("#packet-editor")!.value,
      );
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
      next.towers = JSON.parse(
        root.querySelector<HTMLTextAreaElement>("#tower-editor")!.value,
      );
      next.enemies = JSON.parse(
        root.querySelector<HTMLTextAreaElement>("#enemy-editor")!.value,
      );
      next.rules = JSON.parse(
        root.querySelector<HTMLTextAreaElement>("#rule-editor")!.value,
      );
      saveRevision(
        next,
        root.querySelector<HTMLInputElement>("#draft-name")!.value,
      );
      message =
        "Validated new revision saved. Restart deliberately to play it.";
    } else if (action === "play" || action === "replay") {
      launch(action === "replay");
      return;
    } else if (action === "save-scenario") {
      scenario = readScenario();
      preserveScenario();
      message = "Scenario saved independently of family progress.";
    } else if (action === "inspect-scenario") {
      scenario = readScenario();
      message = json(inspectScenario(content, scenario));
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
      message = "Validated experiments exported.";
    } else if (action === "promotion") {
      message = `Export the bundle, then preview:\nnpm run workbench:promote -- stormwatch-experiments.json ${revision!.id} selection.json\nselection.json: {"levels":["${levelId}"]}\nCatalog/rule scope requires explicit CLI selection. Review the diff before --apply. Scenario overrides, traces and results remain utility data.`;
    } else if (["run", "compare", "search"].includes(action)) {
      if (runBusy) return;
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
          message = json(comparison);
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
          message = json(search);
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
  }
  render();
}
render();
