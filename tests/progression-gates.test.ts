import { describe, expect, it } from "vitest";
import { LEVELS } from "../src/content/levels";
import {
  availableCards,
  initialCard,
  levelUnlocked,
} from "../src/content/progression";
import { freshSave, recordVictory } from "../src/persistence/save";

describe("campaign gates", () => {
  it("opens only Lantern for a fresh slot, then Rainstone after a Lantern victory", () => {
    const fresh = freshSave();
    expect(levelUnlocked(LEVELS, 0, fresh)).toBe(true);
    expect(levelUnlocked(LEVELS, 1, fresh)).toBe(false);
    expect(levelUnlocked(LEVELS, 2, fresh)).toBe(false);
    const earned = recordVictory(fresh, "lantern-pass", 1);
    expect(levelUnlocked(LEVELS, 1, earned)).toBe(true);
    expect(availableCards(LEVELS[0], earned)).toEqual([]);
  });

  it("filters longer nets from a Squirrel-only encounter", () => {
    const save = { ...freshSave(), unlocked: ["reach", "nets"] };
    expect(availableCards(LEVELS[0], save)).toEqual(["reach"]);
    expect(availableCards(LEVELS[1], save)).toEqual(["reach", "nets"]);
  });

  it("equips one earned applicable card and asks for a choice when two apply", () => {
    expect(initialCard([])).toBe("none");
    expect(initialCard(["reach"])).toBe("reach");
    expect(initialCard(["reach", "nets"])).toBe("none");
  });
});
