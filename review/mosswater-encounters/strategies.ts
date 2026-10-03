import {
  resolveConfiguration,
  type AuthoringContent,
} from "../../src/config/configuration";
import {
  progressionContext,
  earnedUpgrades,
  levelForAttempt,
  encounterUnlocked,
} from "../../src/content/progression";
import {
  freshSave,
  recordVictoryOutcome,
  type SaveData,
} from "../../src/persistence/save";
import { Game } from "../../src/sim/game";
import type { Point, TowerKind } from "../../src/sim/types";
import type { RecordedCommand } from "../../src/workbench/commands";

export type Policy =
  "balanced" | "upgrades" | "direct" | "poison-only" | "one-lane" | "hoard";
const firstSites: Point[][] = [
  [
    [1, 4],
    [3, 2],
    [5, 2],
    [7, 5],
    [3, 0],
    [7, 4],
    [5, 0],
  ],
  [
    [0, 4],
    [3, 2],
    [6, 2],
    [9, 5],
    [2, 6],
    [9, 4],
    [5, 4],
    [7, 2],
    [3, 4],
    [9, 2],
    [7, 5],
    [2, 4],
  ],
  [
    [8, 4],
    [3, 3],
    [5, 3],
    [6, 3],
    [3, 2],
    [8, 3],
    [5, 4],
    [6, 4],
    [8, 5],
    [3, 4],
    [1, 2],
    [5, 2],
  ],
].map((rows) => rows.map(([x, z]) => ({ x, z })));
const crossingSites = [
  [1, 2],
  [1, 5],
  [3, 2],
  [5, 2],
  [8, 2],
  [10, 3],
  [8, 6],
  [5, 6],
  [3, 4],
  [7, 2],
  [10, 5],
  [8, 5],
  [10, 4],
  [3, 6],
  [1, 0],
  [9, 6],
  [10, 7],
  [7, 1],
].map(([x, z]) => ({ x, z }));
const singleSites = firstSites[1];
export interface BalanceReport {
  id: string;
  policy: Policy;
  phase: string;
  seconds: number;
  lives: number;
  leaks: number;
  coins: number;
  kills: Record<string, number>;
  trace: RecordedCommand[];
  checkpoints: {
    wave: number;
    seconds: number;
    lives: number;
    coins: number;
    towers: number;
    upgrades: number;
  }[];
}
export function createAttempt(
  content: AuthoringContent,
  id: string,
  save: SaveData,
) {
  const context = progressionContext(content);
  if (!encounterUnlocked(context, id, save))
    throw new Error(`Encounter not earned: ${id}`);
  const resolved = resolveConfiguration(content, id);
  const configuration = {
    ...resolved,
    level: levelForAttempt(resolved.level, save, context),
  };
  return new Game(configuration.level, "none", false, 42, {
    configuration,
    unlockedUpgrades: earnedUpgrades(save, context),
  });
}
export function play(
  content: AuthoringContent,
  id: string,
  save: SaveData,
  policy: Policy = "balanced",
): BalanceReport {
  const g = createAttempt(content, id, save),
    trace: RecordedCommand[] = [];
  const legacy = content.levels.slice(0, 3).findIndex((l) => l.id === id);
  const sites =
    legacy >= 0
      ? firstSites[legacy]
      : (g.level.routes?.length ?? 1) > 1
        ? crossingSites
        : singleSites;
  let next = 0,
    tick = 0,
    lastWave = 0;
  const checkpoints: BalanceReport["checkpoints"] = [];
  function command(command: RecordedCommand["command"]) {
    const accepted =
      command.type === "place"
        ? g.place(command.kind, command.point)
        : command.type === "upgrade"
          ? g.upgrade(command.id)
          : command.type === "start"
            ? g.startWave()
            : false;
    trace.push({ tick, command, accepted });
    if (!accepted)
      throw new Error(
        `Policy issued illegal command ${JSON.stringify(command)} in ${id}`,
      );
  }
  function spend() {
    if (policy === "hoard") return false;
    const kinds: TowerKind[] =
      legacy >= 0
        ? ["bolt"]
        : policy === "poison-only"
          ? ["stone"]
          : policy === "direct"
            ? ["bolt"]
            : id === "mosswater-02"
              ? ["stone", "stone", "stone", "net", "bolt", "bolt", "net"]
              : id === "mosswater-03"
                ? ["bolt", "bolt", "bolt", "net", "bolt", "net", "bolt"]
                : id === "mosswater-05"
                  ? [
                      "stone",
                      "stone",
                      "net",
                      "stone",
                      "bolt",
                      "net",
                      "stone",
                      "bolt",
                      "bolt",
                      "bolt",
                      "net",
                      "bolt",
                    ]
                  : [
                      "stone",
                      "bolt",
                      "net",
                      "bolt",
                      "bolt",
                      "bolt",
                      "net",
                      "bolt",
                    ];
    const kind = kinds[next % kinds.length];
    const upgrade = g.state.towers.find(
      (t) =>
        t.level === 1 &&
        g.canUpgrade(t) &&
        (policy !== "poison-only" || t.kind === "stone"),
    );
    const invest =
      legacy === 2 ||
      id === "mosswater-03" ||
      policy === "upgrades" ||
      policy === "direct" ||
      g.state.towers.length >= 6;
    if (invest && upgrade && g.state.coins >= g.upgradeCost(upgrade)) {
      command({ type: "upgrade", id: upgrade.id });
      return true;
    }
    if (
      next < sites.length &&
      (policy !== "one-lane" || next < 2) &&
      g.state.coins >= g.towers[kind].cost
    ) {
      if (!g.canPlace(sites[next]))
        throw new Error(`Invalid policy site ${JSON.stringify(sites[next])}`);
      command({ type: "place", kind, point: sites[next++] });
      return true;
    }
    if (upgrade && g.state.coins >= g.upgradeCost(upgrade)) {
      command({ type: "upgrade", id: upgrade.id });
      return true;
    }
    return false;
  }
  while (tick < 36000 && g.state.phase !== "won" && g.state.phase !== "lost") {
    if (g.state.wave > lastWave && g.state.phase === "preparation") {
      lastWave = g.state.wave;
      checkpoints.push(checkpoint());
    }
    if (tick % 30 === 0) {
      if (g.state.phase === "preparation") {
        // Spend the current wallet through public commands, before manually launching.
        for (let n = 0; n < 50 && spend(); n++);
        command({ type: "start" });
      } else spend();
    }
    g.tick(1 / 30);
    g.drainEvents();
    tick++;
  }
  function checkpoint() {
    return {
      wave: g.state.wave,
      seconds: Math.round(g.state.clock * 10) / 10,
      lives: g.state.lives,
      coins: g.state.coins,
      towers: g.state.towers.length,
      upgrades: g.state.towers.filter((t) => t.level === 2).length,
    };
  }
  checkpoints.push(checkpoint());
  return {
    id,
    policy,
    phase: g.state.phase,
    seconds: Math.round(g.state.clock * 10) / 10,
    lives: g.state.lives,
    leaks: g.state.leaks,
    coins: g.state.coins,
    kills: { ...g.state.killsByKind },
    trace,
    checkpoints,
  };
}
/** Unlike an authoring shortcut, every preceding entitlement here comes from a won Game. */
export function campaign(
  content: AuthoringContent,
  policy: Policy = "balanced",
) {
  const context = progressionContext(content);
  let save = freshSave(context);
  const reports: BalanceReport[] = [];
  for (const id of context.levelIds) {
    const r = play(
      content,
      id,
      save,
      id.startsWith("mosswater-") ? policy : "balanced",
    );
    reports.push(r);
    if (r.phase !== "won") break;
    save = recordVictoryOutcome(
      save,
      id,
      r.lives === 12 ? 3 : r.lives >= 6 ? 2 : 1,
      context,
    ).save;
  }
  return { save, reports };
}
