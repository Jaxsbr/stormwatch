import { expect, it } from "vitest";
import { Game } from "../src/sim/game";
import {
  CANONICAL_CONTENT,
  normalizeAbilities,
  resolveConfiguration,
  validateContent,
} from "../src/config/configuration";
import {
  createWorkingDraft,
  validateWorkingDraft,
  promoteWorkingWave,
  promoteAllWorkingChanges,
  rebaseAfterPromotion,
} from "../src/workbench/working-draft";
import type { EnemyKind } from "../src/sim/types";
const dt = 1 / 30;
function setup(kinds: EnemyKind[] = ["raider"]) {
  const content = normalizeAbilities(structuredClone(CANONICAL_CONTENT));
  const level = content.levels[0];
  level.width = 100;
  level.path = [
    { x: -1, z: 3 },
    { x: 99, z: 3 },
  ];
  level.blocked = [];
  level.requiresBossDefeat = false;
  level.waves = [
    {
      id: "poison-test",
      title: "Poison",
      reward: 0,
      abilities: { ratShield: true, weaselEvade: true },
      packets: [
        {
          id: "group",
          groups: kinds.map((kind, i) => ({
            id: `enemy-${i}`,
            kind,
            count: 1,
            gap: dt,
          })),
        },
      ],
    },
  ];
  content.abilityDefaults!.ratShield = { downSeconds: dt, upSeconds: 10 };
  content.abilityDefaults!.weaselEvade = { downSeconds: dt, upSeconds: 10 };
  content.abilityDefaults!.skunkPoison = {
    durationSeconds: 1,
    tickSeconds: 0.25,
  };
  for (const def of Object.values(content.enemies)) {
    def.speed = 0.01;
    def.hp = 100;
  }
  const config = resolveConfiguration(content, level.id);
  const game = new Game(config.level, "none", false, 42, {
    configuration: config,
  });
  game.startWave();
  while (game.state.enemies.length < kinds.length) game.tick(dt);
  for (let i = 0; i < 4; i++) game.tick(dt);
  return { content, game };
}
function impact(
  game: Game,
  damage = 20,
  poisonDamage = 4,
  kind: "stone" | "net" = "stone",
) {
  const target = game.state.enemies[0];
  game.state.shots.push({
    id: 10000 + game.state.shots.length,
    x: 0,
    z: 3,
    source: { x: 0, z: 3 },
    targetId: target.id,
    target: { x: target.x, z: target.z },
    kind,
    damage,
    poisonDamage,
    duration: 0,
    life: 0,
  });
}
function advance(game: Game, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds / dt); i++) game.tick(dt);
}

it("resolves each AoE recipient: shield protects blast, evasion rejects attachment, immunity retains armored blast", () => {
  const { game } = setup(["raider", "runner", "armored"]);
  const [rat, weasel, boar] = game.state.enemies;
  impact(game);
  game.tick(dt);
  expect(rat.hp).toBe(
    100 -
      Math.max(1, 20 - game.enemies.raider.armor) * game.rules.guardDamageScale,
  );
  expect(rat.poison?.damage).toBe(4);
  expect(weasel.hp).toBe(100);
  expect(weasel.poison).toBeUndefined();
  expect(boar.hp).toBe(100 - Math.max(1, 20 - game.enemies.armored.armor));
  expect(boar.poison).toBeUndefined();
  for (const [enemy, type] of [
    [rat, "shield-hit"],
    [weasel, "evade"],
    [boar, "immune"],
  ] as const)
    expect(
      game.events.some(
        (event) => event.type === type && event.enemyId === enemy.id,
      ),
    ).toBe(true);
  expect(game.state.effects.map((e) => e.kind)).toEqual(
    expect.arrayContaining(["shield", "evade", "immune"]),
  );
});
it("attached poison bypasses later evasion, armor and shields; nets still slow Boar", () => {
  const { content } = setup(["runner", "armored"]);
  content.abilityDefaults!.weaselEvade = { downSeconds: 0.4, upSeconds: 10 };
  content.enemies.runner.armor = 50;
  const cfg = resolveConfiguration(content);
  const game = new Game(cfg.level, "none", false, 42, { configuration: cfg });
  game.startWave();
  while (game.state.enemies.length < 2) game.tick(dt);
  const [weasel, boar] = game.state.enemies;
  impact(game);
  game.tick(dt);
  const hp = weasel.hp;
  advance(game, 0.6);
  expect(weasel.evasion?.active).toBe(true);
  expect(weasel.hp).toBe(hp - 8);
  game.state.enemies = [boar, weasel];
  impact(game, 5, 0, "net");
  game.tick(dt);
  expect(boar.slowUntil).toBeGreaterThan(game.state.clock);
});
it("refresh preserves strongest damage and cadence without stacking or immediate ticks", () => {
  const { game } = setup();
  const enemy = game.state.enemies[0];
  impact(game, 1, 8);
  game.tick(dt);
  const first = { ...enemy.poison! };
  advance(game, 0.1);
  impact(game, 1, 4);
  impact(game, 1, 12);
  game.tick(dt);
  expect(enemy.poison?.damage).toBe(12);
  expect(enemy.poison?.nextTickAt).toBe(first.nextTickAt);
  expect(enemy.poison?.expiresAt).toBeGreaterThan(first.expiresAt);
  expect(game.events.filter((e) => e.type === "poison-tick")).toHaveLength(0);
  advance(game, 0.2);
  expect(game.events.filter((e) => e.type === "poison-tick")).toHaveLength(1);
});
it("ticks inclusively at expiry, freezes on pause and starts fresh on replay", () => {
  const { game } = setup();
  const enemy = game.state.enemies[0];
  impact(game);
  game.tick(dt);
  const hp = enemy.hp;
  const state = structuredClone(enemy.poison);
  game.pause();
  advance(game, 3);
  expect(enemy.poison).toEqual(state);
  expect(enemy.hp).toBe(hp);
  game.pause();
  advance(game, 1);
  expect(enemy.hp).toBe(hp - 16);
  expect(enemy.poison).toBeUndefined();
  expect(game.events.filter((e) => e.type === "poison-expired")).toHaveLength(
    1,
  );
  expect(setup().game.state.enemies[0].poison).toBeUndefined();
});
it("poison death awards a kill and reward exactly once, even with pending impacts", () => {
  const { game } = setup();
  const enemy = game.state.enemies[0];
  impact(game, 1, 200);
  game.tick(dt);
  const coins = game.state.coins;
  advance(game, 0.3);
  advance(game, 1);
  expect(game.state.kills).toBe(1);
  expect(game.state.coins).toBe(
    coins +
      Math.floor(
        game.enemies.raider.reward * (game.level.enemyRewardScale ?? 1),
      ),
  );
  expect(game.events.filter((e) => e.type === "kill")).toHaveLength(1);
  expect(enemy.poison).toBeUndefined();
});
it("bounds simultaneous defense feedback per enemy", () => {
  const { game } = setup(["raider", "runner", "armored"]);
  impact(game);
  impact(game);
  game.tick(dt);
  for (const type of ["shield-hit", "evade", "immune"])
    expect(game.events.filter((e) => e.type === type)).toHaveLength(1);
});
it("normalizes legacy drafts without enabling poison for legacy catalog entries and promotes combat settings with scoped conflicts", () => {
  const baseline = structuredClone(CANONICAL_CONTENT);
  delete baseline.abilityDefaults!.skunkPoison;
  delete baseline.towers.stone.poisonDamage;
  delete baseline.enemies.armored.poisonImmune;
  const draft = validateWorkingDraft(
    JSON.parse(JSON.stringify(createWorkingDraft(baseline))),
  );
  expect(draft.content.abilityDefaults!.skunkPoison).toEqual({
    durationSeconds: 4,
    tickSeconds: 1,
  });
  expect(draft.content.towers.stone.poisonDamage).toBeUndefined();
  draft.content.towers.stone.poisonDamage = 7;
  draft.content.enemies.armored.poisonImmune = true;
  draft.content.abilityDefaults!.skunkPoison!.durationSeconds = 5;
  const result = promoteWorkingWave(baseline, draft);
  expect(resolveConfiguration(result).skunkPoison!.durationSeconds).toBe(5);
  expect(result.towers.stone.poisonDamage).toBe(7);
  expect(result.levels.slice(1)).toEqual(baseline.levels.slice(1));
  expect(promoteAllWorkingChanges(baseline, draft)).toEqual(result);
  const conflict = structuredClone(baseline);
  conflict.towers.stone.poisonDamage = 9;
  expect(() => promoteWorkingWave(conflict, draft)).toThrow(/changed/);
});
it("rejects invalid poison parameters and capabilities", () => {
  const { content } = setup();
  content.abilityDefaults!.skunkPoison!.tickSeconds = 0;
  expect(() => validateContent(content)).toThrow(/invalid number/);
  content.abilityDefaults!.skunkPoison!.tickSeconds = 2;
  expect(() => validateContent(content)).toThrow(/cadence/);
  content.abilityDefaults!.skunkPoison!.tickSeconds = 0.25;
  content.enemies.runner.poisonImmune = true;
  expect(() => validateContent(content)).toThrow(/Boar/);
});

it("upgraded Skunk shots increase blast and poison using the same scale without changing status timing", () => {
  const { content } = setup();
  content.levels[0].availableTowers = ["stone"];
  content.levels[0].startCoins = 1000;
  const cfg = resolveConfiguration(content);
  const game = new Game(cfg.level, "none", false, 42, {
    configuration: cfg,
    unlockedUpgrades: ["stone"],
  });
  expect(game.place("stone", { x: 0, z: 2 })).toBe(true);
  expect(game.upgrade(game.state.towers[0].id)).toBe(true);
  game.startWave();
  while (!game.state.shots.length) game.tick(dt);
  expect(game.state.shots[0].damage).toBe(
    game.towers.stone.damage * game.rules.upgradeDamageScale,
  );
  expect(game.state.shots[0].poisonDamage).toBe(
    game.towers.stone.poisonDamage! * game.rules.upgradeDamageScale,
  );
  expect(game.skunkPoison).toEqual(content.abilityDefaults!.skunkPoison);
});

it("poison ticks bypass a raised shield and recipients outside the radius remain untouched", () => {
  const { game } = setup(["raider", "raider"]);
  const [inside, outside] = game.state.enemies;
  outside.distance = 10;
  impact(game);
  game.tick(dt);
  expect(inside.poison).toBeDefined();
  expect(outside.hp).toBe(100);
  expect(outside.poison).toBeUndefined();
  const hp = inside.hp;
  advance(game, 0.3);
  expect(inside.shieldRaised).toBe(true);
  expect(inside.hp).toBe(hp - 4);
  // Moving a later arrival into an old burst does not attach poison.
  outside.distance = inside.distance;
  game.tick(dt);
  expect(outside.poison).toBeUndefined();
});
it("fresh poison after expiry can be weaker and authored immunity can be disabled", () => {
  const { content } = setup(["armored"]);
  content.enemies.armored.poisonImmune = false;
  const cfg = resolveConfiguration(content);
  const game = new Game(cfg.level, "none", false, 42, { configuration: cfg });
  game.startWave();
  while (!game.state.enemies.length) game.tick(dt);
  const enemy = game.state.enemies[0];
  impact(game, 1, 8);
  game.tick(dt);
  const hp = enemy.hp;
  advance(game, 1);
  expect(enemy.hp).toBe(hp - 32);
  expect(enemy.poison).toBeUndefined();
  impact(game, 1, 4);
  game.tick(dt);
  expect(enemy.poison?.damage).toBe(4);
  expect(enemy.poison?.nextTickAt).toBeGreaterThan(game.state.clock);
});

it("retains catalog conflicts after refreshing a draft baseline instead of overwriting newer tuning", () => {
  const baseline = structuredClone(CANONICAL_CONTENT);
  const draft = createWorkingDraft(baseline);
  draft.content.towers.stone.poisonDamage = 7;
  const live = structuredClone(baseline);
  live.towers.stone.poisonDamage = 9;
  const rebased = rebaseAfterPromotion(draft, live);
  expect(rebased.content.towers.stone.poisonDamage).toBe(7);
  expect(() => promoteWorkingWave(live, rebased)).toThrow(/changed/);
});

it("preserves unrelated live tower fields when rebasing pending poison tuning", () => {
  const baseline = structuredClone(CANONICAL_CONTENT);
  const draft = createWorkingDraft(baseline);
  draft.content.towers.stone.poisonDamage = 7;
  const live = structuredClone(baseline);
  live.towers.stone.cost = 66;
  const rebased = rebaseAfterPromotion(draft, live);
  expect(rebased.content.towers.stone.cost).toBe(66);
  const promoted = promoteAllWorkingChanges(live, rebased);
  expect(promoted.towers.stone).toEqual({
    ...live.towers.stone,
    poisonDamage: 7,
  });
});

it("preserves unrelated live enemy fields when rebasing pending immunity edits", () => {
  const baseline = structuredClone(CANONICAL_CONTENT);
  const draft = createWorkingDraft(baseline);
  draft.content.enemies.armored.poisonImmune = false;
  const live = structuredClone(baseline);
  live.enemies.armored.armor += 1;
  const rebased = rebaseAfterPromotion(draft, live);
  expect(rebased.content.enemies.armored.armor).toBe(
    live.enemies.armored.armor,
  );
  const promoted = promoteAllWorkingChanges(live, rebased);
  expect(promoted.enemies.armored).toEqual({
    ...live.enemies.armored,
    poisonImmune: false,
  });
});

it("preserves removal of optional combat fields without restoring unrelated catalog values", () => {
  const baseline = structuredClone(CANONICAL_CONTENT);
  const draft = createWorkingDraft(baseline);
  delete draft.content.towers.stone.poisonDamage;
  delete draft.content.enemies.armored.poisonImmune;
  const live = structuredClone(baseline);
  live.towers.stone.cost += 1;
  live.enemies.armored.hp += 1;
  const promoted = promoteAllWorkingChanges(
    live,
    rebaseAfterPromotion(draft, live),
  );
  expect(promoted.towers.stone.cost).toBe(live.towers.stone.cost);
  expect(promoted.enemies.armored.hp).toBe(live.enemies.armored.hp);
  expect(promoted.towers.stone.poisonDamage).toBeUndefined();
  expect(promoted.enemies.armored.poisonImmune).toBeUndefined();
});
