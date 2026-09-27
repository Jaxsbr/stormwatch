import type { ShieldCycle } from "./types";

const DEFAULT_FIRST_GUARD_SECONDS = 1.1;
const DEFAULT_CYCLE: ShieldCycle = { upSeconds: 2, downSeconds: 3 };
export const SHIELD_GLYPH_FADE_SECONDS = 0.18;

export interface ShieldState {
  raised: boolean;
  /** 0–1 presentation strength, faded at the start and end of the guard. */
  strength: number;
}

/** Shared timing for damage reduction and its on-screen guard cue. */
export function ratShieldState(
  age: number,
  customCycle?: ShieldCycle,
  enabled = true,
): ShieldState {
  if (!enabled || !Number.isFinite(age) || age < 0)
    return { raised: false, strength: 0 };
  const cycle = customCycle ?? DEFAULT_CYCLE;
  const firstGuard = customCycle
    ? customCycle.downSeconds
    : DEFAULT_FIRST_GUARD_SECONDS;
  if (age < firstGuard) return { raised: false, strength: 0 };

  const phase = (age - firstGuard) % (cycle.upSeconds + cycle.downSeconds);
  const raised = phase < cycle.upSeconds;
  if (!raised) return { raised: false, strength: 0 };

  const fade = Math.min(
    SHIELD_GLYPH_FADE_SECONDS,
    cycle.upSeconds / 2,
    cycle.downSeconds / 2,
  );
  const strength = Math.min(1, phase / fade, (cycle.upSeconds - phase) / fade);
  return { raised, strength };
}
