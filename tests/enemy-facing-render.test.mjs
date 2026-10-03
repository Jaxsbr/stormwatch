import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";
import { BattleArt } from "../src/render/battle-art";
import { CutoutResource } from "../src/render/cutout";
import { validateCutoutDefinition } from "../src/render/cutout-validation";
import { CharacterRig } from "../src/render/character-rig";
import { LegDeformation } from "../src/render/leg-deformation";
import { enemyVisuals } from "../src/content/encounter-visuals";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../src/config/configuration";
import { Game } from "../src/sim/game";
import { pointOnPath } from "../src/sim/path";
import { routeFor } from "../src/sim/routes";
// Exercise actual Game movement, Battlefield, sprite parts and limb meshes; replace browser I/O only.
vi.mock("three", async (original) => {
  const actual = await original();
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
function renderer(reducedMotion = false) {
  const context = new Proxy({}, { get: () => () => {} });
  vi.stubGlobal("document", {
    createElement: () => ({ getContext: () => context }),
  });
  vi.stubGlobal("devicePixelRatio", 1);
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion }));
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
      set src(_path) {}
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
  const loaded = new Map();
  for (const { views } of Object.values(enemyVisuals))
    for (const id of views) {
      const rig = validateCutoutDefinition(
        JSON.parse(
          readFileSync(
            new URL(`../public/art/v2/${id}/rig.json`, import.meta.url),
            "utf8",
          ),
        ),
      );
      loaded.set(
        id,
        Object.assign(Object.create(CutoutResource.prototype), {
          definition: rig,
          textures: new Map(rig.parts.map((p) => [p.id, new THREE.Texture()])),
        }),
      );
    }
  vi.spyOn(BattleArt.prototype, "enemy").mockImplementation((kind, view) => {
    const index = view === "side" ? 0 : view === "front" ? 1 : 2;
    return loaded.get(enemyVisuals[kind].views[index]);
  });
  const field = new Battlefield({
    append() {},
    getBoundingClientRect: () => ({ width: 1280, height: 720 }),
  });
  const updates = vi.spyOn(CharacterRig.prototype, "update");
  const actor = () => {
    const instance = updates.mock.instances.at(-1);
    if (!(instance instanceof CharacterRig))
      throw new Error("No rendered enemy");
    return instance;
  };
  return { field, updates, actor };
}
function fixture(kind, reducedMotion = false) {
  const rendered = renderer(reducedMotion);
  const content = structuredClone(CANONICAL_CONTENT);
  const map = content.levels[0];
  map.routeLayoutId = "twin-switchbacks";
  map.path = [];
  map.blocked = [];
  map.width = 12;
  map.depth = 8;
  map.waves = [
    {
      id: "facing",
      title: "Facing",
      reward: 0,
      abilities: { ratShield: false, weaselEvade: false },
      packets: [
        {
          id: "one",
          groups: [{ id: "a", kind, count: 1, gap: 0.1, routeId: "route-a" }],
        },
      ],
    },
  ];
  const config = resolveConfiguration(content);
  const game = new Game(config.level, "none", false, 42, {
    configuration: config,
  });
  rendered.field.load(game.level);
  game.startWave();
  return { ...rendered, game, config };
}
it.each(["raider", "runner", "armored", "boss"])(
  "%s faces left on a real crossing return segment",
  (kind) => {
    const { game, field, actor } = fixture(kind);
    let checked = false;
    for (let i = 0; i < 3000 && !checked; i++) {
      game.tick(DT);
      field.update(game, null, DT);
      const enemy = game.state.enemies[0];
      if (!enemy) continue;
      const next = pointOnPath(
        routeFor(game.level, enemy.routeId).path,
        enemy.distance + 0.02,
      );
      if (next.x < enemy.x && next.z === enemy.z) {
        checked = true;
        expect(actor().cutout.resource.definition.id).toBe(
          enemyVisuals[kind].views[0],
        );
        expect(actor().cutout.parts.get("body").material.map.repeat.x).toBe(-1);
      }
    }
    expect(checked).toBe(true);
    field.dispose();
  },
);

function advanceTo(game, predicate) {
  for (let i = 0; i < 3000; i++) {
    game.tick(DT);
    if (game.state.enemies[0] && predicate(game.state.enemies[0].distance))
      return;
  }
  throw new Error("Enemy did not reach the requested route segment");
}
it.each(["raider", "runner", "armored", "boss"])(
  "%s follows side/front/rear turns and returns to forward travel",
  (kind) => {
    const { game, field, actor } = fixture(kind);
    const views = new Set();
    for (let i = 0; i < 3000; i++) {
      game.tick(DT);
      field.update(game, null, DT);
      const e = game.state.enemies[0];
      if (!e) continue;
      const next = pointOnPath(
        routeFor(game.level, e.routeId).path,
        e.distance + 0.02,
      );
      const vertical = Math.abs(next.z - e.z) > Math.abs(next.x - e.x);
      const view = vertical ? (next.z > e.z ? 1 : 2) : 0;
      const left = !vertical && next.x < e.x;
      const rig = actor();
      expect(rig.cutout.resource.definition.id).toBe(
        enemyVisuals[kind].views[view],
      );
      expect(rig.mirrored).toBe(left);
      for (const sprite of rig.cutout.parts.values()) {
        expect(sprite.material.map.repeat.x).toBe(left ? -1 : 1);
        expect(sprite.material.map.offset.x).toBe(left ? 1 : 0);
        const part = rig.cutout.resource.definition.parts.find(
          (p) => rig.cutout.parts.get(p.id) === sprite,
        );
        const pivot = part.pivot[0] / part.rect[2];
        expect(sprite.center.x).toBeCloseTo(left ? 1 - pivot : pivot, 10);
      }
      views.add(
        vertical
          ? String(view)
          : left
            ? "left"
            : e.distance > 19
              ? "forward-again"
              : "right",
      );
      if (views.has("forward-again")) break;
    }
    expect([...views].sort()).toEqual([
      "1",
      "2",
      "forward-again",
      "left",
      "right",
    ]);
    field.dispose();
  },
);
it.each([false, true])(
  "late first rendering, pause and reflected pool reuse hold with reduced motion %s",
  (reducedMotion) => {
    const { game, field, actor, config } = fixture("raider", reducedMotion);
    advanceTo(game, (distance) => distance > 16.4);
    const stateBeforeRender = structuredClone(game.state);
    field.update(game, null, DT);
    expect(game.state).toEqual(stateBeforeRender);
    const left = actor();
    expect(left.mirrored).toBe(true); // no prior frame displacement is needed
    const body = left.cutout.parts.get("body");
    const pose = () => [
      left.group.scale.toArray(),
      body.center.toArray(),
      body.position.toArray(),
      body.material.rotation,
    ];
    const before = pose();
    game.pause();
    game.tick(DT * 10);
    field.update(game, null, DT);
    expect(actor()).toBe(left);
    expect(pose()).toEqual(before);
    for (const sprite of left.cutout.parts.values()) {
      expect([...left.cutout.resource.textures.values()]).not.toContain(
        sprite.material.map,
      );
      expect(sprite.material.map.repeat.x).toBe(-1);
    }
    for (const texture of left.cutout.resource.textures.values())
      expect(texture.repeat.x).toBe(1);
    const second = new Game(game.level, "none", false, 42, {
      configuration: config,
    });
    field.load(second.level);
    second.startWave();
    advanceTo(second, (distance) => distance > 0.1);
    field.update(second, null, DT);
    const right = actor();
    expect(right.mirrored).toBe(false);
    expect(right.cutout.parts.get("body").material.map.repeat.x).toBe(1);
    advanceTo(second, (distance) => distance > 16.4);
    field.update(second, null, DT);
    expect(actor()).toBe(left); // same reflected resource is reused, with a fresh pose
    expect(left.cutout.parts.get("body").material.map.repeat.x).toBe(-1);
    const dispose = vi.spyOn(
      left.cutout.parts.get("body").material.map,
      "dispose",
    );
    field.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  },
);
it("keeps reflected Rat boot contact within the native IK reach tolerance during leftward stance", () => {
  const { game, field, actor } = fixture("raider");
  const legs = vi.spyOn(LegDeformation.prototype, "setSide");
  const feet = [];
  for (let i = 0; i < 3000; i++) {
    game.tick(DT);
    legs.mockClear();
    field.update(game, null, DT);
    const e = game.state.enemies[0];
    if (!e || e.distance < 16.3) continue;
    if (e.distance > 16.55) break;
    const rig = actor();
    expect(rig.mirrored).toBe(true);
    const leg = rig.cutout.resource.definition.parts.find(
      (p) => p.id === "nearLeg",
    );
    const hip = leg.joints.hip ?? leg.pivot,
      sole = leg.joints.sole;
    const local = new THREE.Vector3(
      (sole[0] - hip[0]) * leg.scale,
      (hip[1] - sole[1]) * leg.scale,
      1,
    ).applyMatrix3(legs.mock.instances[0].lower.value);
    rig.group.updateMatrixWorld(true);
    feet.push(
      new THREE.Vector3(local.x, local.y, 0).applyMatrix4(
        rig.group.matrixWorld,
      ),
    );
  }
  expect(feet.length).toBeGreaterThan(5);
  for (const foot of feet) {
    // Native fixed-length IK clamps a few source pixels at full extension;
    // reflection must not reverse the world stride (tens of stage pixels).
    expect(Math.abs(foot.x - feet[0].x)).toBeLessThan(1);
    expect(Math.abs(foot.y - feet[0].y)).toBeLessThan(1);
  }
  field.dispose();
});
