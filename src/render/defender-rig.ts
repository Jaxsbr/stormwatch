import * as THREE from "three";
import {
  AcceptedDefenderMotion,
  defenderMotionPhase,
} from "./accepted-defender-motion";
import { DefenderArm } from "./defender-arm";
import { CutoutInstance, CutoutResource } from "./cutout";

/** Upright defender prototype: planted body, independent arm joints and bow. */
export class DefenderRig {
  readonly cutout: CutoutInstance;
  readonly group: THREE.Group;
  private string: THREE.Line;
  private arrow: THREE.Line;
  private mirroredTextures: THREE.Texture[] = [];
  private arms = new Map<string, DefenderArm>();
  private order = 1000;
  private motion?: AcceptedDefenderMotion;
  private localMuzzle = new THREE.Vector3();
  constructor(
    resource: CutoutResource,
    height: number,
    readonly mirrored = false,
  ) {
    this.cutout = new CutoutInstance(resource, height);
    this.group = this.cutout.group;
    if (mirrored)
      for (const sprite of this.cutout.parts.values()) {
        const texture = sprite.material.map!.clone();
        texture.repeat.x = -1;
        texture.offset.x = 1;
        sprite.material.map = texture;
        this.mirroredTextures.push(texture);
      }
    for (const part of resource.definition!.parts)
      if (part.id === "holdArm" || part.id === "drawArm") {
        const arm = new DefenderArm(part, resource);
        this.arms.set(part.id, arm);
        this.group.add(arm.mesh);
        this.cutout.parts.get(part.id)!.visible = false;
      }
    const line = (color: number, count: number) =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: count }, () => new THREE.Vector3()),
        ),
        new THREE.LineBasicMaterial({
          color,
          depthTest: false,
          depthWrite: false,
        }),
      );
    this.string = line(0xe9d9aa, 3);
    this.arrow = line(0xf1d7a2, 5);
    this.group.add(this.string, this.arrow);
    if (
      ["squirrel-side-defender-v1", "turtle-side-defender-v1"].includes(
        resource.definition!.id,
      )
    )
      this.motion = new AcceptedDefenderMotion(this.cutout, this.arms);
  }
  private point(id: string, name: string) {
    const def = this.cutout.resource.definition!.parts.find(
      (p) => p.id === id,
    )!;
    const sprite = this.cutout.parts.get(id)!;
    const point = def.string?.[name] ?? def.joints?.[name];
    if (!point) throw new Error(`Defender landmark ${id}.${name} missing`);
    const x = ((point[0] - def.pivot[0]) * sprite.scale.x) / def.rect[2];
    const y = ((def.pivot[1] - point[1]) * sprite.scale.y) / def.rect[3];
    const r = sprite.material.rotation;
    return new THREE.Vector3(
      sprite.position.x + x * Math.cos(r) - y * Math.sin(r),
      sprite.position.y + x * Math.sin(r) + y * Math.cos(r),
      0,
    );
  }
  private reach(id: string, hand: THREE.Vector3) {
    return this.arms
      .get(id)!
      .reach(this.cutout.parts.get(id)!.position, hand, this.order);
  }
  update(
    age: number,
    cooldown: number,
    order = 1000,
    hasTarget = true,
    interval = Math.max(0.1, age + cooldown),
  ) {
    this.order = order;
    this.cutout.reset(order);
    if (this.motion) {
      const phase = defenderMotionPhase(
        age,
        cooldown,
        interval,
        this.motion.turtle ? 0.7 : 0.79,
        hasTarget,
      );
      if (this.motion.turtle) {
        this.string.visible = false;
        this.arrow.visible = false;
        this.localMuzzle.copy(this.motion.turtlePose(phase, order));
        this.reflect([]);
      } else this.squirrelPose(phase, order);
      return;
    }
    if (!this.cutout.parts.has("bow")) {
      this.string.visible = false;
      this.arrow.visible = false;
      const body = this.cutout.resource.definition!.parts.find(
        (p) => p.id === "body",
      )!;
      const h = body.rect[3];
      const recovery = THREE.MathUtils.smoothstep(age, 0.08, 0.45);
      const wind = THREE.MathUtils.smoothstep(
        age,
        0.45,
        Math.max(0.6, age + cooldown - 0.2),
      );
      const release =
        cooldown < 0.18
          ? THREE.MathUtils.smoothstep(0.18 - cooldown, 0, 0.18)
          : 0;
      const ready = new THREE.Vector3(h * 0.2, h * 0.43, 0);
      const raised = new THREE.Vector3(-h * 0.14, h * 0.7, 0);
      const forward = new THREE.Vector3(h * 0.34, h * 0.48, 0);
      const view = this.cutout.resource.definition!.view;
      if (view === "front" || view === "rear") {
        ready.set(0, h * 0.4, 0);
        raised.set(-h * 0.14, h * 0.65, 0);
        forward.set(0, h * (view === "front" ? 0.24 : 0.65), 0);
      }
      const hand = forward
        .clone()
        .lerp(ready, recovery)
        .lerp(raised, wind)
        .lerp(forward, release);
      const trader =
        this.cutout.resource.definition!.animation?.action === "trader";
      if (trader)
        hand.set(h * 0.16, h * (0.4 + 0.035 * Math.sin(age * Math.PI)), 0);
      hand.copy(this.reach("drawArm", hand));
      this.reach("holdArm", new THREE.Vector3(h * 0.15, h * 0.34, 0));
      const payload = this.cutout.parts.get("payload");
      if (payload) {
        payload.position.copy(hand);
        payload.visible = trader || age > 0.3;
      }
      this.localMuzzle.copy(hand);
      this.reflect([]);
      return;
    }
    const view = this.cutout.resource.definition!.view;
    const bow = this.cutout.parts.get("bow")!;
    const angle =
      view === "front" ? -Math.PI / 2 : view === "rear" ? Math.PI / 2 : 0;
    if (view === "front" || view === "rear") {
      bow.position.set(0, view === "front" ? 300 : 400, 0);
      bow.material.rotation = angle;
    }
    bow.position.copy(this.reach("holdArm", bow.position));
    const brace = this.point("bow", "braceCenter");
    const drawn = this.point("bow", "drawCenter");
    const draw = THREE.MathUtils.smoothstep(
      age,
      0.18,
      Math.max(0.5, age + cooldown - 0.15),
    );
    const hand = brace.clone().lerp(drawn, draw);
    hand.copy(this.reach("drawArm", hand));
    const points = [
      this.point("bow", "tipNear"),
      hand,
      this.point("bow", "tipFar"),
    ];
    const positions = this.string.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    points.forEach((p, i) => positions.setXYZ(i, p.x, p.y, 0));
    positions.needsUpdate = true;
    this.string.frustumCulled = false;
    this.string.renderOrder = order + 0.05;
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const across = new THREE.Vector3(-direction.y, direction.x, 0);
    const tip = brace.clone().addScaledVector(direction, 130);
    const arrowPoints = [
      hand,
      tip,
      tip.clone().addScaledVector(direction, -25).addScaledVector(across, 10),
      tip,
      tip.clone().addScaledVector(direction, -25).addScaledVector(across, -10),
    ];
    const arrows = this.arrow.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    arrowPoints.forEach((p, i) => arrows.setXYZ(i, p.x, p.y, 0));
    arrows.needsUpdate = true;
    this.arrow.frustumCulled = false;
    this.arrow.visible = age > 0.18;
    this.arrow.renderOrder = order + 0.06;
    this.localMuzzle.copy(brace);
    this.reflect([positions, arrows]);
  }
  private squirrelPose(t: number, order: number) {
    const smooth = THREE.MathUtils.smoothstep;
    const load = smooth(t, 0.12, 0.6),
      snap = smooth(t, 0.74, 0.79),
      settle = smooth(t, 0.82, 1);
    const tension = load * (1 - snap),
      follow = snap * (1 - settle);
    const lean = -4 * load * (1 - settle);
    this.motion!.updateBody(lean, 0, order);
    const shoulder = (id: string) =>
      this.cutout.rests
        .get(id)!
        .clone()
        .add(new THREE.Vector3(lean, 0, 0));
    const bow = this.cutout.parts.get("bow")!;
    bow.position.set(190 + 50 * load * (1 - settle), 370, 0);
    bow.position.copy(
      this.arms.get("holdArm")!.reach(shoulder("holdArm"), bow.position, order),
    );
    bow.scale.y *= 1 - 0.045 * tension;
    bow.scale.x *= 1 + 0.1 * tension;
    const brace = this.point("bow", "braceCenter");
    const stringHand = brace
      .clone()
      .lerp(new THREE.Vector3(35, 370, 0), tension);
    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(94.1, 35, load * (1 - settle)) - 10 * follow,
      370,
      0,
    );
    const hand = this.arms
      .get("drawArm")!
      .reach(shoulder("drawArm"), target, order);
    if (t < 0.74) stringHand.copy(hand);
    if (t >= 0.79)
      stringHand.x +=
        Math.sin((t - 0.79) * 180) * 7 * Math.exp(-(t - 0.79) * 35);
    const positions = this.string.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    [
      this.point("bow", "tipNear"),
      stringHand,
      this.point("bow", "tipFar"),
    ].forEach((p, i) => positions.setXYZ(i, p.x, p.y, 0));
    positions.needsUpdate = true;
    this.string.visible = true;
    this.string.frustumCulled = false;
    this.string.renderOrder = order + 0.05;
    // Hold the arrow until the simulation releases its real projectile.
    const tip = hand.clone().add(new THREE.Vector3(235, 0, 0));
    const arrows = this.arrow.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    [
      hand,
      tip,
      tip.clone().add(new THREE.Vector3(-22, 8, 0)),
      tip,
      tip.clone().add(new THREE.Vector3(-22, -8, 0)),
    ].forEach((p, i) => arrows.setXYZ(i, p.x, p.y, 0));
    arrows.needsUpdate = true;
    this.arrow.visible = t >= 0.12 && t < 0.79;
    this.arrow.frustumCulled = false;
    this.arrow.renderOrder = order + 0.06;
    this.localMuzzle.copy(brace);
    this.reflect([positions, arrows]);
  }
  /** Solved two-hand launch shape in world space for the real net projectile. */
  netLaunch() {
    if (!this.motion?.turtle) return undefined;
    this.group.updateWorldMatrix(true, false);
    return {
      hands: this.motion.hands.map((hand) =>
        this.group.localToWorld(hand.clone()),
      ),
      size: this.group.scale.x,
      mirrored: this.mirrored,
    };
  }
  private reflect(attributes: THREE.BufferAttribute[]) {
    if (this.mirrored) {
      this.motion?.reflect();
      for (const arm of this.arms.values()) arm.reflect();
      for (const def of this.cutout.resource.definition!.parts) {
        const sprite = this.cutout.parts.get(def.id)!;
        sprite.position.x *= -1;
        sprite.material.rotation *= -1;
        sprite.center.x = 1 - def.pivot[0] / def.rect[2];
      }
      for (const attribute of attributes) {
        for (let i = 0; i < attribute.count; i++)
          attribute.setX(i, -attribute.getX(i));
      }
      this.localMuzzle.x *= -1;
    }
  }
  bounds() {
    const b = this.cutout.bounds();
    return this.mirrored ? { ...b, left: -b.right, right: -b.left } : b;
  }
  muzzle() {
    return this.group.localToWorld(this.localMuzzle.clone());
  }
  dispose() {
    this.motion?.dispose();
    for (const line of [this.string, this.arrow]) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.arms.forEach((arm) => arm.dispose());
    this.mirroredTextures.forEach((texture) => texture.dispose());
    this.cutout.dispose();
  }
}
