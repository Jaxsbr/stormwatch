import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";
import { BattleArt } from "../src/render/battle-art";
import { CutoutResource } from "../src/render/cutout";
import { validateCutoutDefinition } from "../src/render/cutout-validation";
import { DefenderRig } from "../src/render/defender-rig";
import squirrel from "../public/art/v2/squirrel-side-defender-v1/rig.json";
import turtle from "../public/art/v2/turtle-side-defender-v1/rig.json";
import candidate from "../review/mosswater-encounters/game-content.json";
import { play, createAttempt } from "../review/mosswater-encounters/strategies";
import { progressionContext } from "../src/content/progression";
import { freshSave, recordVictoryOutcome } from "../src/persistence/save";
import { type AuthoringContent } from "../src/config/configuration";
import skunk from "../public/art/v2/skunk-side-defender-v1/rig.json";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../src/config/configuration";
import { Game } from "../src/sim/game";
import { pointOnPath } from "../src/sim/path";
import { routeFor } from "../src/sim/routes";

// Exercise actual Game, Battlefield, rigs and projectile meshes; replace browser I/O only.
vi.mock("three", async (original) => {
  const actual = await original<typeof THREE>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = { setAttribute() {}, addEventListener() {}, remove() {} };
      setSize() {}
      setPixelRatio() {}
      render() {}
      dispose() {}
      forceContextLoss() {}
    },
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const DT = 1 / 30;
function renderer() {
  const context = new Proxy({}, { get: () => () => {} });
  vi.stubGlobal("document", {
    createElement: () => ({ getContext: () => context }),
  });
  vi.stubGlobal("devicePixelRatio", 1);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal(
    "Path2D",
    class {
      moveTo() {}
      lineTo() {}
      quadraticCurveTo() {}
    },
  );
  vi.stubGlobal(
    "Image",
    class {
      addEventListener() {}
      set src(_path: string) {}
    },
  );
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation(
    () => new THREE.Texture(),
  );
  const resources = { bolt: squirrel, stone: skunk, net: turtle };
  const loaded = Object.fromEntries(
    Object.entries(resources).map(([kind, rig]) => [
      kind,
      Object.assign(Object.create(CutoutResource.prototype), {
        definition: validateCutoutDefinition(rig),
        textures: new Map(rig.parts.map((p) => [p.id, new THREE.Texture()])),
      }),
    ]),
  );
  vi.spyOn(BattleArt.prototype, "defender").mockImplementation(
    (kind) => loaded[kind],
  );
  vi.spyOn(BattleArt.prototype, "enemy").mockReturnValue({
    definition: null,
  } as CutoutResource);
  const field = new Battlefield({
    append() {},
    getBoundingClientRect: () => ({ width: 1280, height: 720 }),
  } as unknown as HTMLElement);
  const updates = vi.spyOn(DefenderRig.prototype, "update");
  const actor = (index = updates.mock.instances.length - 1) => {
    const instance = updates.mock.instances[index];
    if (!(instance instanceof DefenderRig))
      throw new Error("No rendered defender");
    return instance;
  };
  return { field, updates, actor };
}
function fixture() {
  const { field, actor } = renderer();
  const content = structuredClone(CANONICAL_CONTENT);
  const map = content.levels[0];
  map.routeLayoutId = "twin-switchbacks";
  map.path = [];
  map.blocked = [];
  map.width = 12;
  map.depth = 8;
  map.availableTowers = ["stone"];
  map.startCoins = 1000;
  map.waves = [
    {
      id: "facing",
      title: "Facing",
      reward: 0,
      abilities: { ratShield: false, weaselEvade: false },
      packets: [
        {
          id: "both",
          groups: [
            { id: "a", kind: "raider", count: 1, gap: 0.1, routeId: "route-a" },
            {
              id: "b",
              kind: "raider",
              count: 1,
              gap: 0.1,
              routeId: "route-b",
              startTogether: true,
            },
          ],
        },
      ],
    },
  ];
  content.towers.stone.range = 100;
  content.enemies.raider.hp = 1000;
  const config = resolveConfiguration(content);
  const game = new Game(config.level, "none", false, 42, {
    configuration: config,
  });
  field.load(game.level);
  expect(game.place("stone", { x: 3, z: 2 })).toBe(true);
  const tower = game.state.towers[0];
  const render = () => field.update(game, null, DT);
  render(); // idle right-facing rig exists before first actual shot
  game.startWave();
  tower.cooldown = 10;
  while (game.state.enemies.length < 2) game.tick(DT);
  const [a, b] = game.state.enemies;
  a.distance = 9;
  b.distance = 8;
  for (const e of [a, b])
    Object.assign(
      e,
      pointOnPath(routeFor(game.level, e.routeId).path, e.distance),
    );
  return { game, field, tower, a, b, render, actor };
}
it("prepares toward the actual cross-route threat rather than the largest distance", () => {
  const { game, field, a, b, render, actor, tower } = fixture();
  a.slowUntil = game.state.clock + 10;
  render();
  expect(a.x).toBeLessThan(tower.x);
  expect(b.x).toBeGreaterThan(tower.x);
  expect(a.distance).toBeGreaterThan(b.distance);
  expect(actor().mirrored).toBe(false);
  tower.cooldown = 0;
  game.tick(DT);
  expect(game.state.shots[0].targetId).toBe(b.id);
  field.dispose();
});
it("faces the first actual left shot before locking an idle right-facing rig", () => {
  const { game, field, tower, a, b, render, actor } = fixture();
  b.slowUntil = game.state.clock + 10;
  tower.cooldown = 0;
  game.tick(DT);
  expect(game.state.shots[0].targetId).toBe(a.id);
  render();
  expect(actor().mirrored).toBe(true);
  const shot = game.state.shots[0];
  const mesh = field.scene.children.find(
    (o) =>
      o instanceof THREE.Mesh &&
      o.material instanceof THREE.MeshBasicMaterial &&
      o.material.map === actor().bombLaunch()!.texture &&
      o !== actor().group.getObjectByName("held-flask"),
  ) as THREE.Mesh;
  expect(mesh.scale.x).toBeLessThan(0);
  const launch = actor().bombLaunch()!;
  expect(mesh.userData.origin.toArray()).toEqual(launch.origin.toArray());
  game.pause();
  render();
  expect(actor().mirrored).toBe(true);
  expect(mesh.userData.origin.toArray()).toEqual(launch.origin.toArray());
  expect(game.state.shots[0]).toBe(shot);
  game.pause();
  expect(game.sell(tower.id)).toBe(true);
  game.tick(DT);
  render();
  expect(mesh.parent).toBe(field.scene);
  expect(mesh.userData.origin.toArray()).toEqual(launch.origin.toArray());
  expect(mesh.scale.x).toBeCloseTo(-launch.width);
  field.dispose();
});

it("uses the live shot on a late first release render even after preparation's priority changes", () => {
  const { game, field, tower, a, b, render, actor } = fixture();
  b.slowUntil = game.state.clock + 10;
  tower.cooldown = 0;
  game.tick(DT);
  const shot = game.state.shots[0];
  expect(shot.targetId).toBe(a.id);
  a.slowUntil = game.state.clock + 10;
  b.slowUntil = 0;
  game.tick(DT * 2);
  expect(game.targetFor(tower)?.id).toBe(b.id);
  render();
  expect(actor().mirrored).toBe(true);
  const launch = actor().bombLaunch()!;
  game.tick(DT);
  render();
  expect(actor().mirrored).toBe(true);
  expect(actor().bombLaunch()!.origin.toArray()).toEqual(
    launch.origin.toArray(),
  );
  field.dispose();
});
it("queries the firing priority without changing actor order, clocks or behavior state", () => {
  const { game, field, tower, a, b } = fixture();
  a.slowUntil = game.state.clock + 10;
  const before = structuredClone(game.state);
  expect(game.targetFor(tower)?.id).toBe(b.id);
  expect(game.state).toEqual(before);
  field.dispose();
});

it("replays every legal Mosswater Skunk release toward its actual shot target", () => {
  const content = candidate as AuthoringContent;
  const context = progressionContext(content);
  let save = freshSave(context);
  const { field, updates, actor } = renderer();
  let releases = 0;
  const wrong: { level: string; clock: number; shot: number }[] = [];
  for (const id of context.levelIds) {
    const report = play(content, id, save);
    expect(report.phase).toBe("won");
    if (id.startsWith("mosswater-")) {
      const game = createAttempt(content, id, save);
      field.load(game.level);
      const seen = new Set<number>();
      let commandIndex = 0;
      for (
        let tick = 0;
        tick < 36000 && !["won", "lost"].includes(game.state.phase);
        tick++
      ) {
        while (
          commandIndex < report.trace.length &&
          report.trace[commandIndex].tick === tick
        ) {
          const c = report.trace[commandIndex++].command;
          expect(
            c.type === "place"
              ? game.place(c.kind, c.point)
              : c.type === "upgrade"
                ? game.upgrade(c.id)
                : c.type === "start"
                  ? game.startWave()
                  : false,
          ).toBe(true);
        }
        game.tick(DT);
        updates.mockClear();
        field.update(game, null, DT);
        for (const p of game.state.shots) {
          if (p.kind !== "stone" || seen.has(p.id)) continue;
          seen.add(p.id);
          releases++;
          const towerIndex = game.state.towers.findIndex(
            (t) => t.x === p.source.x && t.z === p.source.z,
          );
          const dx = p.target.x - p.source.x;
          if (Math.abs(dx) > 2 / 96 && actor(towerIndex).mirrored !== dx < 0)
            wrong.push({ level: id, clock: game.state.clock, shot: p.id });
        }
        game.drainEvents();
      }
      expect(game.state.phase).toBe("won");
    }
    save = recordVictoryOutcome(save, id, 1, context).save;
  }
  expect(releases).toBeGreaterThan(400);
  expect({ releases, opposite: wrong.length, first: wrong[0] }).toEqual({
    releases,
    opposite: 0,
    first: undefined,
  });
  field.dispose();
}, 60000);
