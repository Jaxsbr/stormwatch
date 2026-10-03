import { describe, expect, it } from "vitest";
import candidate from "../review/mosswater-encounters/game-content.json";
import {
  campaign,
  play,
  createAttempt,
} from "../review/mosswater-encounters/strategies";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
  validateContent,
  type AuthoringContent,
} from "../src/config/configuration";
import {
  describeEncounter,
  validateAuthoredVisuals,
} from "../src/content/encounter-visuals";
import {
  progressionContext,
  earnedUpgrades,
  boardNavigation,
  levelForAttempt,
} from "../src/content/progression";
import {
  freshSave,
  parseSave,
  recordVictoryOutcome,
  recordViewedBoard,
} from "../src/persistence/save";
import { compileSpawnSchedule } from "../src/sim/spawn-schedule";
import { enemyInspection } from "../src/ui/enemy-inspection";
import { advantageScreen } from "../src/ui/advantage-screen";
import { battleMenuMarkup } from "../src/ui/battle-menu";
import {
  createWorkingDraft,
  validateWorkingDraft,
  promoteWorkingWave,
} from "../src/workbench/working-draft";

const content = candidate as AuthoringContent;
const context = progressionContext(content);
const expedition = campaign(content);
function entry(id: string) {
  let save = freshSave(context);
  for (const r of expedition.reports) {
    if (r.id === id) break;
    expect(r.phase).toBe("won");
    save = recordVictoryOutcome(save, r.id, 1, context).save;
  }
  return save;
}

describe("held Mosswater candidate through resolved content and real Game", () => {
  it("keeps the current canonical campaign inactive and validates the complete 3/3/3/5/5 candidate", () => {
    expect(CANONICAL_CONTENT.levels).toHaveLength(3);
    expect(progressionContext().discoveries.map((d) => d.id)).not.toContain(
      "skunk",
    );
    validateContent(content);
    validateAuthoredVisuals(content);
    expect(content.levels.slice(0, 3)).toEqual(CANONICAL_CONTENT.levels);
    expect(content.levels.slice(3).map((m) => m.waves.length)).toEqual([
      3, 3, 3, 5, 5,
    ]);
    expect(context.boards[1].levelIds).toEqual([
      "mosswater-01",
      "mosswater-02",
      "mosswater-03",
      "mosswater-04",
      "mosswater-05",
    ]);
  });
  it("reuses exact approved geometry, stages Rats, starts both Weasel lanes, and schedules simultaneous twin bosses only in wave five", () => {
    const levels = content.levels
      .slice(3)
      .map((m) => resolveConfiguration(content, m.id).level);
    expect(levels[0].routes).toEqual(levels[1].routes);
    expect(levels[0].routes).toEqual(levels[4].routes);
    expect(levels[0].blocked).toEqual([]);
    const rainstone = resolveConfiguration(content, "rainstone-crossing").level;
    expect(rainstone.routes).toBeUndefined();
    for (const level of levels.slice(2, 4)) {
      expect(level.routes).toEqual([
        { id: "rainstone-route", path: rainstone.path },
      ]);
      expect(level.path).toEqual(rainstone.path);
      expect(level.blocked).toEqual(rainstone.blocked);
      expect([level.width, level.depth]).toEqual([
        rainstone.width,
        rainstone.depth,
      ]);
      expect(
        compileSpawnSchedule(level.waves[0]).every(
          (spawn) => spawn.routeId === "rainstone-route",
        ),
      ).toBe(true);
    }
    const rats = compileSpawnSchedule(levels[0].waves[0]);
    expect(rats.find((s) => s.routeId === "route-b")!.at).toBeGreaterThan(
      rats.filter((s) => s.routeId === "route-a").at(-1)!.at,
    );
    for (const w of levels[1].waves) {
      const s = compileSpawnSchedule(w);
      expect(s.find((g) => g.routeId === "route-a")!.at).toBe(
        s.find((g) => g.routeId === "route-b")!.at,
      );
      expect(s.every((g) => g.kind === "runner")).toBe(true);
    }
    expect(
      levels[2].waves.every((w) => w.groups.every((g) => g.kind === "armored")),
    ).toBe(true);
    const finale = levels[4];
    expect(finale.requiresBossDefeat).toBe(true);
    expect(
      finale.waves
        .slice(0, 4)
        .flatMap((w) => w.groups)
        .some((g) => g.kind === "boss"),
    ).toBe(false);
    const bosses = compileSpawnSchedule(finale.waves[4]).filter(
      (s) => s.kind === "boss",
    );
    expect(bosses).toHaveLength(2);
    expect(bosses[0].tick).toBe(bosses[1].tick);
    expect(bosses.map((s) => s.routeId)).toEqual(["route-a", "route-b"]);
    levels.forEach((level) => {
      const art = describeEncounter(
        levelForAttempt(level, entry(level.id), context),
      );
      expect(art.defenders.map((d) => d.kind)).toEqual([
        "bolt",
        "net",
        "stone",
      ]);
      expect(art.enemies.map((e) => e.kind)).toEqual([
        ...new Set(level.waves.flatMap((w) => w.groups.map((g) => g.kind))),
      ]);
    });
  });
  it("earns every encounter from fresh normal-mode campaign wins and defeats both finale bosses without state injections", () => {
    expect(expedition.reports).toHaveLength(8);
    expect(expedition.reports.every((r) => r.phase === "won")).toBe(true);
    expect(
      expedition.reports.every((r) => r.trace.every((c) => c.accepted)),
    ).toBe(true);
    expect(expedition.reports.at(-1)!.kills.boss).toBe(2);
    expect(expedition.reports.slice(3).map((r) => r.lives)).toEqual([
      12, 6, 12, 6, 12,
    ]);
    expect(expedition.save.unlocked).toContain("skunk-upgrade");
  });
  it("preserves meaningful losses and contrasting wins on earned entry resources", () => {
    expect(
      play(content, "mosswater-01", entry("mosswater-01"), "one-lane").phase,
    ).toBe("lost");
    expect(
      play(content, "mosswater-02", entry("mosswater-02"), "direct").phase,
    ).toBe("lost");
    expect(
      play(content, "mosswater-03", entry("mosswater-03"), "poison-only").phase,
    ).toBe("lost");
    expect(
      play(content, "mosswater-03", entry("mosswater-03"), "direct").phase,
    ).toBe("won");
    const directMixed = play(
      content,
      "mosswater-04",
      entry("mosswater-04"),
      "direct",
    );
    const upgradedMixed = play(
      content,
      "mosswater-04",
      entry("mosswater-04"),
      "upgrades",
    );
    expect(directMixed.phase).toBe("won");
    expect(upgradedMixed.phase).toBe("won");
    expect(directMixed.lives).toBeLessThan(upgradedMixed.lives);
    for (const policy of ["direct", "poison-only"] as const) {
      const r = play(content, "mosswater-05", entry("mosswater-05"), policy);
      expect(r.phase).toBe("lost");
      expect(r.kills.boss).toBeLessThan(2);
    }
    expect(
      play(content, "mosswater-05", entry("mosswater-05"), "upgrades").phase,
    ).toBe("won");
  });
  it("grants Skunk only after all first-board wins, upgrade only after 02, migrates legacy victories and permits earned replays", () => {
    const before = entry("mosswater-01");
    expect(before.unlocked).toContain("skunk");
    expect(earnedUpgrades(before, context)).toEqual(["bolt"]);
    expect(
      createAttempt(content, "mosswater-01", before).level.availableTowers,
    ).toContain("stone");
    expect(entry("mosswater-02").unlocked).not.toContain("skunk-upgrade");
    expect(earnedUpgrades(entry("mosswater-03"), context)).toEqual([
      "bolt",
      "stone",
    ]);
    const legacy = parseSave(
      JSON.stringify({ ...before, unlocked: [] }),
      context,
    );
    expect(legacy.unlocked).toContain("skunk");
    expect(
      levelForAttempt(
        resolveConfiguration(content, "lantern-pass").level,
        legacy,
        context,
      ).availableTowers,
    ).toContain("stone");
    expect(
      levelForAttempt(
        resolveConfiguration(content, "lantern-pass").level,
        freshSave(context),
        context,
      ).availableTowers,
    ).toEqual(["bolt"]);
    const viewed = recordViewedBoard(before, "mosswater-reach", context);
    expect(parseSave(JSON.stringify(viewed), context).viewedBoard).toBe(
      "mosswater-reach",
    );
    expect(boardNavigation(context, viewed).previous?.id).toBe("first-board");
    expect(boardNavigation(context, viewed).next).toBeUndefined();
  });
  it("describes permanent tough skin and real counterplay in briefing and paused enemy inspection", () => {
    const game = createAttempt(content, "mosswater-03", entry("mosswater-03"));
    expect(advantageScreen(game.level, [], "none")).toContain(
      "permanently poison immune",
    );
    const panel = enemyInspection(game.level, game.enemies);
    expect(panel).toContain("permanently immune to poison");
    expect(panel).toContain("Skunk blasts still damage");
    expect(panel).toContain("Turtle nets slow");
    const menu = battleMenuMarkup(freshSave(), undefined, {
      level: game.level,
      enemies: game.enemies,
    });
    expect(menu).toContain("menu-enemies");
    expect(menu).toContain(panel);
  });
  it("roundtrips selected wave editing through draft serialization and scoped promotion without changing another map or running attempt", () => {
    const draft = createWorkingDraft(content);
    draft.levelId = "mosswater-04";
    draft.waveId = "mosswater-04-wave-2";
    const map = draft.content.levels.find((m) => m.id === draft.levelId)!;
    const wave = map.waves.find((w) => w.id === draft.waveId)!;
    wave.reward += 7;
    const saved = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
    const running = createAttempt(
      content,
      "mosswater-04",
      entry("mosswater-04"),
    );
    const playtest = resolveConfiguration(saved.content, saved.levelId);
    const promoted = promoteWorkingWave(content, saved);
    expect(
      resolveConfiguration(promoted, saved.levelId).level.waves[1].reward,
    ).toBe(playtest.level.waves[1].reward);
    expect(running.level.waves[1].reward).toBe(
      content.levels[6].waves[1].reward,
    );
    expect(promoted.levels.filter((m) => m.id !== saved.levelId)).toEqual(
      content.levels.filter((m) => m.id !== saved.levelId),
    );
    expect(promoted.levels[6].waves[0]).toEqual(content.levels[6].waves[0]);
  });
});
