import { ENEMIES, TOWERS } from "../content/catalog";
import {
  distance,
  onPath,
  pathLength,
  pointOnPath,
  validateLevel,
} from "./path";
import { refundFor, wavePayout } from "./economy";
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
} from "./types";

// A shielded rat keeps walking for roughly two gait cycles before lowering it.
const RAT_SHIELD_PERIOD = 5;
const RAT_SHIELD_RAISE_AT = 1.1;
const RAT_SHIELD_LOWER_AT = 3.1;

export class Game {
  readonly state: GameState;
  readonly events: GameEvent[] = [];
  private serial = 1;
  private queue: { at: number; kind: EnemyKind }[] = [];
  private waveClock = 0;
  private accumulator = 0;
  private seed: number;
  constructor(
    readonly level: LevelDef,
    card: CardId = "reach",
    assist = false,
    seed = 42,
  ) {
    validateLevel(level);
    this.seed = seed >>> 0;
    this.state = {
      phase: "preparation",
      resumePhase: "preparation",
      clock: 0,
      wave: 0,
      coins:
        level.startCoins + (card === "supply" ? 45 : 0) + (assist ? 70 : 0),
      lives: assist ? 20 : 12,
      maxLives: assist ? 20 : 12,
      kills: 0,
      towers: [],
      enemies: [],
      shots: [],
      effects: [],
      card,
      assist,
      abilityReadyAt: 0,
      abilityUses: 0,
      lastPayout: null,
      totalInterest: 0,
      totalTrade: 0,
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
    const def = TOWERS[kind];
    if (
      !def ||
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
      TOWERS[t.kind].upgrade * (this.state.card === "thrift" ? 0.8 : 1),
    );
  }
  upgrade(id: number) {
    const t = this.state.towers.find((t) => t.id === id);
    if (
      !t ||
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
      TOWERS[t.kind].range *
      (t.level === 2 ? 1.15 : 1) *
      (this.state.card === "reach" ? 1.18 : 1)
    );
  }
  forecast() {
    const s = this.state;
    const active =
      s.phase === "wave" || (s.phase === "paused" && s.resumePhase === "wave");
    const index = Math.min(
      Math.max(0, s.wave - (active ? 1 : 0)),
      this.level.waves.length - 1,
    );
    return wavePayout(s.coins, s.towers, this.level.waves[index].reward);
  }
  startWave() {
    const s = this.state;
    if (s.phase !== "preparation" || s.wave >= this.level.waves.length)
      return false;
    const def = this.level.waves[s.wave];
    this.queue = [];
    let at = 0.7;
    for (const g of def.groups)
      for (let n = 0; n < g.count; n++) {
        this.queue.push({ at, kind: g.kind });
        at += g.gap;
      }
    this.waveClock = 0;
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
  rescue(p: Point) {
    const s = this.state;
    if (
      s.phase !== "wave" ||
      s.clock < s.abilityReadyAt ||
      p.x < 0 ||
      p.z < 0 ||
      p.x >= this.level.width ||
      p.z >= this.level.depth
    )
      return false;
    s.abilityReadyAt = s.clock + 42;
    s.abilityUses++;
    s.lives = Math.min(s.maxLives, s.lives + 1);
    for (const e of s.enemies)
      if (e.alive && distance(e, p) < 2.3) {
        e.slowUntil = Math.max(e.slowUntil, s.clock + 5);
        this.hurt(e, 60);
      }
    s.effects.push({
      ...p,
      id: this.serial++,
      kind: "supply",
      age: 0,
      ttl: 1.3,
    });
    this.emit("supply");
    return true;
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
    if (s.phase !== "wave" || !Number.isFinite(dt) || dt <= 0) return;
    s.clock += dt;
    this.waveClock += dt;
    while (this.queue.length && this.queue[0].at <= this.waveClock) {
      const q = this.queue.shift()!,
        def = ENEMIES[q.kind],
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
      });
    }
    const len = pathLength(this.level.path);
    for (const e of s.enemies) {
      if (!e.alive) continue;
      e.distance +=
        ENEMIES[e.kind].speed * (e.slowUntil > s.clock ? 0.48 : 1) * dt;
      Object.assign(e, pointOnPath(this.level.path, e.distance));
      if (e.distance >= len) {
        e.alive = false;
        s.lives = Math.max(0, s.lives - ENEMIES[e.kind].leak);
        this.emit("leak");
      }
    }
    if (s.lives === 0) {
      s.phase = "lost";
      this.emit("loss");
      return;
    }
    for (const e of s.enemies) {
      if (e.kind !== "raider") continue;
      const phase = (s.clock - e.spawnedAt) % RAT_SHIELD_PERIOD;
      const raised =
        phase >= RAT_SHIELD_RAISE_AT && phase < RAT_SHIELD_LOWER_AT;
      if (raised !== e.shieldRaised) {
        e.shieldRaised = raised;
      }
    }
    for (const t of s.towers) {
      if (t.kind === "trade") continue;
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const target = s.enemies
        .filter((e) => e.alive && distance(e, t) <= this.range(t))
        .sort((a, b) => b.distance - a.distance || a.id - b.id)[0];
      if (!target) continue;
      const def = TOWERS[t.kind];
      t.cooldown = def.interval * (t.level === 2 ? 0.8 : 1);
      t.shots++;
      s.shots.push({
        ...t,
        id: this.serial++,
        source: { x: t.x, z: t.z },
        targetId: target.id,
        kind: t.kind,
        damage: def.damage * (t.level === 2 ? 1.7 : 1),
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
          if (target.alive && distance(target, shot.target) <= 1.15)
            this.hurt(target, shot.damage, true);
        s.effects.push({
          ...shot.target,
          id: this.serial++,
          kind: "splash",
          age: 0,
          ttl: 0.45,
        });
      } else if (e) {
        this.hurt(e, shot.damage, true);
        if (shot.kind === "net")
          e.slowUntil = Math.max(
            e.slowUntil,
            s.clock + (s.card === "nets" ? 4.5 : 3),
          );
      }
    }
    s.shots = s.shots.filter((p) => p.life < p.duration);
    s.enemies = s.enemies.filter((e) => e.alive);
    for (const fx of s.effects) fx.age += dt;
    s.effects = s.effects.filter((fx) => fx.age < fx.ttl);
    if (!this.queue.length && !s.enemies.length) {
      const p = wavePayout(
        s.coins,
        s.towers,
        this.level.waves[s.wave - 1].reward,
      );
      s.coins += p.total;
      s.totalInterest += p.interest;
      s.totalTrade += p.trade;
      s.lastPayout = p;
      s.shots = [];
      s.effects = [];
      this.emit("payout", p.total);
      if (s.wave === this.level.waves.length) {
        s.phase = "won";
        s.stars =
          s.lives === s.maxLives ? 3 : s.lives >= s.maxLives / 2 ? 2 : 1;
        this.emit("win");
      } else {
        s.phase = "preparation";
      }
    }
  }
  private hurt(e: Enemy, damage: number, projectile = false) {
    if (!e.alive) return;
    const s = this.state;
    const guarded = projectile && e.kind === "raider" && e.shieldRaised;
    e.hp -= Math.max(1, damage - ENEMIES[e.kind].armor) * (guarded ? 0.5 : 1);
    if (guarded) {
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
      s.coins += ENEMIES[e.kind].reward;
      this.emit("kill");
    }
  }
}
