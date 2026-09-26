import {
  configurationIdentity,
  type AuthoringContent,
} from "../config/configuration";
import { Game } from "../sim/game";
import type { GameEvent, Phase, TowerKind } from "../sim/types";
import {
  executeCommand,
  type LegalCommand,
  type RecordedCommand,
} from "./commands";
import {
  resolveScenario,
  strictKeys,
  validateScenario,
  type Scenario,
} from "./scenarios";
export const FIXED_STEP = 1 / 30;
declare const __STORMWATCH_ENGINE_REVISION__: string;
export const ENGINE_REVISION =
  typeof __STORMWATCH_ENGINE_REVISION__ !== "undefined"
    ? __STORMWATCH_ENGINE_REVISION__
    : "development-unversioned";
export type { Scenario } from "./scenarios";
export interface Goal {
  type: "wave-clear" | "encounter-win";
  waveId?: string;
  noLivesLost?: boolean;
}
export interface Checkpoint {
  waveId: string;
  wave: number;
  lives: number;
  coins: number;
  leaks: number;
  goldEarned: number;
  seconds: number;
  towers: number;
  upgraded: number;
}
export interface RunReport {
  schemaVersion: 1;
  configurationIdentity: string;
  recipeIdentity: string;
  engineRevision: string;
  fixedStep: number;
  scenario: Scenario;
  synthetic: boolean;
  initialLives: number;
  trace: RecordedCommand[];
  rejections: RecordedCommand[];
  checkpoints: Checkpoint[];
  transactions: {
    tick: number;
    command: LegalCommand;
    coinsBefore: number;
    coinsAfter: number;
  }[];
  phase: Phase;
  completed: boolean;
  goal: Goal;
  success: boolean;
  bossDefeated: boolean;
  bossRequired: boolean;
  lives: number;
  leaks: number;
  coins: number;
  goldEarned: number;
  seconds: number;
  ticks: number;
  towerMix: Record<TowerKind, number>;
  upgraded: number;
  policy?: PolicyDefinition;
  termination: "goal" | "won" | "lost" | "time-limit" | "paused";
  events: { tick: number; event: GameEvent }[];
}
export function validateTrace(
  value: unknown,
): asserts value is RecordedCommand[] {
  if (!Array.isArray(value)) throw new Error("Trace must be an array");
  let previous = -1;
  for (const row of value) {
    strictKeys(row, ["tick", "command", "accepted"], "trace");
    if (
      !Number.isInteger(row.tick) ||
      Number(row.tick) < previous ||
      typeof row.accepted !== "boolean"
    )
      throw new Error("Invalid trace tick/order/acceptance");
    previous = Number(row.tick);
    strictKeys(row.command, ["type", "kind", "point", "id"], "command");
    const c = row.command;
    if (c.type === "place") {
      strictKeys(c, ["type", "kind", "point"], "place");
      strictKeys(c.point, ["x", "z"], "point");
      if (
        !["bolt", "stone", "net"].includes(c.kind as string) ||
        !Number.isInteger(c.point.x) ||
        !Number.isInteger(c.point.z)
      )
        throw new Error("Invalid placement");
    } else if (c.type === "upgrade" || c.type === "sell") {
      strictKeys(c, ["type", "id"], "tower command");
      if (!Number.isInteger(c.id) || Number(c.id) < 1)
        throw new Error("Invalid tower ID");
    } else if (c.type === "start" || c.type === "pause")
      strictKeys(c, ["type"], "command");
    else throw new Error("Unknown command");
  }
}
export function validateGoal(goal: Goal) {
  strictKeys(goal, ["type", "waveId", "noLivesLost"], "goal");
  if (
    !["wave-clear", "encounter-win"].includes(goal.type) ||
    (goal.noLivesLost !== undefined && typeof goal.noLivesLost !== "boolean") ||
    (goal.waveId !== undefined && typeof goal.waveId !== "string")
  )
    throw new Error("Invalid goal");
}
export class AttemptSession {
  readonly game: Game;
  readonly scenario: Scenario;
  readonly synthetic: boolean;
  readonly initialLives: number;
  readonly recipeIdentity: string;
  readonly configurationIdentity: string;
  tickIndex = 0;
  trace: RecordedCommand[] = [];
  checkpoints: Checkpoint[] = [];
  transactions: RunReport["transactions"] = [];
  events: RunReport["events"] = [];
  private pending: RecordedCommand[] = [];
  constructor(content: AuthoringContent, scenario: Scenario) {
    const resolved = resolveScenario(content, scenario);
    this.scenario = resolved.scenario;
    this.synthetic = resolved.synthetic;
    this.initialLives = resolved.initialLives;
    this.recipeIdentity = configurationIdentity(
      scenario.difficultyCandidate?.content ?? content,
    );
    this.configurationIdentity = resolved.configuration.identity;
    this.game = new Game(
      resolved.configuration.level,
      resolved.card,
      resolved.assist,
      scenario.seed,
      {
        configuration: resolved.configuration,
        unlockedUpgrades: resolved.unlockedUpgrades,
      },
    );
    this.game.state.lives = this.initialLives;
    this.game.state.maxLives = this.initialLives;
    for (const f of scenario.formation ?? []) {
      if (!this.command({ type: "place", kind: f.kind, point: f.point }))
        throw new Error("Formation placement is illegal or unaffordable");
      if (
        f.upgraded &&
        !this.command({
          type: "upgrade",
          id: this.game.state.towers.at(-1)!.id,
        })
      )
        throw new Error("Formation upgrade is illegal or unaffordable");
    }
    this.trace = [];
    this.transactions = [];
    this.game.drainEvents();
  }
  command(command: LegalCommand): boolean {
    validateTrace([{ tick: this.tickIndex, command, accepted: true }]);
    const before = this.game.state.coins;
    const accepted = executeCommand(this.game, command);
    this.trace.push({
      tick: this.tickIndex,
      command: structuredClone(command),
      accepted,
    });
    if (accepted && ["place", "upgrade", "sell"].includes(command.type))
      this.transactions.push({
        tick: this.tickIndex,
        command: structuredClone(command),
        coinsBefore: before,
        coinsAfter: this.game.state.coins,
      });
    return accepted;
  }
  replay(trace: RecordedCommand[]) {
    validateTrace(trace);
    if (trace.some((c) => c.tick < this.tickIndex))
      throw new Error("Replay begins before current tick");
    this.pending = structuredClone(trace);
  }
  branch() {
    if (this.game.state.phase !== "preparation")
      throw new Error("Branching requires preparation");
    this.pending = [];
    return true;
  }
  step(): GameEvent[] {
    while (this.pending.length && this.pending[0].tick === this.tickIndex)
      this.command(this.pending.shift()!.command);
    this.game.tick(FIXED_STEP);
    this.tickIndex++;
    const events = this.game.drainEvents();
    for (const event of events) {
      this.events.push({ tick: this.tickIndex, event });
      if (event.type === "payout") {
        const s = this.game.state;
        this.checkpoints.push({
          waveId: this.game.level.waves[s.wave - 1].id!,
          wave: s.wave,
          lives: s.lives,
          coins: s.coins,
          leaks: s.leaks,
          goldEarned: s.goldEarned,
          seconds: s.clock,
          towers: s.towers.length,
          upgraded: s.towers.filter((t) => t.level === 2).length,
        });
      }
    }
    return events;
  }
  report(
    goal: Goal = { type: "encounter-win" },
    termination: RunReport["termination"] = "time-limit",
    policy?: PolicyDefinition,
  ): RunReport {
    validateGoal(goal);
    const s = this.game.state;
    const target = goal.waveId ?? this.game.level.waves.at(-1)!.id;
    const completed =
      goal.type === "encounter-win"
        ? s.phase === "won"
        : this.checkpoints.some((c) => c.waveId === target);
    const bossRequired =
      !!this.game.level.requiresBossDefeat &&
      (goal.type === "encounter-win" ||
        target === this.game.level.waves.at(-1)!.id);
    const bossDefeated = s.killsByKind.boss > 0;
    return {
      schemaVersion: 1,
      configurationIdentity: this.configurationIdentity,
      recipeIdentity: this.recipeIdentity,
      engineRevision: ENGINE_REVISION,
      fixedStep: FIXED_STEP,
      scenario: structuredClone(this.scenario),
      synthetic: this.synthetic,
      initialLives: this.initialLives,
      trace: structuredClone(this.trace),
      rejections: this.trace.filter((c) => !c.accepted),
      checkpoints: structuredClone(this.checkpoints),
      transactions: structuredClone(this.transactions),
      phase: s.phase,
      completed,
      goal,
      success:
        completed &&
        (!bossRequired || bossDefeated) &&
        (!goal.noLivesLost || s.lives === this.initialLives),
      bossDefeated,
      bossRequired,
      lives: s.lives,
      leaks: s.leaks,
      coins: s.coins,
      goldEarned: s.goldEarned,
      seconds: s.clock,
      ticks: this.tickIndex,
      towerMix: {
        bolt: s.towers.filter((t) => t.kind === "bolt").length,
        stone: s.towers.filter((t) => t.kind === "stone").length,
        net: s.towers.filter((t) => t.kind === "net").length,
      },
      upgraded: s.towers.filter((t) => t.level === 2).length,
      policy,
      termination,
      events: structuredClone(this.events),
    };
  }
}
export function goalSatisfied(session: AttemptSession, goal: Goal): boolean {
  const game = session.game;
  const target = goal.waveId ?? game.level.waves.at(-1)!.id;
  const complete =
    goal.type === "encounter-win"
      ? game.state.phase === "won"
      : session.checkpoints.some((c) => c.waveId === target);
  const requiresBoss =
    !!game.level.requiresBossDefeat &&
    (goal.type === "encounter-win" || target === game.level.waves.at(-1)!.id);
  return (
    complete &&
    (!requiresBoss || game.state.killsByKind.boss > 0) &&
    (!goal.noLivesLost || game.state.lives === session.initialLives)
  );
}
export interface PolicyDefinition {
  id: string;
  version: 1;
  cadenceTicks: number;
  maxActionsPerDecision: number;
  allowedTowers: TowerKind[];
  liveSpending: boolean;
  preparation: "start-immediately";
  description: string;
}
export const POLICIES: PolicyDefinition[] = [
  {
    id: "lantern-growth",
    version: 1,
    cadenceTicks: 1,
    maxActionsPerDecision: 3,
    allowedTowers: ["bolt"],
    liveSpending: true,
    preparation: "start-immediately",
    description:
      "Recorded Lantern Pass strategy: two opening Squirrels, one live reinforcement, then one per preparation.",
  },
  {
    id: "coverage-first",
    version: 1,
    cadenceTicks: 1,
    maxActionsPerDecision: 2,
    allowedTowers: ["bolt"],
    liveSpending: true,
    preparation: "start-immediately",
    description:
      "Rainstone coverage strategy: fill recorded sites before upgrading; spends every fixed tick.",
  },
  {
    id: "upgrades-first",
    version: 1,
    cadenceTicks: 1,
    maxActionsPerDecision: 2,
    allowedTowers: ["bolt"],
    liveSpending: true,
    preparation: "start-immediately",
    description:
      "Rainstone upgrade strategy: upgrade after three defenders; then fill recorded sites.",
  },
  {
    id: "finale-mixed",
    version: 1,
    cadenceTicks: 1,
    maxActionsPerDecision: 5,
    allowedTowers: ["bolt", "net"],
    liveSpending: true,
    preparation: "start-immediately",
    description:
      "Recorded Last Lantern mixed line: Turtle plus three Squirrels; prioritize Squirrel upgrades.",
  },
];
const lanternSites = [
  { x: 1, z: 4 },
  { x: 3, z: 2 },
  { x: 5, z: 2 },
  { x: 7, z: 5 },
  { x: 3, z: 0 },
  { x: 7, z: 4 },
  { x: 5, z: 0 },
];
const rainSites = [
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
];
const finaleSites = [
  { x: 1, z: 2 },
  { x: 3, z: 2 },
  { x: 4, z: 0 },
  { x: 6, z: 6 },
  { x: 8, z: 4 },
  { x: 10, z: 4 },
  { x: 3, z: 7 },
  { x: 5, z: 6 },
  { x: 10, z: 1 },
  { x: 5, z: 2 },
  { x: 8, z: 1 },
  { x: 11, z: 5 },
];
export interface RunOptions {
  cadenceTicks?: number;
  policyId?: string;
  trace?: RecordedCommand[];
  maxTicks?: number;
  goal?: Goal;
  plan?: {
    sites: { x: number; z: number }[];
    kind: TowerKind;
    upgradeFirst: boolean;
  };
}
export function runScenario(
  content: AuthoringContent,
  scenario: Scenario,
  options: RunOptions = {},
): RunReport {
  const session = new AttemptSession(content, scenario);
  const goal = options.goal ?? { type: "encounter-win" };
  validateGoal(goal);
  if (
    goal.waveId &&
    !session.game.level.waves.some((w) => w.id === goal.waveId)
  )
    throw new Error("Unknown goal wave");
  if (options.trace && options.policyId)
    throw new Error("Choose trace or policy");
  if (options.trace) session.replay(options.trace);
  const selectedPolicy = options.policyId
    ? POLICIES.find((p) => p.id === options.policyId)
    : undefined;
  if (options.policyId && !selectedPolicy) throw new Error("Unknown policy");
  if (
    options.cadenceTicks !== undefined &&
    (!Number.isInteger(options.cadenceTicks) ||
      options.cadenceTicks < 1 ||
      options.cadenceTicks > 1800)
  )
    throw new Error("Policy cadence must be 1–1800 ticks");
  const policy = selectedPolicy
    ? {
        ...selectedPolicy,
        cadenceTicks: options.cadenceTicks ?? selectedPolicy.cadenceTicks,
      }
    : undefined;
  const maxTicks = options.maxTicks ?? 18000;
  if (!Number.isInteger(maxTicks) || maxTicks < 1 || maxTicks > 108000)
    throw new Error("Tick budget must be 1–108000");
  let next = 0;
  let prepared = -1;
  let termination: RunReport["termination"] = "time-limit";
  const sites =
    options.plan?.sites ??
    (policy?.id === "lantern-growth"
      ? lanternSites
      : policy?.id === "finale-mixed"
        ? finaleSites
        : rainSites);
  while (session.tickIndex < maxTicks) {
    const g = session.game,
      s = g.state;
    if (s.phase === "won" || s.phase === "lost") {
      termination = s.phase;
      break;
    }
    if (
      (policy || options.plan) &&
      session.tickIndex %
        (policy?.cadenceTicks ?? options.cadenceTicks ?? 1) ===
        0
    ) {
      const kind = options.plan?.kind ?? "bolt";
      if (policy?.id === "lantern-growth") {
        if (s.phase === "preparation" && prepared !== s.wave) {
          prepared = s.wave;
          for (
            let n = 0;
            n < (s.wave === 0 ? 2 : 1) && next < sites.length;
            n++
          )
            if (session.command({ type: "place", kind, point: sites[next] }))
              next++;
        } else if (
          s.wave === 1 &&
          s.towers.length === 2 &&
          next < sites.length &&
          s.coins >= g.towers.bolt.cost
        ) {
          if (session.command({ type: "place", kind, point: sites[next] }))
            next++;
        }
      } else if (
        policy?.id === "finale-mixed" &&
        session.tickIndex === 0 &&
        !scenario.formation?.length
      ) {
        for (let n = 0; n < 4; n++)
          if (
            session.command({
              type: "place",
              kind: n === 0 ? "net" : "bolt",
              point: sites[n],
            })
          )
            next = n + 1;
      } else {
        const t = s.towers.find((t) => t.level === 1 && g.canUpgrade(t));
        const upgradeFirst =
          options.plan?.upgradeFirst ??
          ((policy?.id === "upgrades-first" && s.towers.length >= 3) ||
            policy?.id === "finale-mixed");
        if (upgradeFirst && t && s.coins >= g.upgradeCost(t))
          session.command({ type: "upgrade", id: t.id });
        else if (
          next < sites.length &&
          g.canPlace(sites[next]) &&
          s.coins >= g.towers[kind].cost
        ) {
          if (session.command({ type: "place", kind, point: sites[next] }))
            next++;
        } else if (next < sites.length && !g.canPlace(sites[next])) next++;
        else if (t && s.coins >= g.upgradeCost(t))
          session.command({ type: "upgrade", id: t.id });
      }
      if (s.phase === "preparation") session.command({ type: "start" });
    }
    session.step();
    if (goalSatisfied(session, goal)) {
      termination = "goal";
      break;
    }
  }
  return session.report(goal, termination, policy);
}
export interface SearchResult {
  found: boolean;
  budget: number;
  attempts: number;
  reason: string;
  report?: RunReport;
  plan?: RunOptions["plan"];
}
export function searchScenario(
  content: AuthoringContent,
  scenario: Scenario,
  goal: Goal,
  budget = 12,
  maxTicks = 18000,
): SearchResult {
  if (!Number.isInteger(budget) || budget < 1 || budget > 128)
    throw new Error("Search budget must be 1–128");
  const base = resolveScenario(content, scenario);
  const valid: { x: number; z: number }[] = [];
  const probe = new AttemptSession(content, scenario).game;
  for (let z = 0; z < probe.level.depth; z++)
    for (let x = 0; x < probe.level.width; x++)
      if (probe.canPlace({ x, z })) valid.push({ x, z });
  const kinds = base.configuration.level.availableTowers ?? [
    "bolt",
    "stone",
    "net",
  ];
  for (let i = 0; i < budget; i++) {
    const kind = kinds[i % kinds.length];
    if (!kind) break;
    const offset = Math.floor(i / kinds.length) % Math.max(1, valid.length);
    const sites = [...valid.slice(offset), ...valid.slice(0, offset)];
    const plan = { sites, kind, upgradeFirst: i % 2 === 1 };
    const report = runScenario(content, scenario, { plan, goal, maxTicks });
    if (report.success) {
      const replay = runScenario(content, scenario, {
        trace: report.trace,
        goal,
        maxTicks,
      });
      if (replay.success)
        return {
          found: true,
          budget,
          attempts: i + 1,
          reason: "Successful legal plan reproduced by fixed-tick replay",
          report,
          plan,
        };
    }
  }
  return {
    found: false,
    budget,
    attempts: budget,
    reason:
      "No successful plan found within this bounded site-order/defender/upgrade search; this is not proof of impossibility",
  };
}
export function compareScenarios(
  baseline: AuthoringContent,
  candidate: AuthoringContent,
  scenario: Scenario,
  options: RunOptions = {},
) {
  const before = runScenario(baseline, scenario, options);
  const after = runScenario(candidate, scenario, {
    ...options,
    policyId: undefined,
    trace: before.trace,
  });
  return {
    mode: "fixed-plan" as const,
    before,
    after,
    invalidatedCommands: after.trace.filter(
      (c, i) => before.trace[i]?.accepted && !c.accepted,
    ),
    delta: {
      lives: after.lives - before.lives,
      leaks: after.leaks - before.leaks,
      coins: after.coins - before.coins,
      seconds: after.seconds - before.seconds,
    },
  };
}
export function validateReport(value: unknown): asserts value is RunReport {
  strictKeys(
    value,
    [
      "schemaVersion",
      "configurationIdentity",
      "recipeIdentity",
      "engineRevision",
      "fixedStep",
      "scenario",
      "synthetic",
      "initialLives",
      "trace",
      "rejections",
      "checkpoints",
      "transactions",
      "phase",
      "completed",
      "goal",
      "success",
      "bossDefeated",
      "bossRequired",
      "lives",
      "leaks",
      "coins",
      "goldEarned",
      "seconds",
      "ticks",
      "towerMix",
      "upgraded",
      "policy",
      "termination",
      "events",
    ],
    "report",
  );
  const r = value as unknown as RunReport;
  if (
    r.schemaVersion !== 1 ||
    typeof r.configurationIdentity !== "string" ||
    !r.configurationIdentity ||
    typeof r.recipeIdentity !== "string" ||
    !r.recipeIdentity ||
    typeof r.engineRevision !== "string" ||
    !r.engineRevision ||
    r.fixedStep !== FIXED_STEP
  )
    throw new Error("Unsupported result identity/version");
  validateScenario(r.scenario);
  validateTrace(r.trace);
  validateTrace(r.rejections);
  validateGoal(r.goal);
  for (const key of [
    "lives",
    "leaks",
    "coins",
    "goldEarned",
    "seconds",
    "ticks",
    "initialLives",
    "upgraded",
  ] as const)
    if (!Number.isFinite(r[key]) || r[key] < 0)
      throw new Error(`Invalid report ${key}`);
  for (const key of [
    "synthetic",
    "success",
    "completed",
    "bossDefeated",
    "bossRequired",
  ] as const)
    if (typeof r[key] !== "boolean") throw new Error(`Invalid report ${key}`);
  if (
    !["preparation", "wave", "paused", "won", "lost"].includes(r.phase) ||
    !["goal", "won", "lost", "time-limit", "paused"].includes(r.termination)
  )
    throw new Error("Invalid report phase");
  strictKeys(r.towerMix, ["bolt", "stone", "net"], "towerMix");
  for (const k of ["bolt", "stone", "net"] as const)
    if (!Number.isInteger(r.towerMix[k]) || r.towerMix[k] < 0)
      throw new Error("Invalid tower mix");
  if (
    !Array.isArray(r.checkpoints) ||
    !Array.isArray(r.transactions) ||
    !Array.isArray(r.events)
  )
    throw new Error("Invalid report records");
  for (const c of r.checkpoints) {
    strictKeys(
      c,
      [
        "waveId",
        "wave",
        "lives",
        "coins",
        "leaks",
        "goldEarned",
        "seconds",
        "towers",
        "upgraded",
      ],
      "checkpoint",
    );
    if (typeof c.waveId !== "string" || !c.waveId)
      throw new Error("Invalid checkpoint wave");
    for (const [k, v] of Object.entries(c))
      if (k !== "waveId" && (!Number.isFinite(v) || Number(v) < 0))
        throw new Error("Invalid checkpoint metric");
  }
  for (const t of r.transactions) {
    strictKeys(
      t,
      ["tick", "command", "coinsBefore", "coinsAfter"],
      "transaction",
    );
    validateTrace([{ tick: t.tick, command: t.command, accepted: true }]);
    if (
      !Number.isFinite(t.coinsBefore) ||
      !Number.isFinite(t.coinsAfter) ||
      t.coinsBefore < 0 ||
      t.coinsAfter < 0
    )
      throw new Error("Invalid transaction");
  }
  for (const e of r.events) {
    strictKeys(e, ["tick", "event"], "event");
    if (
      !Number.isInteger(e.tick) ||
      e.tick < 0 ||
      !e.event ||
      typeof e.event.type !== "string"
    )
      throw new Error("Invalid event");
  }
  if (r.policy) {
    strictKeys(
      r.policy,
      [
        "id",
        "version",
        "cadenceTicks",
        "maxActionsPerDecision",
        "allowedTowers",
        "liveSpending",
        "preparation",
        "description",
      ],
      "policy",
    );
    if (
      !POLICIES.some((p) => p.id === r.policy!.id) ||
      r.policy.version !== 1 ||
      !Number.isInteger(r.policy.cadenceTicks) ||
      r.policy.cadenceTicks < 1 ||
      !Number.isInteger(r.policy.maxActionsPerDecision) ||
      r.policy.maxActionsPerDecision < 1 ||
      !Array.isArray(r.policy.allowedTowers) ||
      r.policy.allowedTowers.some(
        (t) => !["bolt", "stone", "net"].includes(t),
      ) ||
      typeof r.policy.liveSpending !== "boolean" ||
      r.policy.preparation !== "start-immediately" ||
      typeof r.policy.description !== "string"
    )
      throw new Error("Invalid policy metadata");
  }
  if (
    r.success &&
    (!r.completed ||
      (r.bossRequired && !r.bossDefeated) ||
      (r.goal.noLivesLost && r.lives !== r.initialLives))
  )
    throw new Error("Result claims success without goal completion");
}
/** Import boundary: validate records plus their declared complete content and setup identity. */
export function validateRunReport(
  value: unknown,
  content: AuthoringContent,
): asserts value is RunReport {
  validateReport(value);
  const resolved = resolveScenario(content, value.scenario);
  if (
    value.configurationIdentity !== resolved.configuration.identity ||
    value.recipeIdentity !==
      configurationIdentity(
        value.scenario.difficultyCandidate?.content ?? content,
      ) ||
    value.initialLives !== resolved.initialLives ||
    value.synthetic !== resolved.synthetic
  )
    throw new Error("Result configuration/setup identity mismatch");
  const waves = resolved.configuration.level.waves;
  if (value.goal.waveId && !waves.some((w) => w.id === value.goal.waveId))
    throw new Error("Unknown report goal wave");
  for (const c of value.checkpoints)
    if (
      !waves.some((w) => w.id === c.waveId) ||
      waves[c.wave - 1]?.id !== c.waveId
    )
      throw new Error("Unknown report checkpoint wave");
  if (value.rejections.some((r) => r.accepted))
    throw new Error("Rejected command marked accepted");
}
