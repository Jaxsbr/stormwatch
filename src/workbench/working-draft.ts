import { resolveBoards } from "../content/boards";
import {
  boardRebaseDependencies,
  mergeBoardScopes,
  rebaseBoardScopes,
} from "./board-scopes";
import {
  configurationIdentity,
  CANONICAL_CONTENT,
  normalizeAbilities,
  validateContent,
  type AuthoringContent,
  type LevelRecipe,
  type WaveRecipe,
} from "../config/configuration";
import { validateAuthoredVisuals } from "../content/encounter-visuals";
import { assignMissingRoutes, mergeRouteLayouts } from "./route-authoring";
import { levelRoutes, resolveRouteLayout } from "../sim/routes";

export const WORKING_DRAFT_KEY = "stormwatch.working-draft.v1";
export interface WorkingDraft {
  schemaVersion: 1;
  base: AuthoringContent;
  content: AuthoringContent;
  levelId: string;
  waveId: string;
}
const clone = <T>(value: T): T => structuredClone(value);
const equal = (a: unknown, b: unknown) =>
  a === undefined || b === undefined
    ? a === b
    : configurationIdentity(a) === configurationIdentity(b);
const metadata = ({ waves: _waves, ...fields }: LevelRecipe) => fields;
function selected(draft: WorkingDraft) {
  const level = draft.content.levels.find(
    (entry) => entry.id === draft.levelId,
  );
  const wave = level?.waves.find((entry) => entry.id === draft.waveId);
  if (!level || !wave) throw new Error("Select an existing map and wave");
  return { level, wave };
}
function text(value: string, label: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label} is required`);
  return value.trim();
}
function identifier(value: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value))
    throw new Error("Invalid identity");
  return value;
}

/** Empty new waves are durable drafts, but never playable or promotable content. */
export function validateWorkingDraft(input: unknown): WorkingDraft {
  if (
    !input ||
    typeof input !== "object" ||
    !("schemaVersion" in input) ||
    input.schemaVersion !== 1
  )
    throw new Error("Unsupported working draft version");
  const draft = clone(input as WorkingDraft);
  draft.base = normalizeAbilities(draft.base);
  draft.content = normalizeAbilities(draft.content);
  // Version-one drafts predating route authoring acquire the approved library;
  // legacy paths and group schedules stay untouched and resolve at attempt time.
  draft.base.routeLayouts ??= clone(CANONICAL_CONTENT.routeLayouts ?? []);
  draft.content.routeLayouts ??= clone(draft.base.routeLayouts);
  if (
    draft.base.routeLayouts.some(
      (l) => !draft.content.routeLayouts?.some((a) => a.id === l.id),
    )
  )
    throw new Error("Keep existing shared route layout identities");
  // Older saved drafts did not carry scenery. Restore reviewed choices for
  // known maps; a new map still needs an explicit selection before promotion.
  for (const level of draft.base.levels)
    level.visual ??= clone(
      CANONICAL_CONTENT.levels.find((entry) => entry.id === level.id)?.visual,
    );
  for (const level of draft.content.levels)
    level.visual ??= clone(
      draft.base.levels.find((entry) => entry.id === level.id)?.visual,
    );
  validateContent(draft.base);
  const check = clone(draft.content);
  for (const level of check.levels) {
    for (const wave of level.waves) {
      if (Array.isArray(wave.packets) && wave.packets.length === 0) {
        if (
          draft.base.levels
            .find((entry) => entry.id === level.id)
            ?.waves.some((entry) => entry.id === wave.id)
        )
          throw new Error("An existing wave must retain an enemy group");
        // Validate every other authored field with a temporary valid packet.
        // This packet is never returned, persisted, played, or promoted.
        wave.packets = [
          {
            id: "draft-validation",
            groups: [
              {
                id: "draft-validation",
                kind: "raider",
                count: 1,
                gap: 1,
                routeId: levelRoutes(
                  resolveRouteLayout(level, check.routeLayouts),
                )[0].id,
              },
            ],
          },
        ];
      }
    }
  }
  validateContent(check, { allowIncompleteFinale: true });
  selected(draft);
  return draft;
}

export function createWorkingDraft(
  baseline: AuthoringContent,
  legacyContent?: AuthoringContent,
): WorkingDraft {
  validateContent(baseline);
  const content = clone(legacyContent ?? baseline);
  validateContent(content);
  const first = content.levels[0];
  if (!first?.waves[0]) throw new Error("A map and wave are required");
  return validateWorkingDraft({
    schemaVersion: 1,
    base: clone(baseline),
    content,
    levelId: first.id,
    waveId: first.waves[0].id,
  });
}
function emptyWave(name: string, id: string): WaveRecipe {
  return {
    id: identifier(id),
    title: text(name, "Wave name"),
    reward: 0,
    abilities: { ratShield: true, weaselEvade: false },
    packets: [],
  };
}
export function createMap(
  draft: WorkingDraft,
  name: string,
  templateId: string,
  newId: string,
  waveId: string,
): WorkingDraft {
  const next = validateWorkingDraft(draft);
  const template = next.base.levels.find((level) => level.id === templateId);
  if (!template) throw new Error("Choose an existing map layout");
  if (next.content.levels.some((level) => level.id === newId))
    throw new Error("Map identity already exists");
  const level: LevelRecipe = {
    ...clone(template),
    id: identifier(newId),
    name: text(name, "Map name"),
    subtitle: "New encounter",
    description: "A new woodland encounter.",
    requiresBossDefeat: false,
    waves: [emptyWave("Wave 1", waveId)],
  };
  next.content.levels.push(level);
  const board = next.content.boards?.find(({ levelIds }) =>
    levelIds.includes(draft.levelId),
  );
  board?.levelIds.push(level.id);
  // Copy the selected point as a draft starting position; retain every existing anchor.
  if (board?.visual.markers)
    board.visual.markers[level.id] = clone(board.visual.markers[draft.levelId]);
  next.levelId = level.id;
  next.waveId = waveId;
  return validateWorkingDraft(next);
}
export function createWave(
  draft: WorkingDraft,
  name: string,
  newId: string,
): WorkingDraft {
  const next = validateWorkingDraft(draft);
  const { level } = selected(next);
  if (level.waves.some((wave) => wave.id === newId))
    throw new Error("Wave identity already exists");
  level.waves.push(emptyWave(name, newId));
  next.waveId = newId;
  return validateWorkingDraft(next);
}
export function setMapLayout(
  draft: WorkingDraft,
  templateId: string,
): WorkingDraft {
  const next = validateWorkingDraft(draft);
  const template = next.base.levels.find((level) => level.id === templateId);
  if (!template) throw new Error("Choose an existing map layout");
  const { level } = selected(next);
  for (const key of ["width", "depth", "path", "blocked", "accent"] as const)
    Object.assign(level, { [key]: clone(template[key]) });
  if (template.routeLayoutId) level.routeLayoutId = template.routeLayoutId;
  else delete level.routeLayoutId;
  if (template.routes) level.routes = clone(template.routes);
  else delete level.routes;
  assignMissingRoutes(
    level,
    levelRoutes(resolveRouteLayout(level, next.content.routeLayouts)).map(
      (r) => r.id,
    ),
  );
  return validateWorkingDraft(next);
}

/** Only the explicitly exposed combat catalog fields join shared ability promotion. */
function promoteCombatFields(
  current: AuthoringContent,
  draft: WorkingDraft,
  result: AuthoringContent,
) {
  for (const [scope, kind, field] of [
    ["towers", "stone", "poisonDamage"],
    ["enemies", "armored", "poisonImmune"],
  ] as const) {
    const record = (content: AuthoringContent) =>
      (content[scope] as unknown as Record<string, Record<string, unknown>>)[
        kind
      ];
    const authored = record(draft.content)[field],
      base = record(draft.base)[field];
    if (equal(authored, base)) continue;
    if (!equal(record(current)[field], base))
      throw new Error(
        `${kind}.${field} changed in game config. Reload before promoting.`,
      );
    if (authored === undefined) delete record(result)[field];
    else record(result)[field] = clone(authored);
  }
}

/** Promote only the selected wave and its map settings, against fresh disk content. */
export function promoteWorkingWave(
  current: AuthoringContent,
  input: WorkingDraft,
): AuthoringContent {
  current = normalizeAbilities(current);
  current.routeLayouts ??= clone(CANONICAL_CONTENT.routeLayouts ?? []);
  validateContent(current);
  const draft = validateWorkingDraft(input);
  const { level, wave } = selected(draft);
  if (!wave.packets.length)
    throw new Error("Add enemies before promoting this wave");
  const baseLevel = draft.base.levels.find((entry) => entry.id === level.id);
  const currentLevel = current.levels.find((entry) => entry.id === level.id);
  const baseWave = baseLevel?.waves.find((entry) => entry.id === wave.id);
  const currentWave = currentLevel?.waves.find((entry) => entry.id === wave.id);
  if (
    !equal(
      baseLevel && metadata(baseLevel),
      currentLevel && metadata(currentLevel),
    ) ||
    !equal(baseWave, currentWave)
  )
    throw new Error(
      "This map or wave changed in game config. Reload its latest settings before promoting.",
    );
  const defaultsChanged = !equal(
    draft.content.abilityDefaults,
    draft.base.abilityDefaults,
  );
  if (
    defaultsChanged &&
    !equal(current.abilityDefaults, draft.base.abilityDefaults)
  )
    throw new Error(
      "Shared ability settings changed in game config. Reload their latest settings before promoting.",
    );
  const selectedBoard = resolveBoards(draft.content).find(({ levelIds }) =>
    levelIds.includes(level.id),
  );
  const result = mergeBoardScopes(
    current,
    draft.base,
    draft.content,
    selectedBoard ? [selectedBoard.id] : [],
    // Unpublished maps other than the selected one stay in the draft, along
    // with their marker anchors. Existing membership moves remain atomic.
    [
      ...draft.base.levels.map(({ id }) => id),
      ...current.levels.map(({ id }) => id),
      level.id,
    ],
  );
  result.routeLayouts = mergeRouteLayouts(
    current,
    draft.base,
    draft.content,
    level.routeLayoutId ? [level.routeLayoutId] : [],
  );
  if (defaultsChanged)
    result.abilityDefaults = clone(draft.content.abilityDefaults);
  const index = result.levels.findIndex((entry) => entry.id === level.id);
  if (index < 0)
    result.levels.push({ ...clone(metadata(level)), waves: [clone(wave)] });
  else {
    const waves = result.levels[index].waves;
    const waveIndex = waves.findIndex((entry) => entry.id === wave.id);
    if (waveIndex < 0) waves.push(clone(wave));
    else waves[waveIndex] = clone(wave);
    result.levels[index] = { ...clone(metadata(level)), waves };
  }
  promoteCombatFields(current, draft, result);
  validateContent(result);
  validateAuthoredVisuals(result);
  return result;
}

/** Merge all changed draft scopes, preserving unrelated changes on disk. */
export function promoteAllWorkingChanges(
  current: AuthoringContent,
  input: WorkingDraft,
): AuthoringContent {
  current = normalizeAbilities(current);
  current.routeLayouts ??= clone(CANONICAL_CONTENT.routeLayouts ?? []);
  validateContent(current);
  const draft = validateWorkingDraft(input);
  const result = mergeBoardScopes(current, draft.base, draft.content);
  result.routeLayouts = mergeRouteLayouts(current, draft.base, draft.content);
  const merge = <T>(
    authored: T,
    base: T | undefined,
    live: T | undefined,
    label: string,
  ): T | undefined => {
    if (equal(authored, base)) return live;
    if (!equal(live, base))
      throw new Error(
        `${label} changed in game config. Reload its latest settings before promoting.`,
      );
    return clone(authored);
  };
  for (const level of draft.content.levels) {
    const base = draft.base.levels.find((entry) => entry.id === level.id);
    const live = result.levels.find((entry) => entry.id === level.id);
    const fields = merge(
      metadata(level),
      base && metadata(base),
      live && metadata(live),
      level.name,
    );
    const waves = clone(live?.waves ?? []);
    for (const wave of level.waves) {
      const index = waves.findIndex((entry) => entry.id === wave.id);
      const merged = merge(
        wave,
        base?.waves.find((entry) => entry.id === wave.id),
        waves[index],
        `${level.name}: ${wave.title}`,
      );
      if (merged) {
        if (index < 0) waves.push(merged);
        else waves[index] = merged;
      }
    }
    if (fields) {
      const next = { ...fields, waves };
      const index = result.levels.findIndex((entry) => entry.id === level.id);
      if (index < 0) result.levels.push(next);
      else result.levels[index] = next;
    }
  }
  result.abilityDefaults = merge(
    draft.content.abilityDefaults,
    draft.base.abilityDefaults,
    current.abilityDefaults,
    "Shared ability settings",
  )!;
  for (const scope of ["towers", "enemies", "rules"] as const) {
    const authored = clone(draft.content[scope]);
    const base = clone(draft.base[scope]);
    if (scope === "towers") {
      delete (authored as AuthoringContent["towers"]).stone.poisonDamage;
      delete (base as AuthoringContent["towers"]).stone.poisonDamage;
    }
    if (scope === "enemies") {
      delete (authored as AuthoringContent["enemies"]).armored.poisonImmune;
      delete (base as AuthoringContent["enemies"]).armored.poisonImmune;
    }
    if (!equal(authored, base))
      throw new Error(
        "Catalog and rule changes require the agent promotion workflow.",
      );
  }
  promoteCombatFields(current, draft, result);
  validateContent(result);
  validateAuthoredVisuals(result);
  return result;
}

/** Keep pending work while accepting fresh game content as the new comparison base. */
export function rebaseAfterPromotion(
  input: WorkingDraft,
  newBaseline: AuthoringContent,
): WorkingDraft {
  const draft = validateWorkingDraft(input);
  newBaseline = normalizeAbilities(newBaseline);
  newBaseline.routeLayouts ??= clone(CANONICAL_CONTENT.routeLayouts ?? []);
  validateContent(newBaseline);
  const content = clone(newBaseline);
  const comparisonBase = clone(newBaseline);
  // Retain pending shared layouts, and retain the old comparison on conflicts.
  for (const layout of draft.content.routeLayouts ?? []) {
    const old = draft.base.routeLayouts?.find((l) => l.id === layout.id);
    if (equal(layout, old)) continue;
    content.routeLayouts ??= [];
    const index = content.routeLayouts.findIndex((l) => l.id === layout.id);
    const live = content.routeLayouts[index];
    if (!equal(live, old) && !equal(live, layout)) {
      comparisonBase.routeLayouts = (comparisonBase.routeLayouts ?? []).filter(
        (l) => l.id !== layout.id,
      );
      if (old) comparisonBase.routeLayouts.push(clone(old));
    }
    if (index < 0) content.routeLayouts.push(clone(layout));
    else content.routeLayouts[index] = clone(layout);
  }
  const conflicts = (authored: unknown, old: unknown, current: unknown) =>
    !equal(authored, old) && !equal(current, old) && !equal(current, authored);
  for (const authored of draft.content.levels) {
    const old = draft.base.levels.find((entry) => entry.id === authored.id);
    const current = newBaseline.levels.find(
      (entry) => entry.id === authored.id,
    );
    let comparison = comparisonBase.levels.find(
      (entry) => entry.id === authored.id,
    );
    if (
      conflicts(
        metadata(authored),
        old && metadata(old),
        current && metadata(current),
      )
    ) {
      if (!old) {
        comparisonBase.levels = comparisonBase.levels.filter(
          (entry) => entry.id !== authored.id,
        );
        comparison = undefined;
      } else {
        const replacement = {
          ...clone(metadata(old)),
          waves: clone(comparison?.waves ?? old.waves),
        };
        const index = comparisonBase.levels.findIndex(
          (entry) => entry.id === authored.id,
        );
        if (index < 0) comparisonBase.levels.push(replacement);
        else comparisonBase.levels[index] = replacement;
        comparison = replacement;
      }
    }
    for (const authoredWave of authored.waves) {
      const oldWave = old?.waves.find((entry) => entry.id === authoredWave.id);
      const currentWave = current?.waves.find(
        (entry) => entry.id === authoredWave.id,
      );
      if (!conflicts(authoredWave, oldWave, currentWave)) continue;
      if (!comparison && old) {
        comparison = clone(old);
        comparisonBase.levels.push(comparison);
      }
      if (comparison) {
        comparison.waves = comparison.waves.filter(
          (entry) => entry.id !== authoredWave.id,
        );
        if (oldWave) comparison.waves.push(clone(oldWave));
        if (!comparison.waves.length) {
          comparisonBase.levels = comparisonBase.levels.filter(
            (entry) => entry.id !== authored.id,
          );
          comparison = undefined;
        }
      }
    }
    let target = content.levels.find((entry) => entry.id === authored.id);
    if (!target) {
      if (!equal(authored, old)) content.levels.push(clone(authored));
      continue;
    }
    if (!equal(metadata(authored), old && metadata(old))) {
      const index = content.levels.indexOf(target);
      target = { ...clone(metadata(authored)), waves: target.waves };
      content.levels[index] = target;
    }
    for (const wave of authored.waves) {
      if (
        equal(
          wave,
          old?.waves.find((entry) => entry.id === wave.id),
        )
      )
        continue;
      const index = target.waves.findIndex((entry) => entry.id === wave.id);
      if (index < 0) target.waves.push(clone(wave));
      else target.waves[index] = clone(wave);
    }
  }
  // Keep recipes only in draft snapshots when pending board intent depends on
  // a deleted live board/encounter. Promotion still checks the historical scope.
  for (const id of boardRebaseDependencies(
    draft.base,
    draft.content,
    newBaseline,
  )) {
    const old = draft.base.levels.find((level) => level.id === id)!;
    const authored = draft.content.levels.find((level) => level.id === id);
    if (!comparisonBase.levels.some((level) => level.id === id))
      comparisonBase.levels.push(clone(old));
    if (authored && !content.levels.some((level) => level.id === id))
      content.levels.push(clone(authored));
  }
  const boards = rebaseBoardScopes(
    draft.base,
    draft.content,
    newBaseline,
    content.levels.map(({ id }) => id),
    comparisonBase.levels.map(({ id }) => id),
  );
  if (boards.content) content.boards = boards.content;
  if (boards.comparison) comparisonBase.boards = boards.comparison;
  if (!equal(draft.content.abilityDefaults, draft.base.abilityDefaults)) {
    content.abilityDefaults = clone(draft.content.abilityDefaults);
    if (
      conflicts(
        draft.content.abilityDefaults,
        draft.base.abilityDefaults,
        newBaseline.abilityDefaults,
      )
    )
      comparisonBase.abilityDefaults = clone(draft.base.abilityDefaults);
  }
  for (const [scope, kind, field] of [
    ["towers", "stone", "poisonDamage"],
    ["enemies", "armored", "poisonImmune"],
  ] as const) {
    const record = (value: AuthoringContent) =>
      (value[scope] as unknown as Record<string, Record<string, unknown>>)[
        kind
      ];
    if (
      conflicts(
        record(draft.content)[field],
        record(draft.base)[field],
        record(newBaseline)[field],
      )
    ) {
      const old = record(draft.base)[field];
      if (old === undefined) delete record(comparisonBase)[field];
      else record(comparisonBase)[field] = clone(old);
    }
  }
  // Catalog records can contain both a pending combat edit and unrelated live
  // tuning. Overlay only fields changed by the draft, including optional removals.
  for (const scope of ["towers", "enemies"] as const) {
    const records = (value: AuthoringContent) =>
      value[scope] as unknown as Record<string, Record<string, unknown>>;
    for (const kind of Object.keys(records(draft.content))) {
      const authored = records(draft.content)[kind];
      const old = records(draft.base)[kind];
      const target = records(content)[kind];
      for (const field of new Set([
        ...Object.keys(old),
        ...Object.keys(authored),
      ])) {
        if (equal(authored[field], old[field])) continue;
        if (authored[field] === undefined) delete target[field];
        else target[field] = clone(authored[field]);
      }
    }
  }
  for (const key of Object.keys(draft.content.rules)) {
    const authored = draft.content.rules as unknown as Record<string, unknown>;
    const old = draft.base.rules as unknown as Record<string, unknown>;
    const target = content.rules as unknown as Record<string, unknown>;
    if (!equal(authored[key], old[key])) target[key] = clone(authored[key]);
  }
  return validateWorkingDraft({ ...draft, base: comparisonBase, content });
}
