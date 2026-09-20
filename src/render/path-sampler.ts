import type { Point } from "../sim/types";
import type { Vec2 } from "./gait";

/** Immutable route setup; callers may supply a reusable output during animation. */
export function projectedPathSampler(
  path: readonly Point[],
  project: (point: Point) => Vec2,
) {
  const points = path.map(project);
  const segments = path.slice(1).map((point, i) => ({
    start: points[i],
    end: points[i + 1],
    length: Math.hypot(point.x - path[i].x, point.z - path[i].z),
  }));
  return (travel: number, out: Vec2 = { x: 0, y: 0 }): Vec2 => {
    for (const segment of segments) {
      if (travel <= segment.length) {
        out.x =
          segment.start.x +
          ((segment.end.x - segment.start.x) * travel) / segment.length;
        out.y =
          segment.start.y +
          ((segment.end.y - segment.start.y) * travel) / segment.length;
        return out;
      }
      travel -= segment.length;
    }
    out.x = points.at(-1)!.x;
    out.y = points.at(-1)!.y;
    return out;
  };
}
