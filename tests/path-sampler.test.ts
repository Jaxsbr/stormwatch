import { expect, it } from "vitest";
import { LEVELS } from "../src/content/levels";
import { pathLength, pointOnPath } from "../src/sim/path";
import { projectedPathSampler } from "../src/render/path-sampler";
import { createPathGaitWorkspace, gaitOnPath } from "../src/render/gait";

const project = (p: { x: number; z: number }) => ({
  x: 112 + p.x * 96,
  y: 720 - (106 + p.z * 74),
});

it("matches simulation projection through corners, entry and exit on both maps", () => {
  for (const level of LEVELS) {
    const sample = projectedPathSampler(level.path, project);
    const out = { x: 0, y: 0 };
    for (let d = -0.2; d < pathLength(level.path) + 1; d += 0.03125) {
      const expected = project(pointOnPath(level.path, d));
      expect(sample(d, out)).toBe(out);
      expect(out.x).toBeCloseTo(expected.x, 9);
      expect(out.y).toBeCloseTo(expected.y, 9);
    }
  }
});

it("reuses gait buffers without changing either leg's poses through corners or resets", () => {
  for (const level of LEVELS) {
    const sample = projectedPathSampler(level.path, project);
    const originalSample = (d: number) => project(pointOnPath(level.path, d));
    for (const leg of [0, 1] as const) {
      const workspace = createPathGaitWorkspace();
      const first = gaitOnPath(0, leg, sample, 88 / 672, workspace);
      const foot = first.foot;
      for (const d of [
        0,
        0.325,
        ...Array.from({ length: 300 }, (_, i) => i * 0.1),
        0,
      ]) {
        const actual = gaitOnPath(d, leg, sample, 88 / 672, workspace);
        const expected = gaitOnPath(d, leg, originalSample, 88 / 672);
        expect(actual).toBe(first);
        expect(actual.foot).toBe(foot);
        expect(actual.stance).toBe(expected.stance);
        expect(actual.lift).toBe(expected.lift);
        for (const key of ["foot", "worldAnchor", "worldFoot"] as const) {
          expect(actual[key].x).toBeCloseTo(expected[key].x, 8);
          expect(actual[key].y).toBeCloseTo(expected[key].y, 8);
        }
      }
    }
  }
});
