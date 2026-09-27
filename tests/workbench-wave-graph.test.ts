import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  compileLevel,
  type WaveRecipe,
} from "../src/config/configuration";
import { compileSpawnSchedule } from "../src/sim/spawn-schedule";
import { editWave, layoutWave } from "../src/workbench/wave-graph";

const level = CANONICAL_CONTENT.levels[0];
const selection = { packetIndex: 0, groupIndex: 0 };
const recipe = (): WaveRecipe => ({
  id: "visual-wave",
  title: "Visual timing",
  reward: 10,
  packets: [
    {
      id: "pairs",
      repeat: 2,
      repeatDelayBefore: 1,
      groups: [
        {
          id: "rats",
          kind: "raider",
          count: 4,
          batchSize: 2,
          batchStagger: 0.25,
          gap: 2,
          movementScale: 1.2,
          shieldCycle: { upSeconds: 2, downSeconds: 3 },
        },
      ],
    },
    {
      id: "finish",
      groups: [{ id: "weasel", kind: "runner", count: 1, gap: 1 }],
    },
  ],
});
const times = (wave: WaveRecipe) =>
  compileSpawnSchedule(compileLevel({ ...level, waves: [wave] }).waves[0], 0.7)
    .map((spawn) => spawn.at)
    .map((at) => Number(at.toFixed(6)));

describe("visual wave authoring", () => {
  it("uses exact shared spawn records and shows trailing spacing and additive repeat rest", () => {
    const wave = recipe();
    const graph = layoutWave(level, wave, 0.7);
    const first = graph.nodes[0];
    expect(first.start).toBeCloseTo(0.7);
    expect(first.lastSpawn).toBeCloseTo(2.95);
    expect(first.handoff).toBeCloseTo(4.7);
    expect(graph.nodes[1].start).toBeCloseTo(5.7);
    expect(graph.nodes[1].start - first.lastSpawn).toBeCloseTo(2.75);
    expect(graph.nodes[1].key).toBe("pairs/2/rats");
    expect(graph.nodes[1].repeatIndex).toBe(1);
    expect(graph.nodes[1].groupIndex).toBe(0);
    expect(graph.sequences[0]).toMatchObject({ repeat: 2, count: 8 });
    expect(graph.sequences[0].handoff).toBeCloseTo(9.7);
    expect(graph.end).toBeCloseTo(10.7);
    expect(graph.nodes.flatMap((node) => node.spawns)).toEqual(
      compileSpawnSchedule(
        compileLevel({ ...level, waves: [wave] }).waves[0],
        0.7,
      ),
    );
  });

  it("moving a shared group changes every repeat and ripples following arrivals", () => {
    const source = recipe();
    const before = structuredClone(source);
    const moved = editWave(level, source, 0.7, selection, {
      type: "move",
      delta: 0.5,
    });
    expect(times(moved)).toEqual([
      1.2, 1.45, 3.2, 3.45, 6.7, 6.95, 8.7, 8.95, 10.7,
    ]);
    expect(moved.packets[0].groups[0]).toEqual({
      ...before.packets[0].groups[0],
      delayBefore: 0.5,
    });
    expect(moved.packets[0].repeatDelayBefore).toBe(1);
    expect(source).toEqual(before);
    expect(moved).not.toBe(source);
    expect(() =>
      editWave(level, source, 0.7, selection, { type: "move", delta: -0.1 }),
    ).toThrow("Wait before group");
    expect(source).toEqual(before);
  });

  it("resizes by batch count including trailing spacing without changing population or abilities", () => {
    const source = recipe();
    const resized = editWave(level, source, 0.7, selection, {
      type: "duration",
      seconds: 6,
    });
    expect(resized.packets[0].groups[0]).toEqual({
      ...source.packets[0].groups[0],
      gap: 3,
    });
    expect(times(resized)).toEqual([
      0.7, 0.95, 3.7, 3.95, 7.7, 7.95, 10.7, 10.95, 13.7,
    ]);
    const single = editWave(level, source, 0.7, selection, {
      type: "count",
      count: 1,
    });
    const singleResized = editWave(level, single, 0.7, selection, {
      type: "duration",
      seconds: 4,
    });
    expect(singleResized.packets[0].groups[0].gap).toBe(4);
    expect(layoutWave(level, singleResized, 0.7).nodes[0].handoff).toBeCloseTo(
      4.7,
    );
  });

  it("preserves partial batches and fixed spacing when increasing population", () => {
    const source = recipe();
    const changed = editWave(level, source, 0.7, selection, {
      type: "count",
      count: 5,
    });
    expect(changed.packets[0].groups[0]).toEqual({
      ...source.packets[0].groups[0],
      count: 5,
    });
    expect(times(changed)).toEqual([
      0.7, 0.95, 2.7, 2.95, 4.7, 7.7, 7.95, 9.7, 9.95, 11.7, 13.7,
    ]);
  });

  it("edits stagger and batch size without inventing independently timed enemies", () => {
    const staggered = editWave(level, recipe(), 0.7, selection, {
      type: "stagger",
      seconds: 0.5,
    });
    expect(times(staggered).slice(0, 4)).toEqual([0.7, 1.2, 2.7, 3.2]);
    const triples = editWave(level, staggered, 0.7, selection, {
      type: "batch",
      size: 3,
    });
    expect(times(triples).slice(0, 4)).toEqual([0.7, 1.2, 1.7, 2.7]);
    expect(() =>
      editWave(level, triples, 0.7, selection, { type: "batch", size: 1 }),
    ).toThrow("Set time within a batch to 0");
    const simultaneous = editWave(level, triples, 0.7, selection, {
      type: "stagger",
      seconds: 0,
    });
    expect(times(simultaneous).slice(0, 3)).toEqual([0.7, 0.7, 0.7]);
    const singles = editWave(level, simultaneous, 0.7, selection, {
      type: "batch",
      size: 1,
    });
    expect(singles.packets[0].groups[0].batchStagger).toBeUndefined();
    expect(times(singles).slice(0, 4)).toEqual([0.7, 2.7, 4.7, 6.7]);
  });

  it("rejects a decreasing batch schedule atomically rather than sorting arrivals", () => {
    const source = recipe();
    source.packets[0].groups[0].batchSize = 3;
    source.packets[0].groups[0].batchStagger = 0.75;
    const before = structuredClone(source);
    // Stagger remains below gap, but the third arrival would cross the next batch.
    expect(() =>
      editWave(level, source, 0.7, selection, {
        type: "duration",
        seconds: 2,
      }),
    ).toThrow("nondecreasing");
    expect(source).toEqual(before);
    // Equality is legal and must retain authored insertion order.
    const touching = editWave(level, source, 0.7, selection, {
      type: "duration",
      seconds: 3,
    });
    expect(times(touching).slice(0, 4)).toEqual([0.7, 1.45, 2.2, 2.2]);
  });

  it("validates group and repeat boundaries even when each local pattern is legal", () => {
    const wave = recipe();
    const group = wave.packets[0].groups[0];
    group.count = 3;
    group.batchSize = 3;
    group.batchStagger = 0.75;
    group.gap = 1;
    wave.packets[1].groups[0].delayBefore = 1;
    expect(() => layoutWave(level, wave, 0.7)).not.toThrow();
    expect(() =>
      editWave(level, wave, 0.7, selection, {
        type: "repeat-rest",
        seconds: 0,
      }),
    ).toThrow("nondecreasing");
    expect(() =>
      editWave(
        level,
        wave,
        0.7,
        { packetIndex: 1, groupIndex: 0 },
        {
          type: "move",
          delta: -1,
        },
      ),
    ).toThrow("nondecreasing");
  });

  it("repeats whole patterns while retaining internal waits and extra rest", () => {
    const source = recipe();
    source.packets[0].groups[0].delayBefore = 0.5;
    const repeated = editWave(level, source, 0.7, selection, {
      type: "repeat",
      count: 3,
    });
    const rested = editWave(level, repeated, 0.7, selection, {
      type: "repeat-rest",
      seconds: 2,
    });
    expect(
      layoutWave(level, rested, 0.7).nodes.map((node) => node.start),
    ).toEqual([1.2, 7.7, 14.2, 18.2]);
    expect(rested.packets[0].groups).toEqual(source.packets[0].groups);
  });

  it("inserts, reorders and removes groups while preserving source identity and authored order", () => {
    const source = recipe();
    const added = editWave(level, source, 0.7, selection, {
      type: "add",
      kind: "runner",
      id: "new-weasel",
    });
    expect(added.packets[0].groups[1]).toEqual({
      id: "new-weasel",
      kind: "runner",
      count: 3,
      gap: 1,
    });
    const reordered = editWave(level, added, 0.7, selection, {
      type: "reorder",
      direction: 1,
    });
    expect(reordered.packets[0].groups.map((group) => group.id)).toEqual([
      "new-weasel",
      "rats",
    ]);
    expect(reordered.packets[0].groups[1]).toEqual(source.packets[0].groups[0]);
    expect(
      layoutWave(level, reordered, 0.7).nodes.map((node) => node.key),
    ).toEqual([
      "pairs/1/new-weasel",
      "pairs/1/rats",
      "pairs/2/new-weasel",
      "pairs/2/rats",
      "finish/1/weasel",
    ]);
    const removed = editWave(level, reordered, 0.7, selection, {
      type: "remove",
    });
    expect(removed).toEqual(source);
    const removedPacket = editWave(level, source, 0.7, selection, {
      type: "remove",
    });
    expect(removedPacket.packets).toEqual([source.packets[1]]);
    expect(() =>
      editWave(level, removedPacket, 0.7, selection, { type: "remove" }),
    ).toThrow("Keep at least one");
    expect(() =>
      editWave(level, source, 0.7, selection, {
        type: "add",
        kind: "runner",
        id: "rats",
      }),
    ).toThrow("unique identities");
    expect(() =>
      editWave(level, source, 0.7, selection, {
        type: "reorder",
        direction: -1,
      }),
    ).toThrow("edge of its sequence");
  });

  it("rejects malformed numeric proposals before expansion", () => {
    const source = recipe();
    const before = structuredClone(source);
    for (const count of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        editWave(level, source, 0.7, selection, { type: "count", count }),
      ).toThrow();
      expect(() =>
        editWave(level, source, 0.7, selection, { type: "repeat", count }),
      ).toThrow();
      expect(() =>
        editWave(level, source, 0.7, selection, { type: "batch", size: count }),
      ).toThrow();
    }
    expect(source).toEqual(before);
  });

  it("adds and reorders whole sequences without flattening repetition or changing identities", () => {
    const source = recipe();
    const added = editWave(level, source, 0.7, selection, {
      type: "add-sequence",
      kind: "runner",
      id: "middle",
      groupId: "middle-weasel",
    });
    expect(added.packets.map((packet) => packet.id)).toEqual([
      "pairs",
      "middle",
      "finish",
    ]);
    expect(added.packets[1]).toEqual({
      id: "middle",
      groups: [{ id: "middle-weasel", kind: "runner", count: 3, gap: 1 }],
    });
    const moved = editWave(
      level,
      added,
      0.7,
      { packetIndex: 1, groupIndex: 0 },
      {
        type: "sequence-reorder",
        direction: -1,
      },
    );
    expect(moved.packets.map((packet) => packet.id)).toEqual([
      "middle",
      "pairs",
      "finish",
    ]);
    expect(moved.packets[1]).toEqual(source.packets[0]);
    expect(layoutWave(level, moved, 0.7).nodes.map((node) => node.key)).toEqual(
      [
        "middle/1/middle-weasel",
        "pairs/1/rats",
        "pairs/2/rats",
        "finish/1/weasel",
      ],
    );
    expect(source).toEqual(recipe());
    expect(() =>
      editWave(level, source, 0.7, selection, {
        type: "sequence-reorder",
        direction: -1,
      }),
    ).toThrow("edge of the wave");
    expect(() =>
      editWave(level, source, 0.7, selection, {
        type: "add-sequence",
        kind: "runner",
        id: "pairs",
        groupId: "another",
      }),
    ).toThrow("unique identities");
  });

  it("opens every canonical wave without changing defaults, identities or source content", () => {
    const before = JSON.stringify(CANONICAL_CONTENT);
    for (const entry of CANONICAL_CONTENT.levels) {
      for (const wave of entry.waves) {
        const graph = layoutWave(
          entry,
          wave,
          CANONICAL_CONTENT.rules.initialSpawnDelay,
        );
        expect(graph.nodes.flatMap((node) => node.spawns)).toEqual(
          compileSpawnSchedule(
            compileLevel({ ...entry, waves: [wave] }).waves[0],
            CANONICAL_CONTENT.rules.initialSpawnDelay,
          ),
        );
        expect(
          editWave(
            entry,
            wave,
            CANONICAL_CONTENT.rules.initialSpawnDelay,
            selection,
            { type: "move", delta: 0 },
          ),
        ).toEqual(wave);
      }
    }
    expect(JSON.stringify(CANONICAL_CONTENT)).toBe(before);
  });
});
