import * as THREE from "three";
import type { Enemy, Point, Tower } from "../sim/types";

export const enemyHeight = (enemy: Enemy) =>
  enemy.kind === "boss" ? 142 : enemy.kind === "armored" ? 108 : 88;

/** Repeated untextured overlays retain their exact shapes in three instanced draws. */
export class OverlayBatch {
  readonly group = new THREE.Group();
  private matrix = new THREE.Matrix4();
  shadows: THREE.InstancedMesh;
  backgrounds: THREE.InstancedMesh;
  health: THREE.InstancedMesh;
  constructor() {
    const make = (
      geometry: THREE.BufferGeometry,
      color: number,
      opacity: number,
      order: number,
    ) => {
      const mesh = new THREE.InstancedMesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color,
          opacity,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
        16,
      );
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      mesh.count = 0;
      mesh.visible = false;
      this.group.add(mesh);
      return mesh;
    };
    this.shadows = make(new THREE.CircleGeometry(1, 32), 0x101d16, 0.32, 45);
    // Original per-enemy backgrounds followed the selected marker at order3000.
    this.backgrounds = make(
      new THREE.PlaneGeometry(38, 5),
      0x19241f,
      1,
      3000.5,
    );
    this.health = make(new THREE.PlaneGeometry(34, 3), 0xebbe76, 1, 3001);
  }
  private reserve(mesh: THREE.InstancedMesh, count: number) {
    if (count > mesh.instanceMatrix.count) {
      const next = new THREE.InstancedMesh(
        mesh.geometry,
        mesh.material,
        2 ** Math.ceil(Math.log2(count)),
      );
      next.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      next.frustumCulled = false;
      next.renderOrder = mesh.renderOrder;
      this.group.remove(mesh);
      mesh.dispose();
      this.group.add(next);
      mesh = next;
    }
    mesh.count = count;
    mesh.visible = count > 0;
    return mesh;
  }
  update(
    towers: readonly Tower[],
    enemies: readonly Enemy[],
    project: (p: Point) => { x: number; y: number },
  ) {
    this.shadows = this.reserve(this.shadows, towers.length + enemies.length);
    let index = 0;
    for (const points of [towers, enemies])
      for (const p of points) {
        const center = project(p),
          radius = points === towers ? 36 : 22;
        this.matrix
          .makeScale(radius, radius * 0.35, 1)
          .setPosition(center.x, center.y, 0);
        this.shadows.setMatrixAt(index++, this.matrix);
      }
    const injured = enemies.filter((e) => e.hp < e.maxHp);
    this.backgrounds = this.reserve(this.backgrounds, injured.length);
    this.health = this.reserve(this.health, injured.length);
    injured.forEach((e, i) => {
      const center = project(e);
      this.matrix.makeTranslation(center.x, center.y + enemyHeight(e) + 9, 0);
      this.backgrounds.setMatrixAt(i, this.matrix);
      this.matrix
        .makeScale(Math.max(0, e.hp / e.maxHp), 1, 1)
        .setPosition(center.x, center.y + enemyHeight(e) + 9, 0);
      this.health.setMatrixAt(i, this.matrix);
    });
    for (const mesh of [this.shadows, this.backgrounds, this.health])
      mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    for (const mesh of [this.shadows, this.backgrounds, this.health]) {
      mesh.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.group.clear();
  }
}
