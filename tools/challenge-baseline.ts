import { lanternPass } from "../src/content/lantern-pass";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";
import { Game } from "../src/sim/game";
import { pathLength } from "../src/sim/path";
import type { LevelDef, Point, TowerKind } from "../src/sim/types";

// Run with `node tools/run-challenge-baseline.mjs`. This is a characterization
// scenario, not a balance gate: later content tuning is expected to change it.
const DT = 1 / 30;
type Line = "broad" | "focused" | "greedy";

const positions: Record<string, Record<string, Point>> = {
  "lantern-pass": {
    boltA: { x: 1, z: 4 },
    boltB: { x: 3, z: 2 },
    boltC: { x: 5, z: 2 },
    boltD: { x: 7, z: 5 },
    stoneA: { x: 3, z: 0 },
    stoneB: { x: 7, z: 4 },
    netA: { x: 5, z: 0 },
    netB: { x: 8, z: 5 },
    tradeA: { x: 0, z: 1 },
    tradeB: { x: 10, z: 1 },
  },
  "rainstone-crossing": {
    boltA: { x: 0, z: 4 },
    boltB: { x: 3, z: 2 },
    boltC: { x: 6, z: 2 },
    boltD: { x: 9, z: 5 },
    stoneA: { x: 2, z: 6 },
    stoneB: { x: 9, z: 4 },
    netA: { x: 7, z: 5 },
    netB: { x: 5, z: 2 },
    tradeA: { x: 0, z: 1 },
    tradeB: { x: 11, z: 1 },
  },
};

const plans: Record<Line, string[][]> = {
  broad: [
    ["boltA", "stoneA", "netA"],
    ["boltB"],
    ["stoneB"],
    ["netB"],
    ["upgrade:boltA", "upgrade:stoneA"],
    ["upgrade:boltB", "upgrade:stoneB"],
    ["upgrade:netA", "upgrade:netB"],
    [],
  ],
  focused: [
    ["boltA", "boltB", "stoneA"],
    ["boltC", "upgrade:boltA"],
    ["netA", "upgrade:boltB"],
    ["boltD", "upgrade:stoneA"],
    ["stoneB", "upgrade:boltC"],
    ["upgrade:netA"],
    ["upgrade:stoneB"],
    [],
  ],
  greedy: [
    ["tradeA", "boltA"],
    ["tradeB"],
    ["upgrade:tradeA"],
    ["boltB"],
    ["upgrade:tradeB"],
    ["stoneA"],
    ["netA"],
    ["boltC"],
  ],
};

const kindByName: Record<string, TowerKind> = {
  boltA: "bolt",
  boltB: "bolt",
  boltC: "bolt",
  boltD: "bolt",
  stoneA: "stone",
  stoneB: "stone",
  netA: "net",
  netB: "net",
  tradeA: "trade",
  tradeB: "trade",
};

function run(level: LevelDef, line: Line) {
  const game = new Game(level, "reach", false, 42);
  const location = positions[level.id];
  const built = new Map<string, number>();
  const waves = [];
  const routeLength = pathLength(level.path);
  for (let index = 0; index < level.waves.length; index++) {
    if (game.state.phase !== "preparation") break;
    const actions = [];
    const coinsBeforeBuild = game.state.coins;
    for (const command of plans[line][index]) {
      const [verb, upgradedName] = command.split(":");
      const name = upgradedName ?? verb;
      if (verb === "upgrade") {
        const id = built.get(name);
        if (!id || !game.upgrade(id))
          throw new Error(
            `${level.id} ${line} wave ${index + 1}: ${command} failed`,
          );
      } else {
        const point = location[name];
        if (!point || !game.place(kindByName[name], point))
          throw new Error(
            `${level.id} ${line} wave ${index + 1}: ${command} failed`,
          );
        built.set(name, game.state.towers.at(-1)!.id);
      }
      actions.push({ command, coinsAfter: game.state.coins });
    }
    const coinsAtStart = game.state.coins;
    const heartsAtStart = game.state.lives;
    const killsAtStart = game.state.kills;
    const shotsAtStart = new Map(game.state.towers.map((t) => [t.id, t.shots]));
    const towers = game.state.towers.map((t) => ({
      id: t.id,
      kind: t.kind,
      level: t.level,
      x: t.x,
      z: t.z,
    }));
    if (!game.startWave())
      throw new Error(`Could not start ${level.id} wave ${index + 1}`);
    const leaks: { kind: string; atSecond: number }[] = [];
    for (let tick = 0; tick < 240 * 30 && game.state.phase === "wave"; tick++) {
      const onField = [...game.state.enemies];
      game.tick(DT);
      const escaped = onField.filter(
        (enemy) => !enemy.alive && enemy.distance >= routeLength,
      );
      const leakEvents = game
        .drainEvents()
        .filter((event) => event.type === "leak");
      if (escaped.length !== leakEvents.length)
        throw new Error(
          `${level.id} ${line} wave ${index + 1}: leak record disagrees with game events`,
        );
      for (const enemy of escaped)
        leaks.push({
          kind: enemy.kind,
          atSecond: Math.round(game.state.clock * 10) / 10,
        });
    }
    if (game.state.phase === "wave")
      throw new Error(`${level.id} ${line} wave ${index + 1} timed out`);
    waves.push({
      wave: index + 1,
      title: level.waves[index].title,
      actions,
      coinsBeforeBuild,
      coinsAtStart,
      heartsAtStart,
      towers,
      completed: game.state.phase !== "lost",
      phase: game.state.phase,
      heartsAfter: game.state.lives,
      heartsLost: heartsAtStart - game.state.lives,
      coinsAfter: game.state.coins,
      kills: game.state.kills - killsAtStart,
      leaks,
      shots: game.state.towers.map((t) => ({
        id: t.id,
        count: t.shots - (shotsAtStart.get(t.id) ?? 0),
      })),
      payout: game.state.lastPayout,
      clock: Math.round(game.state.clock * 10) / 10,
    });
  }
  return {
    level: level.id,
    line,
    seed: 42,
    card: "reach",
    assist: false,
    abilityUses: game.state.abilityUses,
    phase: game.state.phase,
    wavesStarted: waves.length,
    wavesCompleted: waves.filter((w) => w.completed).length,
    hearts: game.state.lives,
    crowns: game.state.coins,
    totalInterest: game.state.totalInterest,
    totalTrade: game.state.totalTrade,
    waves,
  };
}

for (const level of [lanternPass, rainstoneCrossing])
  for (const line of ["broad", "focused", "greedy"] as const)
    console.log(JSON.stringify(run(level, line)));
