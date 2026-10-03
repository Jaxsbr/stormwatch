import {
  compileLevel,
  type LevelRecipe,
  type WaveRecipe,
} from "../config/configuration";
import { validateLevel } from "../sim/path";
import {
  compileSpawnSchedule,
  type ScheduledSpawn,
} from "../sim/spawn-schedule";
import type { EnemyKind } from "../sim/types";
import { levelRoutes } from "../sim/routes";

export interface VisualSelection {
  packetIndex: number;
  groupIndex: number;
}

export interface VisualGroup extends VisualSelection {
  repeatIndex: number;
  key: string;
  kind: EnemyKind;
  count: number;
  batchSize: number;
  gap: number;
  stagger: number;
  start: number;
  lastSpawn: number;
  /** Cursor after the final batch spacing, not the last enemy's appearance. */
  handoff: number;
  spawns: ScheduledSpawn[];
}

export interface VisualSequence {
  packetIndex: number;
  start: number;
  handoff: number;
  repeat: number;
  /** Total enemies, including every repeated copy. */
  count: number;
}

export interface WaveLayout {
  nodes: VisualGroup[];
  sequences: VisualSequence[];
  /** Includes both visible arrivals and the last sequence's trailing spacing. */
  end: number;
}

export type WaveEdit =
  | { type: "route"; id: string }
  | { type: "together"; enabled: boolean }
  | { type: "move"; delta: number }
  | { type: "duration"; seconds: number }
  | { type: "count"; count: number }
  | { type: "batch"; size: number }
  | { type: "stagger"; seconds: number }
  | { type: "repeat"; count: number }
  | { type: "repeat-rest"; seconds: number }
  | { type: "reorder"; direction: -1 | 1 }
  | { type: "sequence-reorder"; direction: -1 | 1 }
  | { type: "add-sequence"; kind: EnemyKind; id: string; groupId: string }
  | { type: "add"; kind: EnemyKind; id: string }
  | { type: "remove" };

function nonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${label} must be a finite number of at least 0.`);
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error(`${label} must be a whole number of at least 1.`);
}

function checkIds(items: { id: string }[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.id || seen.has(item.id))
      throw new Error(`${label} need nonempty, unique identities.`);
    seen.add(item.id);
  }
}

/** Validate authored structure before expansion, then use the game's validators. */
function validatedSchedule(
  level: LevelRecipe,
  wave: WaveRecipe,
  initialDelay: number,
): ScheduledSpawn[] {
  nonnegative(initialDelay, "Initial arrival delay");
  if (!wave.packets.length) throw new Error("A wave needs a sequence.");
  checkIds(wave.packets, "Sequences");
  for (const packet of wave.packets) {
    positiveInteger(packet.repeat ?? 1, "Repeat count");
    nonnegative(packet.repeatDelayBefore ?? 0, "Extra repeat wait");
    if (!packet.groups.length)
      throw new Error("A sequence needs an enemy group.");
    checkIds(packet.groups, "Enemy groups");
    for (const group of packet.groups) {
      positiveInteger(group.count, "Enemy count");
      positiveInteger(group.batchSize ?? 1, "Enemies per batch");
      nonnegative(group.delayBefore ?? 0, "Wait before group");
      if (!["raider", "runner", "armored", "boss"].includes(group.kind))
        throw new Error("Choose a supported enemy.");
      if (group.evasionCycle) {
        if (
          group.kind !== "runner" ||
          !Number.isFinite(group.evasionCycle.upSeconds) ||
          group.evasionCycle.upSeconds <= 0 ||
          !Number.isFinite(group.evasionCycle.downSeconds) ||
          group.evasionCycle.downSeconds <= 0
        )
          throw new Error("Invalid Weasel evasion timing.");
      }
    }
  }
  const compiled = compileLevel({ ...level, waves: [wave] });
  validateLevel(compiled);
  return compileSpawnSchedule(compiled.waves[0], initialDelay);
}

/** Species rows are views of one ordered schedule, never independent tracks. */
export function layoutWave(
  level: LevelRecipe,
  wave: WaveRecipe,
  initialDelay: number,
): WaveLayout {
  const schedule = validatedSchedule(level, wave, initialDelay);
  const nodes: VisualGroup[] = [];
  const sequences: VisualSequence[] = [];
  let cursor = initialDelay;
  const spawnsByGroup = new Map<string, ScheduledSpawn[]>();
  for (const spawn of schedule) {
    const group = spawnsByGroup.get(spawn.groupId) ?? [];
    group.push(spawn);
    spawnsByGroup.set(spawn.groupId, group);
  }
  for (const [packetIndex, packet] of wave.packets.entries()) {
    const repeat = packet.repeat ?? 1;
    const firstNode = nodes.length;
    let count = 0;
    for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
      for (const [groupIndex, group] of packet.groups.entries()) {
        const batchSize = group.batchSize ?? 1;
        const spawns = spawnsByGroup.get(
          `${packet.id}/${repeatIndex + 1}/${group.id}`,
        )!;
        let start = spawns[0].at;
        // Use repeated addition just as the scheduler does, retaining precision.
        for (let n = 0; n < group.count; n += batchSize) start += group.gap;
        cursor = Math.max(cursor, start);
        nodes.push({
          packetIndex,
          groupIndex,
          repeatIndex,
          key: spawns[0].groupId,
          kind: group.kind,
          count: group.count,
          batchSize,
          gap: group.gap,
          stagger: group.batchStagger ?? 0,
          start: spawns[0].at,
          lastSpawn: spawns[spawns.length - 1].at,
          handoff: start,
          spawns,
        });
        count += group.count;
      }
    }
    sequences.push({
      packetIndex,
      start: nodes[firstNode].start,
      handoff: cursor,
      repeat,
      count,
    });
  }
  return {
    nodes,
    sequences,
    end: Math.max(cursor, schedule[schedule.length - 1].at),
  };
}

/** A complete proposed edit either returns a valid new recipe or changes nothing. */
export function editWave(
  level: LevelRecipe,
  wave: WaveRecipe,
  initialDelay: number,
  selection: VisualSelection,
  change: WaveEdit,
): WaveRecipe {
  const next = structuredClone(wave);
  const packet = next.packets[selection.packetIndex];
  const group = packet?.groups[selection.groupIndex];
  if (!packet || !group) throw new Error("Select an existing enemy group.");
  switch (change.type) {
    case "together":
      group.startTogether = change.enabled;
      break;
    case "route":
      group.routeId = change.id;
      break;
    case "move": {
      if (!Number.isFinite(change.delta))
        throw new Error("Move distance must be finite.");
      const wait = (group.delayBefore ?? 0) + change.delta;
      nonnegative(wait, "Wait before group");
      if (change.delta !== 0) group.delayBefore = wait;
      break;
    }
    case "duration": {
      if (!Number.isFinite(change.seconds) || change.seconds <= 0)
        throw new Error("Group duration must be greater than 0.");
      group.gap =
        change.seconds / Math.ceil(group.count / (group.batchSize ?? 1));
      break;
    }
    case "count":
      positiveInteger(change.count, "Enemy count");
      group.count = change.count;
      break;
    case "batch":
      positiveInteger(change.size, "Enemies per batch");
      if (change.size === 1 && (group.batchStagger ?? 0) > 0)
        throw new Error(
          "Set time within a batch to 0 before using single enemies.",
        );
      group.batchSize = change.size;
      if (change.size === 1) delete group.batchStagger;
      break;
    case "stagger":
      nonnegative(change.seconds, "Time within a batch");
      if ((group.batchSize ?? 1) < 2) {
        if (change.seconds !== 0)
          throw new Error(
            "Use at least two enemies per batch before staggering.",
          );
        delete group.batchStagger;
      } else group.batchStagger = change.seconds;
      break;
    case "repeat":
      positiveInteger(change.count, "Repeat count");
      packet.repeat = change.count;
      break;
    case "repeat-rest":
      nonnegative(change.seconds, "Extra repeat wait");
      packet.repeatDelayBefore = change.seconds;
      break;
    case "reorder": {
      if (change.direction !== -1 && change.direction !== 1)
        throw new Error("Move one group earlier or later.");
      const destination = selection.groupIndex + change.direction;
      if (destination < 0 || destination >= packet.groups.length)
        throw new Error("This group is already at the edge of its sequence.");
      packet.groups.splice(selection.groupIndex, 1);
      packet.groups.splice(destination, 0, group);
      break;
    }
    case "add":
      packet.groups.splice(selection.groupIndex + 1, 0, {
        id: change.id,
        kind: change.kind,
        count: 3,
        gap: 1,
        ...(level.routes || level.routeLayoutId
          ? { routeId: levelRoutes(compileLevel(level))[0].id }
          : {}),
      });
      break;
    case "add-sequence":
      next.packets.splice(selection.packetIndex + 1, 0, {
        id: change.id,
        groups: [
          {
            id: change.groupId,
            kind: change.kind,
            count: 3,
            gap: 1,
            ...(level.routes || level.routeLayoutId
              ? { routeId: levelRoutes(compileLevel(level))[0].id }
              : {}),
          },
        ],
      });
      break;
    case "sequence-reorder": {
      if (change.direction !== -1 && change.direction !== 1)
        throw new Error("Move one sequence earlier or later.");
      const destination = selection.packetIndex + change.direction;
      if (destination < 0 || destination >= next.packets.length)
        throw new Error("This sequence is already at the edge of the wave.");
      next.packets.splice(selection.packetIndex, 1);
      next.packets.splice(destination, 0, packet);
      break;
    }
    case "remove":
      if (packet.groups.length === 1) {
        if (next.packets.length === 1)
          throw new Error("Keep at least one enemy group in the wave.");
        next.packets.splice(selection.packetIndex, 1);
      } else packet.groups.splice(selection.groupIndex, 1);
      break;
  }
  validatedSchedule(level, next, initialDelay);
  return next;
}
