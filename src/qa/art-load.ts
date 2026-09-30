import { Battlefield } from "../render/battlefield";
import { LEVELS } from "../content/levels";
import { Game } from "../sim/game";
import { pathLength, pointOnPath } from "../sim/path";
import type { EnemyKind, TowerKind } from "../sim/types";

declare global {
  interface Window {
    __stormwatchArtLoad?: {
      level: string;
      artReadyMs: number;
      firstRenderedMs: number;
      missingArt: number;
      error?: string;
    };
  }
}

const root = document.querySelector<HTMLDivElement>("#qa")!;
root.innerHTML = '<div id="field" style="width:960px;height:540px"></div>';
const levelId = new URLSearchParams(location.search).get("level");
const level = LEVELS.find((candidate) => candidate.id === levelId) ?? LEVELS[0];
const start = performance.now();
const field = new Battlefield(document.querySelector<HTMLElement>("#field")!);
field.load(level);
const game = new Game(level);
const defenders =
  level.availableTowers ?? (["bolt", "stone", "net"] as TowerKind[]);
const enemies = [
  ...new Set(
    level.waves.flatMap((wave) => wave.groups.map((group) => group.kind)),
  ),
] as EnemyKind[];
let actorId = 1;
for (const kind of defenders) {
  let placed = false;
  for (let z = 0; z < level.depth && !placed; z++)
    for (let x = 0; x < level.width && !placed; x++)
      if (game.canPlace({ x, z })) {
        game.state.towers.push({
          id: actorId++,
          kind,
          x,
          z,
          level: 1,
          spent: game.towers[kind].cost,
          cooldown: 0,
          shots: 0,
        });
        placed = true;
      }
  if (!placed) throw new Error(`No benchmark placement for ${kind}`);
}
const pathDistance = pathLength(level.path);
for (const [index, kind] of enemies.entries()) {
  const distance = Math.min(pathDistance - 0.1, 0.25 + index * 0.6);
  const point = pointOnPath(level.path, distance);
  const hp = game.enemies[kind].hp;
  game.state.enemies.push({
    id: actorId++,
    kind,
    ...point,
    hp,
    maxHp: hp,
    distance,
    slowUntil: 0,
    alive: true,
    hitAt: -100,
    spawnedAt: 0,
    shieldRaised: false,
  });
}
field.profileTiming = true;

try {
  await field.artReady(level);
  const artReadyMs = performance.now() - start;
  field.update(game, null, 0);
  const expectedRigs = defenders.length + enemies.length;
  if (field.frameProfile.createdRigs < expectedRigs)
    throw new Error(
      `Rendered ${field.frameProfile.createdRigs}/${expectedRigs} actor rigs`,
    );
  if (
    field.frameProfile.drawCalls === 0 ||
    field.renderer.info.memory.textures === 0
  )
    throw new Error("Battle frame has no draw calls or uploaded textures");
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  field.update(game, null, 0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  window.__stormwatchArtLoad = {
    level: level.id,
    artReadyMs,
    firstRenderedMs: performance.now() - start,
    missingArt: 0,
  };
} catch (error) {
  window.__stormwatchArtLoad = {
    level: level.id,
    artReadyMs: 0,
    firstRenderedMs: 0,
    missingArt: 1,
    error: String(error),
  };
}
