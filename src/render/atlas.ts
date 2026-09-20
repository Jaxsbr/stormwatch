import * as THREE from "three";
import { validateClip, type AnimationClip } from "./animation";

export interface AtlasManifest {
  sheet: { columns: number; rows: number };
  width: number;
  height: number;
  texture: string;
  pivot: [number, number];
  clips: Record<string, AnimationClip>;
  frames: {
    rect: [number, number, number, number];
    anchor?: [number, number];
  }[];
}
/** Each immutable frame texture is shared by every actor using this atlas. */
export class AnimatedAtlas {
  readonly frames: THREE.Texture[] = [];
  private disposed = false;
  manifest: AtlasManifest | null = null;
  constructor(id: string) {
    void this.load(id).catch((error) =>
      console.warn(`Animation atlas ${id} unavailable`, error),
    );
  }
  private async load(id: string) {
    const response = await fetch(
      `${import.meta.env.BASE_URL}art/v2/${id}/manifest.json`,
    );
    if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
    const manifest = (await response.json()) as AtlasManifest;
    for (const clip of Object.values(manifest.clips))
      validateClip(clip, manifest.frames.length);
    const texture = await new THREE.TextureLoader().loadAsync(
      `${import.meta.env.BASE_URL}${manifest.texture}`,
    );
    if (this.disposed) {
      texture.dispose();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    for (const {
      rect: [x, y, w, h],
    } of manifest.frames) {
      const frame = texture.clone();
      frame.offset.set(x / manifest.width, 1 - (y + h) / manifest.height);
      frame.repeat.set(w / manifest.width, h / manifest.height);
      frame.needsUpdate = true;
      this.frames.push(frame);
    }
    texture.dispose();
    this.manifest = manifest;
  }
  apply(sprite: THREE.Sprite, index: number, height: number) {
    if (!this.manifest || !this.frames[index]) return false;
    const f = this.manifest.frames[index],
      [, , w, h] = f.rect;
    const anchor = f.anchor ?? [
      w * this.manifest.pivot[0],
      h * this.manifest.pivot[1],
    ];
    if (sprite.material.map !== this.frames[index]) {
      sprite.material.map = this.frames[index];
      sprite.material.needsUpdate = true;
    }
    sprite.center.set(anchor[0] / w, 1 - anchor[1] / h);
    // One scale for the sheet, never resize each silhouette to its bounding box.
    const scale = height / (this.manifest.height / this.manifest.sheet.rows);
    sprite.scale.set(w * scale, h * scale, 1);
    return true;
  }
  dispose() {
    this.disposed = true;
    this.frames.forEach((t) => t.dispose());
    this.frames.length = 0;
  }
}
