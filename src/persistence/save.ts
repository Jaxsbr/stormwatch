// Pure persistence adapter for Stormwatch saves.
// No DOM access — the caller owns localStorage.
import {
  progressionContext,
  viewedBoard,
  boardUnlocked,
  type ProgressionContext,
  deriveUnlocked,
  victoryProgress,
  type ResultReward,
} from "../content/progression";

export const SAVE_KEY = "stormwatch.save.v1";

export interface SaveData {
  version: 2;
  viewedBoard: string;
  stars: Record<string, number>;
  unlocked: string[];
  music: number;
  effects: number;
  muted: boolean;
  showGrid: boolean;
  tutorialSeen: boolean;
}

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

function toUnlockedList(value: unknown, context: ProgressionContext): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (
      typeof entry === "string" &&
      context.discoveries.some(({ id }) => id === entry) &&
      !seen.has(entry)
    ) {
      seen.add(entry);
      out.push(entry);
    }
  }
  return out;
}

function toStarsRecord(
  value: unknown,
  context: ProgressionContext,
): Record<string, number> {
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
    if (!context.levelIds.includes(key)) {
      continue;
    }
    const stars = toStarCount(value[key]);
    if (stars !== null) {
      out[key] = stars;
    }
  }
  return out;
}

export function freshSave(
  context: ProgressionContext = progressionContext(),
): SaveData {
  return {
    version: 2,
    viewedBoard: context.boards[0].id,
    stars: {},
    unlocked: [],
    music: DEFAULT_MUSIC,
    effects: DEFAULT_EFFECTS,
    muted: false,
    showGrid: false,
    tutorialSeen: false,
  };
}

export function parseSave(
  raw: string | null,
  context: ProgressionContext = progressionContext(),
): SaveData {
  if (raw === null) {
    return freshSave(context);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return freshSave(context);
  }

  if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)) {
    return freshSave(context);
  }

  // Reject the save outright if any pollution key is present at the top
  // level; downstream sanitizers drop them too, but failing closed on
  // hostile input is safer.
  for (const key of Object.keys(parsed)) {
    if (hasDangerousKey(key)) {
      return freshSave(context);
    }
  }

  const stars = toStarsRecord(parsed.stars, context);
  const unlocked = toUnlockedList(parsed.unlocked, context);
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

  const save: SaveData = {
    version: 2,
    viewedBoard:
      typeof parsed.viewedBoard === "string"
        ? parsed.viewedBoard
        : context.boards[0].id,
    stars,
    unlocked: deriveUnlocked(stars, unlocked, context),
    music,
    effects,
    muted: toStrictBoolean(parsed.muted, false),
    showGrid: toStrictBoolean(parsed.showGrid, false),
    tutorialSeen: toStrictBoolean(parsed.tutorialSeen, false),
  };
  return { ...save, viewedBoard: viewedBoard(context, save).id };
}

export function recordVictory(
  save: SaveData,
  levelId: string,
  stars: number,
  context: ProgressionContext = progressionContext(),
): SaveData {
  return recordVictoryOutcome(save, levelId, stars, context).save;
}

export function recordVictoryOutcome(
  save: SaveData,
  levelId: string,
  stars: number,
  context: ProgressionContext = progressionContext(),
): {
  save: SaveData;
  rewards: ResultReward[];
  firstBoardComplete: boolean;
  completedBoard?: string;
} {
  // Unknown (or non-string) level id: no change at all.
  if (
    typeof levelId !== "string" ||
    hasDangerousKey(levelId) ||
    !context.levelIds.includes(levelId)
  ) {
    return { save, rewards: [], firstBoardComplete: false };
  }

  const earned = toStarCount(stars);
  if (earned === null) {
    return { save, rewards: [], firstBoardComplete: false };
  }

  const outcome = victoryProgress(save, levelId, earned, context);
  return {
    save: {
      ...save,
      stars: outcome.stars,
      unlocked: outcome.unlocked,
    },
    rewards: outcome.rewards,
    firstBoardComplete: outcome.firstBoardComplete,
    completedBoard: outcome.completedBoard,
  };
}

/** Only explicit travel changes the remembered destination. */
export function recordViewedBoard(
  save: SaveData,
  boardId: string,
  context: ProgressionContext = progressionContext(),
): SaveData {
  return boardUnlocked(context, boardId, save)
    ? { ...save, viewedBoard: boardId }
    : save;
}
