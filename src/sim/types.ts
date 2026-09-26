export type Point = { x: number; z: number };
export type TowerKind = "bolt" | "stone" | "net";
export type EnemyKind = "raider" | "runner" | "armored" | "boss";
export type CardId = "none" | "reach" | "nets" | "thrift";
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
export interface ShieldCycle {
  upSeconds: number;
  downSeconds: number;
}
export interface WaveGroupDef {
  kind: EnemyKind;
  /** Total enemies in the group, including every batch. */
  count: number;
  /** Seconds between solo spawns or between batch start times. */
  gap: number;
  /** Optional batch size; defaults to one enemy per spawn time. */
  batchSize?: number;
  /** Seconds between enemies within one batch. */
  batchStagger?: number;
  /** Per-group movement multiplier; 0.75 means 25% slower than catalog speed. */
  movementScale?: number;
  /** Optional per-group Rat Raider guard timing; first guard follows one down interval. */
  shieldCycle?: ShieldCycle;
}
export interface WaveDef {
  groups: WaveGroupDef[];
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
  availableTowers?: TowerKind[];
  enemyRewardScale?: number;
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
  shieldHitAt?: number;
  movementScale?: number;
  shieldCycle?: ShieldCycle;
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
  kind: "hit" | "splash" | "slow" | "coin";
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
    | "loss";
  value?: number;
}
export interface GameState {
  phase: Phase;
  resumePhase: "preparation" | "wave";
  clock: number;
  wave: number;
  /** Seconds until the next wave; null before wave one and after the finale. */
  nextWaveCountdown: number | null;
  coins: number;
  lives: number;
  maxLives: number;
  kills: number;
  killsByKind: Record<EnemyKind, number>;
  leaks: number;
  /** Kill rewards plus fixed wave rewards; excludes starting gold and sales. */
  goldEarned: number;
  towers: Tower[];
  enemies: Enemy[];
  shots: Shot[];
  effects: Effect[];
  card: CardId;
  assist: boolean;
  lastPayout: { reward: number; total: number } | null;
  stars: number;
}
