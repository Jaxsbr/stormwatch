import { describe, expect, it } from "vitest";
import { solveTwoBone } from "../src/render/ik";

const EPS = 1e-6;

describe("solveTwoBone", () => {
  describe("reachable lengths", () => {
    it("keeps a reachable foot target unchanged and bends the knee", () => {
      const hip = { x: 0, y: 1 };
      const foot = { x: 0.6, y: 0 };
      const upper = 1;
      const lower = 1;
      const { knee, foot: resolvedFoot } = solveTwoBone(
        hip,
        foot,
        upper,
        lower,
        1,
      );

      expect(resolvedFoot.x).toBeCloseTo(foot.x, 6);
      expect(resolvedFoot.y).toBeCloseTo(foot.y, 6);
      expect(Math.hypot(knee.x - hip.x, knee.y - hip.y)).toBeCloseTo(upper, 6);
      expect(Math.hypot(foot.x - knee.x, foot.y - knee.y)).toBeCloseTo(
        lower,
        6,
      );
    });

    it("approaches a straight leg near full extension", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 0, y: -1.999 };
      const upper = 1;
      const lower = 1;
      const { knee, foot: resolvedFoot } = solveTwoBone(
        hip,
        foot,
        upper,
        lower,
        1,
      );

      expect(Math.hypot(resolvedFoot.x, resolvedFoot.y)).toBeLessThanOrEqual(
        upper + lower + EPS,
      );
      expect(Math.abs(knee.x)).toBeLessThan(0.04);
      expect(knee.y).toBeCloseTo(-upper, 3);
      expect(
        Math.hypot(resolvedFoot.x - knee.x, resolvedFoot.y - knee.y),
      ).toBeCloseTo(lower, 5);
    });

    it("handles a short reachable distance near a full fold", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 0.21, y: 0 };
      const upper = 1;
      const lower = 0.8;
      const { knee, foot: resolvedFoot } = solveTwoBone(
        hip,
        foot,
        upper,
        lower,
        -1,
      );

      expect(resolvedFoot.x).toBeCloseTo(foot.x, 6);
      expect(Math.hypot(knee.x - hip.x, knee.y - hip.y)).toBeCloseTo(upper, 6);
      expect(
        Math.hypot(resolvedFoot.x - knee.x, resolvedFoot.y - knee.y),
      ).toBeCloseTo(lower, 6);
    });
  });

  describe("unreachable clamp", () => {
    it("clamps a too-far target to upper + lower - epsilon", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 5, y: 0 };
      const upper = 1;
      const lower = 1;
      const { knee, foot: resolvedFoot } = solveTwoBone(
        hip,
        foot,
        upper,
        lower,
        1,
      );

      const clamped = upper + lower - EPS;
      expect(Math.hypot(resolvedFoot.x, resolvedFoot.y)).toBeCloseTo(
        clamped,
        6,
      );
      expect(resolvedFoot.x).toBeGreaterThan(0);
      expect(resolvedFoot.y).toBeCloseTo(0, 6);
      expect(Math.hypot(knee.x - hip.x, knee.y - hip.y)).toBeCloseTo(upper, 6);
      expect(
        Math.hypot(resolvedFoot.x - knee.x, resolvedFoot.y - knee.y),
      ).toBeCloseTo(lower, 5);
    });

    it("clamps a too-near target shorter than the inner radius", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 0.01, y: 0 };
      const upper = 1.5;
      const lower = 1;
      const { knee, foot: resolvedFoot } = solveTwoBone(
        hip,
        foot,
        upper,
        lower,
        1,
      );

      const clamped = Math.abs(upper - lower) + EPS;
      expect(Math.hypot(resolvedFoot.x, resolvedFoot.y)).toBeCloseTo(
        clamped,
        6,
      );
      expect(Math.hypot(knee.x - hip.x, knee.y - hip.y)).toBeCloseTo(upper, 5);
      expect(
        Math.hypot(resolvedFoot.x - knee.x, resolvedFoot.y - knee.y),
      ).toBeCloseTo(lower, 5);
    });
  });

  describe("mirrored bend", () => {
    it("mirrors the knee across the hip-to-foot axis", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 0, y: -1 };
      const upper = 1;
      const lower = 1;

      const a = solveTwoBone(hip, foot, upper, lower, 1);
      const b = solveTwoBone(hip, foot, upper, lower, -1);

      expect(a.foot.x).toBeCloseTo(b.foot.x, 6);
      expect(a.foot.y).toBeCloseTo(b.foot.y, 6);
      expect(a.knee.x).toBeCloseTo(-b.knee.x, 6);
      expect(a.knee.y).toBeCloseTo(b.knee.y, 6);
      expect(Math.abs(a.knee.x)).toBeGreaterThan(0.1);
    });
  });

  describe("zero target distance", () => {
    it("is stable and finite when hip and foot coincide", () => {
      const hip = { x: 2, y: 3 };
      const foot = { x: 2, y: 3 };
      const upper = 1;
      const lower = 1;

      for (const bend of [1, -1] as const) {
        const result = solveTwoBone(hip, foot, upper, lower, bend);
        expect(Number.isFinite(result.knee.x)).toBe(true);
        expect(Number.isFinite(result.knee.y)).toBe(true);
        expect(Number.isFinite(result.foot.x)).toBe(true);
        expect(Number.isFinite(result.foot.y)).toBe(true);
        expect(
          Math.hypot(result.knee.x - hip.x, result.knee.y - hip.y),
        ).toBeCloseTo(upper, 6);
        expect(
          Math.hypot(
            result.foot.x - result.knee.x,
            result.foot.y - result.knee.y,
          ),
        ).toBeCloseTo(lower, 5);
        expect(
          Math.hypot(result.foot.x - hip.x, result.foot.y - hip.y),
        ).toBeCloseTo(EPS, 6);
      }
    });

    it("stays finite for the smallest equal positive bone lengths", () => {
      const result = solveTwoBone(
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        Number.MIN_VALUE,
        Number.MIN_VALUE,
        1,
      );

      expect(Number.isFinite(result.knee.x)).toBe(true);
      expect(Number.isFinite(result.knee.y)).toBe(true);
      expect(result.foot).toEqual({ x: 0, y: 0 });
    });
  });

  describe("invalid lengths / non-finite inputs", () => {
    it("throws on zero or negative bone lengths", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 1, y: 0 };
      expect(() => solveTwoBone(hip, foot, 0, 1, 1)).toThrow();
      expect(() => solveTwoBone(hip, foot, 1, -1, 1)).toThrow();
    });

    it("throws on non-finite lengths", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 1, y: 0 };
      expect(() => solveTwoBone(hip, foot, NaN, 1, 1)).toThrow();
      expect(() => solveTwoBone(hip, foot, 1, Infinity, 1)).toThrow();
    });

    it("throws on non-finite hip/foot coordinates", () => {
      expect(() =>
        solveTwoBone({ x: NaN, y: 0 }, { x: 1, y: 0 }, 1, 1, 1),
      ).toThrow();
      expect(() =>
        solveTwoBone({ x: 0, y: 0 }, { x: Infinity, y: 0 }, 1, 1, -1),
      ).toThrow();
    });

    it("throws on a displacement that overflows despite finite endpoints", () => {
      expect(() =>
        solveTwoBone(
          { x: -Number.MAX_VALUE, y: 0 },
          { x: Number.MAX_VALUE, y: 0 },
          1,
          1,
          1,
        ),
      ).toThrow(/displacement/);
    });

    it("throws when a finite displacement length overflows", () => {
      expect(() =>
        solveTwoBone(
          { x: 0, y: 0 },
          { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
          1,
          1,
          1,
        ),
      ).toThrow(/distance/);
    });

    it("throws on an invalid bend", () => {
      const hip = { x: 0, y: 0 };
      const foot = { x: 1, y: 0 };
      // @ts-expect-error bend must be 1 | -1
      expect(() => solveTwoBone(hip, foot, 1, 1, 0)).toThrow();
    });
  });
});
