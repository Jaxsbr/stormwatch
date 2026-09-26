import {
  configurationIdentity,
  resolveConfiguration,
  validateContent,
  type AuthoringContent,
  type AttemptConfiguration,
} from "../config/configuration";
import { availableCards, levelForAttempt } from "../content/progression";
import { freshSave, recordVictory } from "../persistence/save";
import type { CardId, Point, TowerKind } from "../sim/types";
export interface Scenario {
  id: string;
  levelId: string;
  waveId?: string;
  mode: "encounter" | "wave";
  progression: "first-arrival" | "replay";
  difficulty: "normal" | "assist";
  seed: number;
  difficultyCandidate?: { id: string; content: AuthoringContent };
  overrides?: {
    towers?: TowerKind[];
    upgrades?: TowerKind[];
    card?: CardId;
    coins?: number;
    lives?: number;
  };
  formation?: { kind: TowerKind; point: Point; upgraded?: boolean }[];
}
export function strictKeys(
  value: unknown,
  keys: string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label}: expected object`);
  for (const k of Object.keys(value))
    if (!keys.includes(k)) throw new Error(`${label}.${k}: unsupported`);
}
const towers = ["bolt", "stone", "net"];
export function validateScenario(value: unknown): asserts value is Scenario {
  strictKeys(
    value,
    [
      "id",
      "levelId",
      "waveId",
      "mode",
      "progression",
      "difficulty",
      "seed",
      "overrides",
      "formation",
      "difficultyCandidate",
    ],
    "scenario",
  );
  for (const key of ["id", "levelId"])
    if (typeof value[key] !== "string" || !(value[key] as string).trim())
      throw new Error(`${key}: required identity`);
  if (
    !["encounter", "wave"].includes(value.mode as string) ||
    !["first-arrival", "replay"].includes(value.progression as string) ||
    !["normal", "assist"].includes(value.difficulty as string) ||
    !Number.isInteger(value.seed) ||
    Number(value.seed) < 0
  )
    throw new Error("Invalid scenario mode, progression, difficulty or seed");
  if (
    value.waveId !== undefined &&
    (typeof value.waveId !== "string" || !value.waveId)
  )
    throw new Error("Invalid wave identity");
  if (value.mode === "wave" && !value.waveId)
    throw new Error("Isolated wave requires waveId");
  if (value.overrides !== undefined) {
    strictKeys(
      value.overrides,
      ["towers", "upgrades", "card", "coins", "lives"],
      "overrides",
    );
    for (const k of ["towers", "upgrades"])
      if (
        value.overrides[k] !== undefined &&
        (!Array.isArray(value.overrides[k]) ||
          (value.overrides[k] as unknown[]).some(
            (x) => !towers.includes(x as string),
          ) ||
          new Set(value.overrides[k] as unknown[]).size !==
            (value.overrides[k] as unknown[]).length)
      )
        throw new Error(`Invalid ${k}`);
    if (
      value.overrides.card !== undefined &&
      !["none", "reach", "nets", "thrift"].includes(
        value.overrides.card as string,
      )
    )
      throw new Error("Invalid card");
    for (const k of ["coins", "lives"])
      if (
        value.overrides[k] !== undefined &&
        (!Number.isInteger(value.overrides[k]) ||
          Number(value.overrides[k]) < (k === "lives" ? 1 : 0))
      )
        throw new Error(`Invalid ${k}`);
  }
  if (value.formation !== undefined) {
    if (!Array.isArray(value.formation)) throw new Error("Invalid formation");
    for (const f of value.formation) {
      strictKeys(f, ["kind", "point", "upgraded"], "formation");
      strictKeys(f.point, ["x", "z"], "point");
      if (
        !towers.includes(f.kind as string) ||
        !Number.isInteger(f.point.x) ||
        !Number.isInteger(f.point.z) ||
        (f.upgraded !== undefined && typeof f.upgraded !== "boolean")
      )
        throw new Error("Invalid formation");
    }
  }
  if (value.difficultyCandidate !== undefined) {
    strictKeys(value.difficultyCandidate, ["id", "content"], "candidate");
    if (
      typeof value.difficultyCandidate.id !== "string" ||
      !value.difficultyCandidate.id.trim()
    )
      throw new Error("Candidate identity required");
    validateContent(value.difficultyCandidate.content as AuthoringContent);
  }
}
export interface ResolvedScenario {
  configuration: AttemptConfiguration;
  scenario: Scenario;
  card: CardId;
  assist: boolean;
  unlockedUpgrades: TowerKind[];
  synthetic: boolean;
  initialLives: number;
}
/** Recipe candidate precedes progression; explicit setup overrides are last and never alter authored content. */
export function resolveScenario(
  content: AuthoringContent,
  scenario: Scenario,
): ResolvedScenario {
  validateScenario(scenario);
  validateContent(content);
  const selected = scenario.difficultyCandidate?.content ?? content;
  const config = resolveConfiguration(selected, scenario.levelId);
  const index = selected.levels.findIndex((l) => l.id === scenario.levelId);
  let save = freshSave();
  for (const level of selected.levels.slice(
    0,
    scenario.progression === "replay" ? selected.levels.length : index,
  ))
    save = recordVictory(save, level.id, 3);
  const level = structuredClone(levelForAttempt(config.level, save));
  const overrides = scenario.overrides ?? {};
  if (scenario.waveId && !level.waves.some((w) => w.id === scenario.waveId))
    throw new Error(`Unknown wave ${scenario.waveId}`);
  if (scenario.mode === "wave") {
    level.waves = level.waves.filter((w) => w.id === scenario.waveId);
    level.requiresBossDefeat =
      !!config.level.requiresBossDefeat &&
      level.waves[0].groups.some((g) => g.kind === "boss");
  }
  if (overrides.towers) level.availableTowers = [...overrides.towers];
  const assist = scenario.difficulty === "assist";
  if (overrides.coins !== undefined)
    level.startCoins =
      overrides.coins - (assist ? config.rules.assistCrowns : 0);
  const cards = availableCards(level, save);
  const card = overrides.card ?? (cards.length === 1 ? cards[0] : "none");
  const upgraded =
    overrides.upgrades ??
    (save.unlocked.includes("squirrel-upgrade") ? ["bolt"] : []);
  const result = { ...config, level };
  result.identity = configurationIdentity({ ...result, identity: undefined });
  return {
    configuration: result,
    scenario: structuredClone(scenario),
    card,
    assist,
    unlockedUpgrades: upgraded as TowerKind[],
    synthetic:
      scenario.mode === "wave" ||
      !!scenario.overrides ||
      !!scenario.formation?.length,
    initialLives:
      overrides.lives ??
      (assist ? config.rules.assistLives : config.rules.normalLives),
  };
}
