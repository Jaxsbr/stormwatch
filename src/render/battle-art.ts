import { CutoutResource } from "./cutout";
import type { EnemyKind, LevelDef, TowerKind } from "../sim/types";
import {
  describeEncounter,
  defenderVisuals,
  enemyVisuals,
} from "../content/encounter-visuals";

/** The encounter roster is the complete demand; wave timing changes no art identity. */
export function battleArtDemand(level: LevelDef) {
  describeEncounter(level);
  const enemies: EnemyKind[] = [
    ...new Set(
      level.waves.flatMap((wave) =>
        wave.groups
          .filter((group) => group.count > 0)
          .map((group) => group.kind),
      ),
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
      this.defenders.set(kind, load(defenderVisuals[kind].sideRig));
    const sideViews = new Map<EnemyKind, CutoutResource>();
    for (const kind of demand.enemies)
      sideViews.set(kind, load(enemyVisuals[kind].views[0]));
    for (const kind of demand.enemies) {
      const [, front, rear] = enemyVisuals[kind].views;
      this.enemies.set(kind, {
        side: sideViews.get(kind)!,
        front: load(front),
        rear: load(rear),
      });
    }
    if (demand.enemies.includes("boss"))
      this.expressions = {
        front: enemyVisuals.boss.expressions!.front.map(load),
        side: enemyVisuals.boss.expressions!.side.map(load),
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
