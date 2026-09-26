import type { LevelDef, WaveGroupDef } from "../sim/types";

const weaselEvasion = { downSeconds: 3, upSeconds: 2 };
const hardWeaselEvasion = { downSeconds: 2.6, upSeconds: 2.4 };
const guard = { upSeconds: 4, downSeconds: 6 };
const hardGuard = { upSeconds: 5, downSeconds: 5 };

function rats(
  count: number,
  gap: number,
  options: Pick<
    WaveGroupDef,
    "batchSize" | "batchStagger" | "shieldCycle" | "movementScale"
  > = {},
): WaveGroupDef {
  return { kind: "raider", count, gap, ...options };
}

function weasels(
  count: number,
  gap: number,
  options: Pick<
    WaveGroupDef,
    "batchSize" | "batchStagger" | "evasionCycle" | "movementScale"
  > = {},
): WaveGroupDef {
  return { kind: "runner", count, gap, ...options };
}

export const theLastLantern: LevelDef = {
  id: "the-last-lantern",
  name: "The Last Lantern",
  subtitle: "03 / THE LAST WATCH",
  description:
    "The road climbs through the last lantern grove. Hold both bends until the Roadwarden and its column are turned back.",
  width: 12,
  depth: 8,
  path: [
    { x: -1, z: 3 },
    { x: 2, z: 3 },
    { x: 2, z: 1 },
    { x: 4, z: 1 },
    { x: 4, z: 5 },
    { x: 7, z: 5 },
    { x: 7, z: 2 },
    { x: 9, z: 2 },
    { x: 9, z: 6 },
    { x: 12, z: 6 },
  ],
  blocked: [
    { x: 0, z: 0 },
    { x: 0, z: 7 },
    { x: 11, z: 0 },
    { x: 11, z: 7 },
  ],
  startCoins: 120,
  availableTowers: ["bolt", "net"],
  enemyRewardScale: 0.4,
  healthScale: 1,
  accent: "#bca879",
  waves: [
    {
      title: "A Net in the Lanternlight",
      reward: 25,
      groups: [weasels(4, 5), rats(10, 2.8)],
    },
    {
      title: "Hold the Runners",
      reward: 28,
      groups: [weasels(12, 2.4, { evasionCycle: weaselEvasion })],
    },
    {
      title: "Through the Guard",
      reward: 30,
      groups: [
        rats(14, 3, {
          batchSize: 2,
          batchStagger: 0.3,
          shieldCycle: guard,
          movementScale: 0.75,
        }),
      ],
    },
    {
      title: "Both Bends",
      reward: 32,
      groups: [
        rats(10, 3, { batchSize: 2, batchStagger: 0.3, shieldCycle: guard }),
        weasels(12, 2.5, {
          batchSize: 2,
          batchStagger: 0.3,
          evasionCycle: weaselEvasion,
        }),
      ],
    },
    {
      title: "The Last Rehearsal",
      reward: 35,
      groups: [
        rats(14, 2.8, {
          batchSize: 2,
          batchStagger: 0.3,
          shieldCycle: hardGuard,
          movementScale: 0.75,
        }),
        weasels(10, 2.5, {
          batchSize: 2,
          batchStagger: 0.3,
          evasionCycle: hardWeaselEvasion,
          movementScale: 0.9,
        }),
      ],
    },
  ],
};
