import type { EnemyKind, LevelDef, TowerKind } from "../sim/types";
import type { AuthoringContent } from "../config/configuration";

/** Reviewed runtime art identities. Reusable characters are defined once. */
export const enemyVisuals: Record<
  EnemyKind,
  {
    views: readonly [string, string, string];
    briefing: string;
    expressions?: { front: readonly string[]; side: readonly string[] };
  }
> = {
  raider: {
    views: ["rat-rig-v3", "rat-front-rig-v3", "rat-rear-rig-v3"],
    briefing: "rat-rig-v3/body.webp",
  },
  runner: {
    views: ["weasel-rig-v1", "weasel-front-rig-v1", "weasel-rear-rig-v1"],
    briefing: "weasel-rig-v1/body.webp",
  },
  armored: {
    views: ["boar-rig-v1", "boar-front-rig-v1", "boar-rear-rig-v1"],
    briefing: "boar-rig-v1/body.webp",
  },
  boss: {
    views: ["badger-rig-v1", "badger-front-rig-v1", "badger-rear-rig-v1"],
    briefing: "badger-rig-v1/body.webp",
    expressions: {
      front: ["badger-front-angry-v1", "badger-front-raging-v1"],
      side: ["badger-side-angry-v1", "badger-side-raging-v1"],
    },
  },
};

export const defenderVisuals: Record<
  TowerKind,
  { sideRig: string; portrait: string }
> = {
  bolt: {
    sideRig: "squirrel-side-defender-v1",
    portrait: "squirrel-side-defender-v1/portrait.webp",
  },
  stone: {
    sideRig: "skunk-side-defender-v1",
    portrait: "skunk-side-defender-v1/portrait.webp",
  },
  net: {
    sideRig: "turtle-side-defender-v1",
    portrait: "turtle-side-defender-v1/portrait.webp",
  },
};

/** Approved scenery can be reused by new authored maps without changing JavaScript. */
export const backdropVisuals: Record<string, string> = {
  woodland: "woodland-clearing-v3/atlas.webp",
  rainstone: "rainstone-riverbank-v2/atlas.webp",
};

export const artPath = (path: string) => `art/v2/${path}`;

export function describeEncounter(
  level: Pick<LevelDef, "id" | "waves" | "availableTowers" | "visual">,
) {
  const visual = level.visual;
  if (!visual?.backdrop || !backdropVisuals[visual.backdrop])
    throw new Error(
      `Encounter ${level.id}: missing or unapproved backdrop visual description`,
    );
  for (const wave of level.waves)
    for (const group of wave.groups)
      if (
        group.count > 0 &&
        (!enemyVisuals[group.kind]?.views?.every(Boolean) ||
          !enemyVisuals[group.kind]?.briefing)
      )
        throw new Error(
          `Encounter ${level.id}, wave ${wave.id}: missing ${group.kind} enemy views or briefing art`,
        );
  for (const kind of level.availableTowers ?? ["bolt", "stone", "net"])
    if (!defenderVisuals[kind]?.sideRig || !defenderVisuals[kind]?.portrait)
      throw new Error(`Encounter ${level.id}: missing ${kind} defender art`);
  const enemies = [
    ...new Set(
      level.waves.flatMap((wave) =>
        wave.groups
          .filter((group) => group.count > 0)
          .map((group) => group.kind),
      ),
    ),
  ];
  const defenders: TowerKind[] = [
    ...new Set<TowerKind>(level.availableTowers ?? ["bolt", "stone", "net"]),
  ];
  return {
    backdrop: artPath(backdropVisuals[visual.backdrop]),
    enemies: enemies.map((kind) => ({ kind, ...enemyVisuals[kind] })),
    defenders: defenders.map((kind) => ({ kind, ...defenderVisuals[kind] })),
  };
}

/** Promotion and startup reject an authored map before it can ship without art. */
export function validateAuthoredVisuals(
  content: Pick<AuthoringContent, "levels">,
): void {
  for (const level of content.levels)
    describeEncounter({
      id: level.id,
      availableTowers: level.availableTowers,
      visual: level.visual,
      waves: level.waves.map((wave) => ({
        id: wave.id,
        groups: wave.packets.flatMap((packet) => packet.groups),
      })),
    } as Pick<LevelDef, "id" | "availableTowers" | "waves" | "visual">);
}
