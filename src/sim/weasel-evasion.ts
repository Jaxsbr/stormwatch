import type { Enemy, EvasionCycle } from "./types";

const CUE_INTERVAL_SECONDS = 0.18;

/** Spawn-relative deterministic windows; presentation shares the same warning. */
export function weaselEvasionState(age: number, cycle?: EvasionCycle) {
  if (!cycle || age < 0 || !Number.isFinite(age))
    return { active: false, warning: false };
  const phase = age % (cycle.downSeconds + cycle.upSeconds);
  return {
    active: phase >= cycle.downSeconds,
    warning: phase >= cycle.downSeconds - 0.6 && phase < cycle.downSeconds,
  };
}

/** Advance the evasion window once per Game tick before movement and impacts. */
export function advanceWeaselEvasion(
  enemy: Enemy,
  clock: number,
  activeSpeedScale: number,
): number {
  if (enemy.kind !== "runner" || !enemy.alive) return 1;
  enemy.evasion = weaselEvasionState(
    clock - enemy.spawnedAt,
    enemy.evasionCycle,
  );
  return enemy.evasion.active ? activeSpeedScale : 1;
}

/** A missed projectile may create one readable cue for a simultaneous volley. */
export function weaselEvasionImpact(
  enemy: Enemy,
  clock: number,
  projectile: boolean,
): { evaded: boolean; cue: boolean } {
  if (!projectile || enemy.kind !== "runner" || !enemy.evasion?.active)
    return { evaded: false, cue: false };
  const cue =
    enemy.evadeAt === undefined ||
    clock - enemy.evadeAt >= CUE_INTERVAL_SECONDS;
  if (cue) enemy.evadeAt = clock;
  return { evaded: true, cue };
}
