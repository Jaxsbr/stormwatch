export interface AnimationClip {
  /** Actual atlas frame indices, in play order. */
  frames: readonly number[];
  /** Playback speed in frames per second. */
  fps: number;
  /** When false, playback stops on the last frame. */
  loop: boolean;
}

export interface FrameSample {
  /** Current frame's actual atlas index. */
  frame: number;
  /** Next frame's actual atlas index, for an optional preview blend. */
  nextFrame: number;
  /** Blend fraction between frame and nextFrame. */
  mix: number;
  /** True once a non-looping clip has reached its duration. */
  finished: boolean;
}

const POSITION_EPSILON = 1e-9;

export function validateClip(
  clip: AnimationClip,
  atlasFrameCount: number,
): void {
  if (!Number.isInteger(atlasFrameCount) || atlasFrameCount < 1) {
    throw new Error(
      `animation: atlasFrameCount must be a positive integer, got ${atlasFrameCount}`,
    );
  }

  const { frames, fps, loop } = clip;
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("animation: clip must contain at least one frame");
  }

  for (const frame of frames) {
    if (!Number.isInteger(frame)) {
      throw new Error(`animation: frame must be an integer, got ${frame}`);
    }
    if (frame < 0 || frame >= atlasFrameCount) {
      throw new Error(
        `animation: frame ${frame} out of range [0, ${atlasFrameCount})`,
      );
    }
  }

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(
      `animation: fps must be a positive finite number, got ${fps}`,
    );
  }
  if (typeof loop !== "boolean") {
    throw new Error(`animation: loop must be a boolean, got ${String(loop)}`);
  }
}

function snapFrameBoundary(position: number): number {
  const nearest = Math.round(position);
  return Math.abs(position - nearest) <= POSITION_EPSILON ? nearest : position;
}

/**
 * Sample a clip without mutating it. Nonfinite or negative elapsed times are
 * treated as zero. Looping uses frame-space modulo so decimal cycle lengths
 * do not turn an exact frame boundary into the preceding frame.
 */
export function sampleClip(
  clip: AnimationClip,
  elapsedSeconds: number,
): FrameSample {
  if (!Number.isFinite(clip.fps) || clip.fps <= 0) {
    throw new Error(
      `animation: fps must be a positive finite number, got ${clip.fps}`,
    );
  }
  if (!Array.isArray(clip.frames) || clip.frames.length === 0) {
    throw new Error("animation: clip must contain at least one frame");
  }

  const elapsed =
    Number.isFinite(elapsedSeconds) && elapsedSeconds >= 0 ? elapsedSeconds : 0;
  const frameCount = clip.frames.length;
  const rawPosition = elapsed * clip.fps;
  const clipDuration = frameCount / clip.fps;

  let position: number;
  if (clip.loop) {
    const wrapped = snapFrameBoundary(rawPosition % frameCount);
    position = wrapped >= frameCount ? 0 : wrapped;
  } else {
    position = snapFrameBoundary(Math.min(rawPosition, frameCount));
  }

  const frameIndex = Math.min(Math.floor(position), frameCount - 1);
  const nextIndex = clip.loop
    ? (frameIndex + 1) % frameCount
    : Math.min(frameIndex + 1, frameCount - 1);
  const mix =
    !clip.loop && frameIndex === frameCount - 1 ? 0 : position - frameIndex;

  return {
    frame: clip.frames[frameIndex],
    nextFrame: clip.frames[nextIndex],
    mix,
    finished: !clip.loop && elapsed >= clipDuration,
  };
}
