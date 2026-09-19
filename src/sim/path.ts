import type { LevelDef, Point } from "./types";
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
  return level.path.slice(1).some((b, i) => {
    const a = level.path[i];
    return Math.abs(distance(a, p) + distance(p, b) - distance(a, b)) < 0.01;
  });
}
export function validateLevel(level: LevelDef): void {
  if (!level.id || level.path.length < 2 || level.waves.length === 0)
    throw new Error("Level needs an id, path and waves");
  for (let i = 1; i < level.path.length; i++) {
    const a = level.path[i - 1],
      b = level.path[i];
    if ((a.x !== b.x && a.z !== b.z) || distance(a, b) === 0)
      throw new Error("Path must use nonzero orthogonal segments");
  }
  for (const w of level.waves)
    for (const g of w.groups)
      if (
        !Number.isInteger(g.count) ||
        g.count < 1 ||
        !Number.isFinite(g.gap) ||
        g.gap <= 0
      )
        throw new Error("Invalid wave group");
}
