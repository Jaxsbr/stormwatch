import type { BossRageSettings } from "../config/configuration";
/** Health thresholds are inclusive; the renderer and simulation share this rule. */
export function bossRagePhase(hp: number, maxHp: number): 0 | 1 | 2 {
  return hp <= maxHp / 3 ? 2 : hp <= (maxHp * 2) / 3 ? 1 : 0;
}
export function bossRageSpeed(
  hp: number,
  maxHp: number,
  settings: BossRageSettings,
): number {
  const phase = bossRagePhase(hp, maxHp);
  return phase === 2
    ? settings.ragingSpeedScale
    : phase === 1
      ? settings.angrySpeedScale
      : 1;
}
