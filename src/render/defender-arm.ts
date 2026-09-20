import * as THREE from "three";
import { solveTwoBone } from "./ik";
import type { CutoutPart, CutoutResource } from "./cutout";

/** Two rigid bone transforms, blended only at the illustrated elbow seam. */
export class DefenderArm {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private original: Float32Array;
  private elbow: THREE.Vector2;
  private grip: THREE.Vector2;
  constructor(
    readonly part: CutoutPart,
    resource: CutoutResource,
  ) {
    const [, , w, h] = part.rect;
    const local = (p: [number, number]) =>
      new THREE.Vector2(
        (p[0] - part.pivot[0]) * part.scale,
        (part.pivot[1] - p[1]) * part.scale,
      );
    this.elbow = local(part.joints!.elbow);
    this.grip = local(part.joints!.grip);
    const geometry = new THREE.PlaneGeometry(
      w * part.scale,
      h * part.scale,
      16,
      12,
    );
    const positions = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    positions.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < positions.count; i++)
      positions.setXY(
        i,
        positions.getX(i) + (w / 2 - part.pivot[0]) * part.scale,
        positions.getY(i) + (part.pivot[1] - h / 2) * part.scale,
      );
    this.original = new Float32Array(positions.array);
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: resource.textures.get(part.id),
        transparent: true,
        alphaTest: 0.02,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        // Flat cutouts have no back-face volume to composite separately.
        forceSinglePass: true,
      }),
    );
    this.mesh.frustumCulled = false;
  }
  reach(shoulder: THREE.Vector3, target: THREE.Vector3, order: number) {
    const lower = this.grip.clone().sub(this.elbow);
    const bend =
      this.grip.x * this.elbow.y - this.grip.y * this.elbow.x >= 0 ? 1 : -1;
    const pose = solveTwoBone(
      shoulder,
      target,
      this.elbow.length(),
      lower.length(),
      bend,
    );
    const ua =
      Math.atan2(pose.knee.y - shoulder.y, pose.knee.x - shoulder.x) -
      Math.atan2(this.elbow.y, this.elbow.x);
    const la =
      Math.atan2(pose.foot.y - pose.knee.y, pose.foot.x - pose.knee.x) -
      Math.atan2(lower.y, lower.x);
    const uc = Math.cos(ua),
      us = Math.sin(ua),
      lc = Math.cos(la),
      ls = Math.sin(la);
    const axis = this.elbow
      .clone()
      .normalize()
      .add(lower.clone().normalize())
      .normalize();
    const positions = this.mesh.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = this.original[i * 3],
        y = this.original[i * 3 + 1],
        dx = x - this.elbow.x,
        dy = y - this.elbow.y;
      const blend = THREE.MathUtils.smoothstep(
        dx * axis.x + dy * axis.y,
        -14,
        14,
      );
      const ux = shoulder.x + x * uc - y * us,
        uy = shoulder.y + x * us + y * uc;
      const lx = pose.knee.x + dx * lc - dy * ls,
        ly = pose.knee.y + dx * ls + dy * lc;
      positions.setXY(
        i,
        THREE.MathUtils.lerp(ux, lx, blend),
        THREE.MathUtils.lerp(uy, ly, blend),
      );
    }
    positions.needsUpdate = true;
    this.mesh.renderOrder = order + this.part.z * 0.01;
    return new THREE.Vector3(pose.foot.x, pose.foot.y, 0);
  }
  reflect() {
    const positions = this.mesh.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++)
      positions.setX(i, -positions.getX(i));
    positions.needsUpdate = true;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
