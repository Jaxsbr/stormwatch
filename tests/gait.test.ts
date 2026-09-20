import { describe, expect, it } from "vitest";
import {
  GAIT_CYCLE_DISTANCE,
  gaitOnPath,
  gaitPose,
  worldFoot,
} from "../src/render/gait";
import { solveTwoBone } from "../src/render/ik";

const SCALE = 88 / 672;
const DIRECTION = { x: 96, y: -55 };
const GROUP_ORIGIN = { x: 400, y: 240 };
const cornerPath = (verticalDirection: 1 | -1) => (distance: number) =>
  distance <= 0.75
    ? { x: 96 * distance, y: 0 }
    : { x: 72, y: verticalDirection * 55 * (distance - 0.75) };

function groupAt(distance: number) {
  return {
    x: GROUP_ORIGIN.x + DIRECTION.x * distance,
    y: GROUP_ORIGIN.y + DIRECTION.y * distance,
  };
}

function expectPointClose(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
}

describe("gaitPose", () => {
  it("keeps each planted foot fixed while its group advances", () => {
    for (const [leg, distances] of [
      [0, [0, 0.06, 0.16, 0.31]],
      [1, [0.34, 0.42, 0.53, 0.64]],
    ] as const) {
      const planted = distances.map((distance) => {
        const pose = gaitPose(distance, leg, DIRECTION, SCALE);
        expect(pose.stance).toBe(true);
        return worldFoot(groupAt(distance), pose, SCALE);
      });
      for (const point of planted.slice(1)) expectPointClose(point, planted[0]);
    }
  });

  it("returns exactly the same pose when simulation distance is paused", () => {
    const before = gaitPose(0.27, 0, DIRECTION, SCALE);
    const paused = gaitPose(0.27, 0, DIRECTION, SCALE);

    expect(paused).toEqual(before);
    expectPointClose(
      worldFoot(groupAt(0.27), paused, SCALE),
      worldFoot(groupAt(0.27), before, SCALE),
    );
  });

  it("joins stance and swing without a foot jump at phase boundaries", () => {
    for (const boundary of [0.325, GAIT_CYCLE_DISTANCE]) {
      const before = worldFoot(
        groupAt(boundary - 1e-9),
        gaitPose(boundary - 1e-9, 0, DIRECTION, SCALE),
        SCALE,
      );
      const after = worldFoot(
        groupAt(boundary + 1e-9),
        gaitPose(boundary + 1e-9, 0, DIRECTION, SCALE),
        SCALE,
      );
      // Crossing a phase boundary over 2e-9 simulation units produces only
      // sub-micropixel numerical movement; it must not create a visible jump.
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
    }
  });

  it("raises the foot only during swing and keeps its target finite", () => {
    const stance = gaitPose(0.1, 0, DIRECTION, SCALE);
    const swing = gaitPose(0.49, 0, DIRECTION, SCALE);

    expect(stance.lift).toBe(0);
    expect(swing.stance).toBe(false);
    expect(swing.lift).toBeGreaterThan(0);
    for (const value of Object.values(swing.foot))
      expect(Number.isFinite(value)).toBe(true);
  });

  it("produces leg targets that preserve native bone lengths when reachable", () => {
    const hip = { x: 40, y: 185 };
    const upper = Math.hypot(38.5, -113.85);
    const lower = Math.hypot(60.5 - 38.5, -245.85 + 113.85);

    for (let i = 0; i < 16; i++) {
      const distance = (GAIT_CYCLE_DISTANCE * i) / 16;
      const pose = gaitPose(distance, 0, { x: 96, y: 0 }, SCALE);
      const solved = solveTwoBone(hip, pose.foot, upper, lower, 1);
      expect(
        Math.hypot(solved.knee.x - hip.x, solved.knee.y - hip.y),
      ).toBeCloseTo(upper, 5);
      expect(
        Math.hypot(
          solved.foot.x - solved.knee.x,
          solved.foot.y - solved.knee.y,
        ),
      ).toBeCloseTo(lower, 5);
      expectPointClose(solved.foot, pose.foot);
    }
  });

  it("keeps a stance foot planted through a ninety-degree corner and pause", () => {
    const pointAtDistance = cornerPath(-1);
    const distances = [0.66, 0.72, 0.8, 0.94];
    const targets = distances.map((distance) => {
      const pose = gaitOnPath(distance, 0, pointAtDistance, SCALE);
      expect(pose.stance).toBe(true);
      return pose.worldFoot;
    });
    for (const target of targets.slice(1)) expectPointClose(target, targets[0]);

    const paused = gaitOnPath(0.8, 0, pointAtDistance, SCALE);
    expect(paused).toEqual(gaitOnPath(0.8, 0, pointAtDistance, SCALE));
  });

  it("keeps both native legs inside their reach envelope on verticals and corners", () => {
    const legs = [
      {
        offset: { x: 40, y: 5 },
        upper: Math.hypot(38.5, -113.85),
        lower: Math.hypot(60.5 - 38.5, -245.85 + 113.85),
      },
      {
        offset: { x: -50, y: 22 },
        upper: Math.hypot(22, -112.75),
        lower: Math.hypot(44 - 22, -244.75 + 112.75),
      },
    ] as const;
    const paths = [
      (distance: number) => ({ x: 0, y: -55 * distance }),
      (distance: number) => ({ x: 0, y: 55 * distance }),
      cornerPath(-1),
      cornerPath(1),
    ];

    for (const pointAtDistance of paths)
      for (const [legIndex, leg] of legs.entries())
        for (let i = 0; i <= 40; i++) {
          const distance = (1.3 * i) / 40;
          const pose = gaitOnPath(
            distance,
            legIndex as 0 | 1,
            pointAtDistance,
            SCALE,
          );
          const hip = {
            x: leg.offset.x,
            y: 145 + Math.cos(pose.phase * Math.PI * 4) * 5 + leg.offset.y,
          };
          const targetDistance = Math.hypot(
            pose.foot.x - hip.x,
            pose.foot.y - hip.y,
          );
          expect(targetDistance).toBeGreaterThanOrEqual(
            Math.abs(leg.upper - leg.lower) - 1e-6,
          );
          expect(targetDistance).toBeLessThanOrEqual(
            leg.upper + leg.lower + 1e-6,
          );
        }
  });

  it("rejects non-finite and invalid gait inputs", () => {
    expect(() => gaitPose(Number.NaN, 0, DIRECTION, SCALE)).toThrow(/distance/);
    expect(() => gaitPose(0, 0, { x: Infinity, y: 0 }, SCALE)).toThrow(
      /direction/,
    );
    expect(() => gaitPose(0, 0, DIRECTION, 0)).toThrow(/scale/);
    expect(() => gaitPose(-0.1, 0, DIRECTION, SCALE)).toThrow(/non-negative/);
    expect(() =>
      worldFoot(GROUP_ORIGIN, gaitPose(0, 0, DIRECTION, SCALE), 0),
    ).toThrow(/scale/);
  });
});
