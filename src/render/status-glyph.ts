import * as THREE from "three";

export type StatusGlyphKind = "shield" | "evade" | "rally";

export interface StatusGlyphView {
  kind: StatusGlyphKind;
  opacity: number;
  flash: number;
}

function shieldShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-12, 11);
  shape.lineTo(12, 11);
  shape.lineTo(10, -2);
  shape.quadraticCurveTo(8, -11, 0, -16);
  shape.quadraticCurveTo(-8, -11, -10, -2);
  shape.closePath();
  return shape;
}

function rallyShape() {
  const shape = new THREE.Shape();
  // Two forward chevrons: the caster grants movement speed, not a sound status.
  for (const x of [-15, 1]) {
    shape.moveTo(x, -12);
    shape.lineTo(x + 9, 0);
    shape.lineTo(x, 12);
    shape.lineTo(x + 7, 12);
    shape.lineTo(x + 16, 0);
    shape.lineTo(x + 7, -12);
    shape.closePath();
  }
  return shape;
}

/** Reusable overhead effect marker; each actor can show several status kinds. */
export class StatusGlyph {
  readonly group = new THREE.Group();
  private readonly glow: THREE.Mesh<
    THREE.ShapeGeometry,
    THREE.MeshBasicMaterial
  >;
  private readonly fill: THREE.Mesh<
    THREE.ShapeGeometry,
    THREE.MeshBasicMaterial
  >;
  private readonly outline: THREE.LineLoop<
    THREE.BufferGeometry,
    THREE.LineBasicMaterial
  >;

  constructor(readonly kind: StatusGlyphKind) {
    const shape =
      kind === "shield"
        ? shieldShape()
        : kind === "evade"
          ? new THREE.Shape([
              new THREE.Vector2(-13, -12),
              new THREE.Vector2(-1, 0),
              new THREE.Vector2(-13, 12),
              new THREE.Vector2(-3, 12),
              new THREE.Vector2(9, 0),
              new THREE.Vector2(-3, -12),
            ])
          : rallyShape();
    this.glow = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0x9be2ff,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.glow.scale.set(1.55, 1.55, 1);
    this.glow.renderOrder = 3998;
    this.fill = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0x67bce9,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.fill.renderOrder = 3999;
    this.outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(shape.getPoints(20)),
      new THREE.LineBasicMaterial({
        color: 0xdaf5ff,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.outline.renderOrder = 4000;
    this.group.add(this.glow, this.fill, this.outline);
  }

  update(opacity: number, flash: number, scaleFactor = 1) {
    const alpha = THREE.MathUtils.clamp(opacity, 0, 1);
    const pulse = THREE.MathUtils.clamp(flash, 0, 1);
    const bright = new THREE.Color(0xffffff);
    this.group.visible = alpha > 0.005 || pulse > 0.005;
    this.fill.material.opacity = alpha * (0.48 + 0.34 * pulse);
    const color =
      this.kind === "shield"
        ? [0x67bce9, 0xdaf5ff, 0x9be2ff]
        : this.kind === "evade"
          ? [0xffcf54, 0xfff2ae, 0xffdf75]
          : [0xffa43c, 0xffedb3, 0xffc05c];
    this.fill.material.color.set(color[0]).lerp(bright, pulse * 0.8);
    this.outline.material.opacity = alpha * (0.88 + 0.12 * pulse);
    this.outline.material.color.set(color[1]).lerp(bright, pulse);
    this.glow.material.opacity = alpha * 0.16 + pulse * 0.7;
    this.glow.material.color.set(color[2]).lerp(bright, pulse);
    const scale = scaleFactor * (1 + pulse * 0.22);
    this.group.scale.set(scale, scale, 1);
  }

  dispose() {
    this.glow.geometry.dispose();
    this.glow.material.dispose();
    this.fill.geometry.dispose();
    this.fill.material.dispose();
    this.outline.geometry.dispose();
    this.outline.material.dispose();
    this.group.clear();
  }
}
