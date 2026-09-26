import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { CharacterRig } from "../src/render/character-rig";
import { CutoutResource } from "../src/render/cutout";
import { validateCutoutDefinition } from "../src/render/cutout-validation";
it.each(["rat-rig-v3", "rat-front-rig-v3", "rat-rear-rig-v3"])(
  "%s switches whole torsos without guarded hit recoil",
  (id) => {
    const definition = JSON.parse(
      readFileSync(`public/art/v2/${id}/rig.json`, "utf8"),
    );
    validateCutoutDefinition(definition, { namespace: "v2" });
    const resource = Object.assign(Object.create(CutoutResource.prototype), {
      definition,
      textures: new Map(),
    });
    const rig = new CharacterRig(resource);
    const sample = (d) => ({ x: d * 40, y: 0 });
    rig.update(1, sample, 1, 0xffffff, Infinity, true);
    const body = rig.cutout.parts.get("body"),
      guard = rig.cutout.parts.get("bodyGuard");
    const before = guard.position.clone();
    rig.update(1, sample, 1, 0xffffff, 0.1, true);
    expect(body.visible).toBe(false);
    expect(guard.visible).toBe(true);
    expect(guard.position.equals(before)).toBe(true);
    expect(guard.material.rotation).toBe(0);
    rig.update(1, sample, 1, new THREE.Color("white"), 0.1, false);
    expect(body.visible).toBe(true);
    expect(guard.visible).toBe(false);
    expect(body.material.rotation).not.toBe(0);
    rig.dispose();
  },
);
