import source from "../content/recipes.json";
import type {
  LevelDef,
  WaveDef,
  WaveGroupDef,
  TowerKind,
  EnemyKind,
  TowerDef,
  EnemyDef,
  ShieldCycle,
  EvasionCycle,
  PoisonSettings,
  RouteLayout,
} from "../sim/types";
import { resolveRouteLayout } from "../sim/routes";
import { validateLevel } from "../sim/path";
import { compileSpawnSchedule } from "../sim/spawn-schedule";
import { validateAuthoredVisuals } from "../content/encounter-visuals";
export interface BossRageSettings {
  angrySpeedScale: number;
  ragingSpeedScale: number;
  triggerDamagePercent?: number;
  angrySeconds?: number;
  ragingSeconds?: number;
}
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
  abilities?: { ratShield: boolean; weaselEvade: boolean };
}
export interface LevelRecipe extends Omit<LevelDef, "waves"> {
  routeLayoutId?: string;
  waves: WaveRecipe[];
}
export interface AuthoringContent {
  schemaVersion: 1;
  routeLayouts?: RouteLayout[];
  abilityDefaults?: {
    ratShield: ShieldCycle;
    weaselEvade: EvasionCycle;
    bossRage?: BossRageSettings;
    skunkPoison?: PoisonSettings;
  };
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
  bossRage?: BossRageSettings;
  skunkPoison?: PoisonSettings;
  identity: string;
}
export let DEFAULT_RULES: GameplayRules = freeze(structuredClone(source.rules));
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export let CANONICAL_CONTENT: AuthoringContent = freeze(
  source as unknown as AuthoringContent,
);
/** Bootstrap only: install validated data before importing game adapters. */
export function installRuntimeContent(value: unknown): void {
  validateContent(value as AuthoringContent);
  validateAuthoredVisuals(value as AuthoringContent);
  CANONICAL_CONTENT = freeze(structuredClone(value as AuthoringContent));
  DEFAULT_RULES = CANONICAL_CONTENT.rules;
}
export const ABILITY_DEFAULTS = {
  skunkPoison: { durationSeconds: 4, tickSeconds: 1 },
  bossRage: structuredClone(source.abilityDefaults.bossRage),
  ratShield: { upSeconds: 3, downSeconds: 5 },
  weaselEvade: { upSeconds: 2, downSeconds: 3 },
};
/** Legacy data only uses the presence of an ability; individual timings are retired. */
export function waveAbilities(wave: WaveRecipe) {
  return (
    wave.abilities ?? {
      ratShield: true,
      weaselEvade: wave.packets.some((p) =>
        p.groups.some((g) => !!g.evasionCycle),
      ),
    }
  );
}
export function normalizeAbilities(
  content: AuthoringContent,
): AuthoringContent {
  const next = structuredClone(content);
  next.abilityDefaults ??= structuredClone(ABILITY_DEFAULTS);
  next.abilityDefaults.bossRage = {
    ...ABILITY_DEFAULTS.bossRage,
    ...next.abilityDefaults.bossRage,
  };
  next.abilityDefaults.skunkPoison ??= structuredClone(
    ABILITY_DEFAULTS.skunkPoison,
  );
  for (const level of next.levels)
    for (const wave of level.waves) {
      wave.abilities = waveAbilities(wave);
      for (const packet of wave.packets)
        for (const group of packet.groups) {
          delete group.shieldCycle;
          delete group.evasionCycle;
        }
    }
  return next;
}
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
export function compileLevel(
  recipe: LevelRecipe,
  abilityDefaults = CANONICAL_CONTENT.abilityDefaults ?? ABILITY_DEFAULTS,
  routeLayouts = CANONICAL_CONTENT.routeLayouts ?? [],
): LevelDef {
  const { routeLayoutId: _layout, ...fields } = recipe;
  const geometry = resolveRouteLayout(recipe, routeLayouts);
  return {
    ...structuredClone(fields),
    ...structuredClone(geometry),
    waves: recipe.waves.map((w) => ({
      id: w.id,
      title: w.title,
      reward: w.reward,
      groups: w.packets.flatMap((p) =>
        Array.from({ length: p.repeat ?? 1 }, (_, r) =>
          p.groups.map((g, i) => ({
            ...structuredClone(g),
            ...(geometry.routes
              ? { routeId: g.routeId ?? geometry.routes[0].id }
              : {}),
            shieldEnabled:
              g.kind === "raider" ? waveAbilities(w).ratShield : undefined,
            shieldCycle:
              g.kind === "raider"
                ? structuredClone(abilityDefaults.ratShield)
                : undefined,
            evasionCycle:
              g.kind === "runner" && waveAbilities(w).weaselEvade
                ? structuredClone(abilityDefaults.weaselEvade)
                : undefined,
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
function validatePoint(p: { x: number; z: number }) {
  exact(p, ["x", "z"], "point");
  numeric(p.x, "point.x", -Number.MAX_VALUE, true);
  numeric(p.z, "point.z", -Number.MAX_VALUE, true);
}
function validateRoutes(routes: RouteLayout["routes"]) {
  if (!Array.isArray(routes) || routes.length < 1 || routes.length > 2)
    throw new Error("Use one or two routes");
  ids(routes, "routes");
  for (const route of routes) {
    exact(route, ["id", "path"], "route");
    if (!Array.isArray(route.path)) throw new Error("Route path required");
    route.path.forEach(validatePoint);
  }
}
export function validateContent(
  content: AuthoringContent,
  options: { allowIncompleteFinale?: boolean } = {},
): void {
  if (!content || content.schemaVersion !== 1)
    throw new Error("Unsupported content schema version");
  exact(
    content,
    [
      "schemaVersion",
      "levels",
      "towers",
      "enemies",
      "rules",
      "abilityDefaults",
      "routeLayouts",
    ],
    "content",
  );
  if (content.routeLayouts !== undefined) {
    if (!Array.isArray(content.routeLayouts))
      throw new Error("routeLayouts: expected array");
    ids(content.routeLayouts, "routeLayouts");
    for (const layout of content.routeLayouts) {
      exact(
        layout,
        ["id", "width", "depth", "routes", "blocked"],
        "routeLayout",
      );
      numeric(layout.width, "layout.width", 1, true);
      numeric(layout.depth, "layout.depth", 1, true);
      validateRoutes(layout.routes);
      for (const p of layout.blocked) validatePoint(p);
      validateLevel({
        ...content.levels[0],
        ...layout,
        path: [],
        waves: [{ title: "Layout validation", reward: 0, groups: [] }],
      });
    }
  }
  if (content.abilityDefaults !== undefined) {
    exact(
      content.abilityDefaults,
      ["ratShield", "weaselEvade", "bossRage", "skunkPoison"],
      "abilityDefaults",
    );
    if (content.abilityDefaults.skunkPoison !== undefined) {
      const poison = content.abilityDefaults.skunkPoison;
      exact(poison, ["durationSeconds", "tickSeconds"], "skunkPoison");
      numeric(poison.durationSeconds, "skunkPoison.durationSeconds", 1 / 30);
      numeric(poison.tickSeconds, "skunkPoison.tickSeconds", 1 / 30);
      if (poison.tickSeconds > poison.durationSeconds)
        throw new Error("Poison cadence exceeds duration");
    }
    if (content.abilityDefaults.bossRage !== undefined) {
      const rage = content.abilityDefaults.bossRage;
      exact(
        rage,
        [
          "angrySpeedScale",
          "ragingSpeedScale",
          "triggerDamagePercent",
          "angrySeconds",
          "ragingSeconds",
        ],
        "bossRage",
      );
      if (rage.triggerDamagePercent !== undefined) {
        numeric(
          rage.triggerDamagePercent,
          "bossRage.triggerDamagePercent",
          Number.EPSILON,
        );
        if (rage.triggerDamagePercent > 100)
          throw new Error("bossRage.triggerDamagePercent: maximum 100");
      }
      for (const key of ["angrySeconds", "ragingSeconds"] as const)
        if (rage[key] !== undefined)
          numeric(rage[key], `bossRage.${key}`, Number.EPSILON);
      numeric(rage.angrySpeedScale, "bossRage.angrySpeedScale", 1);
      numeric(
        rage.ragingSpeedScale,
        "bossRage.ragingSpeedScale",
        rage.angrySpeedScale,
      );
    }
    for (const key of ["ratShield", "weaselEvade"] as const) {
      const cycle = content.abilityDefaults[key];
      exact(cycle, ["upSeconds", "downSeconds"], key);
      numeric(cycle.upSeconds, `${key}.upSeconds`, Number.EPSILON);
      numeric(cycle.downSeconds, `${key}.downSeconds`, Number.EPSILON);
    }
  }
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
        "routes",
        "routeLayoutId",
        "blocked",
        "startCoins",
        "availableTowers",
        "enemyRewardScale",
        "healthScale",
        "requiresBossDefeat",
        "waves",
        "accent",
        "visual",
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
    if (level.visual !== undefined) {
      exact(level.visual, ["backdrop"], `${level.id}.visual`);
      if (typeof level.visual.backdrop !== "string")
        throw new Error(`${level.id}.visual.backdrop: required text`);
    }
    numeric(level.width, "width", 1, true);
    numeric(level.depth, "depth", 1, true);
    numeric(level.startCoins, "startCoins", 0, true);
    if (
      level.requiresBossDefeat !== undefined &&
      typeof level.requiresBossDefeat !== "boolean"
    )
      throw new Error("requiresBossDefeat must be on or off");
    if (level.routeLayoutId !== undefined) {
      if (
        typeof level.routeLayoutId !== "string" ||
        level.routes !== undefined ||
        level.path.length ||
        level.blocked.length
      )
        throw new Error(
          "Referenced layout owns routes and blocked cells; local path and blocked must be empty",
        );
      const layout = content.routeLayouts?.find(
        (l) => l.id === level.routeLayoutId,
      );
      if (
        !layout ||
        layout.width !== level.width ||
        layout.depth !== level.depth
      )
        throw new Error("Unknown layout or mismatched layout dimensions");
    } else if (level.routes !== undefined) {
      validateRoutes(level.routes);
      if (level.path.length)
        throw new Error(
          "Explicit routes own geometry; legacy path must be empty",
        );
    }
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
        [
          "id",
          "title",
          "reward",
          "packets",
          "lesson",
          "targetOutcome",
          "abilities",
        ],
        "wave",
      );
      if (typeof w.title !== "string" || !w.title.trim())
        throw new Error("Wave title required");
      if (w.abilities !== undefined) {
        exact(w.abilities, ["ratShield", "weaselEvade"], "abilities");
        if (
          typeof w.abilities.ratShield !== "boolean" ||
          typeof w.abilities.weaselEvade !== "boolean"
        )
          throw new Error("Wave abilities must be on or off");
      }
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
              "routeId",
              "startTogether",
            ],
            g.id,
          );
          if (!["raider", "runner", "armored", "boss"].includes(g.kind))
            throw new Error(`${g.id}.kind: unsupported ability`);
          numeric(g.delayBefore ?? 0, `${g.id}.delayBefore`);
          if (
            g.startTogether !== undefined &&
            typeof g.startTogether !== "boolean"
          )
            throw new Error("startTogether must be on or off");
          if (g.evasionCycle) {
            exact(g.evasionCycle, ["upSeconds", "downSeconds"], g.id);
            if (g.kind !== "runner")
              throw new Error(`${g.id}.evasionCycle: Weasel only`);
            numeric(g.evasionCycle.upSeconds, g.id, Number.EPSILON);
            numeric(g.evasionCycle.downSeconds, g.id, Number.EPSILON);
          }
          if (g.shieldCycle) {
            exact(g.shieldCycle, ["upSeconds", "downSeconds"], g.id);
            if (g.kind !== "raider")
              throw new Error(`${g.id}.shieldCycle: Rat only`);
            numeric(g.shieldCycle.upSeconds, g.id, Number.EPSILON);
            numeric(g.shieldCycle.downSeconds, g.id, Number.EPSILON);
          }
        }
      }
    }
    const compiled = compileLevel(
      level,
      content.abilityDefaults ?? ABILITY_DEFAULTS,
      content.routeLayouts ?? [],
    );
    validateLevel(compiled);
    if (
      !options.allowIncompleteFinale &&
      compiled.requiresBossDefeat &&
      !compiled.waves.at(-1)!.groups.some((g) => g.kind === "boss")
    )
      throw new Error(`${level.name} requires a boss wave in its finale`);
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
      exact(
        value,
        [
          ...Object.keys(baseline),
          ...(name === "towers" ? ["poisonDamage"] : ["poisonImmune"]),
        ],
        kind,
      );
      if (value.poisonDamage !== undefined) {
        if (kind !== "stone")
          throw new Error("Only Skunk supports poison damage");
        numeric(
          value.poisonDamage as number,
          "stone.poisonDamage",
          Number.EPSILON,
        );
      }
      if (
        value.poisonImmune !== undefined &&
        (typeof value.poisonImmune !== "boolean" || kind !== "armored")
      )
        throw new Error("Only Boar supports poison immunity");
      for (const [key, base] of Object.entries(baseline)) {
        if (key === "poisonDamage" || key === "poisonImmune") continue;
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
  const level = compileLevel(
    recipe,
    content.abilityDefaults ?? ABILITY_DEFAULTS,
    content.routeLayouts ?? [],
  );
  if (options.availableTowers)
    level.availableTowers = [...options.availableTowers];
  const value = {
    level,
    towers: structuredClone(content.towers),
    enemies: structuredClone(content.enemies),
    rules: structuredClone(content.rules),
    skunkPoison: structuredClone(
      content.abilityDefaults?.skunkPoison ?? ABILITY_DEFAULTS.skunkPoison,
    ),
    bossRage: structuredClone({
      ...ABILITY_DEFAULTS.bossRage,
      ...content.abilityDefaults?.bossRage,
    }),
  };
  return freeze({ ...value, identity: configurationIdentity(value) });
}
