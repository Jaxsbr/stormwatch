export type Point = { x: number; z: number };
export type TowerKind = "bolt" | "stone" | "net" | "trade";
export type EnemyKind = "raider" | "runner" | "armored" | "boss";
export type CardId = "reach" | "supply" | "nets" | "thrift";
export type Phase = "preparation" | "wave" | "paused" | "won" | "lost";
export interface TowerDef {
  name: string;
  role: string;
  cost: number;
  upgrade: number;
  range: number;
  damage: number;
  interval: number;
  sprite: number;
  color: string;
}
export interface EnemyDef {
  name: string;
  hp: number;
  speed: number;
  armor: number;
  reward: number;
  leak: number;
  sprite: number;
}
export interface WaveDef {
  groups: { kind: EnemyKind; count: number; gap: number }[];
  reward: number;
  title: string;
}
export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  width: number;
  depth: number;
  path: Point[];
  blocked: Point[];
  startCoins: number;
  healthScale?: number;
  waves: WaveDef[];
  accent: string;
}
export interface Tower extends Point {
  id: number;
  kind: TowerKind;
  level: number;
  spent: number;
  cooldown: number;
  shots: number;
}
export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  distance: number;
  slowUntil: number;
  alive: boolean;
  hitAt: number;
  spawnedAt: number;
  shieldRaised: boolean;
}
export interface Shot extends Point {
  id: number;
  source: Point;
  targetId: number;
  kind: TowerKind;
  damage: number;
  life: number;
  duration: number;
  target: Point;
}
export interface Effect extends Point {
  id: number;
  kind: "hit" | "splash" | "slow" | "supply" | "coin";
  age: number;
  ttl: number;
}
export interface GameEvent {
  type:
    | "build"
    | "upgrade"
    | "sell"
    | "shot"
    | "hit"
    | "shield-hit"
    | "kill"
    | "leak"
    | "start"
    | "payout"
    | "win"
    | "loss"
    | "supply";
  value?: number;
}
export interface GameState {
  phase: Phase;
  resumePhase: "preparation" | "wave";
  clock: number;
  wave: number;
  coins: number;
  lives: number;
  maxLives: number;
  kills: number;
  towers: Tower[];
  enemies: Enemy[];
  shots: Shot[];
  effects: Effect[];
  card: CardId;
  assist: boolean;
  abilityReadyAt: number;
  abilityUses: number;
  lastPayout: {
    interest: number;
    trade: number;
    reward: number;
    total: number;
  } | null;
  totalInterest: number;
  totalTrade: number;
  stars: number;
}
