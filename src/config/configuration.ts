import source from "../content/recipes.json";
import type {
  LevelDef,
  WaveDef,
  WaveGroupDef,
  TowerKind,
  EnemyKind,
  TowerDef,
  EnemyDef,
} from "../sim/types";
import { validateLevel } from "../sim/path";
import { compileSpawnSchedule } from "../sim/spawn-schedule";
export type GameplayRules = typeof source.rules;
export interface PacketRecipe {
  id: string;
  repeat?: number;
  repeatDelayBefore?: number;
  groups: (WaveGroupDef & { id: string })[];
}
export interface WaveRecipe {
  id: string;
  title: string;
  reward: number;
  packets: PacketRecipe[];
  lesson?: string;
  targetOutcome?: string;
}
export interface LevelRecipe extends Omit<LevelDef, "waves"> {
  waves: WaveRecipe[];
}
export interface AuthoringContent {
  schemaVersion: 1;
  levels: LevelRecipe[];
  towers: Record<TowerKind, TowerDef>;
  enemies: Record<EnemyKind, EnemyDef>;
  rules: GameplayRules;
}
export interface AttemptConfiguration {
  level: LevelDef;
  towers: Record<TowerKind, TowerDef>;
  enemies: Record<EnemyKind, EnemyDef>;
  rules: GameplayRules;
  identity: string;
}
export const DEFAULT_RULES: GameplayRules = freeze(
  structuredClone(source.rules),
);
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export const CANONICAL_CONTENT: AuthoringContent = freeze(
  source as unknown as AuthoringContent,
);
export function configurationIdentity(value: unknown): string {
  const ordered = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(ordered)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, x]) => [k, ordered(x)]),
          )
        : v;
  let hash = 2166136261;
  for (const c of JSON.stringify(ordered(value)))
    hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
export function compileLevel(recipe: LevelRecipe): LevelDef {
  return {
    ...structuredClone(recipe),
    waves: recipe.waves.map((w) => ({
      id: w.id,
      title: w.title,
      reward: w.reward,
      groups: w.packets.flatMap((p) =>
        Array.from({ length: p.repeat ?? 1 }, (_, r) =>
          p.groups.map((g, i) => ({
            ...structuredClone(g),
            id: `${p.id}/${r + 1}/${g.id}`,
            delayBefore:
              (g.delayBefore ?? 0) +
              (r > 0 && i === 0 ? (p.repeatDelayBefore ?? 0) : 0),
          })),
        ).flat(),
      ),
    })),
  };
}
function exact(value: object, allowed: string[], label: string) {
  if (!value || typeof value !== "object")
    throw new Error(`${label}: expected object`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw new Error(`${label}.${key}: unsupported field`);
}
function numeric(value: number, label: string, minimum = 0, integer = false) {
  if (
    !Number.isFinite(value) ||
    value < minimum ||
    (integer && !Number.isInteger(value))
  )
    throw new Error(`${label}: invalid number`);
}
function ids(values: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v.id !== "string" || !v.id.trim() || seen.has(v.id))
      throw new Error(`${label}: missing or duplicate identity`);
    seen.add(v.id);
  }
}
export function validateContent(content: AuthoringContent): void {
  if (!content || content.schemaVersion !== 1)
    throw new Error("Unsupported content schema version");
  exact(
    content,
    ["schemaVersion", "levels", "towers", "enemies", "rules"],
    "content",
  );
  ids(content.levels, "levels");
  for (const level of content.levels) {
    exact(
      level,
      [
        "id",
        "name",
        "subtitle",
        "description",
        "width",
        "depth",
        "path",
        "blocked",
        "startCoins",
        "availableTowers",
        "enemyRewardScale",
        "healthScale",
        "requiresBossDefeat",
        "waves",
        "accent",
      ],
      "level",
    );
    for (const key of [
      "id",
      "name",
      "subtitle",
      "description",
      "accent",
    ] as const)
      if (typeof level[key] !== "string" || !level[key].trim())
        throw new Error(`${key}: required text`);
    numeric(level.width, "width", 1, true);
    numeric(level.depth, "depth", 1, true);
    numeric(level.startCoins, "startCoins", 0, true);
    for (const p of [...level.path, ...level.blocked]) {
      numeric(p.x, "point.x", -Number.MAX_VALUE, true);
      numeric(p.z, "point.z", -Number.MAX_VALUE, true);
    }
    if (
      level.availableTowers?.some((t) => !["bolt", "stone", "net"].includes(t))
    )
      throw new Error("Unsupported defender");
    if (level.healthScale !== undefined)
      numeric(level.healthScale, "healthScale", Number.EPSILON);
    if (level.enemyRewardScale !== undefined)
      numeric(level.enemyRewardScale, "enemyRewardScale");
    ids(level.waves, "waves");
    for (const w of level.waves) {
      exact(
        w,
        ["id", "title", "reward", "packets", "lesson", "targetOutcome"],
        "wave",
      );
      if (typeof w.title !== "string" || !w.title.trim())
        throw new Error("Wave title required");
      numeric(w.reward, "reward", 0, true);
      ids(w.packets, "packets");
      if (!w.packets.length) throw new Error("Wave needs packets");
      for (const p of w.packets) {
        exact(p, ["id", "repeat", "repeatDelayBefore", "groups"], p.id);
        numeric(p.repeat ?? 1, `${p.id}.repeat`, 1, true);
        numeric(p.repeatDelayBefore ?? 0, `${p.id}.repeatDelayBefore`);
        ids(p.groups, p.id);
        if (!p.groups.length) throw new Error(`${p.id}: empty packet`);
        for (const g of p.groups) {
          exact(
            g,
            [
              "id",
              "kind",
              "count",
              "gap",
              "delayBefore",
              "batchSize",
              "batchStagger",
              "movementScale",
              "shieldCycle",
              "evasionCycle",
            ],
            g.id,
          );
          if (!["raider", "runner", "armored", "boss"].includes(g.kind))
            throw new Error(`${g.id}.kind: unsupported ability`);
          numeric(g.delayBefore ?? 0, `${g.id}.delayBefore`);
          if (g.evasionCycle) {
            exact(g.evasionCycle, ["upSeconds", "downSeconds"], g.id);
            if (g.kind !== "runner")
              throw new Error(`${g.id}.evasionCycle: Weasel only`);
            numeric(g.evasionCycle.upSeconds, g.id, Number.EPSILON);
            numeric(g.evasionCycle.downSeconds, g.id, Number.EPSILON);
          }
          if (g.shieldCycle)
            exact(g.shieldCycle, ["upSeconds", "downSeconds"], g.id);
        }
      }
    }
    const compiled = compileLevel(level);
    validateLevel(compiled);
    for (const w of compiled.waves)
      compileSpawnSchedule(w, content.rules.initialSpawnDelay);
  }
  for (const [name, defaults] of [
    ["towers", source.towers],
    ["enemies", source.enemies],
  ] as const) {
    const catalog = content[name];
    exact(catalog, Object.keys(defaults), name);
    for (const [kind, baseline] of Object.entries(defaults)) {
      const value = catalog[kind as keyof typeof catalog] as unknown as Record<
        string,
        unknown
      >;
      if (!value) throw new Error(`${name}.${kind}: missing`);
      exact(value, Object.keys(baseline), kind);
      for (const [key, base] of Object.entries(baseline)) {
        if (typeof base === "number")
          numeric(
            value[key] as number,
            `${kind}.${key}`,
            ["interval", "range", "speed", "hp"].includes(key)
              ? Number.EPSILON
              : 0,
          );
        else if (typeof value[key] !== "string")
          throw new Error(`${kind}.${key}: invalid text`);
      }
    }
  }
  for (const key of Object.keys(source.rules))
    if (!(key in content.rules)) throw new Error(`rules.${key}: missing`);
  for (const key of Object.keys(source.rules.boss))
    if (!(key in content.rules.boss)) throw new Error(`boss.${key}: missing`);
  exact(content.rules, Object.keys(source.rules), "rules");
  exact(content.rules.boss, Object.keys(source.rules.boss), "boss");
  for (const [key, value] of Object.entries(content.rules)) {
    if (key === "boss") continue;
    numeric(value as number, `rules.${key}`, Number.EPSILON);
  }
  for (const [key, value] of Object.entries(content.rules.boss))
    numeric(value, `boss.${key}`, Number.EPSILON);
}
export function resolveConfiguration(
  content: AuthoringContent = CANONICAL_CONTENT,
  levelId: string = content.levels[0].id,
  options: { availableTowers?: TowerKind[] } = {},
): AttemptConfiguration {
  validateContent(content);
  const recipe = content.levels.find((l) => l.id === levelId);
  if (!recipe) throw new Error(`Unknown encounter ${levelId}`);
  const level = compileLevel(recipe);
  if (options.availableTowers)
    level.availableTowers = [...options.availableTowers];
  const value = {
    level,
    towers: structuredClone(content.towers),
    enemies: structuredClone(content.enemies),
    rules: structuredClone(content.rules),
  };
  return freeze({ ...value, identity: configurationIdentity(value) });
}
