import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { StatusGlyph } from "../src/render/status-glyph";

describe("overhead status glyph", () => {
  it("fades with the status, flashes when hit, then hides", () => {
    const glyph = new StatusGlyph("shield");
    const fill = glyph.group.children.find(
      (
        child,
      ): child is THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial> =>
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshBasicMaterial,
    )!;

    glyph.update(0, 0);
    expect(glyph.group.visible).toBe(false);
    glyph.update(0.5, 0);
    const guardOpacity = fill.material.opacity;
    expect(glyph.group.visible).toBe(true);
    expect(guardOpacity).toBeGreaterThan(0);

    glyph.update(0.5, 1);
    expect(fill.material.opacity).toBeGreaterThan(guardOpacity);
    expect(fill.material.color.r).toBeGreaterThan(0.9);
    expect(glyph.group.scale.x).toBeGreaterThan(1);

    glyph.update(0, 0);
    expect(glyph.group.visible).toBe(false);
    glyph.dispose();
  });
});
