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
  evaluateGoal,
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
  it("matches canonical and selected named difficulty recipes without replacing the baseline", () => {
    const baseline = small();
    const candidate = small();
    candidate.towers.bolt.cost = 101;
    baseline.enemies.raider.hp = 10;
    candidate.enemies.raider.hp = 10;
    const setup = {
      ...scenario(),
      difficultyCandidate: { id: "costly-defenders", content: candidate },
    };
    const result = compareScenarios(baseline, baseline, setup, {
      trace: [
        {
          tick: 0,
          command: { type: "place", kind: "bolt", point: { x: 1, z: 4 } },
          accepted: true,
        },
        { tick: 0, command: { type: "start" }, accepted: true },
      ],
      maxTicks: 3000,
      goal: { type: "encounter-win", noLivesLost: true },
    });
    expect(result.before.scenario.difficultyCandidate).toBeUndefined();
    expect(result.after.scenario.difficultyCandidate?.id).toBe(
      "costly-defenders",
    );
    expect(result.before.recipeIdentity).not.toBe(result.after.recipeIdentity);
    expect(result.before.scenario.seed).toBe(result.after.scenario.seed);
    expect(result.invalidatedCommands).toHaveLength(1);
    expect(result.before.success).toBe(true);
    expect(result.after.success).toBe(false);
  });
  it("replays only baseline commands for a fixed comparison initiated with a search plan", () => {
    const content = small();
    const result = compareScenarios(content, content, scenario(), {
      plan: {
        sites: [
          { x: 1, z: 4 },
          { x: 3, z: 2 },
        ],
        kind: "bolt",
        upgradeFirst: false,
      },
      maxTicks: 3000,
    });
    expect(result.before.success).toBe(true);
    expect(result.after.trace).toEqual(result.before.trace);
    expect(result.after.coins).toBe(result.before.coins);
    expect(result.after.lives).toBe(result.before.lives);
  });
  it("uses one goal evaluator for session reports and loop completion including wave and loss constraints", () => {
    const content = small();
    content.enemies.raider.hp = 10000; // Guarantee a leak independently of ability balance.
    const session = new AttemptSession(content, scenario());
    session.command({ type: "place", kind: "bolt", point: { x: 1, z: 4 } });
    session.command({ type: "start" });
    const goal = {
      type: "wave-clear" as const,
      waveId: "short",
      noLivesLost: true,
    };
    expect(session.report(goal).success).toBe(
      evaluateGoal(session, goal).success,
    );
    for (let i = 0; i < 3000 && session.game.state.phase === "wave"; i++)
      session.step();
    expect(evaluateGoal(session, goal)).toMatchObject({
      completed: true,
      success: false,
      bossRequired: false,
    });
    expect(session.report(goal)).toMatchObject(evaluateGoal(session, goal));
    expect(evaluateGoal(session, { ...goal, noLivesLost: false }).success).toBe(
      true,
    );
  });
  it("locks manual changes while replaying until an explicit preparation branch", () => {
    const session = new AttemptSession(small(), scenario());
    session.replay([
      {
        tick: 0,
        command: { type: "place", kind: "bolt", point: { x: 1, z: 4 } },
        accepted: true,
      },
    ]);
    expect(session.replayLocked).toBe(true);
    expect(
      session.command({ type: "place", kind: "bolt", point: { x: 3, z: 2 } }),
    ).toBe(false);
    expect(session.trace).toHaveLength(0);
    session.step();
    expect(session.game.state.towers).toHaveLength(1);
    expect(session.trace).toHaveLength(1);
    expect(session.branch()).toBe(true);
    expect(session.replayLocked).toBe(false);
    expect(
      session.command({ type: "place", kind: "bolt", point: { x: 3, z: 2 } }),
    ).toBe(true);
  });
  it("holds authentic later-wave replay preparation until continue or manual branch", () => {
    const c = small();
    c.enemies.raider.hp = 10;
    c.levels[0].waves.push({
      ...structuredClone(c.levels[0].waves[0]),
      id: "later",
      title: "Later",
    });
    const recorded = runScenario(c, scenario(), {
      policyId: "lantern-growth",
      maxTicks: 3000,
    });
    expect(recorded.success).toBe(true);
    const held = new AttemptSession(c, scenario());
    held.replay(recorded.trace, { stopAtPreparationWaveId: "later" });
    for (let n = 0; n < 3000 && !held.preparationHeld; n++) held.step();
    expect(held.preparationHeld).toBe(true);
    expect(held.game.state.phase).toBe("preparation");
    expect(held.game.state.wave).toBe(1);
    expect(held.checkpoints[0]).toEqual(recorded.checkpoints[0]);
    const tick = held.tickIndex,
      clock = held.game.state.clock,
      countdown = held.game.state.nextWaveCountdown,
      trace = structuredClone(held.trace);
    for (let n = 0; n < 100; n++) expect(held.step()).toEqual([]);
    expect([
      held.tickIndex,
      held.game.state.clock,
      held.game.state.nextWaveCountdown,
    ]).toEqual([tick, clock, countdown]);
    expect(held.command({ type: "pause" })).toBe(false);
    expect(held.game.state.phase).toBe("preparation");
    expect(held.continueReplay()).toBe(true);
    held.step();
    expect(held.game.state.phase).toBe("wave");
    const branched = new AttemptSession(c, scenario());
    branched.replay(recorded.trace, { stopAtPreparationWaveId: "later" });
    while (!branched.preparationHeld) branched.step();
    expect(branched.branch()).toBe(true);
    expect(branched.trace).toEqual(trace);
    expect(branched.preparationHeld).toBe(false);
    expect(branched.replayLocked).toBe(false);
    expect(branched.command({ type: "start" })).toBe(true);
  });
  it("holds initial isolated-wave preparation and rejects unknown replay targets", () => {
    const c = small();
    const session = new AttemptSession(c, {
      ...scenario(),
      mode: "wave",
      waveId: "short",
    });
    expect(() =>
      session.replay([], { stopAtPreparationWaveId: "missing" }),
    ).toThrow(/Unknown/);
    session.replay([{ tick: 0, command: { type: "start" }, accepted: true }], {
      stopAtPreparationWaveId: "short",
    });
    expect(session.preparationHeld).toBe(true);
    session.step();
    expect(session.tickIndex).toBe(0);
    session.continueReplay();
    session.step();
    expect(session.game.state.phase).toBe("wave");
  });
});
