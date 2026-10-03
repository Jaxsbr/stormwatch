import type { WaveDef, WaveGroupDef } from "./types";
export interface ScheduledSpawn extends WaveGroupDef {
  at: number;
  groupId: string;
  ordinal: number;
  tick: number;
}
/** Legacy cadence rejects overlapping tails; opted-in simultaneous groups merge with stable ties. */
export function compileSpawnSchedule(
  wave: WaveDef,
  initialDelay = 0.7,
): ScheduledSpawn[] {
  const result: ScheduledSpawn[] = [];
  let at = initialDelay;
  let previousStart = initialDelay;
  let latestSpawn = -Infinity;
  for (const [index, group] of wave.groups.entries()) {
    const label = group.id ?? `group-${index + 1}`;
    if (group.startTogether && index === 0)
      throw new Error(`${label}: simultaneous group needs a preceding group`);
    const handoff = at;
    at = (group.startTogether ? previousStart : at) + (group.delayBefore ?? 0);
    previousStart = at;
    let lastGroupSpawn = -Infinity;
    const batchSize = group.batchSize ?? 1;
    for (let n = 0; n < group.count; n += batchSize) {
      for (let i = 0; i < Math.min(batchSize, group.count - n); i++) {
        const time = at + i * (group.batchStagger ?? 0);
        if (
          time < lastGroupSpawn ||
          (!group.startTogether && time < latestSpawn)
        )
          throw new Error(
            `${label}.batchStagger/gap: schedule must be nondecreasing`,
          );
        latestSpawn = Math.max(latestSpawn, time);
        lastGroupSpawn = time;
        result.push({
          ...group,
          at: time,
          groupId: label,
          ordinal: n + i,
          tick: 0,
        });
      }
      at += group.gap;
    }
    at = Math.max(at, handoff);
  }
  // Equal-time arrivals retain authored insertion order, independent of route.
  result.sort((a, b) => a.at - b.at);
  let tick = 0,
    tickClock = 0;
  for (const spawn of result) {
    while (tickClock < spawn.at) {
      tick++;
      tickClock += 1 / 30;
    }
    spawn.tick = tick;
  }
  return result;
}
