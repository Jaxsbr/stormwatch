import * as THREE from "three";
import { netGeometry } from "./combat-shapes";
import type { Enemy, Point } from "../sim/types";

/** Floor-level net cues follow exactly the enemies whose slow is active. */
export class SlowNetCue {
  readonly group = new THREE.Group();
  private readonly actors = new Map<number, THREE.Group>();
  private readonly auraGeometry = new THREE.CircleGeometry(1, 48);
  private readonly ringGeometry = new THREE.RingGeometry(0.84, 1, 48);
  private readonly latticeGeometry = netGeometry();
  private readonly knotRingGeometry = new THREE.RingGeometry(0.66, 1, 20);
  private readonly knotCenterGeometry = new THREE.CircleGeometry(0.38, 16);
  private readonly auraMaterial = this.material(0x9db58b, 0.42);
  private readonly ringMaterial = this.material(0xd8c38e, 0.94);
  private readonly latticeMaterial = this.material(0xf0d89d, 0.96);
  private readonly knotRingMaterial = this.material(0x355b45, 0.95);
  private readonly knotCenterMaterial = this.material(0xb9a36b, 0.95);

  update(
    enemies: readonly Enemy[],
    clock: number,
    project: (point: Point) => { x: number; y: number },
  ) {
    const active = new Set<number>();
    for (const enemy of enemies) {
      if (enemy.slowUntil <= clock) continue;
      active.add(enemy.id);
      let actor = this.actors.get(enemy.id);
      if (!actor) {
        actor = this.createActor();
        this.actors.set(enemy.id, actor);
        this.group.add(actor);
      }
      const center = project(enemy);
      // The simulation point anchors the actor's shadow; lower the cue a little
      // so the weave reads as ground texture just beneath the illustrated boots.
      actor.position.set(center.x, center.y - 12, 0);
    }
    for (const [id, actor] of this.actors) {
      if (active.has(id)) continue;
      this.group.remove(actor);
      this.actors.delete(id);
    }
  }

  private createActor() {
    const actor = new THREE.Group();
    const aura = new THREE.Mesh(this.auraGeometry, this.auraMaterial);
    aura.scale.set(32, 15, 1);
    aura.renderOrder = 46;

    const ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
    ring.scale.set(34, 16, 1);
    ring.renderOrder = 47;

    const lattice = new THREE.Mesh(this.latticeGeometry, this.latticeMaterial);
    lattice.scale.set(2.05, 0.82, 1);
    lattice.renderOrder = 48;

    actor.add(aura, ring, lattice);
    for (const [x, y] of [
      [-14, -6],
      [14, -6],
      [-14, 6],
      [14, 6],
    ]) {
      const knot = new THREE.Group();
      const outline = new THREE.Mesh(
        this.knotRingGeometry,
        this.knotRingMaterial,
      );
      outline.scale.set(2.3, 2.3, 1);
      const center = new THREE.Mesh(
        this.knotCenterGeometry,
        this.knotCenterMaterial,
      );
      center.scale.set(2.3, 2.3, 1);
      knot.add(outline, center);
      knot.position.set(x, y, 0);
      outline.renderOrder = 48;
      center.renderOrder = 49;
      actor.add(knot);
    }
    return actor;
  }

  private material(color: number, opacity: number) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  clear() {
    for (const actor of this.actors.values()) this.group.remove(actor);
    this.actors.clear();
  }

  dispose() {
    this.clear();
    this.auraGeometry.dispose();
    this.ringGeometry.dispose();
    this.latticeGeometry.dispose();
    this.knotRingGeometry.dispose();
    this.knotCenterGeometry.dispose();
    this.auraMaterial.dispose();
    this.ringMaterial.dispose();
    this.latticeMaterial.dispose();
    this.knotRingMaterial.dispose();
    this.knotCenterMaterial.dispose();
    this.group.clear();
  }
}
