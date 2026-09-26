import type { EvasionCycle } from "./types";

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
