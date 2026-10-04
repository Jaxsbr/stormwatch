import { describe, expect, it } from "vitest";
import { LEVELS } from "../src/content/levels";
import {
  availableCards,
  initialCard,
  levelUnlocked,
  levelForAttempt,
} from "../src/content/progression";
import { freshSave, recordVictory, parseSave } from "../src/persistence/save";
import { Game } from "../src/sim/game";
import { advantageScreen } from "../src/ui/advantage-screen";
import { TOWERS } from "../src/content/catalog";

it("uses earned Turtle and Squirrel upgrades on completed maps after reload", () => {
  const earned = parseSave(
    JSON.stringify(
      recordVictory(
        recordVictory(freshSave(), "lantern-pass", 1),
        "rainstone-crossing",
        1,
      ),
    ),
  );
  for (const level of LEVELS.slice(0, 3)) {
    const replay = levelForAttempt(level, earned);
    const game = new Game({ ...replay, startCoins: 500 }, "none", false, 42, {
      unlockedUpgrades: earned.unlocked.includes("squirrel-upgrade")
        ? ["bolt"]
        : [],
    });
    expect(game.place("net", { x: 1, z: 2 })).toBe(true);
    expect(game.place("bolt", { x: 3, z: 0 })).toBe(true);
    expect(game.upgrade(game.state.towers[1].id)).toBe(true);
    expect(game.upgrade(game.state.towers[0].id)).toBe(false);
    expect(advantageScreen(replay, [], "none")).toContain("Turtle");
    expect(level.availableTowers).toEqual(
      level.id === "the-last-lantern" ? ["bolt", "net"] : ["bolt"],
    );
  }
  const improved = recordVictory(earned, "lantern-pass", 3);
  expect(recordVictory(improved, "lantern-pass", 1).stars["lantern-pass"]).toBe(
    3,
  );
});

it("keeps first attempts and another player's roster restricted", () => {
  for (const level of LEVELS) {
    expect(levelForAttempt(level, freshSave())).toBe(level);
    expect(
      levelForAttempt(level, { ...freshSave(), unlocked: ["turtle"] }),
    ).toBe(level);
  }
  const lanternOnly = recordVictory(freshSave(), "lantern-pass", 1);
  expect(levelForAttempt(LEVELS[0], lanternOnly).availableTowers).toEqual([
    "bolt",
  ]);
});

describe("campaign gates", () => {
  it("opens only Lantern for a fresh slot, then Rainstone after a Lantern victory", () => {
    const fresh = freshSave();
    expect(levelUnlocked(LEVELS, 0, fresh)).toBe(true);
    expect(levelUnlocked(LEVELS, 1, fresh)).toBe(false);
    expect(levelUnlocked(LEVELS, 2, fresh)).toBe(false);
    const earned = recordVictory(fresh, "lantern-pass", 1);
    expect(levelUnlocked(LEVELS, 1, earned)).toBe(true);
    expect(levelUnlocked(LEVELS, 2, earned)).toBe(false);
    const secondMap = recordVictory(earned, "rainstone-crossing", 1);
    expect(levelUnlocked(LEVELS, 2, secondMap)).toBe(true);
    expect(availableCards(LEVELS[0], earned)).toEqual([]);
  });

  it("filters longer nets from a Squirrel-only encounter", () => {
    const save = { ...freshSave(), unlocked: ["reach", "nets"] };
    expect(availableCards(LEVELS[0], save)).toEqual(["reach"]);
    expect(availableCards(LEVELS[1], save)).toEqual(["reach"]);
  });

  it("equips one earned applicable card and asks for a choice when two apply", () => {
    expect(initialCard([])).toBe("none");
    expect(initialCard(["reach"])).toBe("reach");
    expect(initialCard(["reach", "nets"])).toBe("none");
  });
});

it("earns Turtle only after a Rainstone victory, preserves it through reload and replay", () => {
  const lantern = recordVictory(freshSave(), "lantern-pass", 2);
  expect(lantern.unlocked).not.toContain("turtle");
  expect(
    recordVictory(lantern, "rainstone-crossing", 0).unlocked,
  ).not.toContain("turtle");
  const earned = recordVictory(lantern, "rainstone-crossing", 1);
  expect(earned.unlocked).toContain("turtle");
  expect(parseSave(JSON.stringify(earned)).unlocked).toContain("turtle");
  expect(
    recordVictory(earned, "rainstone-crossing", 1).unlocked.filter(
      (id) => id === "turtle",
    ),
  ).toHaveLength(1);
});

it("persists both first-board advantages and applies them on Last Lantern replay", () => {
  const before = recordVictory(
    recordVictory(
      recordVictory(freshSave(), "lantern-pass", 3),
      "rainstone-crossing",
      3,
    ),
    "the-last-lantern",
    2,
  );
  const reloaded = parseSave(JSON.stringify(before));
  expect(reloaded.unlocked).toEqual(expect.arrayContaining(["reach", "nets"]));
  expect(availableCards(LEVELS[2], reloaded)).toEqual(["reach", "nets"]);

  const reachReplay = new Game(levelForAttempt(LEVELS[2], reloaded), "reach");
  expect(reachReplay.place("bolt", { x: 1, z: 2 })).toBe(true);
  expect(reachReplay.range(reachReplay.state.towers[0])).toBeCloseTo(
    TOWERS.bolt.range * 1.18,
  );

  const netsReplay = new Game(
    {
      ...levelForAttempt(LEVELS[2], reloaded),
      startCoins: 500,
      waves: [
        {
          title: "Replay slow check",
          reward: 0,
          groups: [{ kind: "runner", count: 1, gap: 1 }],
        },
      ],
    },
    "nets",
  );
  expect(netsReplay.place("net", { x: 1, z: 2 })).toBe(true);
  expect(netsReplay.startWave()).toBe(true);
  const net = netsReplay.state.towers[0];
  for (let i = 0; i < 360; i += 1) {
    netsReplay.tick(1 / 30);
    if (
      netsReplay.state.enemies.some(
        (enemy) => enemy.slowUntil > netsReplay.state.clock,
      )
    ) {
      net.cooldown = 30;
      break;
    }
  }
  const runner = netsReplay.state.enemies.find(
    (enemy) =>
      enemy.kind === "runner" && enemy.slowUntil > netsReplay.state.clock,
  );
  expect(runner).toBeDefined();
  expect(runner!.slowUntil - netsReplay.state.clock).toBeCloseTo(4.5, 5);
});
