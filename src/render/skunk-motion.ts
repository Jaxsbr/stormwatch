import * as THREE from "three";
import type { CutoutInstance } from "./cutout";
import type { DefenderArm } from "./defender-arm";

const smooth = (a: number, b: number, t: number) =>
  THREE.MathUtils.smoothstep(t, a, b);
const point = (x: number, y: number) => new THREE.Vector3(x, y, 0);
export const SKUNK_RELEASE = 0.66;
export const FLASK_SIZE = [280, 264] as const;

/** Owner-accepted continuous side study. Simulation chooses when release occurs. */
export class SkunkMotion {
  readonly body: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly flask: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly launch = new THREE.Vector3();
  private original: Float32Array;
  constructor(
    private cutout: CutoutInstance,
    private arms: Map<string, DefenderArm>,
  ) {
    const def = cutout.resource.definition!.parts.find((p) => p.id === "body")!;
    const geometry = new THREE.PlaneGeometry(def.rect[2], def.rect[3], 12, 20);
    const p = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++)
      p.setXY(
        i,
        p.getX(i) + def.rect[2] / 2 - def.pivot[0],
        p.getY(i) + def.pivot[1] - def.rect[3] / 2,
      );
    p.setUsage(THREE.DynamicDrawUsage);
    this.original = Float32Array.from(p.array);
    const material = (map: THREE.Texture) =>
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        forceSinglePass: true,
      });
    this.body = new THREE.Mesh(
      geometry,
      material(cutout.resource.textures.get("body")!),
    );
    this.body.name = "defender-body";
    this.flask = new THREE.Mesh(
      new THREE.PlaneGeometry(...FLASK_SIZE),
      material(cutout.resource.textures.get("payload")!),
    );
    this.flask.name = "held-flask";
    this.body.frustumCulled = this.flask.frustumCulled = false;
    cutout.parts.get("body")!.visible = false;
    cutout.parts.get("payload")!.visible = false;
    cutout.group.add(this.body, this.flask);
  }
  private effort(t: number, reduced: boolean) {
    const load = smooth(0.12, 0.48, t) * (1 - smooth(0.52, SKUNK_RELEASE, t));
    const cast = smooth(0.52, SKUNK_RELEASE, t) * (1 - smooth(0.76, 0.94, t));
    return reduced ? [0, 0] : [-9 * load + 7 * cast, 7 * load - 3 * cast];
  }
  private transform(x: number, y: number, lean: number, dip: number) {
    const w = smooth(90, 500, y);
    return point(x + lean * w, y - dip * w);
  }
  private hand(t: number, reduced: boolean, order: number) {
    const ready = point(25, 265),
      back = point(-195, 230),
      release = point(170, 315),
      follow = point(170, 355);
    const at =
      t < 0.12
        ? ready
        : t < 0.48
          ? ready.lerp(back, smooth(0.12, 0.48, t))
          : t < 0.52
            ? back
            : t < SKUNK_RELEASE
              ? back.lerp(release, smooth(0.52, SKUNK_RELEASE, t))
              : t < 0.76
                ? release.lerp(follow, smooth(SKUNK_RELEASE, 0.76, t))
                : follow.lerp(ready, smooth(0.76, 0.94, t));
    const [lean, dip] = this.effort(t, reduced),
      socket = this.cutout.rests.get("drawArm")!;
    return this.arms
      .get("drawArm")!
      .reach(this.transform(socket.x, socket.y, lean, dip), at, order);
  }
  update(t: number, order: number, mirrored: boolean, reduced: boolean) {
    const [lean, dip] = this.effort(t, reduced),
      p = this.body.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = this.transform(
        this.original[i * 3],
        this.original[i * 3 + 1],
        lean,
        dip,
      );
      p.setXYZ(i, mirrored ? -v.x : v.x, v.y, 0);
    }
    p.needsUpdate = true;
    this.body.renderOrder = order + 0.01;
    // Exact release is sampled independently of the current frame, including a late first render.
    this.launch
      .copy(this.hand(SKUNK_RELEASE, reduced, order))
      .add(point(35, 75));
    const hand = this.hand(t, reduced, order);
    const socket = this.cutout.rests.get("holdArm")!;
    const support = point(140, 310)
      .lerp(point(242, 350), smooth(0.12, 0.45, t))
      .lerp(point(140, 310), smooth(0.78, 0.94, t));
    this.arms
      .get("holdArm")!
      .reach(this.transform(socket.x, socket.y, lean, dip), support, order);
    const backWeight =
      smooth(0.12, 0.48, t) * (1 - smooth(0.52, SKUNK_RELEASE, t));
    this.flask.position
      .copy(hand)
      .add(point(35, 75).lerp(point(-30, 65), backWeight));
    this.flask.rotation.z = reduced ? 0 : -0.25 * backWeight;
    this.flask.scale.x = mirrored ? -1 : 1;
    if (mirrored) {
      this.flask.position.x *= -1;
      this.flask.rotation.z *= -1;
      this.launch.x *= -1;
      for (const arm of this.arms.values()) arm.reflect();
    }
    this.flask.visible = t < SKUNK_RELEASE || t >= 0.88;
    this.flask.material.opacity = t >= 0.88 ? smooth(0.88, 0.96, t) : 1;
    this.flask.renderOrder = order + 0.025;
  }
  dispose() {
    for (const m of [this.body, this.flask]) {
      m.geometry.dispose();
      m.material.dispose();
    }
  }
}
