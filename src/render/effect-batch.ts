import * as THREE from "three";
import type { Effect, Point } from "../sim/types";

/** Ordered ring effects share one draw, preserving each ring's shape and alpha. */
export class EffectBatch {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private readonly ring = new THREE.RingGeometry(0.7, 1, 24);
  private readonly ordinary = new THREE.Color(0xdab575);
  private capacity = 0;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2600;
    this.mesh.visible = false;
  }

  update(
    effects: readonly Effect[],
    project: (point: Point) => { x: number; y: number },
  ) {
    const vertices = this.ring.attributes.position;
    const indices = this.ring.index!;
    if (effects.length > this.capacity) {
      this.capacity = Math.max(16, 2 ** Math.ceil(Math.log2(effects.length)));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array(this.capacity * vertices.count * 3),
          3,
        ).setUsage(THREE.DynamicDrawUsage),
      );
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(
          new Float32Array(this.capacity * vertices.count * 4),
          4,
        ).setUsage(THREE.DynamicDrawUsage),
      );
      const index = [];
      for (let n = 0; n < this.capacity; n++)
        for (let i = 0; i < indices.count; i++)
          index.push(indices.getX(i) + n * vertices.count);
      geometry.setIndex(index);
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    }
    this.mesh.visible = effects.length > 0;
    this.mesh.geometry.setDrawRange(0, effects.length * indices.count);
    if (!effects.length) return;
    const positions = this.mesh.geometry.attributes.position;
    const colors = this.mesh.geometry.attributes.color;
    for (let n = 0; n < effects.length; n++) {
      const fx = effects[n];
      const k = fx.age / fx.ttl;
      const size = (fx.kind === "splash" ? 60 : 18) * (0.2 + k * 0.8);
      const center = project(fx);
      const color = this.ordinary;
      for (let i = 0; i < vertices.count; i++) {
        const offset = n * vertices.count + i;
        positions.setXYZ(
          offset,
          center.x + vertices.getX(i) * size,
          center.y + vertices.getY(i) * size * 0.45,
          0,
        );
        colors.setXYZW(offset, color.r, color.g, color.b, (1 - k) * 0.7);
      }
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  dispose() {
    this.ring.dispose();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
