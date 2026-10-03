import { expect, it } from "vitest";
import * as THREE from "three";
import skunk from "../public/art/v2/skunk-side-defender-v1/rig.json";
import { validateCutoutDefinition } from "../src/render/cutout-validation";
import { CutoutResource } from "../src/render/cutout";
import { DefenderRig } from "../src/render/defender-rig";
import { PoisonEffects } from "../src/render/poison-effects";
import { Game } from "../src/sim/game";
import {
  CANONICAL_CONTENT,
  normalizeAbilities,
  resolveConfiguration,
} from "../src/config/configuration";
function rig(mirrored = false) {
  const r = Object.create(CutoutResource.prototype) as CutoutResource;
  r.definition = validateCutoutDefinition(skunk);
  r.textures = new Map(
    r.definition.parts.map((p) => [p.id, new THREE.Texture()]),
  );
  return new DefenderRig(r, 98, mirrored);
}
function vertices(actor: DefenderRig) {
  return Array.from(
    (actor.group.getObjectByName("defender-body") as THREE.Mesh).geometry
      .attributes.position.array,
  );
}
it("hands off the same neon plane at an exact mirrored release, including a late render and first shot", () => {
  const east = rig(),
    west = rig(true);
  for (const a of [east, west]) {
    a.update(100, 0, 1000, false, 2);
    expect(a.group.getObjectByName("held-flask")!.visible).toBe(true);
    a.update(1.99, 0.01, 1000, true, 2);
    expect(a.group.getObjectByName("held-flask")!.visible).toBe(true);
    a.update(0, 2, 1000, true, 2);
    expect(a.group.getObjectByName("held-flask")!.visible).toBe(false);
    const launch = a.bombLaunch()!,
      held = a.group.getObjectByName("held-flask") as THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.MeshBasicMaterial
      >;
    expect(
      launch.origin.distanceTo(a.group.localToWorld(held.position.clone())),
    ).toBeCloseTo(0, 6);
    expect(launch.texture).toBe(held.material.map);
    expect(launch.width).toBeCloseTo(
      held.geometry.parameters.width * a.group.scale.x,
    );
    a.update(0.12, 1.88, 1000, true, 2);
    expect(a.bombLaunch()!.origin.toArray()).toEqual(launch.origin.toArray());
  }
  expect(west.bombLaunch()!.origin.x).toBeCloseTo(-east.bombLaunch()!.origin.x);
  expect(west.bombLaunch()!.origin.y).toBeCloseTo(east.bombLaunch()!.origin.y);
  east.dispose();
  west.dispose();
});
it("freezes Skunk during pause, keeps feet planted, preserves cadence and resets pooled idle", () => {
  const a = rig(),
    b = rig();
  a.update(100, 0, 1000, false, 2);
  const idle = vertices(a);
  a.update(1.64, 0.36, 1000, true, 2);
  const load = vertices(a);
  expect(load).not.toEqual(idle);
  for (let i = 0; i < load.length; i += 3)
    if (idle[i + 1] < 90)
      expect(load.slice(i, i + 3)).toEqual(idle.slice(i, i + 3));
  a.update(1.64, 0.36, 1000, true, 2);
  expect(vertices(a)).toEqual(load);
  b.update(1.64 * 0.8, 0.36 * 0.8, 1000, true, 1.6);
  expect(vertices(b)).toEqual(load);
  a.update(100, 0, 1000, false, 2);
  expect(vertices(a)).toEqual(idle);
  a.update(1.64, 0.36, 1000, true, 2, true);
  expect(vertices(a)).toEqual(idle);
  a.dispose();
  b.dispose();
});
function game() {
  const content = normalizeAbilities(structuredClone(CANONICAL_CONTENT));
  const level = content.levels[0];
  level.width = 30;
  level.path = [
    { x: -1, z: 3 },
    { x: 29, z: 3 },
  ];
  level.blocked = [];
  level.availableTowers = ["stone"];
  level.startCoins = 1000;
  level.requiresBossDefeat = false;
  level.waves = [
    {
      id: "visual-test",
      title: "Visual",
      reward: 0,
      abilities: { ratShield: true, weaselEvade: true },
      packets: [
        {
          id: "mixed",
          groups: (["raider", "runner", "armored"] as const).map((kind) => ({
            id: kind,
            kind,
            count: 1,
            gap: 1 / 30,
          })),
        },
      ],
    },
  ];
  content.abilityDefaults!.weaselEvade = { downSeconds: 1 / 30, upSeconds: 30 };
  for (const e of Object.values(content.enemies)) {
    e.hp = 500;
    e.speed = 0.05;
  }
  const config = resolveConfiguration(content, level.id);
  return new Game(config.level, "none", false, 42, { configuration: config });
}
it("renders real Game poison only, follows its enemy, freezes with pause and clears after expiry/replay", () => {
  const g = game();
  expect(g.place("stone", { x: 0, z: 2 })).toBe(true);
  g.startWave();
  for (let i = 0; i < 60; i++) g.tick(1 / 30);
  expect(
    g.state.enemies.find((e) => e.kind === "raider")?.poison,
  ).toBeDefined();
  expect(
    g.state.enemies.find((e) => e.kind === "runner")?.poison,
  ).toBeUndefined();
  expect(
    g.state.enemies.find((e) => e.kind === "armored")?.poison,
  ).toBeUndefined();
  const fx = new PoisonEffects(),
    project = (p: { x: number; z: number }) => ({ x: p.x * 40, y: p.z * 20 });
  const update = () =>
    fx.update(g.state.enemies, g.state.effects, g.state.clock, project);
  update();
  expect(fx.mesh.geometry.drawRange.count).toBe(36);
  const geo = fx.mesh.geometry;
  const snapshot = () => Array.from(geo.attributes.position.array);
  const before = snapshot();
  g.pause();
  g.advance(2);
  update();
  expect(snapshot()).toEqual(before);
  g.pause();
  g.tick(1 / 30);
  update();
  expect(snapshot()).not.toEqual(before);
  expect(fx.mesh.geometry).toBe(geo);
  for (const t of [...g.state.towers]) g.sell(t.id);
  for (let i = 0; i < 200; i++) g.tick(1 / 30);
  update();
  expect(fx.mesh.visible).toBe(false);
  const fresh = game();
  fx.update(fresh.state.enemies, fresh.state.effects, 0, project);
  expect(fx.mesh.geometry.drawRange.count).toBe(0);
  fx.dispose();
});
it("draws a transient soft burst from the real splash lifetime, with reusable buffers", () => {
  const fx = new PoisonEffects(),
    project = () => ({ x: 10, y: 20 });
  fx.update(
    [],
    [{ id: 1, x: 0, z: 0, kind: "splash", age: 0.1, ttl: 0.45 }],
    1,
    project,
  );
  expect(fx.mesh.geometry.drawRange.count).toBe(48);
  const geo = fx.mesh.geometry;
  fx.update(
    [],
    [{ id: 1, x: 0, z: 0, kind: "splash", age: 0.2, ttl: 0.45 }],
    1,
    project,
    true,
  );
  expect(fx.mesh.geometry).toBe(geo);
  fx.update(
    [],
    [{ id: 1, x: 0, z: 0, kind: "splash", age: 0.45, ttl: 0.45 }],
    1,
    project,
  );
  expect(fx.mesh.visible).toBe(false);
  fx.dispose();
});
