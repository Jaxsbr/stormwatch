import * as THREE from "three";
import { ENEMIES, TOWERS } from "../content/catalog";
import { onPath } from "../sim/path";
import type { Game } from "../sim/game";
import type { LevelDef, Point } from "../sim/types";

const BOUNDS = [
  [57, 39, 376, 436],
  [491, 79, 837, 434],
  [934, 31, 1255, 436],
  [1367, 38, 1746, 424],
  [55, 534, 417, 802],
  [502, 564, 843, 809],
  [949, 493, 1278, 821],
  [1343, 471, 1749, 827],
];
const mat = (color: number | string) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1 });
type Figure = { sprite: THREE.Sprite; shadow: THREE.Mesh; bar?: THREE.Group };
export class Battlefield {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera();
  private world = new THREE.Group();
  private figures = new Map<number, Figure>();
  private shots = new Map<number, THREE.Mesh>();
  private effects = new Map<number, THREE.Mesh>();
  private textures: THREE.Texture[] = [];
  private atlasTexture: THREE.Texture;
  private groundTexture: THREE.Texture;
  private forestTexture: THREE.Texture;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private range: THREE.Mesh;
  private cursor: THREE.Mesh;
  private observer: ResizeObserver;
  private width = 12;
  private depth = 8;
  private time = 0;
  private rain: THREE.Points;
  onPick: (p: Point) => void = () => {};
  onHover: (p: Point | null) => void = () => {};
  constructor(readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x12272b, 0);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Isometric battlefield. Select a structure, then tap an open ground tile.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    host.append(this.renderer.domElement);
    this.groundTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}art/ground.webp`,
    );
    this.groundTexture.colorSpace = THREE.SRGBColorSpace;
    this.groundTexture.wrapS = this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.forestTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}art/forest-prop.webp`,
    );
    this.forestTexture.colorSpace = THREE.SRGBColorSpace;
    this.scene.add(
      this.world,
      new THREE.HemisphereLight(0xc1d8d7, 0x25352b, 2.1),
    );
    const sun = new THREE.DirectionalLight(0xffe6b4, 2.4);
    sun.position.set(-8, 16, 8);
    this.scene.add(sun);
    const cold = new THREE.DirectionalLight(0x7daabd, 1.2);
    cold.position.set(8, 8, -10);
    this.scene.add(cold);
    this.camera.position.set(18, 20, 22);
    this.camera.lookAt(5.5, 0, 3.5);
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.range = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1, 80),
      new THREE.MeshBasicMaterial({
        color: 0xecc574,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.range.rotation.x = -Math.PI / 2;
    this.range.visible = false;
    this.scene.add(this.range);
    this.cursor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.94, 0.94),
      new THREE.MeshBasicMaterial({
        color: 0xf2d48b,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.cursor.rotation.x = -Math.PI / 2;
    this.cursor.visible = false;
    this.scene.add(this.cursor);
    const positions = new Float32Array(150 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = ((i * 13.37) % 20) - 4;
      positions[i + 1] = (i * 3.31) % 8;
      positions[i + 2] = ((i * 5.79) % 15) - 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.rain = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xaacbd0,
        size: 0.027,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    this.scene.add(this.rain);
    const atlas = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}art/sprite-atlas.webp`,
      () => {
        for (const t of this.textures) {
          t.image = atlas.image;
          t.needsUpdate = true;
        }
      },
    );
    this.atlasTexture = atlas;
    atlas.colorSpace = THREE.SRGBColorSpace;
    this.textures = BOUNDS.map(([x, y, r, b]) => {
      const t = atlas.clone();
      t.colorSpace = THREE.SRGBColorSpace;
      t.offset.set(x / 1774, 1 - b / 887);
      t.repeat.set((r - x) / 1774, (b - y) / 887);
      t.needsUpdate = true;
      return t;
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener("pointerup", (e) => {
      if (e.button !== 0) return;
      const p = this.pick(e.clientX, e.clientY);
      if (p) this.onPick(p);
    });
    this.renderer.domElement.addEventListener("pointermove", (e) =>
      this.onHover(this.pick(e.clientX, e.clientY)),
    );
    this.renderer.domElement.addEventListener("pointerleave", () =>
      this.onHover(null),
    );
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const aspect = width / height,
      span = Math.max(11.2, 17.3 / aspect);
    this.camera.left = (-span * aspect) / 2;
    this.camera.right = (span * aspect) / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
  load(level: LevelDef) {
    this.width = level.width;
    this.depth = level.depth;
    this.clearWorld();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(level.width + 0.45, 0.85, level.depth + 0.45),
      mat(0x283d36),
    );
    base.position.set((level.width - 1) / 2, -0.53, (level.depth - 1) / 2);
    this.world.add(base);
    const tileGeo = new THREE.BoxGeometry(0.98, 0.17, 0.98);
    const greens = [0xb6bd9d, 0xbec7a6, 0xb5c2a5, 0xc1c9aa],
      paths = [0x8a8770, 0x939078, 0x81816d];
    const tileMats = [...greens, ...paths].map((c) => mat(c));
    for (let x = 0; x < level.width; x++)
      for (let z = 0; z < level.depth; z++) {
        const path = onPath(level, { x, z });
        const m = path
          ? tileMats[4 + ((x * 7 + z * 3) % 3)]
          : tileMats[(x * 13 + z * 3) % 4];
        if (!path) m.map = this.groundTexture;
        const geo = tileGeo.clone();
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++)
          uv.setXY(i, (uv.getX(i) + x) / 4, (uv.getY(i) + z) / 4);
        const tile = new THREE.Mesh(geo, m);
        tile.position.set(x, -0.085, z);
        this.world.add(tile);
        if (path && (x + z) % 2 === 0) {
          for (let n = 0; n < 3; n++) {
            const rock = new THREE.Mesh(
              new THREE.BoxGeometry(0.13, 0.02, 0.18),
              mat(0xaaa28a),
            );
            rock.position.set(
              x - 0.28 + n * 0.23,
              0.012,
              z + 0.22 * (((x + z) % 3) - 1),
            );
            rock.rotation.y = n * 0.6;
            this.world.add(rock);
          }
        }
      }
    tileGeo.dispose();
    // Scenic trees stay outside buildable land: gameplay never hides behind a tall foreground prop.
    for (let i = 0; i < 20; i++) {
      const x = i < 12 ? i - 0.5 : (i % 4) * 3.5 - 1,
        z = i < 12 ? -1.6 : i < 16 ? 9 : 10;
      this.tree(x, z, 0.85 + (i % 3) * 0.18);
    }
    this.tree(-1.4, 0, 1.25);
    this.tree(-1.5, 7, 0.9);
    this.tree(12.5, 0, 1.1);
    for (const p of level.blocked) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.43, 0),
        mat(0x647366),
      );
      rock.position.set(p.x, 0.22, p.z);
      rock.scale.y = 0.75;
      this.world.add(rock);
    }
    for (const [x, z] of [
      [-0.7, 3],
      [11.7, 3],
    ]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.07, 1.6, 6),
        mat(0x5d4b33),
      );
      pole.position.set(x, 0.8, z);
      this.world.add(pole);
      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.32, 0.22),
        new THREE.MeshStandardMaterial({
          color: 0xffd184,
          emissive: 0xffb342,
          emissiveIntensity: 1.2,
        }),
      );
      lantern.position.set(x, 1.4, z);
      this.world.add(lantern);
    }
  }
  private tree(x: number, z: number, scale: number) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.forestTexture,
        alphaTest: 0.15,
        transparent: true,
        depthWrite: true,
        color: 0x9aa993,
      }),
    );
    sprite.center.set(0.5, 0.035);
    sprite.position.set(x, 0, z);
    sprite.scale.set(2.9 * scale, 2.9 * scale, 1);
    this.world.add(sprite);
  }
  private releaseObject(root: THREE.Object3D) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
      }
      if (
        o instanceof THREE.Mesh ||
        o instanceof THREE.Sprite ||
        o instanceof THREE.Points
      ) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
  }
  private clearWorld() {
    for (const f of this.figures.values()) {
      for (const object of [f.sprite, f.shadow, f.bar])
        if (object) {
          this.scene.remove(object);
          this.releaseObject(object);
        }
    }
    this.figures.clear();
    this.trimMeshes(this.shots, new Set());
    this.trimMeshes(this.effects, new Set());
    this.releaseObject(this.world);
    this.world.clear();
  }
  private figure(id: number, index: number, height: number, enemy = false) {
    let f = this.figures.get(id);
    if (f) return f;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.textures[index],
        transparent: true,
        alphaTest: 0.1,
        depthWrite: true,
      }),
    );
    sprite.center.set(0.5, 0.06);
    const b = BOUNDS[index];
    sprite.scale.set((height * (b[2] - b[0])) / (b[3] - b[1]), height, 1);
    this.scene.add(sprite);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(enemy ? 0.32 : 0.5, 20),
      new THREE.MeshBasicMaterial({
        color: 0x0b1915,
        opacity: 0.35,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.023;
    this.scene.add(shadow);
    f = { sprite, shadow };
    if (enemy) {
      const bar = new THREE.Group();
      const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 0.07),
        new THREE.MeshBasicMaterial({ color: 0x1d2925, depthTest: false }),
      );
      const health = new THREE.Mesh(
        new THREE.PlaneGeometry(0.58, 0.035),
        new THREE.MeshBasicMaterial({ color: 0xcda36e, depthTest: false }),
      );
      health.position.z = 0.01;
      bar.add(bg, health);
      bar.renderOrder = 10;
      this.scene.add(bar);
      f.bar = bar;
    }
    this.figures.set(id, f);
    return f;
  }
  pick(clientX: number, clientY: number): Point | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((clientX - r.left) / r.width) * 2 - 1,
        (-(clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    const sprites = [...this.figures.values()]
      .filter((f) => !f.bar)
      .map((f) => f.sprite);
    const hit = this.ray.intersectObjects(sprites)[0];
    if (hit)
      return {
        x: Math.round(hit.object.position.x),
        z: Math.round(hit.object.position.z),
      };
    const at = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, at)) return null;
    const p = { x: Math.round(at.x), z: Math.round(at.z) };
    return p.x >= 0 && p.x < this.width && p.z >= 0 && p.z < this.depth
      ? p
      : null;
  }
  project(p: Point) {
    const v = new THREE.Vector3(p.x, 0, p.z).project(this.camera),
      r = this.renderer.domElement.getBoundingClientRect();
    return {
      x: r.left + ((v.x + 1) / 2) * r.width,
      y: r.top + ((1 - v.y) / 2) * r.height,
    };
  }
  highlight(p: Point | null, valid = true) {
    this.cursor.visible = !!p;
    if (p) {
      this.cursor.position.set(p.x, 0.025, p.z);
      (this.cursor.material as THREE.MeshBasicMaterial).color.set(
        valid ? 0xe5c378 : 0xc77766,
      );
    }
  }
  update(game: Game, selected: number | null, dt: number) {
    const s = game.state;
    this.time += dt;
    const ids = new Set<number>();
    for (const t of s.towers) {
      ids.add(t.id);
      const h = t.kind === "trade" ? 1.65 : 1.7;
      const f = this.figure(t.id, TOWERS[t.kind].sprite, h);
      f.sprite.position.set(t.x, 0.035, t.z);
      f.shadow.position.set(t.x, 0.023, t.z);
      f.sprite.material.color.set(t.level === 2 ? 0xffe6ac : 0xffffff);
      const pulse = t.cooldown > TOWERS[t.kind].interval * 0.75 ? 1.025 : 1;
      f.sprite.scale.y = h * pulse;
    }
    for (const e of s.enemies) {
      ids.add(e.id);
      const height =
        e.kind === "boss" ? 1.7 : e.kind === "armored" ? 1.12 : 0.92;
      const f = this.figure(e.id, ENEMIES[e.kind].sprite, height, true);
      const bob =
        s.phase === "wave" ? Math.sin(s.clock * 10 + e.id) * 0.025 : 0;
      f.sprite.position.set(e.x, 0.04 + bob, e.z);
      f.shadow.position.set(e.x, 0.024, e.z);
      f.sprite.material.color.set(
        s.clock - e.hitAt < 0.1
          ? 0xffc5a2
          : e.slowUntil > s.clock
            ? 0xb9dfd1
            : 0xffffff,
      );
      if (f.bar) {
        f.bar.position.set(e.x, height + 0.12, e.z);
        f.bar.quaternion.copy(this.camera.quaternion);
        f.bar.children[1].scale.x = Math.max(0, e.hp / e.maxHp);
      }
    }
    for (const [id, f] of this.figures)
      if (!ids.has(id)) {
        this.scene.remove(f.sprite, f.shadow);
        f.sprite.material.dispose();
        f.shadow.geometry.dispose();
        (f.shadow.material as THREE.Material).dispose();
        if (f.bar) {
          this.scene.remove(f.bar);
          f.bar.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              o.material.dispose();
            }
          });
        }
        this.figures.delete(id);
      }
    const selectedTower = s.towers.find((t) => t.id === selected);
    this.range.visible = !!selectedTower && selectedTower.kind !== "trade";
    if (selectedTower) {
      const r = game.range(selectedTower);
      this.range.scale.set(r, r, r);
      this.range.position.set(selectedTower.x, 0.032, selectedTower.z);
    }
    const activeShots = new Set<number>();
    for (const p of s.shots) {
      activeShots.add(p.id);
      let mesh = this.shots.get(p.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.kind === "stone" ? 0.085 : 0.045, 6, 4),
          new THREE.MeshBasicMaterial({
            color:
              p.kind === "net"
                ? 0xa6d5aa
                : p.kind === "stone"
                  ? 0xb0ac99
                  : 0xffd989,
          }),
        );
        this.shots.set(p.id, mesh);
        this.scene.add(mesh);
      }
      const v = Math.min(1, p.life / p.duration);
      mesh.position.set(
        p.source.x + (p.target.x - p.source.x) * v,
        0.6 + Math.sin(v * Math.PI) * (p.kind === "stone" ? 1.2 : 0.12),
        p.source.z + (p.target.z - p.source.z) * v,
      );
    }
    this.trimMeshes(this.shots, activeShots);
    const activeFx = new Set<number>();
    for (const fx of s.effects) {
      activeFx.add(fx.id);
      let mesh = this.effects.get(fx.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.8, 1, 24),
          new THREE.MeshBasicMaterial({
            color:
              fx.kind === "supply"
                ? 0xf5d085
                : fx.kind === "splash"
                  ? 0xbcb9a1
                  : 0xdab575,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        mesh.rotation.x = -Math.PI / 2;
        this.effects.set(fx.id, mesh);
        this.scene.add(mesh);
      }
      const k = fx.age / fx.ttl,
        sz =
          (fx.kind === "supply" ? 2.3 : fx.kind === "splash" ? 1.1 : 0.25) *
          (0.2 + k * 0.8);
      mesh.scale.setScalar(sz);
      mesh.position.set(fx.x, 0.08, fx.z);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.65;
    }
    this.trimMeshes(this.effects, activeFx);
    const a = this.rain.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) - dt * 3.2;
      if (y < 0) y = 8;
      a.setY(i, y);
    }
    a.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
  private trimMeshes(map: Map<number, THREE.Mesh>, active: Set<number>) {
    for (const [id, m] of map)
      if (!active.has(id)) {
        this.scene.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
        map.delete(id);
      }
  }
  dispose() {
    this.observer.disconnect();
    this.clearWorld();
    this.textures.forEach((t) => t.dispose());
    this.atlasTexture.dispose();
    this.groundTexture.dispose();
    this.forestTexture.dispose();
    [this.range, this.cursor, this.rain].forEach((o) => this.releaseObject(o));
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
