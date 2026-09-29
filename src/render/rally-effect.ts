import * as THREE from "three";
/** Boost feedback stays beside the feet, leaving shield/evade overhead unobstructed. */
export class RallyEffect {
  readonly group = new THREE.Group();
  private readonly streaks: THREE.Mesh[] = [];
  private readonly ring: THREE.Mesh<
    THREE.RingGeometry,
    THREE.MeshBasicMaterial
  >;
  constructor() {
    const material = () =>
      new THREE.MeshBasicMaterial({
        color: 0xffd073,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    for (let i = 0; i < 3; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(-34, 0);
      shape.lineTo(0, 1.7);
      shape.lineTo(0, -1.7);
      shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material());
      mesh.position.y = (i - 1) * 9;
      mesh.renderOrder = 3990;
      this.streaks.push(mesh);
      this.group.add(mesh);
    }
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.04, 64), material());
    this.ring.renderOrder = 3990;
    this.group.add(this.ring);
  }
  update(
    clock: number,
    direction: { x: number; y: number },
    boosted: boolean,
    castAge: number,
    reducedMotion: boolean,
  ) {
    this.group.visible = boosted || (castAge >= 0 && castAge < 0.75);
    const angle = Math.atan2(direction.y, direction.x);
    this.streaks.forEach((mesh, i) => {
      mesh.visible = boosted;
      const phase = reducedMotion ? 0.4 : (clock * 2.5 + i / 3) % 1;
      mesh.rotation.z = angle;
      const back = 18 + phase * 18;
      mesh.position.set(
        -Math.cos(angle) * back - Math.sin(angle) * (i - 1) * 9,
        -Math.sin(angle) * back + Math.cos(angle) * (i - 1) * 9 + 20,
        0,
      );
      mesh.scale.x = 0.65 + phase * 0.65;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        0.8 * (1 - phase * 0.65);
    });
    this.ring.visible = castAge >= 0 && castAge < 0.75;
    const pulseAge = this.ring.visible ? castAge : 0;
    const size = reducedMotion ? 65 : 24 + pulseAge * 140;
    this.ring.scale.set(size, size * 0.55, 1);
    this.ring.material.opacity = Math.max(0, 1 - castAge / 0.75) * 0.75;
  }
  dispose() {
    for (const mesh of [...this.streaks, this.ring]) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.group.removeFromParent();
    this.group.clear();
  }
}
