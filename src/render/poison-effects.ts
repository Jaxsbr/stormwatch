import * as THREE from "three";
import type { Effect, Enemy, Point } from "../sim/types";

/** Soft puffs from authoritative status/effect snapshots; no combat decisions or timers. */
export class PoisonEffects {
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private capacity = 0;
  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: `attribute float opacity; varying vec2 puffUv; varying float alpha;
        void main(){puffUv=uv;alpha=opacity;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 puffUv; varying float alpha;
        void main(){float r=length((puffUv-.5)*2.);float a=(1.-smoothstep(.2,1.,r))*alpha;
          gl_FragColor=vec4(mix(vec3(.30,.53,.07),vec3(.62,.91,.18),1.-r),a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      }),
    );
    this.mesh.name = "poison-soft-puffs";
    this.mesh.renderOrder = 2550;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }
  update(
    enemies: readonly Enemy[],
    effects: readonly Effect[],
    clock: number,
    project: (p: Point) => { x: number; y: number },
    reduced = false,
  ) {
    const active = enemies.filter(
      (e) => e.alive && e.poison && e.poison.expiresAt > clock,
    );
    const bursts = effects.filter((e) => e.kind === "splash" && e.age < e.ttl);
    const count = active.length * 6 + bursts.length * 8;
    if (count > this.capacity) {
      this.capacity = Math.max(32, 2 ** Math.ceil(Math.log2(count)));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array(this.capacity * 18),
          3,
        ).setUsage(THREE.DynamicDrawUsage),
      );
      geo.setAttribute(
        "uv",
        new THREE.BufferAttribute(new Float32Array(this.capacity * 12), 2),
      );
      geo.setAttribute(
        "opacity",
        new THREE.BufferAttribute(
          new Float32Array(this.capacity * 6),
          1,
        ).setUsage(THREE.DynamicDrawUsage),
      );
      const uv = geo.attributes.uv;
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      for (let n = 0; n < this.capacity; n++)
        for (let i = 0; i < 6; i++)
          uv.setXY(n * 6 + i, ...(corners[i] as [number, number]));
      this.mesh.geometry.dispose();
      this.mesh.geometry = geo;
    }
    this.mesh.visible = count > 0;
    this.mesh.geometry.setDrawRange(0, count * 6);
    if (!count) return;
    const p = this.mesh.geometry.attributes.position,
      a = this.mesh.geometry.attributes.opacity;
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    let n = 0;
    const puff = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      alpha: number,
    ) => {
      for (let i = 0; i < 6; i++) {
        p.setXYZ(n * 6 + i, x + corners[i][0] * rx, y + corners[i][1] * ry, 0);
        a.setX(n * 6 + i, alpha);
      }
      n++;
    };
    for (const e of active) {
      const center = project(e),
        fade = Math.min(1, (e.poison!.expiresAt - clock) / 0.35);
      for (let i = 0; i < 6; i++) {
        const q =
          ((reduced ? 0 : clock * 0.35) + i * 0.17 + (e.id % 17) / 17) % 1;
        // Low opacity over silhouettes preserves shields/faces in dense overlapping groups.
        puff(
          center.x + Math.sin(i * 2.3 + q) * 24,
          center.y + 9 + q * 42,
          22 + q * 9,
          18 + q * 8,
          0.65 * 0.46 * (1 - q * 0.6) * fade,
        );
      }
    }
    for (const fx of bursts) {
      const center = project(fx),
        q = fx.age / fx.ttl;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4,
          radius = (10 + q * 60) * (reduced ? 0.6 : 1);
        puff(
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius * 0.5,
          36,
          25,
          (1 - q) * 0.45,
        );
      }
    }
    p.needsUpdate = true;
    a.needsUpdate = true;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
