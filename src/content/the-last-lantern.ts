import type { LevelDef, WaveGroupDef } from "../sim/types";

const introductoryGuard = { upSeconds: 4, downSeconds: 6 };
const hardGuard = { upSeconds: 5, downSeconds: 5 };
const hardWeaselEvasion = { downSeconds: 2.6, upSeconds: 2.4 };
const finaleWeaselEvasion = { downSeconds: 2, upSeconds: 3 };

function rats(
  count: number,
  gap: number,
  options: Pick<
    WaveGroupDef,
    | "delayBefore"
    | "batchSize"
    | "batchStagger"
    | "shieldCycle"
    | "movementScale"
  > = {},
): WaveGroupDef {
  return { kind: "raider", count, gap, ...options };
}

function weasels(
  count: number,
  gap: number,
  options: Pick<
    WaveGroupDef,
    | "delayBefore"
    | "batchSize"
    | "batchStagger"
    | "evasionCycle"
    | "movementScale"
  > = {},
): WaveGroupDef {
  return { kind: "runner", count, gap, ...options };
}

function boss(): WaveGroupDef {
  return { kind: "boss", count: 1, gap: 2 };
}

const mixedPacketPattern = [
  { rats: 1, weasels: 6 },
  { rats: 2, weasels: 5 },
  { rats: 4, weasels: 4 },
];

function mixedPackets(
  repeats: number,
  restSeconds: number,
  weaselMovement: number,
  evasionCycle: typeof finaleWeaselEvasion,
): WaveGroupDef[] {
  let packet = 0;
  return Array.from({ length: repeats }, () => mixedPacketPattern)
    .flat()
    .flatMap(({ rats: ratCount, weasels: weaselCount }) => {
      const delayBefore = packet++ === 0 ? 0 : restSeconds - 0.2;
      return [
        rats(ratCount, 0.2, { delayBefore, shieldCycle: hardGuard }),
        weasels(weaselCount, 0.2, {
          evasionCycle,
          movementScale: weaselMovement,
        }),
      ];
    });
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
  startCoins: 235,
  availableTowers: ["bolt", "net"],
  enemyRewardScale: 0.4,
  healthScale: 1,
  requiresBossDefeat: true,
  accent: "#bca879",
  waves: [
    {
      title: "A Net in the Lanternlight",
      reward: 25,
      groups: Array.from({ length: 3 }, (_, cycle) => [
        rats(6, 2, {
          delayBefore: cycle === 0 ? 0 : 3,
          shieldCycle: introductoryGuard,
        }),
        weasels(4, 0.45, { delayBefore: 4, movementScale: 0.85 }),
      ]).flat(),
    },
    {
      title: "Crossing Pairs",
      reward: 28,
      groups: Array.from({ length: 18 }, () => [
        rats(1, 0.9, { shieldCycle: hardGuard }),
        weasels(1, 1.6, {
          evasionCycle: hardWeaselEvasion,
          movementScale: 1,
        }),
      ]).flat(),
    },
    {
      title: "Through the Guard",
      reward: 30,
      groups: Array.from({ length: 5 }, (_, cycle) => [
        rats(5, 0.2, {
          delayBefore: cycle === 0 ? 0 : 4.8,
          shieldCycle: hardGuard,
          movementScale: 0.75,
        }),
        weasels(3, 0.2, {
          evasionCycle: hardWeaselEvasion,
          movementScale: 1,
        }),
      ]).flat(),
    },
    {
      title: "Both Bends",
      reward: 32,
      groups: mixedPackets(3, 5, 1, hardWeaselEvasion),
    },
    {
      title: "The Last Rehearsal",
      reward: 35,
      groups: mixedPackets(4, 4, 1.1, finaleWeaselEvasion),
    },
    {
      title: "The Roadwarden's Column",
      reward: 0,
      groups: [
        rats(8, 0.8, { shieldCycle: hardGuard }),
        boss(),
        weasels(7, 0.2, {
          delayBefore: 2.5,
          evasionCycle: finaleWeaselEvasion,
          movementScale: 1.1,
        }),
        rats(5, 0.15, { delayBefore: 8.6, shieldCycle: hardGuard }),
        weasels(7, 0.2, {
          delayBefore: 9.25,
          evasionCycle: finaleWeaselEvasion,
          movementScale: 1.1,
        }),
        rats(5, 0.15, { delayBefore: 8.6, shieldCycle: hardGuard }),
        weasels(7, 0.2, {
          delayBefore: 9.25,
          evasionCycle: finaleWeaselEvasion,
          movementScale: 1.1,
        }),
      ],
    },
  ],
};
