import type { WaveDef, WaveGroupDef } from "./types";
export interface ScheduledSpawn extends WaveGroupDef {
  at: number;
  groupId: string;
  ordinal: number;
  tick: number;
}
/** Authored order is retained. Overlapping batch/group tails are invalid, never sorted. */
export function compileSpawnSchedule(
  wave: WaveDef,
  initialDelay = 0.7,
): ScheduledSpawn[] {
  const result: ScheduledSpawn[] = [];
  let at = initialDelay;
  let tick = 0,
    tickClock = 0;
  for (const [index, group] of wave.groups.entries()) {
    const label = group.id ?? `group-${index + 1}`;
    at += group.delayBefore ?? 0;
    const batchSize = group.batchSize ?? 1;
    for (let n = 0; n < group.count; n += batchSize) {
      for (let i = 0; i < Math.min(batchSize, group.count - n); i++) {
        const time = at + i * (group.batchStagger ?? 0);
        if (result.length && time < result[result.length - 1].at)
          throw new Error(
            `${label}.batchStagger/gap: schedule must be nondecreasing`,
          );
        while (tickClock < time) {
          tick++;
          tickClock += 1 / 30;
        }
        result.push({
          ...group,
          at: time,
          groupId: label,
          ordinal: n + i,
          tick,
        });
      }
      at += group.gap;
    }
  }
  return result;
}
