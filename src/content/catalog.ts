import type {
  CardId,
  EnemyDef,
  EnemyKind,
  TowerDef,
  TowerKind,
} from "../sim/types";
import source from "./recipes.json";
export const TOWERS: Record<TowerKind, TowerDef> = source.towers;
export const ENEMIES: Record<EnemyKind, EnemyDef> = source.enemies;
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
    id: "nets",
    name: "Longer Nets",
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
