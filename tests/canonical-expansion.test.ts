import { expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../src/config/configuration";
import { LEVELS } from "../src/content/levels";
import {
  boardNavigation,
  boardUnlocked,
  encounterUnlocked,
  earnedUpgrades,
  levelForAttempt,
  progressionContext,
} from "../src/content/progression";
import {
  createProfile,
  loadProfiles,
  PROFILES_KEY,
} from "../src/persistence/profiles";
import {
  freshSave,
  parseSave,
  recordVictoryOutcome,
  recordViewedBoard,
  SAVE_KEY,
} from "../src/persistence/save";
import {
  campaign,
  createAttempt,
} from "../review/mosswater-encounters/strategies";
import { resultCard } from "../src/ui/game-chrome";

const context = progressionContext();
const expedition = campaign(CANONICAL_CONTENT);

it("takes ordinary fresh profiles through every canonical gate, earned roster, saved destination and twin-boss completion", () => {
  const player = createProfile("expedition", "Expedition", "fox");
  const other = createProfile("fresh", "Fresh", "rabbit");
  player.progress.music = 0.25;
  player.progress.showGrid = true;
  let profiles: ReturnType<typeof loadProfiles> = {
    version: 2 as const,
    active: player.id,
    users: [player, other],
  };
  expect(LEVELS.map((l) => l.id)).toEqual(context.levelIds);
  expect(expedition.reports).toHaveLength(8);
  for (const [index, report] of expedition.reports.entries()) {
    const current = profiles.users[0];
    expect(encounterUnlocked(context, report.id, current.progress)).toBe(true);
    if (index < 7)
      expect(
        encounterUnlocked(
          context,
          context.levelIds[index + 1],
          current.progress,
        ),
      ).toBe(false);
    const attempt = createAttempt(
      CANONICAL_CONTENT,
      report.id,
      current.progress,
    );
    expect(attempt.state.coins).toBe(LEVELS[index].startCoins);
    expect(attempt.state.lives).toBe(CANONICAL_CONTENT.rules.normalLives);
    if (index === 0) expect(attempt.level.availableTowers).toEqual(["bolt"]);
    if (index >= 3)
      expect(attempt.level.availableTowers).toEqual(["bolt", "net", "stone"]);
    if (index === 3) {
      expect(attempt.place("stone", { x: 1, z: 2 })).toBe(true);
      expect(attempt.upgrade(attempt.state.towers[0].id)).toBe(false);
      current.progress = recordViewedBoard(current.progress, "mosswater-reach");
    }
    if (index === 5) {
      expect(attempt.place("stone", { x: 0, z: 4 })).toBe(true);
      expect(attempt.upgrade(attempt.state.towers[0].id)).toBe(true);
    }
    expect(report.phase).toBe("won");
    expect(report.trace.every((c) => c.accepted)).toBe(true);
    const outcome = recordVictoryOutcome(current.progress, report.id, 1);
    expect(outcome.firstBoardComplete).toBe(index === 2);
    if (index === 2) {
      expect(outcome.rewards).toContainEqual({
        kind: "tower-unlock",
        tower: "stone",
      });
      expect(outcome.save.viewedBoard).toBe("first-board");
      expect(boardNavigation(context, outcome.save).next?.id).toBe(
        "mosswater-reach",
      );
    }
    if (index === 4)
      expect(outcome.rewards).toEqual([
        { kind: "tower-upgrade", tower: "stone" },
      ]);
    current.progress = outcome.save;
    profiles = loadProfiles(JSON.stringify(profiles), null);
    expect(profiles.active).toBe(player.id);
    expect(profiles.users[1].progress).toEqual(freshSave());
    expect(profiles.users[0].progress.music).toBe(0.25);
    expect(profiles.users[0].progress.showGrid).toBe(true);
    if (index >= 3)
      expect(profiles.users[0].progress.viewedBoard).toBe("mosswater-reach");
    if (index === 7) {
      expect(outcome.completedBoard).toBe("mosswater-reach");
      expect(report.kills.boss).toBe(2);
      expect(attempt.level.requiresBossDefeat).toBe(true);
      const result = {
        phase: "won" as const,
        stars: 1,
        goldEarned: report.coins,
        kills: Object.values(report.kills).reduce((a, b) => a + b, 0),
        killsByKind: report.kills as {
          raider: number;
          runner: number;
          armored: number;
          boss: number;
        },
      };
      expect(
        resultCard(result, outcome.rewards, false, {
          name: context.boards[1].name,
          expeditionComplete: true,
        }),
      ).toContain("Expedition Complete!");
      const replay = recordVictoryOutcome(outcome.save, report.id, 3);
      expect(replay.completedBoard).toBeUndefined();
      expect(replay.rewards).toEqual([]);
    }
  }
  const complete = profiles.users[0].progress;
  expect(earnedUpgrades(complete)).toEqual(["bolt", "stone"]);
  expect(boardNavigation(context, complete).next).toBeUndefined();
  expect(recordViewedBoard(complete, "first-board").stars).toEqual(
    complete.stars,
  );
  expect(levelForAttempt(LEVELS[0], complete).availableTowers).toEqual([
    "bolt",
    "net",
    "stone",
  ]);
});

it.each([1, 2])(
  "migrates a real first-board completion from save version %s without invented Mosswater victories or another player's entitlements",
  (version) => {
    const stars = Object.fromEntries(
      expedition.reports.slice(0, 3).map((r) => {
        expect(r.phase).toBe("won");
        return [r.id, 1];
      }),
    );
    const legacy = {
      version,
      stars,
      unlocked: ["reach", "nets"],
      music: 0.7,
      effects: 0.4,
      muted: true,
      showGrid: true,
      tutorialSeen: true,
    };
    const restored = loadProfiles(
      JSON.stringify({ version: 1, active: 0, slots: [legacy, freshSave()] }),
      null,
    );
    expect(restored.users).toHaveLength(1);
    const save = restored.users[0].progress;
    expect(save.stars).toEqual(stars);
    expect(save.unlocked).toEqual([
      "reach",
      "nets",
      "squirrel-upgrade",
      "turtle",
      "skunk",
    ]);
    expect(save.unlocked).not.toContain("skunk-upgrade");
    expect(save.viewedBoard).toBe("first-board");
    expect(save.muted).toBe(true);
    expect(save.showGrid).toBe(true);
    expect(boardNavigation(context, save).next?.id).toBe("mosswater-reach");
    expect(encounterUnlocked(context, "mosswater-01", save)).toBe(true);
    expect(encounterUnlocked(context, "mosswater-02", save)).toBe(false);
    expect(
      levelForAttempt(
        resolveConfiguration(CANONICAL_CONTENT, "mosswater-01").level,
        save,
      ).availableTowers,
    ).toContain("stone");
    const viewed = recordViewedBoard(save, "mosswater-reach");
    expect(parseSave(JSON.stringify(viewed))).toEqual(viewed);
    expect(recordViewedBoard(freshSave(), "mosswater-reach")).toEqual(
      freshSave(),
    );
    expect(
      parseSave(
        JSON.stringify({ ...freshSave(), viewedBoard: "mosswater-reach" }),
      ).viewedBoard,
    ).toBe("first-board");
    for (const missing of context.boards[0].levelIds) {
      const partial = parseSave(
        JSON.stringify({ ...legacy, stars: { ...stars, [missing]: 0 } }),
      );
      expect(boardUnlocked(context, "mosswater-reach", partial)).toBe(false);
      expect(partial.unlocked).not.toContain("skunk");
    }
    expect(PROFILES_KEY).toBe("stormwatch.profiles.v1");
    expect(SAVE_KEY).toBe("stormwatch.save.v1");
    expect(createProfile("another", "Another", "rabbit").progress).toEqual(
      freshSave(),
    );
  },
);
