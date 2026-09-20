export interface Vec2 {
  x: number;
  y: number;
}

export interface SolveResult {
  knee: Vec2;
  foot: Vec2;
}

/**
 * Pure two-bone 2D IK solver (Y up).
 *
 * Solves for the knee position given a hip, a foot target, and two bone
 * lengths, using the law of cosines. Targets outside the reachable annulus
 * are clamped and the resolved foot is returned with the result.
 */

const EPSILON = 1e-6;

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number, got ${value}`);
  }
}

function assertLength(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be positive, got ${value}`);
  }
}

function assertPoint(point: Vec2, name: string): void {
  assertFinite(point.x, `${name}.x`);
  assertFinite(point.y, `${name}.y`);
}

function assertResult(point: Vec2, name: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} is outside the finite coordinate range`);
  }
}

export function solveTwoBone(
  hip: Vec2,
  foot: Vec2,
  upper: number,
  lower: number,
  bend: 1 | -1,
): SolveResult {
  assertPoint(hip, "hip");
  assertPoint(foot, "foot");
  assertLength(upper, "upper");
  assertLength(lower, "lower");
  if (bend !== 1 && bend !== -1) {
    throw new RangeError(`bend must be 1 or -1, got ${bend}`);
  }

  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  // Two finite coordinates can still overflow when subtracted. There is no
  // representable direction for that target, so fail clearly rather than
  // returning NaN coordinates from the trigonometry below.
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new RangeError(
      "hip-to-foot displacement is outside the finite range",
    );
  }
  const rawDistance = Math.hypot(dx, dy);
  if (!Number.isFinite(rawDistance)) {
    throw new RangeError("hip-to-foot distance is outside the finite range");
  }

  // Keep the requested one-pixel-scale epsilon for ordinary assets, but make
  // it relative for very small bones so the lower and upper clamp bounds do
  // not cross. At most half of the shorter bone is removed from each bound.
  const epsilon = Math.min(EPSILON, Math.min(upper, lower) * 0.5);
  const minDistance = Math.abs(upper - lower) + epsilon;
  const maxDistance = upper + lower - epsilon;
  const lowerBound = Math.min(minDistance, maxDistance);
  const upperBound = Math.max(minDistance, maxDistance);
  const distance = Math.min(upperBound, Math.max(lowerBound, rawDistance));

  let ux = 0;
  let uy = -1;
  if (rawDistance > 0) {
    ux = dx / rawDistance;
    uy = dy / rawDistance;
  }

  // If both bones are so small that their reachable interval rounds to zero,
  // the law-of-cosines denominator also becomes zero. Equal-length bones can
  // still be solved deterministically by folding around the canonical axis.
  if (distance === 0) {
    const angle = -Math.PI / 2 + (bend * Math.PI) / 2;
    const knee = {
      x: hip.x + upper * Math.cos(angle),
      y: hip.y + upper * Math.sin(angle),
    };
    const resolvedFoot = { x: hip.x, y: hip.y };
    assertResult(knee, "knee");
    return { knee, foot: resolvedFoot };
  }

  // Normalize before squaring. This keeps the law-of-cosines calculation
  // finite for very small or very large, otherwise valid, bone lengths.
  const scale = Math.max(upper, lower, distance);
  const normalizedUpper = upper / scale;
  const normalizedLower = lower / scale;
  const normalizedDistance = distance / scale;
  const denominator = 2 * normalizedUpper * normalizedDistance;
  const cosAlpha =
    (normalizedUpper * normalizedUpper +
      normalizedDistance * normalizedDistance -
      normalizedLower * normalizedLower) /
    denominator;
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosAlpha)));
  const angle = Math.atan2(uy, ux) + bend * alpha;
  const knee: Vec2 = {
    x: hip.x + upper * Math.cos(angle),
    y: hip.y + upper * Math.sin(angle),
  };
  const resolvedFoot: Vec2 = {
    x: hip.x + distance * ux,
    y: hip.y + distance * uy,
  };
  assertResult(knee, "knee");
  assertResult(resolvedFoot, "foot");
  return { knee, foot: resolvedFoot };
}
