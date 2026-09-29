import * as THREE from "three";
import { CutoutInstance } from "./cutout";
import { DefenderArm } from "./defender-arm";
import { updateCastNet } from "./cast-net";

/** Map the accepted study to the actual shot, without changing simulation cadence. */
export function defenderMotionPhase(
  age: number,
  cooldown: number,
  interval: number,
  release: number,
  hasTarget: boolean,
) {
  if (age >= 0 && age < (1 - release) * interval)
    return release + age / interval;
  return hasTarget
    ? Math.max(0, release - Math.max(0, cooldown) / interval)
    : 0;
}

/** Reuses the approved body and arm art; parameters come from the accepted side studies. */
export class AcceptedDefenderMotion {
  readonly body: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly net?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private original: Float32Array;
  readonly hands = [new THREE.Vector3(), new THREE.Vector3()];
  readonly turtle: boolean;
  constructor(
    private cutout: CutoutInstance,
    private arms: Map<string, DefenderArm>,
  ) {
    this.turtle = cutout.resource.definition!.id === "turtle-side-defender-v1";
    const def = cutout.resource.definition!.parts.find(
      (part) => part.id === "body",
    )!;
    const geometry = new THREE.PlaneGeometry(
      def.rect[2],
      def.rect[3],
      this.turtle ? 12 : 1,
      this.turtle ? 20 : 12,
    );
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++)
      pos.setXY(
        i,
        pos.getX(i) + def.rect[2] / 2 - def.pivot[0],
        pos.getY(i) + def.pivot[1] - def.rect[3] / 2,
      );
    pos.setUsage(THREE.DynamicDrawUsage);
    this.original = Float32Array.from(pos.array);
    this.body = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: cutout.resource.textures.get("body"),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        forceSinglePass: true,
      }),
    );
    this.body.name = "defender-body";
    this.body.frustumCulled = false;
    cutout.parts.get("body")!.visible = false;
    cutout.group.add(this.body);
    if (this.turtle) {
      cutout.parts.get("payload")!.visible = false;
      this.net = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial({
          color: 0xd5b881,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
          forceSinglePass: true,
        }),
      );
      this.net.name = "held-net";
      this.net.frustumCulled = false;
      cutout.group.add(this.net);
    }
  }
  updateBody(lean: number, dip: number, order: number) {
    const positions = this.body.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = this.original[i * 3],
        y = this.original[i * 3 + 1];
      const weight = THREE.MathUtils.smoothstep(
        y,
        this.turtle ? 90 : 110,
        this.turtle ? 500 : 330,
      );
      positions.setXYZ(i, x + lean * weight, y - dip * weight, 0);
    }
    positions.needsUpdate = true;
    this.body.renderOrder = order + 0.01;
  }
  turtlePose(t: number, order: number) {
    const load = THREE.MathUtils.smoothstep(t, 0.12, 0.52),
      cast = THREE.MathUtils.smoothstep(t, 0.57, 0.7),
      recover = THREE.MathUtils.smoothstep(t, 0.82, 1);
    const effort = load * (1 - cast),
      follow = cast * (1 - recover);
    const lean = -24 * effort + 24 * follow,
      dip = 14 * effort - 5 * follow;
    this.updateBody(lean, dip, order);
    const poses = [
      { id: "drawArm", ready: [55, 285], back: [-10, 315], out: [200, 425] },
      { id: "holdArm", ready: [240, 300], back: [175, 335], out: [425, 435] },
    ];
    poses.forEach(({ id, ready, back, out }, i) => {
      const at = new THREE.Vector3(ready[0], ready[1], 0)
        .lerp(new THREE.Vector3(back[0], back[1], 0), load)
        .lerp(new THREE.Vector3(out[0], out[1], 0), cast)
        .lerp(new THREE.Vector3(ready[0], ready[1], 0), recover);
      const socket = this.cutout.rests.get(id)!;
      const y = socket.y + (id === "drawArm" ? 35 : 0),
        weight = THREE.MathUtils.smoothstep(y, 90, 500);
      const shoulder = new THREE.Vector3(
        socket.x - (id === "drawArm" ? 20 : 0) + lean * weight,
        y - dip * weight,
        0,
      );
      this.hands[i].copy(this.arms.get(id)!.reach(shoulder, at, order));
    });
    updateCastNet(this.net!.geometry, this.hands[0], this.hands[1]);
    this.net!.renderOrder = order + 0.045;
    this.net!.visible = t < 0.7 || t >= 0.9;
    this.net!.material.opacity =
      t >= 0.9 ? THREE.MathUtils.smoothstep(t, 0.9, 1) : 1;
    return this.hands[0].clone().lerp(this.hands[1], 0.5);
  }
  reflect() {
    for (const mesh of [this.body, this.net]) {
      if (!mesh) continue;
      const positions = mesh.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++)
        positions.setX(i, -positions.getX(i));
      positions.needsUpdate = true;
    }
    for (const hand of this.hands) hand.x *= -1;
  }
  dispose() {
    for (const mesh of [this.body, this.net]) {
      mesh?.geometry.dispose();
      mesh?.material.dispose();
    }
  }
}
