import { ENEMIES, TOWERS } from "../content/catalog";
import {
  DEFAULT_RULES,
  type AttemptConfiguration,
  type GameplayRules,
} from "../config/configuration";
import { compileSpawnSchedule } from "./spawn-schedule";
import {
  distance,
  onPath,
  pathLength,
  pointOnPath,
  validateLevel,
} from "./path";
import { refundFor, waveReward } from "./economy";
import { weaselEvasionState } from "./weasel-evasion";
import { ratShieldState } from "./rat-shield";
import type {
  CardId,
  Enemy,
  EnemyKind,
  GameEvent,
  GameState,
  LevelDef,
  Point,
  Tower,
  TowerKind,
  WaveGroupDef,
} from "./types";

export const INTER_WAVE_COUNTDOWN_SECONDS = 10;
export interface AttemptRules {
  configuration?: AttemptConfiguration;
  unlockedUpgrades?: readonly TowerKind[];
}

export class Game {
  readonly level: LevelDef;
  readonly towers: typeof TOWERS;
  readonly enemies: typeof ENEMIES;
  readonly rules: GameplayRules;
  readonly state: GameState;
  readonly events: GameEvent[] = [];
  private serial = 1;
  private queue: {
    at: number;
    kind: EnemyKind;
    movementScale?: number;
    shieldCycle?: WaveGroupDef["shieldCycle"];
    shieldEnabled?: boolean;
    evasionCycle?: WaveGroupDef["evasionCycle"];
  }[] = [];
  private waveClock = 0;
  private accumulator = 0;
  private bossKillsAtWaveStart = 0;
  private seed: number;
  private readonly unlockedUpgrades: ReadonlySet<TowerKind> | null;
  constructor(
    level: LevelDef,
    card: CardId = "none",
    assist = false,
    seed = 42,
    rules: AttemptRules = {},
  ) {
    const snapshot = rules.configuration;
    this.level = structuredClone(snapshot?.level ?? level);
    this.towers = structuredClone(snapshot?.towers ?? TOWERS);
    this.enemies = structuredClone(snapshot?.enemies ?? ENEMIES);
    this.rules = structuredClone(snapshot?.rules ?? DEFAULT_RULES);
    const freeze = (value: object) => {
      Object.values(value).forEach((v) => {
        if (v && typeof v === "object") freeze(v);
      });
      Object.freeze(value);
    };
    freeze(this.level);
    freeze(this.towers);
    freeze(this.enemies);
    freeze(this.rules);
    level = this.level;
    validateLevel(level);
    for (const wave of level.waves)
      compileSpawnSchedule(wave, this.rules.initialSpawnDelay);
    this.seed = seed >>> 0;
    this.unlockedUpgrades = rules.unlockedUpgrades
      ? new Set(rules.unlockedUpgrades)
      : null;
    this.state = {
      phase: "preparation",
      resumePhase: "preparation",
      clock: 0,
      wave: 0,
      nextWaveCountdown: null,
      coins: level.startCoins + (assist ? this.rules.assistCrowns : 0),
      lives: assist ? this.rules.assistLives : this.rules.normalLives,
      maxLives: assist ? this.rules.assistLives : this.rules.normalLives,
      kills: 0,
      killsByKind: { raider: 0, runner: 0, armored: 0, boss: 0 },
      leaks: 0,
      goldEarned: 0,
      towers: [],
      enemies: [],
      shots: [],
      effects: [],
      card,
      assist,
      lastPayout: null,
      stars: 0,
    };
  }
  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  drainEvents() {
    return this.events.splice(0);
  }
  private emit(type: GameEvent["type"], value?: number) {
    this.events.push({ type, value });
  }
  canAct() {
    return this.state.phase === "preparation" || this.state.phase === "wave";
  }
  canPlace(p: Point) {
    return (
      Number.isInteger(p.x) &&
      Number.isInteger(p.z) &&
      p.x >= 0 &&
      p.z >= 0 &&
      p.x < this.level.width &&
      p.z < this.level.depth &&
      !onPath(this.level, p) &&
      !this.level.blocked.some((b) => distance(b, p) < 0.1) &&
      !this.state.towers.some((t) => distance(t, p) < 0.1)
    );
  }
  place(kind: TowerKind, p: Point): boolean {
    const def = this.towers[kind];
    if (
      !def ||
      (this.level.availableTowers !== undefined &&
        !this.level.availableTowers.includes(kind)) ||
      !this.canAct() ||
      !this.canPlace(p) ||
      this.state.coins < def.cost
    )
      return false;
    this.state.coins -= def.cost;
    this.state.towers.push({
      ...p,
      id: this.serial++,
      kind,
      level: 1,
      spent: def.cost,
      cooldown: 0,
      shots: 0,
    });
    this.emit("build");
    return true;
  }
  upgradeCost(t: Tower) {
    return Math.floor(
      this.towers[t.kind].upgrade *
        (this.state.card === "thrift" ? this.rules.thriftScale : 1),
    );
  }
  canUpgrade(t: Tower) {
    return this.unlockedUpgrades === null || this.unlockedUpgrades.has(t.kind);
  }
  upgrade(id: number) {
    const t = this.state.towers.find((t) => t.id === id);
    if (
      !t ||
      !this.canUpgrade(t) ||
      !this.canAct() ||
      t.level !== 1 ||
      this.state.coins < this.upgradeCost(t)
    )
      return false;
    const cost = this.upgradeCost(t);
    this.state.coins -= cost;
    t.spent += cost;
    t.level = 2;
    this.emit("upgrade");
    return true;
  }
  sell(id: number) {
    const t = this.state.towers.find((t) => t.id === id);
    if (!t || !this.canAct()) return false;
    this.state.coins += refundFor(t.spent);
    this.state.towers = this.state.towers.filter((t) => t.id !== id);
    this.emit("sell");
    return true;
  }
  range(t: Tower) {
    return (
      this.towers[t.kind].range *
      (t.level === 2 ? this.rules.upgradeRangeScale : 1) *
      (this.state.card === "reach" ? this.rules.reachScale : 1)
    );
  }
  startWave() {
    const s = this.state;
    if (s.phase !== "preparation" || s.wave >= this.level.waves.length)
      return false;
    const def = this.level.waves[s.wave];
    s.nextWaveCountdown = null;
    this.queue = compileSpawnSchedule(def, this.rules.initialSpawnDelay);
    this.waveClock = 0;
    this.bossKillsAtWaveStart = s.killsByKind.boss;
    s.wave++;
    s.phase = "wave";
    s.lastPayout = null;
    this.emit("start");
    return true;
  }
  pause() {
    const s = this.state;
    if (s.phase === "paused") {
      s.phase = s.resumePhase;
      return;
    }
    if (this.canAct()) {
      s.resumePhase = s.phase as "preparation" | "wave";
      s.phase = "paused";
    }
  }
  advance(realSeconds: number) {
    if (!Number.isFinite(realSeconds) || realSeconds <= 0) return;
    this.accumulator += Math.min(realSeconds, 0.25);
    while (this.accumulator >= 1 / 30) {
      this.tick(1 / 30);
      this.accumulator -= 1 / 30;
    }
  }
  tick(dt: number) {
    const s = this.state;
    if (!Number.isFinite(dt) || dt <= 0 || s.phase === "paused") return;
    if (s.phase === "preparation") {
      if (s.nextWaveCountdown === null) return;
      s.nextWaveCountdown = Math.max(0, s.nextWaveCountdown - dt);
      if (s.nextWaveCountdown === 0) this.startWave();
      return;
    }
    if (s.phase !== "wave") return;
    s.clock += dt;
    this.waveClock += dt;
    while (this.queue.length && this.queue[0].at <= this.waveClock) {
      const q = this.queue.shift()!,
        def = this.enemies[q.kind],
        hp = def.hp * (this.level.healthScale ?? 1);
      s.enemies.push({
        ...this.level.path[0],
        id: this.serial++,
        kind: q.kind,
        hp,
        maxHp: hp,
        distance: 0,
        slowUntil: 0,
        alive: true,
        hitAt: -1,
        spawnedAt: s.clock,
        shieldRaised: false,
        shieldHitAt: -1,
        evadeAt: -1,
        ...(q.kind === "boss"
          ? {
              nextRallyAt: s.clock + this.rules.boss.firstRallySeconds,
              rallyWarningEmitted: false,
            }
          : {}),
        evasionCycle: q.evasionCycle,
        shieldEnabled: q.shieldEnabled,
        ...(q.movementScale === undefined
          ? {}
          : { movementScale: q.movementScale }),
        ...(q.shieldCycle === undefined
          ? {}
          : { shieldCycle: { ...q.shieldCycle } }),
      });
      if (q.kind === "boss") this.emit("boss-arrival");
    }
    const len = pathLength(this.level.path);
    for (const e of s.enemies) {
      if (!e.alive) continue;
      e.distance +=
        this.enemies[e.kind].speed *
        (e.movementScale ?? 1) *
        Math.max(
          e.kind === "runner" &&
            weaselEvasionState(s.clock - e.spawnedAt, e.evasionCycle).active
            ? this.rules.evasionSpeedScale
            : 1,
          e.rallyUntil !== undefined && e.rallyUntil > s.clock
            ? this.rules.boss.speedScale
            : 1,
        ) *
        (e.slowUntil > s.clock ? this.rules.slowScale : 1) *
        dt;
      Object.assign(e, pointOnPath(this.level.path, e.distance));
      if (e.distance >= len) {
        e.alive = false;
        s.lives = Math.max(0, s.lives - this.enemies[e.kind].leak);
        s.leaks++;
        this.emit("leak");
        Object.assign(this.events[this.events.length - 1], {
          enemyId: e.id,
          enemyKind: e.kind,
          wave: s.wave,
        });
        if (this.level.requiresBossDefeat && e.kind === "boss") {
          s.phase = "lost";
          this.emit("loss");
          return;
        }
      }
    }
    if (s.lives === 0) {
      s.phase = "lost";
      this.emit("loss");
      return;
    }
    this.updateBossRallies();
    for (const e of s.enemies) {
      if (e.kind !== "raider") continue;
      const age = s.clock - e.spawnedAt;
      const raised = ratShieldState(age, e.shieldCycle, e.shieldEnabled).raised;
      if (raised !== e.shieldRaised) {
        e.shieldRaised = raised;
      }
    }
    for (const t of s.towers) {
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const target = s.enemies
        .filter((e) => e.alive && distance(e, t) <= this.range(t))
        .sort((a, b) => b.distance - a.distance || a.id - b.id)[0];
      if (!target) continue;
      const def = this.towers[t.kind];
      t.cooldown =
        def.interval * (t.level === 2 ? this.rules.upgradeIntervalScale : 1);
      t.shots++;
      s.shots.push({
        ...t,
        id: this.serial++,
        source: { x: t.x, z: t.z },
        targetId: target.id,
        kind: t.kind,
        damage:
          def.damage * (t.level === 2 ? this.rules.upgradeDamageScale : 1),
        life: 0,
        duration: 0.22 + distance(t, target) * 0.045,
        target: { x: target.x, z: target.z },
      });
      this.emit("shot");
    }
    for (const shot of s.shots) {
      shot.life += dt;
      const e = s.enemies.find((e) => e.id === shot.targetId && e.alive);
      if (e) shot.target = { x: e.x, z: e.z };
      if (shot.life < shot.duration) continue;
      if (shot.kind === "stone") {
        for (const target of s.enemies)
          if (
            target.alive &&
            distance(target, shot.target) <= this.rules.splashRadius
          )
            this.hurt(target, shot.damage, true);
        s.effects.push({
          ...shot.target,
          id: this.serial++,
          kind: "splash",
          age: 0,
          ttl: 0.45,
        });
      } else if (e) {
        const landed = this.hurt(e, shot.damage, true);
        if (landed && shot.kind === "net")
          e.slowUntil = Math.max(
            e.slowUntil,
            s.clock +
              (s.card === "nets"
                ? this.rules.longerNetSeconds
                : this.rules.netSeconds),
          );
      }
    }
    s.shots = s.shots.filter((p) => p.life < p.duration);
    s.enemies = s.enemies.filter((e) => e.alive);
    for (const fx of s.effects) fx.age += dt;
    s.effects = s.effects.filter((fx) => fx.age < fx.ttl);
    if (!this.queue.length && !s.enemies.length) {
      const reward = waveReward(this.level.waves[s.wave - 1].reward);
      s.coins += reward;
      s.goldEarned += reward;
      s.lastPayout = { reward, total: reward };
      s.shots = [];
      s.effects = [];
      this.emit("payout", reward);
      if (s.wave === this.level.waves.length) {
        if (
          this.level.requiresBossDefeat &&
          s.killsByKind.boss === this.bossKillsAtWaveStart
        ) {
          s.phase = "lost";
          this.emit("loss");
          return;
        }
        s.phase = "won";
        s.stars =
          s.lives === s.maxLives ? 3 : s.lives >= s.maxLives / 2 ? 2 : 1;
        this.emit("win");
      } else {
        s.phase = "preparation";
        s.nextWaveCountdown = this.rules.interWaveSeconds;
      }
    }
  }
  private updateBossRallies() {
    const s = this.state;
    for (const boss of s.enemies) {
      if (!boss.alive || boss.kind !== "boss" || boss.nextRallyAt === undefined)
        continue;
      if (
        !boss.rallyWarningEmitted &&
        s.clock >= boss.nextRallyAt - this.rules.boss.warningSeconds
      ) {
        boss.rallyWarningEmitted = true;
        this.emit("rally-warning");
      }
      if (s.clock < boss.nextRallyAt) continue;
      let recipients = 0;
      for (const escort of s.enemies) {
        if (
          !escort.alive ||
          escort.kind === "boss" ||
          Math.abs(escort.distance - boss.distance) > this.rules.boss.radius
        )
          continue;
        escort.rallyUntil = Math.max(
          escort.rallyUntil ?? 0,
          s.clock + this.rules.boss.durationSeconds,
        );
        recipients++;
      }
      this.emit("rally", recipients);
      boss.nextRallyAt += this.rules.boss.rallyIntervalSeconds;
      boss.rallyWarningEmitted = false;
    }
  }
  private hurt(e: Enemy, damage: number, projectile = false) {
    if (!e.alive) return false;
    const s = this.state;
    if (
      projectile &&
      e.kind === "runner" &&
      weaselEvasionState(s.clock - e.spawnedAt, e.evasionCycle).active
    ) {
      // Coalesce simultaneous misses so a volley produces one readable cue.
      if (e.evadeAt === undefined || s.clock - e.evadeAt >= 0.18) {
        e.evadeAt = s.clock;
        s.effects.push({
          x: e.x,
          z: e.z,
          id: this.serial++,
          kind: "evade",
          age: 0,
          ttl: 0.7,
        });
        this.emit("evade");
      }
      return false;
    }
    const guarded = projectile && e.kind === "raider" && e.shieldRaised;
    e.hp -=
      Math.max(1, damage - this.enemies[e.kind].armor) *
      (guarded ? this.rules.guardDamageScale : 1);
    if (guarded) {
      e.shieldHitAt = s.clock;
      this.emit("shield-hit");
    } else {
      e.hitAt = s.clock;
      s.effects.push({
        x: e.x,
        z: e.z,
        id: this.serial++,
        kind: "hit",
        age: 0,
        ttl: 0.2,
      });
      this.emit("hit");
    }
    if (e.hp <= 0) {
      e.alive = false;
      s.kills++;
      s.killsByKind[e.kind]++;
      const reward = Math.floor(
        this.enemies[e.kind].reward * (this.level.enemyRewardScale ?? 1),
      );
      s.coins += reward;
      s.goldEarned += reward;
      this.emit("kill");
    }
    return true;
  }
}
