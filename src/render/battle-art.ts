import { CutoutResource } from "./cutout";
import type { EnemyKind, LevelDef, TowerKind } from "../sim/types";

const enemyRigNames: Record<EnemyKind, [string, string, string]> = {
  raider: ["rat-rig-v3", "rat-front-rig-v3", "rat-rear-rig-v3"],
  runner: ["weasel-rig-v1", "weasel-front-rig-v1", "weasel-rear-rig-v1"],
  armored: ["boar-rig-v1", "boar-front-rig-v1", "boar-rear-rig-v1"],
  boss: ["badger-rig-v1", "badger-front-rig-v1", "badger-rear-rig-v1"],
};
const defenderRigNames: Record<TowerKind, string> = {
  bolt: "squirrel-side-defender-v1",
  stone: "skunk-side-defender-v1",
  net: "turtle-side-defender-v1",
};
const bossExpressionNames = {
  front: ["badger-front-angry-v1", "badger-front-raging-v1"],
  side: ["badger-side-angry-v1", "badger-side-raging-v1"],
} as const;

/** The encounter roster is the complete demand; wave timing changes no art identity. */
export function battleArtDemand(level: LevelDef) {
  const enemies: EnemyKind[] = [
    ...new Set(
      level.waves.flatMap((wave) => wave.groups.map((group) => group.kind)),
    ),
  ].sort();
  const defenders: TowerKind[] = [
    ...new Set<TowerKind>(level.availableTowers ?? ["bolt", "stone", "net"]),
  ].sort();
  return { enemies, defenders, key: JSON.stringify([enemies, defenders]) };
}

/** Owns every cutout required by one immutable encounter, including failures and disposal. */
export class BattleArt {
  readonly key: string;
  readonly ready: Promise<void>;
  private disposed = false;
  private resources: CutoutResource[] = [];
  private resourceReadiness: Promise<void>[] = [];
  private enemies = new Map<
    EnemyKind,
    { side: CutoutResource; front: CutoutResource; rear: CutoutResource }
  >();
  private defenders = new Map<TowerKind, CutoutResource>();
  private expressions: {
    front: CutoutResource[];
    side: CutoutResource[];
  } | null = null;

  constructor(
    level: LevelDef,
    create = (id: string) => new CutoutResource(id),
  ) {
    const demand = battleArtDemand(level);
    this.key = demand.key;
    const load = (id: string) => {
      const resource = create(id);
      this.resources.push(resource);
      this.resourceReadiness.push(
        resource.ready.catch((error) => {
          throw new Error(`Battle art ${id} failed: ${String(error)}`);
        }),
      );
      return resource;
    };
    // Initiate the views used during preparation and early combat first.
    for (const kind of demand.defenders)
      this.defenders.set(kind, load(defenderRigNames[kind]));
    const sideViews = new Map<EnemyKind, CutoutResource>();
    for (const kind of demand.enemies)
      sideViews.set(kind, load(enemyRigNames[kind][0]));
    for (const kind of demand.enemies) {
      const [, front, rear] = enemyRigNames[kind];
      this.enemies.set(kind, {
        side: sideViews.get(kind)!,
        front: load(front),
        rear: load(rear),
      });
    }
    if (demand.enemies.includes("boss"))
      this.expressions = {
        front: bossExpressionNames.front.map(load),
        side: bossExpressionNames.side.map(load),
      };
    this.ready = Promise.all(this.resourceReadiness).then(() => {
      if (this.disposed)
        throw new Error("Battle art was disposed while loading");
    });
    void this.ready.catch(() => {});
  }

  defender(kind: TowerKind) {
    const resource = this.defenders.get(kind);
    if (!resource)
      throw new Error(`Defender art absent from encounter: ${kind}`);
    return resource;
  }

  enemy(kind: EnemyKind, view: "side" | "front" | "rear", rage = 0) {
    const views = this.enemies.get(kind);
    if (!views) throw new Error(`Enemy art absent from encounter: ${kind}`);
    if (kind === "boss" && rage > 0 && view !== "rear")
      return this.expressions?.[view][rage - 1] ?? views[view];
    return views[view];
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const resource of this.resources) resource.dispose();
    this.resources = [];
    this.enemies.clear();
    this.defenders.clear();
    this.expressions = null;
  }
}
