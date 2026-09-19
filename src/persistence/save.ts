// Pure persistence adapter for Stormwatch saves.
// No dependencies, no DOM access — the caller owns localStorage.

export const SAVE_KEY = 'stormwatch.save.v1';

export interface SaveData {
  version: 1;
  stars: Record<string, number>;
  unlocked: string[];
  music: number;
  effects: number;
  muted: boolean;
  tutorialSeen: boolean;
}

const LEVEL_IDS: readonly string[] = ['lantern-pass', 'rainstone-crossing'];
const UNLOCK_IDS: readonly string[] = ['thrift'];

const DEFAULT_MUSIC = 0.45;
const DEFAULT_EFFECTS = 0.6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasDangerousKey(key: string): boolean {
  // Reject pollution vectors ("__proto__", "constructor", "prototype")
  // and anything smuggled through a null byte.
  return (
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'prototype' ||
    key.includes('\0')
  );
}

function toStrictBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
}

function toStarCount(value: unknown): number | null {
  if (
    typeof value !== 'number' ||
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
      typeof entry === 'string' &&
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
    if (typeof key !== 'string' || hasDangerousKey(key)) {
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
  // lantern-pass with any stars always implies the thrift unlock.
  if ((stars['lantern-pass'] ?? 0) > 0) {
    out.add('thrift');
  }
  return Array.from(out);
}

export function freshSave(): SaveData {
  return {
    version: 1,
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

  if (!isRecord(parsed) || parsed.version !== 1) {
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

  return {
    version: 1,
    stars,
    unlocked: deriveUnlocked(stars, unlocked),
    music: toVolume(parsed.music, DEFAULT_MUSIC),
    effects: toVolume(parsed.effects, DEFAULT_EFFECTS),
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
  if (typeof levelId !== 'string' || !LEVEL_IDS.includes(levelId)) {
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
  // First lantern-pass win unlocks thrift.
  if (
    levelId === 'lantern-pass' &&
    nextStars['lantern-pass'] > 0 &&
    !nextUnlocked.includes('thrift')
  ) {
    nextUnlocked.push('thrift');
  }

  return {
    version: 1,
    stars: nextStars,
    unlocked: nextUnlocked,
    music: save.music,
    effects: save.effects,
    muted: save.muted,
    tutorialSeen: save.tutorialSeen,
  };
}
