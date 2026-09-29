import type { BossRageSettings } from "../config/configuration";
import type { Enemy } from "./types";
/** Damage during a cycle is spent; recovery starts a fresh damage window. */
export function updateBossRage(
  enemy: Enemy,
  clock: number,
  settings: Required<BossRageSettings>,
): void {
  if (!enemy.alive || enemy.kind !== "boss") return;
  const rage = (enemy.rage ??= {
    phase: 0,
    damageBaselineHp: enemy.maxHp,
    phaseUntil: 0,
    permanent: false,
  });
  if (enemy.hp <= enemy.maxHp / 4 || rage.permanent) {
    rage.phase = 2;
    rage.permanent = true;
    rage.phaseUntil = 0;
    return;
  }
  if (rage.phase === 1 && clock >= rage.phaseUntil) {
    rage.phase = 2;
    rage.phaseUntil += settings.ragingSeconds;
  }
  if (rage.phase === 2 && clock >= rage.phaseUntil) {
    rage.phase = 0;
    rage.damageBaselineHp = enemy.hp;
    rage.phaseUntil = 0;
  }
  if (
    rage.phase === 0 &&
    rage.damageBaselineHp - enemy.hp >=
      (enemy.maxHp * settings.triggerDamagePercent) / 100
  ) {
    rage.phase = 1;
    rage.phaseUntil = clock + settings.angrySeconds;
  }
}
export function bossRagePhase(enemy: Enemy): 0 | 1 | 2 {
  return enemy.rage?.phase ?? 0;
}
export function bossRageSpeed(
  enemy: Enemy,
  settings: BossRageSettings,
): number {
  const phase = bossRagePhase(enemy);
  return phase === 2
    ? settings.ragingSpeedScale
    : phase === 1
      ? settings.angrySpeedScale
      : 1;
}
