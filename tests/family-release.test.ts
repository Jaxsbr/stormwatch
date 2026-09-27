import { expect, it } from "vitest";
import { LEVELS } from "../src/content/levels";
import {
  availableCards,
  levelForAttempt,
  levelUnlocked,
} from "../src/content/progression";
import { loadProfiles } from "../src/persistence/profiles";
import {
  freshSave,
  recordVictory,
  type SaveData,
} from "../src/persistence/save";
import { Game } from "../src/sim/game";
import type { CardId, Point } from "../src/sim/types";

const sites: Point[][] = [
  [
    { x: 1, z: 4 },
    { x: 3, z: 2 },
    { x: 5, z: 2 },
    { x: 7, z: 5 },
    { x: 3, z: 0 },
    { x: 7, z: 4 },
    { x: 5, z: 0 },
  ],
  [
    { x: 0, z: 4 },
    { x: 3, z: 2 },
    { x: 6, z: 2 },
    { x: 9, z: 5 },
    { x: 2, z: 6 },
    { x: 9, z: 4 },
    { x: 5, z: 4 },
    { x: 7, z: 2 },
    { x: 3, z: 4 },
    { x: 9, z: 2 },
    { x: 7, z: 5 },
    { x: 2, z: 4 },
  ],
  [
    { x: 8, z: 4 },
    { x: 3, z: 3 },
    { x: 5, z: 3 },
    { x: 6, z: 3 },
    { x: 3, z: 2 },
    { x: 8, z: 3 },
    { x: 5, z: 4 },
    { x: 6, z: 4 },
    { x: 8, z: 5 },
    { x: 3, z: 4 },
    { x: 1, z: 2 },
    { x: 5, z: 2 },
  ],
];

/** Legal purchases once a second; no setup overrides or state mutation. */
function play(
  index: number,
  save: SaveData,
  assist = false,
  card: CardId = "none",
) {
  const game = new Game(
    levelForAttempt(LEVELS[index], save),
    card,
    assist,
    42,
    {
      unlockedUpgrades: save.unlocked.includes("squirrel-upgrade")
        ? ["bolt"]
        : [],
    },
  );
  let next = 0;
  for (let tick = 0; tick < 18000; tick++) {
    if (game.state.phase === "won" || game.state.phase === "lost") break;
    if (tick % 30 === 0) {
      const upgrade = game.state.towers.find(
        (t) => t.level === 1 && game.canUpgrade(t),
      );
      if (
        index === 2 &&
        upgrade &&
        game.state.coins >= game.upgradeCost(upgrade)
      ) {
        expect(game.upgrade(upgrade.id)).toBe(true);
      } else if (
        next < sites[index].length &&
        game.state.coins >= game.towers.bolt.cost
      ) {
        expect(game.place("bolt", sites[index][next])).toBe(true);
        next++;
      } else if (upgrade && game.state.coins >= game.upgradeCost(upgrade)) {
        expect(game.upgrade(upgrade.id)).toBe(true);
      }
      if (game.state.phase === "preparation")
        expect(game.startWave()).toBe(true);
    }
    game.tick(1 / 30);
  }
  return game;
}

it.each([false, true])(
  "takes a fresh second player through the chapter, saved rewards and replay (boss assist=%s)",
  (assist) => {
    let profiles = loadProfiles(null, null);
    profiles.active = 1;
    for (let index = 0; index < 2; index++) {
      const save = profiles.slots[1];
      expect(levelUnlocked(LEVELS, index, save)).toBe(true);
      expect(levelUnlocked(LEVELS, index + 1, save)).toBe(false);
      expect(availableCards(LEVELS[index], save)).toEqual([]);
      const game = play(index, save);
      expect(game.state.phase).toBe("won");
      profiles.slots[1] = recordVictory(save, game.level.id, game.state.stars);
      profiles = loadProfiles(JSON.stringify(profiles), null);
      expect(profiles.slots[0]).toEqual(freshSave());
      expect(profiles.active).toBe(1);
    }
    const beforeBoss = structuredClone(profiles.slots[1]);
    expect(beforeBoss.unlocked).toEqual(
      expect.arrayContaining(["squirrel-upgrade", "turtle"]),
    );
    expect(levelUnlocked(LEVELS, 2, beforeBoss)).toBe(true);
    const emptyAttempt = new Game(levelForAttempt(LEVELS[2], beforeBoss));
    emptyAttempt.startWave();
    for (
      let tick = 0;
      tick < 18000 && emptyAttempt.state.phase !== "lost";
      tick++
    )
      emptyAttempt.tick(1 / 30);
    expect(emptyAttempt.state.phase).toBe("lost");
    expect(profiles.slots[1]).toEqual(beforeBoss);
    const retry = play(2, beforeBoss, assist);
    expect(retry.state.phase).toBe("won");
    expect(retry.state.wave).toBe(6);
    expect(retry.state.killsByKind.boss).toBe(1);
    profiles.slots[1] = recordVictory(
      beforeBoss,
      retry.level.id,
      retry.state.stars,
    );
    profiles = loadProfiles(JSON.stringify(profiles), null);
    const complete = profiles.slots[1];
    expect(complete.stars["the-last-lantern"]).toBeGreaterThan(0);
    expect(availableCards(LEVELS[2], complete)).toEqual(["reach", "nets"]);
    expect(levelUnlocked(LEVELS, 3, complete)).toBe(false);
    const replay = play(0, complete, false, "reach");
    expect(replay.state.phase).toBe("won");
    expect(replay.level.availableTowers).toContain("net");
    profiles.slots[1] = recordVictory(
      complete,
      replay.level.id,
      replay.state.stars,
    );
    expect(profiles.slots[1].stars["lantern-pass"]).toBeGreaterThanOrEqual(
      complete.stars["lantern-pass"],
    );
    expect(profiles.slots[1].stars["the-last-lantern"]).toBe(
      complete.stars["the-last-lantern"],
    );
    expect(profiles.slots[0]).toEqual(freshSave());
  },
);
