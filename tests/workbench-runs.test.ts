import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  type AuthoringContent,
} from "../src/config/configuration";
import {
  AttemptSession,
  runScenario,
  searchScenario,
  compareScenarios,
  validateRunReport,
  type Scenario,
} from "../src/workbench/runs";
const scenario = (levelId = "lantern-pass"): Scenario => ({
  id: "test",
  levelId,
  mode: "encounter",
  progression: "first-arrival",
  difficulty: "normal",
  seed: 42,
});
const small = () => {
  const c = structuredClone(CANONICAL_CONTENT) as AuthoringContent;
  c.levels[0].waves = [
    {
      id: "short",
      title: "One rat",
      reward: 25,
      packets: [
        {
          id: "rat",
          groups: [{ id: "single", kind: "raider", count: 1, gap: 1 }],
        },
      ],
    },
  ];
  return c;
};
describe("workbench real attempts and evidence", () => {
  it("derives arrival and earned replay capabilities through legal commands", () => {
    const first = new AttemptSession(CANONICAL_CONTENT, scenario());
    expect(
      first.command({ type: "place", kind: "bolt", point: { x: 1, z: 4 } }),
    ).toBe(true);
    expect(
      first.command({ type: "upgrade", id: first.game.state.towers[0].id }),
    ).toBe(false);
    expect(
      first.command({ type: "place", kind: "net", point: { x: 3, z: 2 } }),
    ).toBe(false);
    const replay = new AttemptSession(CANONICAL_CONTENT, {
      ...scenario(),
      progression: "replay",
      overrides: { coins: 500 },
    });
    expect(
      replay.command({ type: "place", kind: "net", point: { x: 3, z: 2 } }),
    ).toBe(true);
    expect(replay.game.state.card).toBe("none");
    const second = new AttemptSession(
      CANONICAL_CONTENT,
      scenario("rainstone-crossing"),
    );
    second.command({ type: "place", kind: "bolt", point: { x: 0, z: 4 } });
    expect(
      second.command({ type: "upgrade", id: second.game.state.towers[0].id }),
    ).toBe(true);
    const last = new AttemptSession(
      CANONICAL_CONTENT,
      scenario("the-last-lantern"),
    );
    expect(last.game.level.availableTowers).toContain("net");
    expect(last.game.state.card).toBe("none");
  });
  it("runs the recorded Lantern growth line and reproduces its outcome by legal trace", () => {
    const first = runScenario(CANONICAL_CONTENT, scenario(), {
      policyId: "lantern-growth",
      goal: { type: "encounter-win", noLivesLost: true },
    });
    expect(first.success).toBe(true);
    expect(first.lives).toBe(12);
    const replay = runScenario(CANONICAL_CONTENT, scenario(), {
      trace: first.trace,
      goal: first.goal,
    });
    expect([replay.phase, replay.lives, replay.coins, replay.seconds]).toEqual([
      first.phase,
      first.lives,
      first.coins,
      first.seconds,
    ]);
    expect(replay.rejections).toEqual([]);
    validateRunReport(replay, CANONICAL_CONTENT);
  });
  it("does not call positive hearts or a time limit a goal completion", () => {
    const report = runScenario(small(), scenario(), {
      maxTicks: 10,
      goal: { type: "encounter-win", noLivesLost: true },
    });
    expect(report.lives).toBe(report.initialLives);
    expect(report.success).toBe(false);
    expect(report.completed).toBe(false);
    expect(report.termination).toBe("time-limit");
  });
  it("branches only at preparation and retains commands leading to an authentic checkpoint", () => {
    const c = small();
    const session = new AttemptSession(c, scenario());
    session.command({ type: "place", kind: "bolt", point: { x: 1, z: 4 } });
    session.command({ type: "start" });
    expect(() => session.branch()).toThrow(/preparation/);
    expect(session.trace).toHaveLength(2);
    const replay = new AttemptSession(c, scenario());
    replay.replay(session.trace);
    expect(replay.branch()).toBe(true);
    replay.step();
    expect(replay.game.state.phase).toBe("preparation");
    expect(replay.trace).toHaveLength(0);
  });
  it("rejects illegal synthetic formations and labels isolated wave resources", () => {
    expect(
      () =>
        new AttemptSession(small(), {
          ...scenario(),
          formation: [{ kind: "bolt", point: { x: 2, z: 3 } }],
        }),
    ).toThrow(/illegal/);
    const session = new AttemptSession(small(), {
      ...scenario(),
      mode: "wave",
      waveId: "short",
      overrides: { coins: 1000, lives: 25 },
      formation: [{ kind: "bolt", point: { x: 1, z: 4 } }],
    });
    expect(session.synthetic).toBe(true);
    expect(session.game.state.coins).toBe(960);
    expect(session.initialLives).toBe(25);
  });
  it("compares a fixed plan and reports actions invalidated by changed costs", () => {
    const before = small(),
      after = small();
    after.towers.bolt.cost = 101;
    const result = compareScenarios(before, after, scenario(), {
      trace: [
        {
          tick: 0,
          command: { type: "place", kind: "bolt", point: { x: 1, z: 4 } },
          accepted: true,
        },
        { tick: 0, command: { type: "start" }, accepted: true },
      ],
    });
    expect(result.mode).toBe("fixed-plan");
    expect(result.invalidatedCommands).toHaveLength(1);
    expect(result.before.configurationIdentity).not.toBe(
      result.after.configurationIdentity,
    );
  });
  it("finds a bounded replayable defense and honestly reports exhausted search", () => {
    const c = small();
    const result = searchScenario(
      c,
      scenario(),
      { type: "encounter-win", noLivesLost: true },
      6,
      3000,
    );
    expect(result.found).toBe(true);
    expect(result.report?.success).toBe(true);
    const fail = searchScenario(c, scenario(), { type: "encounter-win" }, 1, 5);
    expect(fail.found).toBe(false);
    expect(fail.reason).toContain("not proof");
  });
  it("preserves required boss defeat and recorded finale strategy loss", () => {
    const result = runScenario(
      CANONICAL_CONTENT,
      scenario("the-last-lantern"),
      { policyId: "finale-mixed" },
    );
    expect(result.phase).toBe("lost");
    expect(result.success).toBe(false);
    expect(result.bossRequired).toBe(true);
  });
  it("changes actual policy decision cadence and rejects unsupported imported result fields", () => {
    const c = small();
    const slow = runScenario(c, scenario(), {
      policyId: "coverage-first",
      cadenceTicks: 30,
      maxTicks: 20,
    });
    expect(slow.policy?.cadenceTicks).toBe(30);
    expect(slow.trace.every((row) => row.tick % 30 === 0)).toBe(true);
    expect(() => validateRunReport({ ...slow, unknown: true }, c)).toThrow(
      /unsupported/,
    );
    expect(() =>
      validateRunReport({ ...slow, configurationIdentity: "wrong" }, c),
    ).toThrow(/identity/);
  });
});
