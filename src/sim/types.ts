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
export interface EvasionCycle {
  downSeconds: number;
  upSeconds: number;
}
export interface WaveGroupDef {
  id?: string;
  /** Additional silence before this group, after the preceding group cadence. */
  delayBefore?: number;
  /** Opt-in Weasel evasion; omitted for the introductory wave. */
  evasionCycle?: EvasionCycle;
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
  /** Explicit opt-out; legacy simulation fixtures default to enabled. */
  shieldEnabled?: boolean;
}
export interface WaveDef {
  id?: string;
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
  /** The authored finale cannot be won unless its final wave's boss is defeated. */
  requiresBossDefeat?: boolean;
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
  evasionCycle?: EvasionCycle;
  evadeAt?: number;
  movementScale?: number;
  shieldCycle?: ShieldCycle;
  /** Explicit opt-out; legacy simulation fixtures default to enabled. */
  shieldEnabled?: boolean;
  /** Absolute simulation time when a rallied escort's speed bonus expires. */
  rallyUntil?: number;
  /** Absolute simulation time of the boss's next rally pulse. */
  nextRallyAt?: number;
  /** Last successful rally, used to present the boost without affecting rules. */
  rallyCastAt?: number;
  rage?: {
    phase: 0 | 1 | 2;
    damageBaselineHp: number;
    phaseUntil: number;
    permanent: boolean;
  };
  /** Suppresses duplicate rally-warning events for the current pulse. */
  rallyWarningEmitted?: boolean;
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
  kind: "hit" | "splash" | "slow" | "coin" | "evade";
  age: number;
  ttl: number;
}
export interface GameEvent {
  enemyId?: number;
  enemyKind?: EnemyKind;
  wave?: number;
  type:
    | "build"
    | "upgrade"
    | "sell"
    | "shot"
    | "hit"
    | "shield-hit"
    | "evade"
    | "kill"
    | "leak"
    | "start"
    | "payout"
    | "boss-arrival"
    | "rally-warning"
    | "rally"
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
