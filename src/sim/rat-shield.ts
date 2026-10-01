import type { Enemy, ShieldCycle } from "./types";

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

/** Advance the guard once per Game tick, before movement and projectile impacts. */
export function advanceRatShield(enemy: Enemy, clock: number): void {
  if (enemy.kind !== "raider" || !enemy.alive) return;
  const state = ratShieldState(
    clock - enemy.spawnedAt,
    enemy.shieldCycle,
    enemy.shieldEnabled,
  );
  enemy.shieldRaised = state.raised;
  enemy.shieldStrength = state.strength;
}

/** Apply the guard decision at impact; the caller owns damage and feedback. */
export function ratShieldImpact(
  enemy: Enemy,
  clock: number,
  projectile: boolean,
  guardDamageScale: number,
): { guarded: boolean; damageScale: number } {
  const guarded = projectile && enemy.kind === "raider" && enemy.shieldRaised;
  if (guarded) enemy.shieldHitAt = clock;
  return { guarded, damageScale: guarded ? guardDamageScale : 1 };
}
