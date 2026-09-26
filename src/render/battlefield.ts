import * as THREE from "three";
import { RANK_BADGE, rankFontSize, rankLabel } from "../ui/rank-badge";
import { selectionMaterial } from "./selection-material";
import { CutoutResource, type CutoutInstance } from "./cutout";
import { projectedPathSampler } from "./path-sampler";
import { OverlayBatch, enemyHeight } from "./overlay-batch";
import { ResourcePool } from "./resource-pool";
import { CombatText } from "./combat-text";
import { weaselEvasionState } from "../sim/weasel-evasion";
import { EffectBatch } from "./effect-batch";
import { DefenderRig } from "./defender-rig";
import { CharacterRig } from "./character-rig";
import { SlowNetCue } from "./slow-net-cue";
import {
  StatusGlyph,
  type StatusGlyphKind,
  type StatusGlyphView,
} from "./status-glyph";
import { ratShieldState } from "../sim/rat-shield";
import { netGeometry } from "./combat-shapes";
import { pointOnPath } from "../sim/path";
import type { Game } from "../sim/game";
import type { EnemyKind, LevelDef, Point, TowerKind } from "../sim/types";

// Simulation coordinates remain independent of the painted presentation.
const W = 1280,
  H = 720,
  X = 96,
  Y = 74,
  ORIGIN_X = 112,
  ORIGIN_Y = 106;
const position = (p: Point) =>
  new THREE.Vector3(ORIGIN_X + p.x * X, H - (ORIGIN_Y + p.z * Y), 0);
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
type Figure = {
  sprite: THREE.Sprite;
  enemy: boolean;
  point: Point;
  rig?: CutoutInstance;
  character?: CharacterRig;
  defender?: DefenderRig;
  pad?: THREE.Sprite;
  direction?: { x: number; y: number };
  statusGlyphs?: Map<StatusGlyphKind, StatusGlyph>;
};
function material(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
}
export class Battlefield {
  readonly renderer: THREE.WebGLRenderer;
  // The build constant removes instrumentation entirely from the game artifact.
  declare profileTiming: boolean;
  declare readonly frameProfile: {
    figuresMs: number;
    effectsMs: number;
    submissionMs: number;
    createdRigs: number;
    drawCalls: number;
  };
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera();
  private world = new THREE.Group();
  private backdrop: THREE.Sprite | null = null;
  private generation = 0;
  private sceneryKey: string | null = null;
  private gaitSampler = projectedPathSampler(
    [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ],
    position,
  );
  private figures = new Map<number, Figure>();
  private characterPool = new ResourcePool<CharacterRig>();
  private defenderPool = new ResourcePool<DefenderRig>();
  private shots = new Map<number, THREE.Mesh>();
  private effects = new EffectBatch();
  private combatText = new CombatText();
  private overlays = new OverlayBatch();
  private slowNetCue = new SlowNetCue();
  private textures: THREE.Texture[] = [];
  private owned: THREE.Texture[] = [];
  private sceneTextures: THREE.Texture[] = [];
  private range: THREE.Mesh;
  private selectionClock = 0;
  private baseGlow: THREE.Mesh;
  private cursor: THREE.Mesh;
  private selection: THREE.Mesh;
  private selectedMarker: THREE.Mesh;
  private rankText: THREE.Mesh;
  private rankCanvas = document.createElement("canvas");
  private rankTexture: THREE.CanvasTexture;
  private selectedRank = "";
  private observer: ResizeObserver;
  private characterRigs: Record<EnemyKind, CutoutResource> = {
    raider: new CutoutResource("rat-rig-v3"),
    runner: new CutoutResource("weasel-rig-v1"),
    armored: new CutoutResource("boar-rig-v1"),
    boss: new CutoutResource("badger-rig-v1"),
  };
  private directionalRigs: Record<
    EnemyKind,
    { front: CutoutResource; rear: CutoutResource }
  > = {
    raider: {
      front: new CutoutResource("rat-front-rig-v3"),
      rear: new CutoutResource("rat-rear-rig-v3"),
    },
    runner: {
      front: new CutoutResource("weasel-front-rig-v1"),
      rear: new CutoutResource("weasel-rear-rig-v1"),
    },
    armored: {
      front: new CutoutResource("boar-front-rig-v1"),
      rear: new CutoutResource("boar-rear-rig-v1"),
    },
    boss: {
      front: new CutoutResource("badger-front-rig-v1"),
      rear: new CutoutResource("badger-rear-rig-v1"),
    },
  };
  private defenderRigs = Object.fromEntries(
    Object.entries({
      bolt: "squirrel",
      stone: "skunk",
      net: "turtle",
    }).map(([kind, animal]) => [
      kind,
      {
        side: new CutoutResource(`${animal}-side-defender-v1`),
        front: new CutoutResource(`${animal}-front-defender-v1`),
        rear: new CutoutResource(`${animal}-rear-defender-v1`),
      },
    ]),
  ) as Record<
    TowerKind,
    {
      side: CutoutResource;
      front: CutoutResource | null;
      rear: CutoutResource | null;
    }
  >;
  private placementTile: THREE.Texture;
  private fired = new Map<number, { shots: number; at: number }>();
  private aim = new Map<number, number>();
  private width = 12;
  private depth = 8;
  preferGround = false;
  onPick: (p: Point) => void = () => {};
  onHover: (p: Point | null) => void = () => {};
  constructor(readonly host: HTMLElement) {
    if (__STORMWATCH_QA__) {
      this.profileTiming = false;
      this.frameProfile = {
        figuresMs: 0,
        effectsMs: 0,
        submissionMs: 0,
        createdRigs: 0,
        drawCalls: 0,
      };
    }
    this.placementTile = this.texture(
      "art/v2/defender-placement-tile/tile.webp",
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Battlefield. Choose a structure, then tap open ground.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    host.append(this.renderer.domElement);
    // Include top-row animal ears/selection marker and bottom-row tile edges.
    this.camera.position.set(W / 2, H / 2 + 50, 100);
    this.camera.near = 0.1;
    this.camera.far = 200;
    this.scene.add(this.world);
    this.range = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.3),
      selectionMaterial(),
    );
    this.range.renderOrder = 30;
    this.range.visible = false;
    this.scene.add(this.range);
    this.baseGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      selectionMaterial(true),
    );
    this.baseGlow.renderOrder = 29;
    this.baseGlow.visible = false;
    this.scene.add(this.baseGlow);
    this.cursor = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1, 48),
      material(0xffdf9b, 0.9),
    );
    this.cursor.scale.set(32, 16, 1);
    this.cursor.renderOrder = 40;
    this.cursor.visible = false;
    this.scene.add(this.cursor);
    const corners: THREE.Shape[] = [];
    for (const x of [-1, 1])
      for (const y of [-1, 1]) {
        for (const [w, h] of [
          [0.2, 0.025],
          [0.025, 0.2],
        ]) {
          const left = x < 0 ? -0.5 : 0.5 - w;
          const bottom = y < 0 ? -0.5 : 0.5 - h;
          corners.push(
            new THREE.Shape([
              new THREE.Vector2(left, bottom),
              new THREE.Vector2(left + w, bottom),
              new THREE.Vector2(left + w, bottom + h),
              new THREE.Vector2(left, bottom + h),
            ]),
          );
        }
      }
    this.selection = new THREE.Mesh(
      new THREE.ShapeGeometry(corners),
      material(0xffdf8c),
    );
    this.selection.renderOrder = 2999;
    this.selection.visible = false;
    this.scene.add(this.selection);
    this.selectedMarker = new THREE.Mesh(
      new THREE.PlaneGeometry(RANK_BADGE.width, RANK_BADGE.height),
      new THREE.MeshBasicMaterial({
        map: this.texture(RANK_BADGE.image),
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.selectedMarker.renderOrder = 3000;
    this.selectedMarker.visible = false;
    this.scene.add(this.selectedMarker);
    this.rankCanvas.width = RANK_BADGE.width * 4;
    this.rankCanvas.height = RANK_BADGE.height * 4;
    this.rankTexture = new THREE.CanvasTexture(this.rankCanvas);
    this.rankTexture.colorSpace = THREE.SRGBColorSpace;
    this.owned.push(this.rankTexture);
    this.rankText = new THREE.Mesh(
      new THREE.PlaneGeometry(RANK_BADGE.width, RANK_BADGE.height),
      new THREE.MeshBasicMaterial({
        map: this.rankTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.rankText.renderOrder = 3001;
    this.selectedMarker.add(this.rankText);
    const atlas = this.texture("art/sprite-atlas.webp", () => {
      for (const t of this.textures) {
        t.image = atlas.image;
        t.needsUpdate = true;
      }
    });
    this.textures = BOUNDS.map(([x, y, r, b]) => {
      const t = atlas.clone();
      t.offset.set(x / 1774, 1 - b / 887);
      t.repeat.set((r - x) / 1774, (b - y) / 887);
      this.owned.push(t);
      return t;
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener("pointerup", (e) => {
      if (e.button === 0) {
        const p = this.pick(e.clientX, e.clientY);
        if (p) this.onPick(p);
      }
    });
    this.renderer.domElement.addEventListener("pointermove", (e) =>
      this.onHover(this.pick(e.clientX, e.clientY)),
    );
    this.renderer.domElement.addEventListener("pointerleave", () =>
      this.onHover(null),
    );
  }
  private texture(path: string, ready?: () => void) {
    const t = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}${path}`,
      ready,
    );
    t.colorSpace = THREE.SRGBColorSpace;
    this.owned.push(t);
    return t;
  }
  private updateRank(level: number) {
    const label = rankLabel(level);
    if (label === this.selectedRank) return;
    const context = this.rankCanvas.getContext("2d")!;
    context.setTransform(4, 0, 0, 4, 0, 0);
    context.clearRect(0, 0, RANK_BADGE.width, RANK_BADGE.height);
    context.fillStyle = RANK_BADGE.background;
    context.beginPath();
    context.roundRect(4, 9, 32, 24, 5);
    context.fill();
    context.fillStyle = RANK_BADGE.color;
    context.font = `800 ${rankFontSize(label)}px Arial,sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 20, 21);
    this.rankTexture.needsUpdate = true;
    this.selectedRank = label;
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const aspect = width / height,
      span = Math.max(680, W / aspect);
    this.camera.left = (-span * aspect) / 2;
    this.camera.right = (span * aspect) / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.fitBackdrop();
  }
  private fitBackdrop() {
    if (!this.backdrop) return;
    const factor = Math.max(
      (this.camera.right - this.camera.left) / W,
      (this.camera.top - this.camera.bottom) / H,
    );
    this.backdrop.scale.set(W * factor, H * factor, 1);
  }
  load(level: LevelDef) {
    // Retrying an encounter resets actors, not its unchanged painted terrain.
    // Include the route itself so edited layouts never reuse a stale path.
    const sceneryKey = JSON.stringify([
      level.id,
      level.width,
      level.depth,
      level.path,
    ]);
    const retainScenery = this.sceneryKey === sceneryKey;
    this.clearWorld(retainScenery);
    if (retainScenery) return;
    this.sceneryKey = sceneryKey;
    this.gaitSampler = projectedPathSampler(level.path, position);
    this.width = level.width;
    this.depth = level.depth;
    let scenery: THREE.Sprite;
    const backdrop = this.texture(
      `art/v2/${level.id === "rainstone-crossing" ? "rainstone-riverbank-v2" : "woodland-clearing-v3"}/atlas.webp`,
      () => {
        if (scenery) scenery.visible = true;
      },
    );
    this.sceneTextures.push(backdrop);
    scenery = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: backdrop,
        depthTest: false,
        depthWrite: false,
      }),
    );
    scenery.visible = !!backdrop.image;
    scenery.position.set(W / 2, H / 2, 0);
    this.backdrop = scenery;
    this.fitBackdrop();
    scenery.renderOrder = 0;
    this.world.add(scenery);
    const canvas = document.createElement("canvas");
    const pathPadding = 320;
    canvas.width = (W + pathPadding * 2) * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.translate(pathPadding, 0);
    const pts = level.path.map((p) => ({
      x: position(p).x,
      y: H - position(p).y,
    }));
    // Continue the off-map entrance/exit into the scenery on wide stages.
    // Simulation waypoints are unchanged.
    if (pts[0].y === pts[1].y) pts[0].x = -pathPadding;
    if (pts.at(-1)!.y === pts.at(-2)!.y) pts.at(-1)!.x = W + pathPadding;
    const route = new Path2D();
    route.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1],
        b = pts[i],
        c = pts[i + 1],
        r = 15;
      const ab = Math.hypot(b.x - a.x, b.y - a.y),
        bc = Math.hypot(c.x - b.x, c.y - b.y);
      route.lineTo(b.x + ((a.x - b.x) * r) / ab, b.y + ((a.y - b.y) * r) / ab);
      route.quadraticCurveTo(
        b.x,
        b.y,
        b.x + ((c.x - b.x) * r) / bc,
        b.y + ((c.y - b.y) * r) / bc,
      );
    }
    route.lineTo(pts.at(-1)!.x, pts.at(-1)!.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [width, color] of [
      [65, "#27332645"],
      [57, "#55564085"],
      [49, "#79745b"],
      [39, "#968a6d"],
    ] as const) {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke(route);
    }
    const pathTexture = new THREE.CanvasTexture(canvas);
    pathTexture.colorSpace = THREE.SRGBColorSpace;
    this.sceneTextures.push(pathTexture);
    const generation = this.generation;
    const surface = new Image();
    surface.onload = () => {
      if (generation !== this.generation) return;
      const pattern = ctx.createPattern(surface, "repeat");
      if (!pattern) return;
      pattern.setTransform(new DOMMatrix().scale(200 / surface.width));
      ctx.strokeStyle = pattern;
      ctx.lineWidth = 45;
      ctx.stroke(route);
      ctx.strokeStyle = "#d4c69c25";
      ctx.lineWidth = 41;
      ctx.stroke(route);
      pathTexture.needsUpdate = true;
    };
    surface.src = `${import.meta.env.BASE_URL}art/v2/cobblestone-material-v1/atlas.webp`;

    const trail = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: pathTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    trail.position.set(W / 2, H / 2, 0);
    trail.scale.set(W + pathPadding * 2, H, 1);
    trail.renderOrder = 10;
    this.world.add(trail);
  }

  private releaseObject(root: THREE.Object3D) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => m.dispose());
      }
    });
  }
  private clearWorld(retainScenery = false) {
    if (!retainScenery) {
      this.generation++;
      this.backdrop = null;
      this.sceneryKey = null;
    }
    this.range.visible = false;
    this.baseGlow.visible = false;
    this.cursor.visible = false;
    this.selection.visible = false;
    this.selectedMarker.visible = false;
    for (const f of this.figures.values()) {
      if (f.character) {
        this.scene.remove(f.character.group);
        this.characterPool.release(f.character);
      }
      if (f.defender) {
        this.scene.remove(f.defender.group);
        this.defenderPool.release(f.defender);
      }
      if (f.rig) {
        this.scene.remove(f.rig.group);
        f.rig.dispose();
      }
      for (const o of [f.sprite, f.pad])
        if (o) {
          this.scene.remove(o);
          this.releaseObject(o);
        }
      for (const glyph of f.statusGlyphs?.values() ?? []) {
        this.scene.remove(glyph.group);
        glyph.dispose();
      }
    }
    this.figures.clear();
    this.fired.clear();
    this.aim.clear();
    this.trimMeshes(this.shots, new Set());
    this.effects.update([], position);
    this.combatText.update([], position);
    this.overlays.update([], [], position);
    this.slowNetCue.clear();
    if (retainScenery) return;
    this.releaseObject(this.world);
    this.world.clear();
    for (const t of this.sceneTextures) {
      t.dispose();
      const i = this.owned.indexOf(t);
      if (i >= 0) this.owned.splice(i, 1);
    }
    this.sceneTextures = [];
  }
  private figure(id: number, index: number, height: number, enemy = false) {
    let f = this.figures.get(id);
    if (f) return f;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.textures[index],
        transparent: true,
        alphaTest: 0.03,
        depthWrite: false,
        depthTest: false,
      }),
    );
    sprite.center.set(0.5, 0.06);
    const b = BOUNDS[index];
    sprite.scale.set((height * (b[2] - b[0])) / (b[3] - b[1]), height, 1);
    this.scene.add(sprite);
    f = { sprite, enemy, point: { x: 0, z: 0 } };
    this.figures.set(id, f);
    return f;
  }
  private updateStatusGlyphs(
    figure: Figure,
    point: Point,
    anchorHeight: number,
    views: readonly StatusGlyphView[],
  ) {
    const active = new Set<StatusGlyphKind>();
    for (const [index, view] of views.entries()) {
      active.add(view.kind);
      let glyph = figure.statusGlyphs?.get(view.kind);
      if (!glyph && (view.opacity > 0.005 || view.flash > 0.005)) {
        glyph = new StatusGlyph(view.kind);
        figure.statusGlyphs ??= new Map();
        figure.statusGlyphs.set(view.kind, glyph);
        this.scene.add(glyph.group);
      }
      if (!glyph) continue;
      const center = position(point);
      const horizontalOffset = (index - (views.length - 1) / 2) * 24;
      glyph.group.position.set(
        center.x + horizontalOffset,
        center.y + anchorHeight + 34,
        0,
      );
      glyph.update(view.opacity, view.flash, views.length > 1 ? 0.78 : 1);
    }
    for (const [kind, glyph] of figure.statusGlyphs ?? [])
      if (!active.has(kind)) glyph.update(0, 0);
  }
  pick(clientX: number, clientY: number): Point | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector3(
      ((clientX - r.left) / r.width) * 2 - 1,
      1 - ((clientY - r.top) / r.height) * 2,
      0,
    ).unproject(this.camera);
    // Tall tower silhouettes select their ground anchor, not the empty ground behind them.
    const towers = [...this.figures.values()]
      .filter((f) => !f.enemy)
      .sort((a, b) => b.sprite.renderOrder - a.sprite.renderOrder);
    for (const f of this.preferGround ? [] : towers) {
      const s = f.sprite;
      const bounds = f.defender?.bounds() ??
        f.rig?.bounds() ?? {
          left: -s.scale.x * s.center.x,
          right: s.scale.x * (1 - s.center.x),
          bottom: -s.scale.y * s.center.y,
          top: s.scale.y * (1 - s.center.y),
        };
      if (
        v.x >= s.position.x + bounds.left &&
        v.x <= s.position.x + bounds.right &&
        v.y >= s.position.y + bounds.bottom &&
        v.y <= s.position.y + bounds.top
      )
        return { ...f.point };
    }
    const p = {
      x: Math.round((v.x - ORIGIN_X) / X),
      z: Math.round((H - v.y - ORIGIN_Y) / Y),
    };
    return p.x >= 0 && p.x < this.width && p.z >= 0 && p.z < this.depth
      ? p
      : null;
  }
  project(p: Point) {
    const v = position(p).project(this.camera),
      r = this.renderer.domElement.getBoundingClientRect();
    return {
      x: r.left + ((v.x + 1) / 2) * r.width,
      y: r.top + ((1 - v.y) / 2) * r.height,
    };
  }
  highlight(p: Point | null, valid = true) {
    this.cursor.visible = !!p;
    if (p) {
      this.cursor.position.copy(position(p));
      (this.cursor.material as THREE.MeshBasicMaterial).color.set(
        valid ? 0xf2cf7b : 0xd97160,
      );
    }
  }
  update(game: Game, selected: number | null, _dt: number) {
    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (game.state.phase !== "paused" && !reducedMotion)
      this.selectionClock += _dt;
    for (const mesh of [this.range, this.baseGlow])
      (mesh.material as THREE.ShaderMaterial).uniforms.time.value =
        this.selectionClock;
    const profileStart =
      __STORMWATCH_QA__ && this.profileTiming ? performance.now() : 0;
    if (__STORMWATCH_QA__ && this.profileTiming)
      this.frameProfile.createdRigs = 0;
    const s = game.state,
      ids = new Set<number>();
    for (const t of s.towers) {
      ids.add(t.id);
      const f = this.figure(t.id, game.towers[t.kind].sprite, 150);
      f.sprite.visible = false;
      f.point = { x: t.x, z: t.z };
      f.sprite.position.copy(position(t));
      f.sprite.renderOrder = 1000 + ORIGIN_Y + t.z * Y;
      f.sprite.material.color.set(t.level === 2 ? 0xffe6ac : 0xffffff);
      this.updateStatusGlyphs(f, t, 98, []);
      {
        let fired = this.fired.get(t.id);
        if (!fired || fired.shots !== t.shots) {
          fired = { shots: t.shots, at: t.shots ? s.clock : -100 };
          this.fired.set(t.id, fired);
        }
        const defenderResources = this.defenderRigs[t.kind];
        if (defenderResources.side.definition) {
          const target = s.enemies
            .filter((e) => Math.hypot(e.x - t.x, e.z - t.z) <= game.range(t))
            .sort((a, b) => b.distance - a.distance)[0];
          let view: "side" | "front" | "rear" = "side",
            mirrored = false;
          if (target) {
            const dx = (target.x - t.x) * X,
              dy = (target.z - t.z) * Y;
            if (Math.abs(dy) > Math.abs(dx)) view = dy > 0 ? "front" : "rear";
            else mirrored = dx < 0;
          } else if (f.defender) {
            view = f.defender.cutout.resource.definition?.view ?? "side";
            mirrored = f.defender.mirrored;
          }
          let resource = defenderResources[view];
          if (!resource?.definition) resource = defenderResources.side;
          // Preserve the release pose so the visual muzzle cannot jump views
          // during the first frames of a shot.
          if (f.defender && s.clock - fired.at < 0.16) {
            resource = f.defender.cutout.resource;
            mirrored = f.defender.mirrored;
          }
          if (
            f.defender &&
            (f.defender.cutout.resource !== resource ||
              f.defender.mirrored !== mirrored)
          ) {
            this.scene.remove(f.defender.group);
            this.defenderPool.release(f.defender);
            f.defender = undefined;
          }
          if (!f.defender) {
            const height = 98;
            f.defender = this.defenderPool.acquire(
              `${resource!.definition!.id}:${height}:${mirrored}`,
              () => {
                if (__STORMWATCH_QA__ && this.profileTiming)
                  this.frameProfile.createdRigs++;
                return new DefenderRig(resource!, height, mirrored);
              },
            );
            this.scene.add(f.defender.group);
          }
          if (f.rig) {
            this.scene.remove(f.rig.group);
            f.rig.dispose();
            f.rig = undefined;
          }
          if (!f.pad) {
            f.pad = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: this.placementTile,
                transparent: true,
                depthTest: false,
                depthWrite: false,
              }),
            );
            f.pad.scale.set(80, 36, 1);
            f.pad.renderOrder = 40;
            this.scene.add(f.pad);
          }
          f.pad.position.copy(position(t));
          f.defender.group.position.copy(position(t));
          f.defender.update(
            s.clock - fired.at,
            t.cooldown,
            f.sprite.renderOrder,
          );
          continue;
        }
      }
    }
    for (const e of s.enemies) {
      ids.add(e.id);
      const height = enemyHeight(e);
      const f = this.figure(e.id, game.enemies[e.kind].sprite, height, true);
      f.sprite.visible = !!f.sprite.material.map?.image;
      const dx = e.x - f.point.x,
        dz = e.z - f.point.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.00001) {
        const d = Math.hypot(dx, dz);
        f.direction = { x: (dx / d) * X, y: (-dz / d) * Y };
      }
      f.point = { x: e.x, z: e.z };
      f.sprite.position.copy(position(e));
      f.sprite.renderOrder = 1000 + ORIGIN_Y + e.z * Y;
      f.sprite.material.color.set(
        !e.shieldRaised && s.clock - e.hitAt < 0.1
          ? 0xffc5a2
          : e.slowUntil > s.clock
            ? 0xb9dfd1
            : e.rallyUntil !== undefined && e.rallyUntil > s.clock
              ? 0xffd28e
              : 0xffffff,
      );
      const guard = ratShieldState(s.clock - e.spawnedAt, e.shieldCycle);
      const flashAge =
        e.shieldHitAt === undefined ? Infinity : s.clock - e.shieldHitAt;
      const flash = flashAge >= 0 && flashAge < 0.24 ? 1 - flashAge / 0.24 : 0;
      const evasion = weaselEvasionState(s.clock - e.spawnedAt, e.evasionCycle);
      const evadeAge =
        e.evadeAt === undefined || e.evadeAt < 0
          ? Infinity
          : s.clock - e.evadeAt;
      const evadeFlash = evadeAge < 0.25 ? 1 - evadeAge / 0.25 : 0;
      const sidestep =
        reducedMotion || evadeAge >= 0.28
          ? 0
          : Math.sin((evadeAge / 0.28) * Math.PI) * 18;
      const direction = f.direction ?? { x: 1, y: 0 };
      const directionLength = Math.hypot(direction.x, direction.y);
      const evadeOffset = new THREE.Vector3(
        (-direction.y / directionLength) * sidestep,
        (direction.x / directionLength) * sidestep,
        0,
      );
      f.sprite.position.add(evadeOffset);
      const rallyWarning =
        e.kind === "boss" &&
        e.nextRallyAt !== undefined &&
        s.clock >= e.nextRallyAt - game.rules.boss.warningSeconds &&
        s.clock < e.nextRallyAt;
      const statuses: StatusGlyphView[] = [];
      if (e.kind === "raider")
        statuses.push({ kind: "shield", opacity: guard.strength, flash });
      if (e.kind === "runner")
        statuses.push({
          kind: "evade",
          opacity: evasion.active ? 1 : evasion.warning ? 0.35 : 0,
          flash: evadeFlash,
        });
      if (e.rallyUntil !== undefined && e.rallyUntil > s.clock)
        statuses.push({ kind: "rally", opacity: 1, flash: 0 });
      if (rallyWarning)
        statuses.push({
          kind: "rally",
          opacity: 1,
          flash: Math.sin(
            (s.clock - (e.nextRallyAt! - game.rules.boss.warningSeconds)) *
              Math.PI,
          ),
        });
      this.updateStatusGlyphs(f, e, height, statuses);
      const next = pointOnPath(game.level.path, e.distance + 0.02);
      const vertical = Math.abs(next.z - e.z) > Math.abs(next.x - e.x);
      const desiredRig = vertical
        ? next.z > e.z
          ? this.directionalRigs[e.kind].front
          : this.directionalRigs[e.kind].rear
        : this.characterRigs[e.kind];
      const characterResource = desiredRig.definition
        ? desiredRig
        : this.characterRigs[e.kind];
      if (characterResource.definition) {
        if (f.character && f.character.cutout.resource !== characterResource) {
          this.scene.remove(f.character.group);
          this.characterPool.release(f.character);
          f.character = undefined;
        }
        if (!f.character) {
          f.character = this.characterPool.acquire(
            `${characterResource.definition.id}:${height}`,
            () => {
              if (__STORMWATCH_QA__ && this.profileTiming)
                this.frameProfile.createdRigs++;
              return new CharacterRig(characterResource, height);
            },
          );
          this.scene.add(f.character.group);
        }
        f.sprite.visible = false;
        f.character.group.position.copy(position(e)).add(evadeOffset);
        f.character.update(
          e.distance,
          this.gaitSampler,
          f.sprite.renderOrder,
          f.sprite.material.color,
          e.shieldRaised ? Infinity : s.clock - e.hitAt,
          e.shieldRaised,
        );
      }
    }
    for (const [id, f] of this.figures)
      if (!ids.has(id)) {
        if (f.character) {
          this.scene.remove(f.character.group);
          this.characterPool.release(f.character);
        }
        if (f.defender) {
          this.scene.remove(f.defender.group);
          this.defenderPool.release(f.defender);
        }
        if (f.rig) {
          this.scene.remove(f.rig.group);
          f.rig.dispose();
        }
        this.fired.delete(id);
        this.aim.delete(id);
        for (const o of [f.sprite, f.pad])
          if (o) {
            this.scene.remove(o);
            this.releaseObject(o);
          }
        for (const glyph of f.statusGlyphs?.values() ?? []) {
          this.scene.remove(glyph.group);
          glyph.dispose();
        }
        this.figures.delete(id);
      }
    this.overlays.update(s.towers, s.enemies, position);
    if (!this.overlays.group.parent) this.scene.add(this.overlays.group);
    this.slowNetCue.update(s.enemies, s.clock, position);
    if (!this.slowNetCue.group.parent) this.scene.add(this.slowNetCue.group);
    const selectedTower = s.towers.find((t) => t.id === selected);
    this.selection.visible = false;
    this.selectedMarker.visible = false;
    this.range.visible = !!selectedTower;
    this.baseGlow.visible = !!selectedTower;
    if (selectedTower) {
      this.updateRank(selectedTower.level);
      const r = game.range(selectedTower);
      this.baseGlow.position.copy(position(selectedTower));
      this.baseGlow.scale.set(110, 55, 1);
      (this.selection.material as THREE.MeshBasicMaterial).opacity =
        0.65 + 0.3 * Math.sin(this.selectionClock * 2.8);
      this.range.scale.set(r * X, r * Y, 1);
      this.range.position.copy(position(selectedTower));
      const defender = this.figures.get(selectedTower.id)?.defender;
      if (defender) {
        this.selection.position.copy(position(selectedTower));
        this.selection.scale.set(76, 36, 1);
        this.selection.visible = true;
      }
      const rig = this.figures.get(selectedTower.id)?.rig;
      this.selectedMarker.position.copy(position(selectedTower));
      this.selectedMarker.position.y +=
        (defender?.bounds().top ?? rig?.bounds().top ?? 150) +
        28 +
        (reducedMotion ? 0 : Math.sin(this.selectionClock * 3) * 5);
      this.selectedMarker.visible = true;
      const base = rig?.resource.definition?.parts.find(
        (part) => !part.attachTo,
      );
      if (rig && base) {
        const scale = rig.group.scale.x * base.scale;
        this.selection.scale.set(
          base.rect[2] * scale + 8,
          base.rect[3] * scale + 8,
          1,
        );
        this.selection.position
          .copy(position(selectedTower))
          .add(
            new THREE.Vector3(
              (base.rect[2] / 2 - base.pivot[0]) * scale,
              (base.pivot[1] - base.rect[3] / 2) * scale,
              0,
            ),
          );
        this.selection.visible = true;
      }
    }
    const figuresEnd =
      __STORMWATCH_QA__ && this.profileTiming ? performance.now() : 0;
    const shotIds = new Set<number>();
    for (const p of s.shots) {
      shotIds.add(p.id);
      let m = this.shots.get(p.id);
      if (!m) {
        m = new THREE.Mesh(
          p.kind === "bolt"
            ? new THREE.ShapeGeometry(
                new THREE.Shape([
                  new THREE.Vector2(-10, -1.2),
                  new THREE.Vector2(5, -1.2),
                  new THREE.Vector2(3, -4),
                  new THREE.Vector2(11, 0),
                  new THREE.Vector2(3, 4),
                  new THREE.Vector2(5, 1.2),
                  new THREE.Vector2(-10, 1.2),
                ]),
              )
            : p.kind === "net"
              ? netGeometry()
              : new THREE.CircleGeometry(7, 12),
          material(
            p.kind === "net"
              ? 0xc6ba8c
              : p.kind === "stone"
                ? 0xb0ac99
                : 0xffd989,
          ),
        );
        m.renderOrder = 2500;
        this.shots.set(p.id, m);
        this.scene.add(m);
      }
      const k = Math.min(1, p.life / p.duration);
      const sourceTower = s.towers.find(
        (t) => t.x === p.source.x && t.z === p.source.z,
      );
      const muzzle = sourceTower
        ? (this.figures.get(sourceTower.id)?.defender?.muzzle() ??
          this.figures.get(sourceTower.id)?.rig?.muzzle())
        : null;
      if (!m.userData.origin)
        m.userData.origin =
          muzzle?.clone() ??
          position(p.source).add(new THREE.Vector3(0, 55, 0));
      const origin = m.userData.origin as THREE.Vector3;
      const target = position(p.target).add(new THREE.Vector3(0, 35, 0));
      m.position.lerpVectors(origin, target, k);
      m.rotation.z = Math.atan2(
        target.y -
          origin.y +
          Math.cos(k * Math.PI) * Math.PI * (p.kind === "stone" ? 95 : 6),
        target.x - origin.x,
      );
      if (p.kind === "net") {
        const spread = THREE.MathUtils.smoothstep(k, 0, 0.8);
        m.scale.set(0.4 + spread * 1.2, 0.2 + spread * 1.4, 1);
        m.rotation.z += Math.PI / 4;
      }
      m.position.y += Math.sin(k * Math.PI) * (p.kind === "stone" ? 95 : 6);
    }
    this.trimMeshes(this.shots, shotIds);
    this.effects.update(
      s.effects.filter((effect) => effect.kind !== "evade"),
      position,
    );
    this.combatText.update(s.effects, position);
    if (!this.combatText.group.parent) this.scene.add(this.combatText.group);
    if (!this.effects.mesh.parent) this.scene.add(this.effects.mesh);
    const effectsEnd =
      __STORMWATCH_QA__ && this.profileTiming ? performance.now() : 0;
    this.renderer.render(this.scene, this.camera);
    if (__STORMWATCH_QA__ && this.profileTiming) {
      this.frameProfile.figuresMs = figuresEnd - profileStart;
      this.frameProfile.effectsMs = effectsEnd - figuresEnd;
      this.frameProfile.submissionMs = performance.now() - effectsEnd;
      this.frameProfile.drawCalls = this.renderer.info.render.calls;
    }
  }
  private trimMeshes(map: Map<number, THREE.Mesh>, active: Set<number>) {
    for (const [id, m] of map)
      if (!active.has(id)) {
        this.scene.remove(m);
        this.releaseObject(m);
        map.delete(id);
      }
  }
  dispose() {
    this.observer.disconnect();
    this.clearWorld();
    this.effects.dispose();
    this.combatText.dispose();
    this.overlays.dispose();
    this.slowNetCue.dispose();
    this.characterPool.dispose();
    this.defenderPool.dispose();
    this.owned.forEach((t) => t.dispose());
    Object.values(this.characterRigs).forEach((r) => r.dispose());
    Object.values(this.directionalRigs).forEach(({ front, rear }) => {
      front.dispose();
      rear.dispose();
    });
    Object.values(this.defenderRigs).forEach((views) =>
      Object.values(views).forEach((r) => r?.dispose()),
    );
    [
      this.range,
      this.baseGlow,
      this.cursor,
      this.selection,
      this.selectedMarker,
    ].forEach((o) => this.releaseObject(o));
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
