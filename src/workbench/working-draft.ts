import {
  configurationIdentity,
  normalizeAbilities,
  validateContent,
  type AuthoringContent,
  type LevelRecipe,
  type WaveRecipe,
} from "../config/configuration";

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
              { id: "draft-validation", kind: "raider", count: 1, gap: 1 },
            ],
          },
        ];
      }
    }
  }
  validateContent(check);
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
  return validateWorkingDraft(next);
}

/** Promote only the selected wave and its map settings, against fresh disk content. */
export function promoteWorkingWave(
  current: AuthoringContent,
  input: WorkingDraft,
): AuthoringContent {
  current = normalizeAbilities(current);
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
  const result = clone(current);
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
  validateContent(result);
  const promoted = result.levels.find((entry) => entry.id === level.id)!;
  if (
    promoted.requiresBossDefeat &&
    !promoted.waves.some((entry) =>
      entry.packets.some((packet) =>
        packet.groups.some((group) => group.kind === "boss"),
      ),
    )
  )
    throw new Error("This map requires a boss wave");
  return result;
}

/** Keep pending work while accepting fresh game content as the new comparison base. */
export function rebaseAfterPromotion(
  input: WorkingDraft,
  newBaseline: AuthoringContent,
): WorkingDraft {
  const draft = validateWorkingDraft(input);
  newBaseline = normalizeAbilities(newBaseline);
  validateContent(newBaseline);
  const content = clone(newBaseline);
  const comparisonBase = clone(newBaseline);
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
  for (const scope of ["towers", "enemies", "rules"] as const) {
    for (const key of Object.keys(draft.content[scope])) {
      const authored = draft.content[scope] as unknown as Record<
        string,
        unknown
      >;
      const old = draft.base[scope] as unknown as Record<string, unknown>;
      const target = content[scope] as unknown as Record<string, unknown>;
      if (!equal(authored[key], old[key])) target[key] = clone(authored[key]);
    }
  }
  return validateWorkingDraft({ ...draft, base: comparisonBase, content });
}
