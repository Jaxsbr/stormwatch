import { expect, it } from "vitest";
import * as THREE from "three";
import { LegDeformation } from "../src/render/leg-deformation";

it("GPU pose matrices preserve the previous two-bone vertex transform", () => {
  const material = new THREE.MeshBasicMaterial();
  const deformation = new LegDeformation(material, false, -115, -220, {
    x: 60,
    y: -245,
  });
  const nativeKnee = { x: 38, y: -115 };
  const hip = { x: 40, y: 155 };
  const knee = { x: 62, y: 49 };
  for (const upperAngle of [-0.5, 0, 0.3])
    for (const lowerAngle of [-0.7, 0, 0.6]) {
      deformation.setSide(hip, knee, nativeKnee, upperAngle, lowerAngle);
      for (const y of [0, -60, -100, -115, -130, -200, -245])
        for (const x of [-30, 0, 40]) {
          const blend = THREE.MathUtils.smoothstep(-y, 87, 143);
          const upper = new THREE.Vector3(x, y, 1).applyMatrix3(
            deformation.upper.value,
          );
          const lower = new THREE.Vector3(x, y, 1).applyMatrix3(
            deformation.lower.value,
          );
          const uc = Math.cos(upperAngle),
            us = Math.sin(upperAngle);
          const lc = Math.cos(lowerAngle),
            ls = Math.sin(lowerAngle);
          const ux = hip.x + x * uc - y * us,
            uy = hip.y + x * us + y * uc;
          const dx = x - nativeKnee.x,
            dy = y - nativeKnee.y;
          const lx = knee.x + dx * lc - dy * ls,
            ly = knee.y + dx * ls + dy * lc;
          expect(upper.x + (lower.x - upper.x) * blend).toBeCloseTo(
            ux + (lx - ux) * blend,
            9,
          );
          expect(upper.y + (lower.y - upper.y) * blend).toBeCloseTo(
            uy + (ly - uy) * blend,
            9,
          );
        }
    }
  material.dispose();
});

it("keeps pose uniform ownership separate between reused shader programs", () => {
  const materialA = new THREE.MeshBasicMaterial(),
    materialB = new THREE.MeshBasicMaterial();
  const a = new LegDeformation(materialA, true, -115, -220, { x: 60, y: -245 });
  const b = new LegDeformation(materialB, true, -115, -220, { x: 60, y: -245 });
  a.setFront({ x: 40, y: 150 }, { x: 30, y: 4 });
  b.setFront({ x: -40, y: 140 }, { x: -25, y: 7 });
  expect(a.hipFoot.value.toArray()).toEqual([40, 150, 30, 4]);
  expect(b.hipFoot.value.toArray()).toEqual([-40, 140, -25, 7]);
  expect(materialA.customProgramCacheKey()).toBe(
    materialB.customProgramCacheKey(),
  );
  materialA.dispose();
  materialB.dispose();
});
