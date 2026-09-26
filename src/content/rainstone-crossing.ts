import type { LevelDef, WaveGroupDef } from "../sim/types";

const guard = { upSeconds: 5, downSeconds: 5 };
const evade = { downSeconds: 3, upSeconds: 2 };
const hardEvade = { downSeconds: 2.6, upSeconds: 2.4 };
const rat = (count: number, gap: number, delayBefore = 0): WaveGroupDef => ({
  kind: "raider",
  count,
  gap,
  delayBefore,
  shieldCycle: guard,
});
const weasel = (
  count: number,
  gap: number,
  evasionCycle?: WaveGroupDef["evasionCycle"],
  delayBefore = 0,
): WaveGroupDef => ({
  kind: "runner",
  count,
  gap,
  delayBefore,
  movementScale: 0.85,
  evasionCycle,
});

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
  startCoins: 120,
  availableTowers: ["bolt"],
  enemyRewardScale: 0.4,
  healthScale: 1,
  accent: "#91b9ac",
  waves: [
    {
      title: "Quiet, Then Quick",
      reward: 35,
      // Five little stories: steady Rats, 3.5 seconds of quiet, then four runners.
      groups: Array.from({ length: 5 }, (_, i) => [
        rat(6, 2, i === 0 ? 0 : 3),
        weasel(4, 0.45, undefined, 1.5),
      ]).flat(),
    },
    {
      title: "Shields and Sidesteps",
      reward: 40,
      groups: Array.from({ length: 18 }, () => [
        rat(1, 1.1),
        weasel(1, 2.2, evade),
      ]).flat(),
    },
    {
      title: "The River Rush",
      reward: 0,
      // Three Rats one second apart; two Weasels immediately behind, then 3 seconds quiet.
      groups: Array.from({ length: 12 }, (_, i) => [
        rat(3, 1, i === 0 ? 0 : 2.55),
        weasel(2, 0.45, hardEvade),
      ]).flat(),
    },
  ],
};
