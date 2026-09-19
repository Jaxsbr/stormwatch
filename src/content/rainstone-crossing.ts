import type { LevelDef } from "../sim/types";

export const rainstoneCrossing: LevelDef = {
  id: "rainstone-crossing",
  name: "Rainstone Crossing",
  subtitle: "02 / THE RIVER WATCH",
  description:
    "The river bends around the old stone crossing where the village keeps its river watch. Hold the causeway through the storm — the fields on both banks are the last shelter before the deep water.",
  width: 12,
  depth: 8,
  path: [
    { x: -1, z: 3 },
    { x: 1, z: 3 },
    { x: 1, z: 5 },
    { x: 4, z: 5 },
    { x: 4, z: 1 },
    { x: 8, z: 1 },
    { x: 8, z: 6 },
    { x: 10, z: 6 },
    { x: 10, z: 3 },
    { x: 12, z: 3 },
  ],
  blocked: [
    { x: 0, z: 0 },
    { x: 0, z: 7 },
    { x: 11, z: 0 },
    { x: 11, z: 7 },
  ],
  startCoins: 185,
  healthScale: 1.12,
  accent: "#91b9ac",
  waves: [
    {
      title: "First Drizzle",
      reward: 28,
      groups: [{ kind: "raider", count: 10, gap: 2.2 }],
    },
    {
      title: "Rising Weeds",
      reward: 30,
      groups: [
        { kind: "raider", count: 7, gap: 1.7 },
        { kind: "runner", count: 6, gap: 1.8 },
      ],
    },
    {
      title: "Low Water Drums",
      reward: 34,
      groups: [
        { kind: "armored", count: 5, gap: 2.4 },
        { kind: "raider", count: 10, gap: 1.4 },
      ],
    },
    {
      title: "Mud Runners",
      reward: 38,
      groups: [
        { kind: "runner", count: 12, gap: 1.4 },
        { kind: "raider", count: 10, gap: 1.5 },
      ],
    },
    {
      title: "Falling Rain",
      reward: 42,
      groups: [
        { kind: "armored", count: 8, gap: 2 },
        { kind: "runner", count: 10, gap: 1.2 },
      ],
    },
    {
      title: "River Swell",
      reward: 48,
      groups: [
        { kind: "armored", count: 5, gap: 2 },
        { kind: "boss", count: 1, gap: 4 },
        { kind: "raider", count: 12, gap: 1.3 },
      ],
    },
    {
      title: "Stonefall Thunder",
      reward: 55,
      groups: [
        { kind: "armored", count: 10, gap: 1.5 },
        { kind: "runner", count: 16, gap: 1 },
      ],
    },
    {
      title: "The Long Downpour",
      reward: 70,
      groups: [
        { kind: "armored", count: 8, gap: 1.8 },
        { kind: "boss", count: 2, gap: 4 },
        { kind: "raider", count: 20, gap: 1.2 },
      ],
    },
  ],
};
