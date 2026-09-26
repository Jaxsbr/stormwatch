// Pure persistence adapter for Stormwatch saves.
// No dependencies, no DOM access — the caller owns localStorage.

export const SAVE_KEY = "stormwatch.save.v1";

export interface SaveData {
  version: 2;
  stars: Record<string, number>;
  unlocked: string[];
  music: number;
  effects: number;
  muted: boolean;
  tutorialSeen: boolean;
}

const LEVEL_IDS: readonly string[] = ["lantern-pass", "rainstone-crossing"];
const UNLOCK_IDS: readonly string[] = ["squirrel-upgrade", "turtle"];

const DEFAULT_MUSIC = 0.5;
const DEFAULT_EFFECTS = 0.5;
const LEGACY_DEFAULT_MUSIC = 0.45;
const LEGACY_DEFAULT_EFFECTS = 0.6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasDangerousKey(key: string): boolean {
  // Reject pollution vectors ("__proto__", "constructor", "prototype")
  // and anything smuggled through a null byte.
  return (
    key === "__proto__" ||
    key === "constructor" ||
    key === "prototype" ||
    key.includes("\0")
  );
}

function toStrictBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toVolume(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
}

function toStarCount(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value)
  ) {
    return null;
  }
  return Math.min(3, Math.max(0, value));
}

function toUnlockedList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (
      typeof entry === "string" &&
      UNLOCK_IDS.includes(entry) &&
      !seen.has(entry)
    ) {
      seen.add(entry);
      out.push(entry);
    }
  }
  return out;
}

function toStarsRecord(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(value)) {
    return out;
  }
  for (const key of Object.keys(value)) {
    // Object.keys always yields strings; guard keeps the whitelist check
    // strict (no NaN / type-confusion slip-through).
    if (typeof key !== "string" || hasDangerousKey(key)) {
      continue;
    }
    if (!LEVEL_IDS.includes(key)) {
      continue;
    }
    const stars = toStarCount(value[key]);
    if (stars !== null) {
      out[key] = stars;
    }
  }
  return out;
}

function deriveUnlocked(
  stars: Record<string, number>,
  storedUnlocked: string[],
): string[] {
  const out = new Set(storedUnlocked);
  // Lantern Pass teaches the base Squirrel, then awards its upgrade.
  if ((stars["lantern-pass"] ?? 0) > 0) {
    out.add("squirrel-upgrade");
  }
  if ((stars["rainstone-crossing"] ?? 0) > 0) out.add("turtle");
  return Array.from(out);
}

export function freshSave(): SaveData {
  return {
    version: 2,
    stars: {},
    unlocked: [],
    music: DEFAULT_MUSIC,
    effects: DEFAULT_EFFECTS,
    muted: false,
    tutorialSeen: false,
  };
}

export function parseSave(raw: string | null): SaveData {
  if (raw === null) {
    return freshSave();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return freshSave();
  }

  if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)) {
    return freshSave();
  }

  // Reject the save outright if any pollution key is present at the top
  // level; downstream sanitizers drop them too, but failing closed on
  // hostile input is safer.
  for (const key of Object.keys(parsed)) {
    if (hasDangerousKey(key)) {
      return freshSave();
    }
  }

  const stars = toStarsRecord(parsed.stars);
  const unlocked = toUnlockedList(parsed.unlocked);
  const oldSchema = parsed.version === 1;
  const storedMusic = toVolume(
    parsed.music,
    oldSchema ? LEGACY_DEFAULT_MUSIC : DEFAULT_MUSIC,
  );
  const storedEffects = toVolume(
    parsed.effects,
    oldSchema ? LEGACY_DEFAULT_EFFECTS : DEFAULT_EFFECTS,
  );
  // Schema 1 stored slider values directly. The owner's prior listening
  // reference (music .20, effects 1.0) and the old untouched defaults both
  // become the new midpoint; other custom settings retain their prior gain.
  const matchesOwnerReference = storedMusic === 0.2 && storedEffects === 1;
  const music = oldSchema
    ? storedMusic === LEGACY_DEFAULT_MUSIC || matchesOwnerReference
      ? DEFAULT_MUSIC
      : toVolume((storedMusic * 0.35) / 0.4, DEFAULT_MUSIC)
    : storedMusic;
  const effects = oldSchema
    ? storedEffects === LEGACY_DEFAULT_EFFECTS || matchesOwnerReference
      ? DEFAULT_EFFECTS
      : toVolume(storedEffects / 2, DEFAULT_EFFECTS)
    : storedEffects;

  return {
    version: 2,
    stars,
    unlocked: deriveUnlocked(stars, unlocked),
    music,
    effects,
    muted: toStrictBoolean(parsed.muted, false),
    tutorialSeen: toStrictBoolean(parsed.tutorialSeen, false),
  };
}

export function recordVictory(
  save: SaveData,
  levelId: string,
  stars: number,
): SaveData {
  // Unknown (or non-string) level id: no change at all.
  if (typeof levelId !== "string" || !LEVEL_IDS.includes(levelId)) {
    return save;
  }

  const earned = toStarCount(stars);
  if (earned === null) {
    return save;
  }

  const previous = save.stars[levelId] ?? 0;
  const nextStars: Record<string, number> = { ...save.stars };
  // Keep the best star count.
  if (earned > previous) {
    nextStars[levelId] = earned;
  }

  const nextUnlocked = [...save.unlocked];
  if (
    levelId === "rainstone-crossing" &&
    nextStars[levelId] > 0 &&
    !nextUnlocked.includes("turtle")
  )
    nextUnlocked.push("turtle");
  // First Lantern Pass win unlocks Squirrel upgrades.
  if (
    levelId === "lantern-pass" &&
    nextStars["lantern-pass"] > 0 &&
    !nextUnlocked.includes("squirrel-upgrade")
  ) {
    nextUnlocked.push("squirrel-upgrade");
  }

  return {
    version: 2,
    stars: nextStars,
    unlocked: nextUnlocked,
    music: save.music,
    effects: save.effects,
    muted: save.muted,
    tutorialSeen: save.tutorialSeen,
  };
}
