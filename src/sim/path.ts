import type { LevelDef, Point } from "./types";
import { levelRoutes, routeFor } from "./routes";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function pathLength(path: Point[]): number {
  return path.slice(1).reduce((n, p, i) => n + distance(path[i], p), 0);
}
export function pointOnPath(path: Point[], travel: number): Point {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i],
      len = distance(a, b);
    if (travel <= len)
      return {
        x: a.x + ((b.x - a.x) * travel) / len,
        z: a.z + ((b.z - a.z) * travel) / len,
      };
    travel -= len;
  }
  return { ...path[path.length - 1] };
}
export function onPath(level: LevelDef, p: Point): boolean {
  return levelRoutes(level).some(({ path }) =>
    path.slice(1).some((b, i) => {
      const a = path[i];
      return Math.abs(distance(a, p) + distance(p, b) - distance(a, b)) < 0.01;
    }),
  );
}
export function validateLevel(level: LevelDef): void {
  const routes = levelRoutes(level);
  if (
    !level.id ||
    !routes.length ||
    routes.some((r) => r.path.length < 2) ||
    level.waves.length === 0
  )
    throw new Error("Level needs an id, path and waves");
  const ids = new Set<string>();
  for (const { id, path } of routes) {
    if (typeof id !== "string" || !id.trim() || ids.has(id))
      throw new Error("Invalid route identity");
    ids.add(id);
    for (const p of path)
      if (!Number.isFinite(p.x) || !Number.isFinite(p.z))
        throw new Error("Invalid route point");
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i];
      if ((a.x !== b.x && a.z !== b.z) || distance(a, b) === 0)
        throw new Error("Path must use nonzero orthogonal segments");
    }
  }
  for (const w of level.waves) {
    for (const g of w.groups) {
      routeFor(level, g.routeId);
      if (g.startTogether !== undefined && typeof g.startTogether !== "boolean")
        throw new Error("Invalid simultaneous group");
      if (
        !Number.isInteger(g.count) ||
        g.count < 1 ||
        !Number.isFinite(g.gap) ||
        g.gap <= 0 ||
        (g.batchSize !== undefined &&
          (!Number.isInteger(g.batchSize) || g.batchSize < 1)) ||
        (g.batchStagger !== undefined &&
          (!Number.isFinite(g.batchStagger) ||
            g.batchStagger < 0 ||
            g.batchStagger >= g.gap ||
            (g.batchSize ?? 1) < 2)) ||
        (g.movementScale !== undefined &&
          (!Number.isFinite(g.movementScale) || g.movementScale <= 0)) ||
        (g.shieldCycle !== undefined &&
          (g.kind !== "raider" ||
            !Number.isFinite(g.shieldCycle.upSeconds) ||
            g.shieldCycle.upSeconds <= 0 ||
            !Number.isFinite(g.shieldCycle.downSeconds) ||
            g.shieldCycle.downSeconds <= 0))
      )
        throw new Error("Invalid wave group");
    }
  }
}
