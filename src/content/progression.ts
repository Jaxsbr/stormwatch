import { CARDS } from "./catalog";
import type { SaveData } from "../persistence/save";
import type { CardId, LevelDef } from "../sim/types";

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
  if (
    !(save.stars[level.id] > 0) ||
    !save.unlocked.includes("turtle") ||
    !level.availableTowers ||
    level.availableTowers.includes("net")
  )
    return level;
  return { ...level, availableTowers: [...level.availableTowers, "net"] };
}

export function initialCard(cards: readonly CardId[]): CardId {
  return cards.length === 1 ? cards[0] : "none";
}
