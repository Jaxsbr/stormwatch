import { readFileSync, writeFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { CutoutResource, type CutoutDefinition } from "../../src/render/cutout";
import { DefenderRig } from "../../src/render/defender-rig";
import { DefenderArm } from "../../src/render/defender-arm";
import { solveTwoBone } from "../../src/render/ik";
function fixture(animal: string, view: string) {
  const definition: CutoutDefinition = JSON.parse(
    readFileSync(
      `public/art/v2/${animal}-${view}-defender-v1/rig.json`,
      "utf8",
    ),
  );
  const resource: CutoutResource = Object.assign(
    Object.create(CutoutResource.prototype),
    {
      definition,
      textures: new Map(
        definition.parts.map((p) => [p.id, new THREE.Texture()]),
      ),
    },
  );
  return { resource, rig: new DefenderRig(resource, 98) };
}
describe("annotated screenshot reproduction (expected red until rigs are corrected)", () => {
  it("north squirrel weapon should be occluded by the back", () => {
    const { rig } = fixture("squirrel", "rear");
    rig.update(5 / 30, 1 - 5 / 30);
    expect(rig.cutout.parts.get("bow")!.renderOrder).toBeLessThan(
      rig.cutout.parts.get("body")!.renderOrder,
    );
    rig.dispose();
  });
  it("north turtle net should not composite on top of the shell", () => {
    const { rig } = fixture("turtle", "rear");
    rig.update(11 / 30, 1.35 - 11 / 30);
    expect(rig.cutout.parts.get("payload")!.renderOrder).toBeLessThan(
      rig.cutout.parts.get("body")!.renderOrder,
    );
    rig.dispose();
  });
  it("front squirrel bow should retain an upright bow plane", () => {
    const { rig } = fixture("squirrel", "front");
    rig.update(5 / 30, 1 - 5 / 30);
    expect(
      Math.abs(rig.cutout.parts.get("bow")!.material.rotation),
    ).toBeLessThan(Math.PI / 4);
    rig.dispose();
  });
  it("the arm solver preserves every authored rest pose rather than flipping all elbows", () => {
    for (const animal of ["squirrel", "turtle", "skunk"])
      for (const view of ["side", "front", "rear"]) {
        const { resource, rig } = fixture(animal, view);
        for (const part of resource.definition!.parts.filter((p) =>
          p.id.endsWith("Arm"),
        )) {
          const arm = new DefenderArm(part, resource);
          const positions = arm.mesh.geometry.getAttribute("position");
          const before = Array.from(positions.array);
          const grip = new THREE.Vector3(
            (part.joints!.grip[0] - part.pivot[0]) * part.scale,
            (part.pivot[1] - part.joints!.grip[1]) * part.scale,
            0,
          );
          arm.reach(new THREE.Vector3(), grip, 1000);
          expect(
            Math.max(...before.map((v, i) => Math.abs(v - positions.array[i]))),
          ).toBeLessThan(0.001);
          arm.dispose();
        }
        rig.dispose();
      }
  });
  it("reports the actual arm reach demanded by release poses", () => {
    const original = DefenderArm.prototype.reach;
    const rows: object[] = [];
    let context = "";
    DefenderArm.prototype.reach = function (shoulder, target, order) {
      const p = this.part;
      const elbow = {
        x: (p.joints!.elbow[0] - p.pivot[0]) * p.scale,
        y: (p.pivot[1] - p.joints!.elbow[1]) * p.scale,
      };
      const grip = {
        x: (p.joints!.grip[0] - p.pivot[0]) * p.scale,
        y: (p.pivot[1] - p.joints!.grip[1]) * p.scale,
      };
      const upper = Math.hypot(elbow.x, elbow.y),
        lower = Math.hypot(grip.x - elbow.x, grip.y - elbow.y);
      const result = original.call(this, shoulder, target, order);
      const joint = solveTwoBone(
        shoulder,
        target,
        upper,
        lower,
        grip.x * elbow.y - grip.y * elbow.x >= 0 ? 1 : -1,
      ).knee;
      rows.push({
        context,
        part: p.id,
        reachRatio: +(shoulder.distanceTo(target) / (upper + lower)).toFixed(2),
        elbowYFromShoulder: +(joint.y - shoulder.y).toFixed(1),
        handError: +result.distanceTo(target).toFixed(1),
      });
      return result;
    };
    try {
      for (const animal of ["squirrel", "turtle", "skunk"])
        for (const view of ["side", "front", "rear"]) {
          const age = animal === "squirrel" ? 5 / 30 : 0;
          context = `${animal}/${view}/F${animal === "squirrel" ? 5 : 0}`;
          const { rig } = fixture(animal, view);
          rig.update(
            age,
            (animal === "turtle" ? 1.35 : animal === "squirrel" ? 1 : 2) - age,
          );
          rig.dispose();
        }
    } finally {
      DefenderArm.prototype.reach = original;
    }
    writeFileSync(
      ".scratch/tower-animation-review/diagnosis-probe.json",
      JSON.stringify(rows, null, 2),
    );
  });
});
