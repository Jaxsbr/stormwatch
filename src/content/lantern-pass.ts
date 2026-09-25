import type { LevelDef } from "../sim/types";
export const lanternPass: LevelDef = {
  id: "lantern-pass",
  name: "Lantern Pass",
  subtitle: "01 / THE FIRST WATCH",
  description:
    "The last wagons are crossing the forest. Keep the lantern line burning until they reach home.",
  width: 12,
  depth: 8,
  accent: "#caab6c",
  startCoins: 100,
  availableTowers: ["bolt"],
  enemyRewardScale: 0.4,
  path: [
    { x: -1, z: 3 },
    { x: 2, z: 3 },
    { x: 2, z: 1 },
    { x: 6, z: 1 },
    { x: 6, z: 6 },
    { x: 9, z: 6 },
    { x: 9, z: 3 },
    { x: 12, z: 3 },
  ],
  blocked: [
    { x: 0, z: 0 },
    { x: 0, z: 7 },
    { x: 11, z: 0 },
    { x: 11, z: 7 },
  ],
  waves: [
    {
      title: "The first guard",
      reward: 25,
      groups: [
        {
          kind: "raider",
          count: 20,
          gap: 3,
          shieldCycle: { upSeconds: 2, downSeconds: 8 },
        },
      ],
    },
    {
      title: "A busier trail",
      reward: 28,
      groups: [
        {
          kind: "raider",
          count: 23,
          gap: 2,
          shieldCycle: { upSeconds: 2, downSeconds: 8 },
        },
      ],
    },
    {
      title: "The slow pairs",
      reward: 30,
      groups: [
        {
          kind: "raider",
          count: 20,
          gap: 3,
          batchSize: 2,
          batchStagger: 0.3,
          movementScale: 0.75,
          shieldCycle: { upSeconds: 4, downSeconds: 6 },
        },
      ],
    },
    {
      title: "The held line",
      reward: 34,
      groups: [
        {
          kind: "raider",
          count: 23,
          gap: 3,
          shieldCycle: { upSeconds: 6, downSeconds: 4 },
        },
      ],
    },
    {
      title: "The guarded pairs",
      reward: 38,
      groups: [
        {
          kind: "raider",
          count: 20,
          gap: 2,
          batchSize: 2,
          batchStagger: 0.3,
          movementScale: 0.75,
          shieldCycle: { upSeconds: 6, downSeconds: 4 },
        },
      ],
    },
  ],
};
