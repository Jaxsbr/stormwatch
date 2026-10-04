import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CharacterRig } from "../src/render/character-rig";
import { CutoutResource } from "../src/render/cutout";
import { validateCutoutDefinition } from "../src/render/cutout-validation";

const read = (id) =>
  JSON.parse(readFileSync(`public/art/v2/${id}/rig.json`, "utf8"));
afterEach(() => vi.restoreAllMocks());
async function createRig(id = "boar-side-resistance-v1") {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(read(id))),
  );
  vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockImplementation(
    async () => new THREE.Texture(),
  );
  const resource = new CutoutResource(id);
  await resource.ready;
  return { resource, rig: new CharacterRig(resource) };
}
const path = (d) => ({ x: d * 64, y: 0 });

it("keeps the original neutral, leg sources and geometry while registering the approved brace", () => {
  const original = read("boar-rig-v1"),
    candidate = read("boar-side-resistance-v1");
  expect(() =>
    validateCutoutDefinition(candidate, { namespace: "v2" }),
  ).not.toThrow();
  expect(candidate.parts.filter((p) => p.id.endsWith("Leg"))).toEqual(
    original.parts.filter((p) => p.id.endsWith("Leg")),
  );
  const { attachments, ...body } = candidate.parts[0];
  const { attachments: originalAttachments, ...originalBody } =
    original.parts[0];
  expect(body).toEqual(originalBody);
  expect(attachments.nearHip).toEqual(originalAttachments.nearHip);
  expect(attachments.farHip).toEqual(originalAttachments.farHip);
  const brace = candidate.parts.find((p) => p.id === "bodyResist");
  expect(
    createHash("sha256")
      .update(readFileSync(`public/${brace.texture}`))
      .digest("hex"),
  ).toBe(brace.sha256);
  expect(brace.pivot).toEqual([699, 919]);
  expect(brace.scale).toBe(0.602);
});

it("changes only torso visibility for 600 ms, resets on reuse, and keeps simultaneous hit/slow presentation", async () => {
  const { resource, rig } = await createRig();
  const body = rig.cutout.parts.get("body"),
    brace = rig.cutout.parts.get("bodyResist");
  const children = [...rig.group.children];
  const update = (age = Infinity, reduced = false) =>
    rig.update(1.2, path, 17, 0xb9dfd1, 0.08, false, 0, reduced, age);
  update();
  expect(body.visible).toBe(true);
  expect(brace.visible).toBe(false);
  const legs = rig.group.children.filter((o) => o instanceof THREE.Mesh);
  const materials = legs.map((o) => o.material);
  update(0);
  expect(body.visible).toBe(false);
  expect(brace.visible).toBe(true);
  expect(brace.position).toEqual(body.position);
  expect(brace.material.rotation).toBe(body.material.rotation);
  expect(brace.material.color.getHex()).toBe(0xb9dfd1);
  update(0.3);
  expect(brace.visible).toBe(true);
  update(0.599, true);
  expect(brace.visible).toBe(true);
  update(0.6);
  expect(body.visible).toBe(true);
  expect(brace.visible).toBe(false);
  update(0.01);
  expect(brace.visible).toBe(true);
  update();
  expect(brace.visible).toBe(false); // pooled rig, next actor has no cue
  update(-0.01);
  expect(body.visible).toBe(true);
  expect(rig.group.children).toEqual(children);
  expect(legs.map((o) => o.material)).toEqual(materials);
  rig.dispose();
  resource.dispose();
});

it("leaves unapproved front/rear poses neutral when an immunity outcome occurs", async () => {
  for (const id of ["boar-front-rig-v1", "boar-rear-rig-v1"]) {
    const { resource, rig } = await createRig(id);
    rig.update(0.5, path, 0, 0xffffff, Infinity, false, 0, false, 0.1);
    expect(rig.cutout.parts.get("body").visible).toBe(true);
    expect(rig.cutout.parts.has("bodyResist")).toBe(false);
    rig.dispose();
    resource.dispose();
  }
});
