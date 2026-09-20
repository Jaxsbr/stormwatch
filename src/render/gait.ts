export interface Vec2 {
  x: number;
  y: number;
}

export interface GaitPose {
  /** Whole-character phase in the range [0, 1). */
  phase: number;
  /** Phase for this leg after the half-cycle offset. */
  legPhase: number;
  /** True while this leg is planted. */
  stance: boolean;
  /** Local source-pixel stride offset from the planted foot. */
  stride: number;
  /** Local source-pixel lift during swing. */
  lift: number;
  /** Foot target in the character group's local coordinates. */
  foot: Vec2;
}

export interface PathGaitPose extends GaitPose {
  /** Start of the current half-cycle in simulation distance units. */
  contactDistance: number;
  /** Progress through swing, or zero while planted. */
  swingProgress: number;
  /** Path anchor before the fixed near/far lateral foot offset. */
  worldAnchor: Vec2;
  /** Final rendered world-space foot target, including the lateral offset. */
  worldFoot: Vec2;
}

export interface PathGaitWorkspace {
  start: Vec2;
  end: Vec2;
  current: Vec2;
  pose?: PathGaitPose;
}
export const createPathGaitWorkspace = (): PathGaitWorkspace => ({
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
  current: { x: 0, y: 0 },
});

export const GAIT_CYCLE_DISTANCE = 0.65;
export const GAIT_STANCE_FRACTION = 0.5;
const HALF_STRIDE = 0.1625;
const SWING_LIFT = 7;

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be finite, got ${value}`);
  }
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

/**
 * Derive one leg's deterministic gait pose from simulation distance.
 *
 * `direction` is the rendered world displacement for one simulation distance
 * unit, and `scale` converts source-pixel offsets into rendered world units.
 * Keeping those units explicit is what makes the counter-translation plant a
 * foot while the character advances along a straight path segment.
 */
export function gaitPose(
  distance: number,
  legIndex: 0 | 1,
  direction: Vec2,
  scale: number,
): GaitPose {
  assertFinite(distance, "distance");
  assertFinite(direction.x, "direction.x");
  assertFinite(direction.y, "direction.y");
  assertFinite(scale, "scale");
  if (distance < 0) throw new RangeError("distance must be non-negative");
  if (scale <= 0) throw new RangeError("scale must be positive");

  const phase = positiveModulo(distance / GAIT_CYCLE_DISTANCE, 1);
  const legPhase = positiveModulo(phase + legIndex * 0.5, 1);
  const stance = legPhase < GAIT_STANCE_FRACTION;
  const stride = stance
    ? HALF_STRIDE - GAIT_CYCLE_DISTANCE * legPhase
    : -HALF_STRIDE + GAIT_CYCLE_DISTANCE * (legPhase - 0.5);
  const lift = stance
    ? 0
    : Math.sin((legPhase - 0.5) * Math.PI * 2) * SWING_LIFT;

  return {
    phase,
    legPhase,
    stance,
    stride,
    lift,
    foot: {
      x: (legIndex === 0 ? 35 : -35) + (direction.x * stride) / scale,
      y: (direction.y * stride) / scale + lift / scale,
    },
  };
}

/**
 * Derive a gait target from a deterministic path sampler.
 *
 * A leg's stance anchor is sampled once per half-cycle from the path rather
 * than reconstructed from the current tangent. This keeps a planted foot
 * fixed through a ninety-degree path corner without mutable renderer state.
 */
export function gaitOnPath(
  distance: number,
  legIndex: 0 | 1,
  pointAtDistance: (distance: number, out?: Vec2) => Vec2,
  scale: number,
  workspace?: PathGaitWorkspace,
): PathGaitPose {
  assertFinite(distance, "distance");
  assertFinite(scale, "scale");
  if (distance < 0) throw new RangeError("distance must be non-negative");
  if (scale <= 0) throw new RangeError("scale must be positive");
  if (legIndex !== 0 && legIndex !== 1)
    throw new RangeError(`legIndex must be 0 or 1, got ${legIndex}`);

  const phase = positiveModulo(distance / GAIT_CYCLE_DISTANCE, 1);
  const cycle = distance / GAIT_CYCLE_DISTANCE + legIndex * 0.5;
  const legPhase = positiveModulo(cycle, 1);
  const contactDistance =
    Math.floor(cycle) * GAIT_CYCLE_DISTANCE -
    legIndex * GAIT_CYCLE_DISTANCE * 0.5;
  const stance = legPhase < GAIT_STANCE_FRACTION;
  const swingProgress = stance ? 0 : (legPhase - 0.5) * 2;
  const start = pointAtDistance(contactDistance + 0.1625, workspace?.start);
  const end = pointAtDistance(contactDistance + 0.65 + 0.1625, workspace?.end);
  const current = pointAtDistance(distance, workspace?.current);
  assertFinite(start.x, "start.x");
  assertFinite(start.y, "start.y");
  assertFinite(end.x, "end.x");
  assertFinite(end.y, "end.y");
  assertFinite(current.x, "current.x");
  assertFinite(current.y, "current.y");
  const lift = stance ? 0 : Math.sin((legPhase - 0.5) * Math.PI * 2) * 7;
  const x = stance ? start.x : start.x + (end.x - start.x) * swingProgress;
  const y =
    (stance ? start.y : start.y + (end.y - start.y) * swingProgress) + lift;
  const lateral = legIndex === 0 ? 35 : -35;
  const result = workspace?.pose ?? {
    phase: 0,
    legPhase: 0,
    stance: false,
    stride: 0,
    lift: 0,
    foot: { x: 0, y: 0 },
    contactDistance: 0,
    swingProgress: 0,
    worldAnchor: { x: 0, y: 0 },
    worldFoot: { x: 0, y: 0 },
  };
  result.phase = phase;
  result.legPhase = legPhase;
  result.stance = stance;
  result.stride = stance
    ? 0.1625 - GAIT_CYCLE_DISTANCE * legPhase
    : -0.1625 + GAIT_CYCLE_DISTANCE * (legPhase - 0.5);
  result.lift = lift;
  result.contactDistance = contactDistance;
  result.swingProgress = swingProgress;
  result.worldAnchor.x = x;
  result.worldAnchor.y = y;
  result.worldFoot.x = x + lateral * scale;
  result.worldFoot.y = y;
  result.foot.x = (x - current.x) / scale + lateral;
  result.foot.y = (y - current.y) / scale;
  if (workspace) workspace.pose = result;
  return result;
}

/** Convert a local gait foot target into the rendered world coordinate. */
export function worldFoot(
  groupPosition: Vec2,
  pose: GaitPose,
  scale: number,
): Vec2 {
  assertFinite(groupPosition.x, "groupPosition.x");
  assertFinite(groupPosition.y, "groupPosition.y");
  assertFinite(scale, "scale");
  if (scale <= 0) throw new RangeError("scale must be positive");
  return {
    x: groupPosition.x + pose.foot.x * scale,
    y: groupPosition.y + pose.foot.y * scale,
  };
}
