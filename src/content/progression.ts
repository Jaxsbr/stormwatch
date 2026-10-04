import {
  CANONICAL_CONTENT,
  type AuthoringContent,
} from "../config/configuration";
import { resolveBoards, validateBoards, type BoardDef } from "./boards";
import { CARDS } from "./catalog";
import type { SaveData } from "../persistence/save";
import type { CardId, LevelDef, TowerKind } from "../sim/types";

export type ResultReward =
  | { kind: "tower-upgrade" | "tower-unlock"; tower: TowerKind }
  | { kind: "advantage-unlock"; card: "reach" | "nets" };

export type DiscoveryRule = {
  id: string;
  legacy: boolean;
  replayTower?: TowerKind;
  reward: ResultReward;
} & (
  { encounter: string; board?: never } | { board: string; encounter?: never }
);
export interface ProgressionContext {
  boards: readonly BoardDef[];
  levelIds: readonly string[];
  discoveries: readonly DiscoveryRule[];
}

// Keep the earning rule, legacy derivation and presentation meaning together.
// Legacy derivation applies only to rewards promised to players with older saves.
const DISCOVERIES = [
  {
    id: "squirrel-upgrade",
    encounter: "lantern-pass",
    legacy: true,
    reward: { kind: "tower-upgrade", tower: "bolt" },
  },
  {
    id: "turtle",
    encounter: "rainstone-crossing",
    legacy: true,
    replayTower: "net",
    reward: { kind: "tower-unlock", tower: "net" },
  },
  {
    id: "reach",
    encounter: "the-last-lantern",
    legacy: false,
    reward: { kind: "advantage-unlock", card: "reach" },
  },
  {
    id: "nets",
    encounter: "the-last-lantern",
    legacy: false,
    reward: { kind: "advantage-unlock", card: "nets" },
  },
] as const satisfies readonly DiscoveryRule[];

/** Explicit contexts support isolated authoring fixtures; runtime uses accepted content. */
export function progressionContext(
  content: AuthoringContent = CANONICAL_CONTENT,
  discoveries?: readonly DiscoveryRule[],
): ProgressionContext {
  validateBoards(content);
  const boards = resolveBoards(content);
  return {
    boards,
    levelIds: boards.flatMap(({ levelIds }) => levelIds),
    discoveries: structuredClone(discoveries ?? campaignDiscoveries(boards)),
  };
}

/** Expansion rewards activate only with the complete authored destination. */
function campaignDiscoveries(
  boards: readonly BoardDef[],
): readonly DiscoveryRule[] {
  const destination = boards.find(({ id }) => id === "mosswater-reach");
  const ids = [
    "mosswater-01",
    "mosswater-02",
    "mosswater-03",
    "mosswater-04",
    "mosswater-05",
  ];
  if (
    !destination ||
    destination.levelIds.length !== ids.length ||
    !ids.every((id, index) => destination.levelIds[index] === id)
  )
    return DISCOVERIES;
  return [
    ...DISCOVERIES,
    {
      id: "skunk",
      board: boards[0].id,
      legacy: true,
      replayTower: "stone",
      reward: { kind: "tower-unlock", tower: "stone" },
    },
    {
      id: "skunk-upgrade",
      encounter: "mosswater-02",
      legacy: true,
      reward: { kind: "tower-upgrade", tower: "stone" },
    },
  ];
}
export function boardComplete(
  board: BoardDef,
  save: Pick<SaveData, "stars">,
): boolean {
  return (
    board.levelIds.length > 0 &&
    board.levelIds.every((id) => (save.stars[id] ?? 0) > 0)
  );
}
export function boardUnlocked(
  context: ProgressionContext,
  boardId: string,
  save: Pick<SaveData, "stars">,
): boolean {
  const index = context.boards.findIndex(({ id }) => id === boardId);
  return (
    index >= 0 &&
    context.boards.slice(0, index).every((board) => boardComplete(board, save))
  );
}
export function viewedBoard(
  context: ProgressionContext,
  save: SaveData,
): BoardDef {
  return (
    context.boards.find(
      (board) =>
        board.id === save.viewedBoard && boardUnlocked(context, board.id, save),
    ) ?? context.boards[0]
  );
}
export function boardNavigation(
  context: ProgressionContext,
  save: SaveData,
): { previous?: BoardDef; next?: BoardDef } {
  const current = viewedBoard(context, save);
  const index = context.boards.findIndex(({ id }) => id === current.id);
  const next = context.boards[index + 1];
  return {
    previous: context.boards[index - 1],
    next: next && boardUnlocked(context, next.id, save) ? next : undefined,
  };
}
function discoveryEarned(
  discovery: DiscoveryRule,
  stars: SaveData["stars"],
  context: ProgressionContext,
): boolean {
  if (discovery.board) {
    const board = context.boards.find(({ id }) => id === discovery.board);
    return !!board && boardComplete(board, { stars });
  }
  return (
    !!discovery.encounter &&
    context.levelIds.includes(discovery.encounter) &&
    (stars[discovery.encounter] ?? 0) > 0
  );
}
export const DISCOVERY_IDS: readonly string[] = DISCOVERIES.map(({ id }) => id);

export function deriveUnlocked(
  stars: Readonly<Record<string, number>>,
  storedUnlocked: readonly string[],
  context: ProgressionContext = progressionContext(),
): string[] {
  const out = new Set(storedUnlocked);
  for (const discovery of context.discoveries) {
    if (discovery.legacy && discoveryEarned(discovery, stars, context))
      out.add(discovery.id);
  }
  return [...out];
}

export function victoryProgress(
  save: SaveData,
  levelId: string,
  stars: number,
  context: ProgressionContext = progressionContext(),
): {
  stars: Record<string, number>;
  unlocked: string[];
  rewards: ResultReward[];
  firstBoardComplete: boolean;
  completedBoard?: string;
} {
  const previous = save.stars[levelId] ?? 0;
  const nextStars = { ...save.stars };
  if (stars > previous) nextStars[levelId] = stars;
  const nextUnlocked = [...save.unlocked];
  const rewards: ResultReward[] = [];
  for (const discovery of context.discoveries) {
    if (
      stars > 0 &&
      (discovery.encounter === levelId ||
        context.boards.some(
          (board) =>
            board.id === discovery.board && board.levelIds.includes(levelId),
        )) &&
      discoveryEarned(discovery, nextStars, context) &&
      !nextUnlocked.includes(discovery.id)
    ) {
      nextUnlocked.push(discovery.id);
      rewards.push(discovery.reward);
    }
  }
  const completed =
    stars > 0
      ? context.boards.find(
          (board) =>
            board.levelIds.includes(levelId) &&
            !boardComplete(board, save) &&
            boardComplete(board, { stars: nextStars }),
        )
      : undefined;
  return {
    stars: nextStars,
    unlocked: nextUnlocked,
    rewards,
    firstBoardComplete: completed?.id === context.boards[0].id,
    completedBoard: completed?.id,
  };
}

export function levelUnlocked(
  levels: readonly LevelDef[],
  index: number,
  save: SaveData,
  context: ProgressionContext = progressionContext(),
): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= levels.length)
    return false;
  return encounterUnlocked(context, levels[index].id, save);
}

export function encounterUnlocked(
  context: ProgressionContext,
  levelId: string,
  save: SaveData,
): boolean {
  const board = context.boards.find(({ levelIds }) =>
    levelIds.includes(levelId),
  );
  if (!board || !boardUnlocked(context, board.id, save)) return false;
  const index = board.levelIds.indexOf(levelId);
  return board.levelIds
    .slice(0, index)
    .every((id) => (save.stars[id] ?? 0) > 0);
}
export function earnedUpgrades(
  save: SaveData,
  context: ProgressionContext = progressionContext(),
): TowerKind[] {
  return [
    ...new Set(
      context.discoveries.flatMap(({ id, reward }) =>
        save.unlocked.includes(id) && reward.kind === "tower-upgrade"
          ? [reward.tower]
          : [],
      ),
    ),
  ];
}

export function availableCards(level: LevelDef, save: SaveData): CardId[] {
  return CARDS.filter(
    ({ id }) =>
      save.unlocked.includes(id) &&
      (id !== "nets" ||
        (level.availableTowers ?? ["bolt", "stone", "net"]).includes("net")),
  ).map(({ id }) => id);
}

export function levelForAttempt(
  level: LevelDef,
  save: SaveData,
  context: ProgressionContext = progressionContext(),
): LevelDef {
  const available = level.availableTowers;
  const board = context.boards.find(({ levelIds }) =>
    levelIds.includes(level.id),
  );
  const continuing =
    !!board &&
    board.id !== context.boards[0].id &&
    boardUnlocked(context, board.id, save);
  if ((!continuing && !(save.stars[level.id] > 0)) || !available) return level;
  const replayTowers = context.discoveries.flatMap((discovery) =>
    discovery.replayTower !== undefined && save.unlocked.includes(discovery.id)
      ? [discovery.replayTower]
      : [],
  );
  const added = [...new Set(replayTowers)].filter(
    (tower) => !available.includes(tower),
  );
  return added.length
    ? { ...level, availableTowers: [...available, ...added] }
    : level;
}

export function initialCard(cards: readonly CardId[]): CardId {
  return cards.length === 1 ? cards[0] : "none";
}
