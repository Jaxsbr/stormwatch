import type { Enemy, PoisonSettings } from "./types";

/** Poison has one source strength and schedule, regardless of overlapping bombs. */
export function applyPoison(
  enemy: Enemy,
  damage: number,
  clock: number,
  settings: PoisonSettings,
): "immune" | "poison-applied" | "poison-refreshed" {
  if (enemy.poisonImmune) return "immune";
  const active = enemy.poison && enemy.poison.expiresAt >= clock;
  enemy.poison = {
    damage: active ? Math.max(enemy.poison!.damage, damage) : damage,
    expiresAt: clock + settings.durationSeconds,
    nextTickAt: active
      ? enemy.poison!.nextTickAt
      : clock + settings.tickSeconds,
    tickSeconds: active ? enemy.poison!.tickSeconds : settings.tickSeconds,
  };
  return active ? "poison-refreshed" : "poison-applied";
}

/** Inclusive expiry boundary: a tick exactly at expiry lands, then status clears. */
export function advancePoison(
  enemy: Enemy,
  clock: number,
  tick: (damage: number) => void,
): boolean {
  const poison = enemy.poison;
  if (!poison) return false;
  const epsilon = 1e-9;
  while (
    enemy.alive &&
    poison.nextTickAt <= clock + epsilon &&
    poison.nextTickAt <= poison.expiresAt + epsilon
  ) {
    poison.nextTickAt += poison.tickSeconds;
    tick(poison.damage);
  }
  if (!enemy.alive || clock + epsilon >= poison.expiresAt) {
    delete enemy.poison;
    return true;
  }
  return false;
}

export function feedbackReady(
  enemy: Enemy,
  key: "immuneAt" | "shieldCueAt",
  clock: number,
): boolean {
  if (enemy[key] !== undefined && clock - enemy[key]! < 0.18) return false;
  enemy[key] = clock;
  return true;
}
