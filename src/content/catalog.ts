import type {
  CardId,
  EnemyDef,
  EnemyKind,
  TowerDef,
  TowerKind,
} from "../sim/types";
export const TOWERS: Record<TowerKind, TowerDef> = {
  bolt: {
    name: "Squirrel archer",
    role: "Precise • reliable",
    cost: 40,
    upgrade: 55,
    range: 2.7,
    damage: 14,
    interval: 0.9,
    sprite: 0,
    color: "#eec576",
  },
  stone: {
    name: "Skunk slinger",
    role: "Splash • groups",
    cost: 65,
    upgrade: 75,
    range: 2.8,
    damage: 22,
    interval: 2.0,
    sprite: 1,
    color: "#e59169",
  },
  net: {
    name: "Turtle trapper",
    role: "Slow • control",
    cost: 50,
    upgrade: 60,
    range: 2.6,
    damage: 5,
    interval: 1.35,
    sprite: 2,
    color: "#a8c8a3",
  },
  trade: {
    name: "Donkey trader",
    role: "Income • investment",
    cost: 55,
    upgrade: 40,
    range: 0,
    damage: 0,
    interval: 1,
    sprite: 3,
    color: "#ecc274",
  },
};
export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  raider: {
    name: "Rat raider",
    hp: 54,
    speed: 0.8,
    armor: 0,
    reward: 5,
    leak: 1,
    sprite: 4,
  },
  runner: {
    name: "Fleet weasel",
    hp: 38,
    speed: 1.25,
    armor: 0,
    reward: 5,
    leak: 1,
    sprite: 5,
  },
  armored: {
    name: "Iron boar",
    hp: 150,
    speed: 0.62,
    armor: 4,
    reward: 10,
    leak: 2,
    sprite: 6,
  },
  boss: {
    name: "The Roadwarden",
    hp: 1100,
    speed: 0.46,
    armor: 6,
    reward: 65,
    leak: 6,
    sprite: 7,
  },
};
export const CARDS: {
  id: CardId;
  name: string;
  tag: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "reach",
    name: "Far-sight scouts",
    tag: "REACH",
    description: "All defenses reach 18% farther. Cover more of the trail.",
    icon: "◎",
  },
  {
    id: "supply",
    name: "Supply wagons",
    tag: "RESOURCES",
    description: "Begin with 45 extra crowns. Build now, or save for interest.",
    icon: "▣",
  },
  {
    id: "nets",
    name: "Patient trappers",
    tag: "CONTROL",
    description:
      "Nets hold raiders 50% longer. Buy time for your heavy defenses.",
    icon: "✥",
  },
  {
    id: "thrift",
    name: "Careful carpenters",
    tag: "UNLOCKED",
    description:
      "All structure upgrades cost 20% less. Turn modest defenses into a strong line.",
    icon: "⌂",
  },
];
