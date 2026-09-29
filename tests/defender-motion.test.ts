import { expect, it } from "vitest";
import * as THREE from "three";
import squirrel from "../public/art/v2/squirrel-side-defender-v1/rig.json";
import turtle from "../public/art/v2/turtle-side-defender-v1/rig.json";
import { validateCutoutDefinition } from "../src/render/cutout-validation";
import { CutoutResource } from "../src/render/cutout";
import { DefenderRig } from "../src/render/defender-rig";

function rig(kind: "squirrel" | "turtle", mirrored = false) {
  const resource = Object.create(CutoutResource.prototype) as CutoutResource;
  resource.definition = validateCutoutDefinition(
    kind === "squirrel" ? squirrel : turtle,
  );
  resource.textures = new Map(
    resource.definition.parts.map((part) => [part.id, new THREE.Texture()]),
  );
  return new DefenderRig(resource, 150, mirrored);
}
function snapshot(rig: DefenderRig) {
  return rig.group.children
    .filter((child): child is THREE.Mesh => child instanceof THREE.Mesh)
    .map((child) => ({
      name: child.name,
      visible: child.visible,
      vertices: Array.from(child.geometry.getAttribute("position").array),
    }));
}
it.each(["squirrel", "turtle"] as const)(
  "uses accepted %s body effort with planted feet and repeatable pooled poses",
  (kind) => {
    const actor = rig(kind);
    actor.update(100, 0, 1000, false, 1.35);
    const idle = snapshot(actor);
    actor.update(0.9, 0.45, 1000, true, 1.35);
    const loaded = snapshot(actor);
    const body = loaded.find((mesh) => mesh.name === "defender-body");
    expect(body).toBeDefined();
    const rest = idle.find((mesh) => mesh.name === "defender-body")!;
    expect(body!.vertices).not.toEqual(rest.vertices);
    for (let i = 0; i < body!.vertices.length; i += 3)
      if (rest.vertices[i + 1] < 90)
        expect(body!.vertices.slice(i, i + 3)).toEqual(
          rest.vertices.slice(i, i + 3),
        );
    actor.update(0, 1.35, 1000, true, 1.35);
    actor.update(0.9, 0.45, 1000, true, 1.35);
    expect(snapshot(actor)).toEqual(loaded);
    actor.update(100, 0, 1000, false, 1.35);
    expect(snapshot(actor)).toEqual(idle);
    actor.dispose();
  },
);
it("holds turtle net between solved hands until the actual shot and reloads it afterward", () => {
  const actor = rig("turtle");
  actor.update(1.34, 0.01, 1000, true, 1.35);
  const held = actor.group.getObjectByName("held-net") as THREE.Mesh;
  expect(held).toBeDefined();
  expect(held.visible).toBe(true);
  actor.update(0, 1.35, 1000, true, 1.35);
  expect(held.visible).toBe(false);
  actor.update(0.6, 0.75, 1000, true, 1.35);
  expect(held.visible).toBe(true);
  expect(actor.cutout.parts.get("payload")!.visible).toBe(false);
  actor.dispose();
});
it.each(["squirrel", "turtle"] as const)(
  "mirrors every %s motion mesh and the projectile origin",
  (kind) => {
    const east = rig(kind),
      west = rig(kind, true);
    east.update(0.9, 0.45, 1000, true, 1.35);
    west.update(0.9, 0.45, 1000, true, 1.35);
    const a = snapshot(east),
      b = snapshot(west);
    for (let m = 0; m < a.length; m++) {
      expect(b[m].vertices.length).toBe(a[m].vertices.length);
      for (let i = 0; i < a[m].vertices.length; i++)
        expect(b[m].vertices[i]).toBeCloseTo(
          a[m].vertices[i] * (i % 3 === 0 ? -1 : 1),
          4,
        );
    }
    expect(west.muzzle().x).toBeCloseTo(-east.muzzle().x);
    expect(west.muzzle().y).toBeCloseTo(east.muzzle().y);
    east.dispose();
    west.dispose();
  },
);

it.each(["squirrel", "turtle"] as const)(
  "keeps %s poses fixed during pause and synchronizes upgraded intervals",
  (kind) => {
    const normal = rig(kind),
      upgraded = rig(kind);
    normal.update(0.81, 0.54, 1000, true, 1.35);
    const frozen = snapshot(normal);
    normal.update(0.81, 0.54, 1000, true, 1.35);
    expect(snapshot(normal)).toEqual(frozen);
    upgraded.update(0.81 * 0.8, 0.54 * 0.8, 1000, true, 1.35 * 0.8);
    expect(snapshot(upgraded)).toEqual(frozen);
    normal.update(0, 1.35, 1000, false, 1.35);
    upgraded.update(0, 1.35 * 0.8, 1000, false, 1.35 * 0.8);
    expect(snapshot(upgraded)).toEqual(snapshot(normal));
    normal.dispose();
    upgraded.dispose();
  },
);

it("hands the same folded net geometry to the projectile in either facing", async () => {
  const { updateCastNet } = await import("../src/render/cast-net");
  for (const mirrored of [false, true]) {
    const actor = rig("turtle", mirrored);
    actor.update(0, 1.35, 1000, true, 1.35);
    const held = actor.group.getObjectByName("held-net") as THREE.Mesh;
    const launch = actor.netLaunch()!;
    const projectile = new THREE.BufferGeometry();
    updateCastNet(
      projectile,
      launch.hands[0],
      launch.hands[1],
      0,
      launch.size,
      mirrored,
    );
    const a = held.geometry.getAttribute("position"),
      b = projectile.getAttribute("position");
    expect(a.count).toBe(b.count);
    for (let i = 0; i < a.count; i++) {
      expect(b.getX(i)).toBeCloseTo(a.getX(i) * launch.size, 4);
      expect(b.getY(i)).toBeCloseTo(a.getY(i) * launch.size, 4);
    }
    const attribute = projectile.getAttribute("position");
    updateCastNet(
      projectile,
      launch.hands[0],
      launch.hands[1],
      1,
      launch.size,
      mirrored,
    );
    expect(projectile.getAttribute("position")).toBe(attribute);
    projectile.computeBoundingBox();
    expect(
      projectile.boundingBox!.max.x - projectile.boundingBox!.min.x,
    ).toBeGreaterThan(80);
    actor.dispose();
    projectile.dispose();
  }
});
