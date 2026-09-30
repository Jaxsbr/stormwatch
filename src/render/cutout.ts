import * as THREE from "three";
import { validateCutoutDefinition } from "./cutout-validation";
import { netGeometry } from "./combat-shapes";

export interface CutoutPart {
  id: string;
  texture: string;
  rect: [number, number, number, number];
  pivot: [number, number];
  scale: number;
  z: number;
  attachments?: Record<string, [number, number]>;
  attachTo?: string;
  joints?: Record<string, [number, number]>;
  string?: Record<string, [number, number]>;
  rail?: Record<string, [number, number]>;
  recoilAxis?: [number, number];
}
export interface CutoutDefinition {
  id: string;
  view?: "side" | "front" | "rear";
  parts: CutoutPart[];
  animation?: { hipHeight?: number; action?: "archer" | "thrower" | "trader" };
}
/** A generated part is immutable. Animation changes joints, never redraws architecture. */
export class CutoutResource {
  definition: CutoutDefinition | null = null;
  textures = new Map<string, THREE.Texture>();
  readonly ready: Promise<void>;
  private disposed = false;
  constructor(id: string, namespace = "v2") {
    this.ready = this.load(id, namespace);
    void this.ready.catch((e) => console.warn(`Cutout ${id} unavailable`, e));
  }
  private async load(id: string, namespace: string) {
    const response = await fetch(
      `${import.meta.env.BASE_URL}art/${namespace}/${id}/rig.json`,
    );
    if (!response.ok) throw new Error(`Rig HTTP ${response.status}`);
    const def = validateCutoutDefinition(await response.json(), { namespace });
    const loaded = await Promise.allSettled(
      def.parts.map(async (p) => ({
        id: p.id,
        texture: await new THREE.TextureLoader().loadAsync(
          `${import.meta.env.BASE_URL}${p.texture}`,
        ),
      })),
    );
    for (const result of loaded)
      if (result.status === "fulfilled") {
        const { id, texture } = result.value;
        if (this.disposed) {
          texture.dispose();
          continue;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        this.textures.set(id, texture);
      }
    if (this.disposed) return;
    if (loaded.some((r) => r.status === "rejected")) {
      this.dispose();
      throw new Error("Part texture loading failed");
    }
    this.definition = def;
  }
  create(height: number) {
    return this.definition ? new CutoutInstance(this, height) : null;
  }
  dispose() {
    this.disposed = true;
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
    this.definition = null;
  }
}
export class CutoutInstance {
  readonly group = new THREE.Group();
  readonly parts = new Map<string, THREE.Sprite>();
  readonly rests = new Map<string, THREE.Vector3>();
  private string?: THREE.Line;
  private arrow?: THREE.Line;
  private loadedStone?: THREE.Mesh<
    THREE.CircleGeometry,
    THREE.MeshBasicMaterial
  >;
  private loadedNet?: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  constructor(
    readonly resource: CutoutResource,
    height: number,
  ) {
    const def = resource.definition!;
    const root = def.parts.find((p) => !p.attachTo)!;
    const scale = height / (root.rect[3] * root.scale);
    this.group.scale.setScalar(scale);
    for (const p of def.parts) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: resource.textures.get(p.id),
          transparent: true,
          depthTest: false,
          depthWrite: false,
          alphaTest: 0.02,
        }),
      );
      s.center.set(p.pivot[0] / p.rect[2], 1 - p.pivot[1] / p.rect[3]);
      s.scale.set(p.rect[2] * p.scale, p.rect[3] * p.scale, 1);
      if (p.attachTo) {
        const [parentId, anchor] = p.attachTo.split(".");
        const parent = def.parts.find((q) => q.id === parentId)!;
        const point = parent.attachments?.[anchor];
        if (!point) throw new Error(`Missing attachment ${p.attachTo}`);
        s.position.set(
          (point[0] - parent.pivot[0]) * parent.scale,
          (parent.pivot[1] - point[1]) * parent.scale,
          0,
        );
      }
      this.parts.set(p.id, s);
      this.rests.set(p.id, s.position.clone());
      this.group.add(s);
    }
    if (def.parts.some((p) => p.string)) {
      this.string = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(),
          new THREE.Vector3(),
        ]),
        new THREE.LineBasicMaterial({
          color: 0xd1b889,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      this.arrow = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 5 }, () => new THREE.Vector3()),
        ),
        new THREE.LineBasicMaterial({
          color: 0xf1d7a2,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      this.group.add(this.string, this.arrow);
    }
  }
  reset(order: number, color: THREE.ColorRepresentation = 0xffffff) {
    for (const p of this.resource.definition!.parts) {
      const s = this.parts.get(p.id)!;
      s.position.copy(this.rests.get(p.id)!);
      s.material.rotation = 0;
      s.scale.set(p.rect[2] * p.scale, p.rect[3] * p.scale, 1);
      s.material.color.set(color);
      s.renderOrder = order + p.z * 0.01;
    }
  }
  bounds() {
    let left = Infinity,
      right = -Infinity,
      bottom = Infinity,
      top = -Infinity;
    for (const p of this.resource.definition!.parts) {
      const rest = this.rests.get(p.id)!;
      left = Math.min(left, rest.x - p.pivot[0] * p.scale);
      right = Math.max(right, rest.x + (p.rect[2] - p.pivot[0]) * p.scale);
      bottom = Math.min(bottom, rest.y - (p.rect[3] - p.pivot[1]) * p.scale);
      top = Math.max(top, rest.y + p.pivot[1] * p.scale);
    }
    const scale = this.group.scale.x;
    return {
      left: left * scale,
      right: right * scale,
      bottom: bottom * scale,
      top: top * scale,
    };
  }
  private partPoint(id: string, point: [number, number]) {
    const p = this.resource.definition!.parts.find((p) => p.id === id)!,
      s = this.parts.get(id)!;
    const x = (point[0] - p.pivot[0]) * (s.scale.x / p.rect[2]),
      y = (p.pivot[1] - point[1]) * (s.scale.y / p.rect[3]),
      r = s.material.rotation;
    return new THREE.Vector3(
      s.position.x + x * Math.cos(r) - y * Math.sin(r),
      s.position.y + x * Math.sin(r) + y * Math.cos(r),
      0,
    );
  }
  muzzle() {
    const p = this.resource.definition!.parts.find(
      (p) => p.rail?.release || p.joints?.release,
    );
    if (!p) return null;
    return this.group.localToWorld(
      this.partPoint(p.id, p.rail?.release ?? p.joints!.release),
    );
  }
  /** Release is tied to the simulation shot counter; pauses preserve the exact pose. */
  fire(age: number, readyIn: number, hasTarget: boolean, aim = 0) {
    const bow = this.parts.get("bow"),
      operator = this.parts.get("operator");
    const recoil =
      age >= 0 && age < 0.25
        ? Math.sin((Math.min(1, age / 0.04) * Math.PI) / 2) *
          Math.pow(1 - age / 0.25, 2)
        : 0;
    // age + cooldown is the shot interval, including upgrade speed. Finish
    // winding before the next release; a full turn returns to the same pose.
    const winding = Number.isFinite(age)
      ? THREE.MathUtils.smoothstep(
          age,
          0.1,
          Math.max(0.65, age + readyIn - 0.12),
        )
      : 1;
    const reload = this.parts.has("crank")
      ? Math.sin(winding * Math.PI)
      : age > 0.1 && age < 0.65
        ? Math.sin(((age - 0.1) / 0.55) * Math.PI)
        : 0;
    const anticipation = hasTarget && readyIn < 0.16 ? 1 - readyIn / 0.16 : 0;
    if (bow) {
      bow.material.rotation = aim;
      bow.position.x += recoil * 28 * Math.cos(aim);
      bow.position.y += recoil * 28 * Math.sin(aim);
    }
    const arm = this.parts.get("arm"),
      launcher = this.parts.get("launcher");
    if (operator) {
      const mechanism = bow ?? launcher ?? arm;
      if (mechanism) {
        const pivot = this.rests.get(
          bow ? "bow" : launcher ? "launcher" : "arm",
        )!;
        const rest = this.rests.get("operator")!;
        const x = rest.x - pivot.x + reload * 8,
          y = rest.y - pivot.y;
        operator.position.set(
          pivot.x + x * Math.cos(aim) - y * Math.sin(aim),
          pivot.y + x * Math.sin(aim) + y * Math.cos(aim),
          0,
        );
        operator.material.rotation = aim - 0.07 * reload + 0.02 * anticipation;
      } else {
        operator.material.rotation = -0.07 * reload + 0.02 * anticipation;
        operator.position.x += reload * 8;
      }
    }
    if (arm) {
      const recovery =
        age < 0.85 ? 1 - THREE.MathUtils.smoothstep(age, 0.08, 0.85) : 0;
      // The lever pitches up around its axle. In the approved overhead view
      // that shortens its projected length; it must not sweep sideways to fire.
      const pitch = Math.max(recovery, anticipation * anticipation);
      arm.material.rotation = aim;
      arm.scale.x *= 1 - 0.58 * pitch;
      this.loadedStone ??= new THREE.Mesh(
        new THREE.CircleGeometry(34, 12),
        new THREE.MeshBasicMaterial({
          color: 0xb0ac99,
          depthTest: false,
          depthWrite: false,
        }),
      );
      if (!this.loadedStone.parent) this.group.add(this.loadedStone);
      const armDefinition = this.resource.definition!.parts.find(
        (p) => p.id === "arm",
      )!;
      this.loadedStone.position.copy(
        this.partPoint("arm", armDefinition.joints!.cup),
      );
      this.loadedStone.visible = age > 0.65;
      this.loadedStone.renderOrder = arm.renderOrder + 0.005;
    }
    if (launcher) {
      launcher.position.x += recoil * 34 * Math.cos(aim);
      launcher.position.y += recoil * 34 * Math.sin(aim);
      launcher.material.rotation = aim;
      // Descriptor attachments stay flat. These moving joints share the
      // launcher's rigid aim/recoil transform without moving the platform.
      const pivot = this.rests.get("launcher")!;
      for (const id of ["drum", "crank"]) {
        const part = this.parts.get(id),
          rest = this.rests.get(id);
        if (!part || !rest) continue;
        const x = rest.x - pivot.x,
          y = rest.y - pivot.y;
        part.position.set(
          launcher.position.x + x * Math.cos(aim) - y * Math.sin(aim),
          launcher.position.y + x * Math.sin(aim) + y * Math.cos(aim),
          0,
        );
        // The drum remains seated in its bearings; only its separate handle
        // rotates in screen space. Endpoints differ by exactly one full turn.
        part.material.rotation =
          aim + (id === "crank" ? winding * Math.PI * 2 : 0);
        if (id === "crank")
          part.material.color.multiplyScalar(1 + reload * 0.4);
      }
    }
    if (launcher && this.parts.has("crank")) {
      this.loadedNet ??= new THREE.Mesh(
        netGeometry(),
        new THREE.MeshBasicMaterial({
          color: 0xffe1a4,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      if (!this.loadedNet.parent) this.group.add(this.loadedNet);
      const definition = this.resource.definition!.parts.find(
        (part) => part.id === "launcher",
      )!;
      const release = definition.joints!.release;
      // The rope payload travels along the loading rails. At release the
      // simulation projectile takes over; winding draws a replacement forward.
      const loading = THREE.MathUtils.smoothstep(winding, 0.12, 0.9);
      this.loadedNet.visible = age > 0.16;
      this.loadedNet.position.copy(
        this.partPoint("launcher", [
          THREE.MathUtils.lerp(definition.pivot[0], release[0], loading),
          THREE.MathUtils.lerp(definition.pivot[1], release[1], loading),
        ]),
      );
      this.loadedNet.scale.setScalar(4.5 + loading * 1.5);
      this.loadedNet.rotation.z = aim + Math.PI / 4;
      this.loadedNet.material.opacity = 0.5 + loading * 0.5;
      this.loadedNet.renderOrder = launcher.renderOrder + 0.005;
    }
    const p = this.resource.definition!.parts.find((p) => p.string);
    if (p && this.string && this.arrow) {
      const draw = age < 0.1 ? 0 : THREE.MathUtils.smoothstep(age, 0.1, 0.65);
      const center: [number, number] = [
        THREE.MathUtils.lerp(
          p.string!.braceCenter[0],
          p.string!.drawCenter[0],
          draw,
        ),
        THREE.MathUtils.lerp(
          p.string!.braceCenter[1],
          p.string!.drawCenter[1],
          draw,
        ),
      ];
      const points = [p.string!.tipNear, center, p.string!.tipFar];
      const position = this.string.geometry.attributes.position;
      points.forEach((pt, i) => {
        const v = this.partPoint(p.id, pt);
        position.setXYZ(i, v.x, v.y, 0);
      });
      position.needsUpdate = true;
      this.string.geometry.computeBoundingSphere();
      this.string.renderOrder = this.parts.get(p.id)!.renderOrder + 0.001;
      this.arrow.visible = age > 0.2;
      const back = p.string!.drawCenter[0],
        tip = p.rail!.release[0],
        y = p.rail!.release[1];
      const arrowPoints: [
        [number, number],
        [number, number],
        [number, number],
        [number, number],
        [number, number],
      ] = [
        [back, y],
        [tip, y],
        [tip + 27, y - 12],
        [tip, y],
        [tip + 27, y + 12],
      ];
      const ap = this.arrow.geometry.attributes.position;
      arrowPoints.forEach((pt, i) => {
        const v = this.partPoint(p.id, pt);
        ap.setXYZ(i, v.x, v.y, 0);
      });
      ap.needsUpdate = true;
      this.arrow.geometry.computeBoundingSphere();
      this.arrow.renderOrder = this.string.renderOrder + 0.001;
    }
  }
  idle(clock: number) {
    const flag = this.parts.get("flag"),
      lantern = this.parts.get("lantern");
    if (flag) flag.material.rotation = Math.sin(clock * 2.2) * 0.025;
    if (lantern) lantern.material.rotation = Math.sin(clock * 1.4) * 0.015;
  }
  dispose() {
    this.loadedStone?.geometry.dispose();
    this.loadedStone?.material.dispose();
    this.loadedNet?.geometry.dispose();
    this.loadedNet?.material.dispose();
    for (const line of [this.string, this.arrow])
      if (line) {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    this.parts.forEach((s) => s.material.dispose());
    this.parts.clear();
    this.group.clear();
  }
}
