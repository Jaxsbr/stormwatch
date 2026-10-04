import { legacyFirstBoard } from "./fixtures/first-board-content";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  compileLevel,
  validateContent,
} from "../src/config/configuration";
import { FIRST_BOARD_ID, resolveBoards } from "../src/content/boards";
import {
  boardComplete,
  boardNavigation,
  boardUnlocked,
  earnedUpgrades,
  encounterUnlocked,
  levelForAttempt,
  progressionContext,
  type DiscoveryRule,
} from "../src/content/progression";
import {
  freshSave,
  parseSave,
  recordVictoryOutcome,
  recordViewedBoard,
  type SaveData,
} from "../src/persistence/save";
import { createProfile, loadProfiles } from "../src/persistence/profiles";
import { expeditionScreen } from "../src/ui/expedition-screen";
import { resultCard } from "../src/ui/game-chrome";
import { Game } from "../src/sim/game";

/** Synthetic two-board fixture, never registered or shipped as campaign content. */
export function twoBoards() {
  const content = legacyFirstBoard();
  content.levels.push(
    ...content.levels.slice(0, 2).map((level, i) => ({
      ...structuredClone(level),
      id: `fixture-${i + 1}`,
    })),
  );
  content.boards = [
    resolveBoards(CANONICAL_CONTENT)[0],
    {
      id: "fixture-board",
      name: "Synthetic test board",
      levelIds: ["fixture-1", "fixture-2"],
      visual: {
        illustration: "expedition-map-v1",
        markers: {
          "fixture-1": { x: 20, y: 60 },
          "fixture-2": { x: 80, y: 30 },
        },
      },
    },
  ];
  return content;
}
const rules: DiscoveryRule[] = [
  {
    id: "skunk-fixture",
    board: FIRST_BOARD_ID,
    legacy: true,
    replayTower: "stone",
    reward: { kind: "tower-unlock", tower: "stone" },
  },
  {
    id: "skunk-upgrade-fixture",
    encounter: "fixture-2",
    legacy: true,
    reward: { kind: "tower-upgrade", tower: "stone" },
  },
];
const fixture = () => {
  const content = twoBoards();
  const context = progressionContext(content, rules);
  return { content, context };
};
function winFirst(context: ReturnType<typeof progressionContext>): SaveData {
  let save = freshSave(context);
  for (const id of context.boards[0].levelIds)
    save = recordVictoryOutcome(save, id, 1, context).save;
  return save;
}

describe("resolved boards through public progression and save interfaces", () => {
  it("preserves the original teaching roster and unlocks accepted Mosswater only after all first-board wins", () => {
    const context = progressionContext();
    expect(context.boards.map((b) => b.levelIds.length)).toEqual([3, 5]);
    const fresh = freshSave();
    expect(boardNavigation(context, fresh).next).toBeUndefined();
    const save = winFirst(context);
    expect(save.unlocked).toEqual([
      "squirrel-upgrade",
      "turtle",
      "reach",
      "nets",
      "skunk",
    ]);
    expect(boardNavigation(context, save).next?.id).toBe("mosswater-reach");
    expect(save.viewedBoard).toBe(FIRST_BOARD_ID);
    expect(
      expeditionScreen(
        CANONICAL_CONTENT.levels.map((level) => compileLevel(level)),
        save,
        context,
      ),
    ).toContain('data-action="board:mosswater-reach"');
    expect(
      levelForAttempt(compileLevel(CANONICAL_CONTENT.levels[0]), fresh)
        .availableTowers,
    ).toEqual(["bolt"]);
  });
  it("still resolves pre-expansion content with no board collection and no Skunk grant", () => {
    const legacy = legacyFirstBoard();
    const context = progressionContext(legacy);
    expect(resolveBoards(legacy)[0].levelIds).toEqual(
      legacy.levels.map(({ id }) => id),
    );
    const save = winFirst(context);
    expect(save.unlocked).toEqual([
      "squirrel-upgrade",
      "turtle",
      "reach",
      "nets",
    ]);
    expect(boardNavigation(context, save)).toEqual({
      previous: undefined,
      next: undefined,
    });
    expect(
      expeditionScreen(
        legacy.levels.map((level) => compileLevel(level)),
        save,
        context,
      ),
    ).not.toContain('data-action="board:');
  });
  it("requires every victory, accepts one star, announces completion exactly once and never travels automatically", () => {
    const { context } = fixture();
    const finale = recordVictoryOutcome(
      freshSave(context),
      context.boards[0].levelIds[2],
      3,
      context,
    );
    expect(finale.firstBoardComplete).toBe(false);
    expect(finale.rewards).toEqual([]);
    expect(boardUnlocked(context, "fixture-board", finale.save)).toBe(false);
    let save = recordVictoryOutcome(
      finale.save,
      context.boards[0].levelIds[0],
      1,
      context,
    ).save;
    const completed = recordVictoryOutcome(
      save,
      context.boards[0].levelIds[1],
      1,
      context,
    );
    expect(completed.completedBoard).toBe(FIRST_BOARD_ID);
    expect(completed.rewards).toEqual([rules[0].reward]);
    save = completed.save;
    expect(save.viewedBoard).toBe(FIRST_BOARD_ID);
    expect(boardComplete(context.boards[0], save)).toBe(true);
    expect(boardNavigation(context, save).next?.id).toBe("fixture-board");
    const repeated = recordVictoryOutcome(
      save,
      context.boards[0].levelIds[1],
      3,
      context,
    );
    expect(repeated.rewards).toEqual([]);
    expect(repeated.completedBoard).toBeUndefined();
    expect(recordVictoryOutcome(save, "unknown", 3, context).save).toBe(save);
  });
  it("uses authored encounter order and board gates rather than flattened recipe order", () => {
    const { context } = fixture();
    const save = winFirst(context);
    expect(encounterUnlocked(context, "fixture-1", freshSave(context))).toBe(
      false,
    );
    expect(encounterUnlocked(context, "fixture-1", save)).toBe(true);
    expect(encounterUnlocked(context, "fixture-2", save)).toBe(false);
    expect(
      encounterUnlocked(
        context,
        "fixture-2",
        recordVictoryOutcome(save, "fixture-1", 1, context).save,
      ),
    ).toBe(true);
    context.boards[1].levelIds.reverse();
    expect(encounterUnlocked(context, "fixture-2", save)).toBe(true);
    expect(encounterUnlocked(context, "fixture-1", save)).toBe(false);
  });
  it("migrates completed legacy profiles and restores viewed boards independently, recovering unknown and locked destinations", () => {
    const { context } = fixture();
    const legacy = {
      version: 2,
      stars: winFirst(context).stars,
      unlocked: [],
      music: 0.7,
    };
    const alice = createProfile("alice", "Alice", "fox", context);
    alice.progress = parseSave(JSON.stringify(legacy), context);
    expect(alice.progress.viewedBoard).toBe(FIRST_BOARD_ID);
    expect(alice.progress.unlocked).toContain("skunk-fixture");
    alice.progress = recordViewedBoard(
      alice.progress,
      "fixture-board",
      context,
    );
    const bob = createProfile("bob", "Bob", "rabbit", context);
    expect(recordViewedBoard(bob.progress, "fixture-board", context)).toBe(
      bob.progress,
    );
    const saved = loadProfiles(
      JSON.stringify({ version: 2, active: "bob", users: [alice, bob] }),
      null,
      context,
    );
    expect(saved.users[0].progress).toEqual(alice.progress);
    expect(saved.users[1].progress).toEqual(bob.progress);
    for (const invalid of ["nonexistent", "fixture-board", 42]) {
      const recovered = parseSave(
        JSON.stringify({ ...bob.progress, viewedBoard: invalid }),
        context,
      );
      expect(recovered.viewedBoard).toBe(FIRST_BOARD_ID);
    }
    const unavailable = parseSave(JSON.stringify(alice.progress));
    expect(unavailable.viewedBoard).toBe(FIRST_BOARD_ID);
    expect(unavailable.music).toBe(0.7);
    expect(
      recordViewedBoard(alice.progress, FIRST_BOARD_ID, context).unlocked,
    ).toEqual(alice.progress.unlocked);
  });
  it("agrees on reward, saved entitlement, earned upgrades and real Game replay roster without changing first-board teaching", () => {
    const { content, context } = fixture();
    let save = winFirst(context);
    const next = compileLevel(content.levels[3]);
    expect(levelForAttempt(next, save, context).availableTowers).toContain(
      "stone",
    );
    const earlier = compileLevel(content.levels[0]);
    const replay = levelForAttempt(earlier, save, context);
    expect(replay.availableTowers).toContain("stone");
    expect(
      levelForAttempt(earlier, freshSave(context), context).availableTowers,
    ).not.toContain("stone");
    save = recordVictoryOutcome(save, "fixture-1", 1, context).save;
    const upgrade = recordVictoryOutcome(save, "fixture-2", 1, context);
    expect(upgrade.rewards).toEqual([rules[1].reward]);
    const reloaded = parseSave(JSON.stringify(upgrade.save), context);
    expect(earnedUpgrades(reloaded, context)).toEqual(["stone"]);
    const game = new Game({ ...replay, startCoins: 500 }, "none", false, 42, {
      unlockedUpgrades: earnedUpgrades(reloaded, context),
    });
    expect(game.place("stone", { x: 1, z: 2 })).toBe(true);
    expect(game.upgrade(game.state.towers[0].id)).toBe(true);
    expect(
      recordVictoryOutcome(reloaded, "fixture-2", 3, context).rewards,
    ).toEqual([]);
    const result = {
      phase: "won" as const,
      stars: 1,
      goldEarned: 1,
      kills: 1,
      killsByKind: { raider: 1, runner: 0, armored: 0, boss: 0 },
    };
    expect(
      resultCard(result, upgrade.rewards, false, {
        name: context.boards[1].name,
        expeditionComplete: true,
      }),
    ).toContain("Expedition Complete!");
    save = recordViewedBoard(reloaded, "fixture-board", context);
    expect(boardNavigation(context, save).previous?.id).toBe(FIRST_BOARD_ID);
    expect(boardNavigation(context, save).next).toBeUndefined();
    expect(
      expeditionScreen(
        content.levels.map((level) => compileLevel(level)),
        save,
        context,
      ),
    ).toContain(`data-action="board:${FIRST_BOARD_ID}"`);
  });
  it("validates references, identity, illustration and anchors", () => {
    for (const mutate of [
      (c: ReturnType<typeof twoBoards>) => {
        c.boards![1].id = FIRST_BOARD_ID;
      },
      (c: ReturnType<typeof twoBoards>) => {
        c.boards![1].levelIds = ["unknown"];
      },
      (c: ReturnType<typeof twoBoards>) => {
        c.boards![1].levelIds = [c.levels[0].id];
      },
      (c: ReturnType<typeof twoBoards>) => {
        c.boards![1].visual.markers!["fixture-1"].x = NaN;
      },
      (c: ReturnType<typeof twoBoards>) => {
        delete c.boards![1].visual.markers!["fixture-1"];
      },
    ]) {
      const content = twoBoards();
      mutate(content);
      expect(() => validateContent(content)).toThrow();
    }
    expect(() => validateContent(twoBoards())).not.toThrow();
  });
});
