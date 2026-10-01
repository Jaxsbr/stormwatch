import { CARDS } from "./catalog";
import type { SaveData } from "../persistence/save";
import type { CardId, LevelDef, TowerKind } from "../sim/types";

export type ResultReward =
  | { kind: "tower-upgrade" | "tower-unlock"; tower: TowerKind }
  | { kind: "advantage-unlock"; card: "reach" | "nets" };

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
] as const satisfies readonly {
  id: string;
  encounter: string;
  legacy: boolean;
  replayTower?: TowerKind;
  reward: ResultReward;
}[];

export const DISCOVERY_IDS: readonly string[] = DISCOVERIES.map(({ id }) => id);

export function deriveUnlocked(
  stars: Readonly<Record<string, number>>,
  storedUnlocked: readonly string[],
): string[] {
  const out = new Set(storedUnlocked);
  for (const discovery of DISCOVERIES) {
    if (discovery.legacy && (stars[discovery.encounter] ?? 0) > 0)
      out.add(discovery.id);
  }
  return [...out];
}

export function victoryProgress(
  save: SaveData,
  levelId: string,
  stars: number,
): {
  stars: Record<string, number>;
  unlocked: string[];
  rewards: ResultReward[];
  firstBoardComplete: boolean;
} {
  const previous = save.stars[levelId] ?? 0;
  const nextStars = { ...save.stars };
  if (stars > previous) nextStars[levelId] = stars;
  const nextUnlocked = [...save.unlocked];
  const rewards: ResultReward[] = [];
  for (const discovery of DISCOVERIES) {
    if (
      discovery.encounter === levelId &&
      nextStars[levelId] > 0 &&
      !nextUnlocked.includes(discovery.id)
    ) {
      nextUnlocked.push(discovery.id);
      rewards.push(discovery.reward);
    }
  }
  return {
    stars: nextStars,
    unlocked: nextUnlocked,
    rewards,
    firstBoardComplete:
      levelId === "the-last-lantern" && previous === 0 && stars > 0,
  };
}

export function levelUnlocked(
  levels: readonly LevelDef[],
  index: number,
  save: SaveData,
): boolean {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < levels.length &&
    (index === 0 || (save.stars[levels[index - 1].id] ?? 0) > 0)
  );
}

export function availableCards(level: LevelDef, save: SaveData): CardId[] {
  return CARDS.filter(
    ({ id }) =>
      save.unlocked.includes(id) &&
      (id !== "nets" ||
        (level.availableTowers ?? ["bolt", "stone", "net"]).includes("net")),
  ).map(({ id }) => id);
}

export function levelForAttempt(level: LevelDef, save: SaveData): LevelDef {
  const available = level.availableTowers;
  if (!(save.stars[level.id] > 0) || !available) return level;
  const replayTowers = DISCOVERIES.flatMap((discovery) =>
    "replayTower" in discovery && save.unlocked.includes(discovery.id)
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
