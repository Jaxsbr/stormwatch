import { describe, expect, it } from "vitest";
import {
  sampleClip,
  validateClip,
  type AnimationClip,
} from "../src/render/animation";

const clip: AnimationClip = {
  frames: [3, 0, 1],
  fps: 10,
  loop: true,
};

describe("animation clip validation", () => {
  it("accepts actual atlas indices in a valid clip", () => {
    expect(() => validateClip(clip, 4)).not.toThrow();
  });

  it("rejects empty, malformed, or out-of-range frame data", () => {
    expect(() => validateClip({ frames: [], fps: 10, loop: true }, 4)).toThrow(
      /at least one frame/,
    );
    expect(() =>
      validateClip({ frames: [3, 0.5], fps: 10, loop: true }, 4),
    ).toThrow(/frame must be an integer/);
    expect(() =>
      validateClip({ frames: [3, 4], fps: 10, loop: true }, 4),
    ).toThrow(/out of range/);
    expect(() =>
      validateClip({ frames: [-1], fps: 10, loop: true }, 4),
    ).toThrow(/out of range/);
  });

  it("rejects invalid fps, loop flags, and atlas counts", () => {
    for (const fps of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validateClip({ frames: [0], fps, loop: true }, 4)).toThrow(
        /fps/,
      );
    }
    expect(() =>
      validateClip({ frames: [0], fps: 10, loop: "yes" as never }, 4),
    ).toThrow(/loop/);
    for (const count of [0, -1, 2.5, Number.NaN]) {
      expect(() => validateClip(clip, count)).toThrow(/atlasFrameCount/);
    }
  });
});

describe("animation clip sampling", () => {
  it("returns actual atlas frames and the midpoint blend", () => {
    const sample = sampleClip(clip, 0.05);
    expect(sample).toEqual({
      frame: 3,
      nextFrame: 0,
      mix: 0.5,
      finished: false,
    });
  });

  it("wraps exact and decimal cycle boundaries to the first frame", () => {
    const cycle = clip.frames.length / clip.fps;
    for (const elapsed of [cycle, 0.1 + 0.1 + 0.1, 0.4]) {
      const sample = sampleClip(clip, elapsed);
      expect(sample.frame).toBe(elapsed === 0.4 ? 0 : 3);
      expect(sample.nextFrame).toBe(elapsed === 0.4 ? 1 : 0);
      expect(sample.mix).toBe(0);
    }
    expect(sampleClip(clip, cycle + 0.1).frame).toBe(0);
  });

  it("normalizes negative and nonfinite elapsed values to zero", () => {
    for (const elapsed of [-0.1, Number.NaN, Number.NEGATIVE_INFINITY]) {
      expect(sampleClip(clip, elapsed)).toEqual({
        frame: 3,
        nextFrame: 0,
        mix: 0,
        finished: false,
      });
    }
  });

  it("does not mark an infinite non-looping time finished after normalization", () => {
    const still: AnimationClip = { frames: [7, 8], fps: 2, loop: false };
    expect(sampleClip(still, Number.POSITIVE_INFINITY)).toEqual({
      frame: 7,
      nextFrame: 8,
      mix: 0,
      finished: false,
    });
  });

  it("holds the final frame for a non-looping clip", () => {
    const still: AnimationClip = { frames: [7, 8], fps: 2, loop: false };
    const duration = still.frames.length / still.fps;
    const before = sampleClip(still, duration - 1e-9);

    expect(before.frame).toBe(8);
    expect(before.nextFrame).toBe(8);
    expect(before.mix).toBe(0);
    expect(before.finished).toBe(false);

    for (const elapsed of [duration, duration + 5]) {
      expect(sampleClip(still, elapsed)).toEqual({
        frame: 8,
        nextFrame: 8,
        mix: 0,
        finished: true,
      });
    }
  });

  it("rejects invalid fps even when the clip was not prevalidated", () => {
    expect(() => sampleClip({ frames: [0], fps: 0, loop: true }, 0)).toThrow(
      /fps/,
    );
    expect(() =>
      sampleClip({ frames: [0], fps: Number.NaN, loop: true }, 0),
    ).toThrow(/fps/);
  });
});
