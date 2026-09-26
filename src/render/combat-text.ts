import * as THREE from "three";
import type { Effect, Point } from "../sim/types";

/** One shared label texture; short-lived sprites follow simulation effect ages. */
export class CombatText {
  readonly group = new THREE.Group();
  private readonly texture: THREE.CanvasTexture;
  private readonly labels = new Map<number, THREE.Sprite>();
  constructor() {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;
    context.font = "bold 36px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 7;
    context.strokeStyle = "#302319";
    context.strokeText("Evade", 96, 32);
    context.fillStyle = "#ffe080";
    context.fillText("Evade", 96, 32);
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }
  update(effects: readonly Effect[], project: (point: Point) => THREE.Vector3) {
    const active = new Set<number>();
    for (const effect of effects) {
      if (effect.kind !== "evade") continue;
      active.add(effect.id);
      let label = this.labels.get(effect.id);
      if (!label) {
        label = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: this.texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
        );
        label.scale.set(84, 28, 1);
        label.renderOrder = 4010;
        this.labels.set(effect.id, label);
        this.group.add(label);
      }
      const fraction = effect.age / effect.ttl;
      label.position.copy(project(effect));
      label.position.y += 100 + fraction * 40;
      label.material.opacity = Math.min(1, (1 - fraction) * 2);
    }
    for (const [id, label] of this.labels) {
      if (active.has(id)) continue;
      this.group.remove(label);
      label.material.dispose();
      this.labels.delete(id);
    }
  }
  dispose() {
    this.update([], () => new THREE.Vector3());
    this.texture.dispose();
  }
}
