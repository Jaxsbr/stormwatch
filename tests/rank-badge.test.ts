import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";
import { rankBadge, rankLabel } from "../src/ui/rank-badge";

describe("shared rank badge", () => {
  it("normalizes invalid ranks and fractions", () => {
    for (const level of [NaN, Infinity, -Infinity, -4, 0, 0.5])
      expect(rankLabel(level)).toBe("1");
    expect(rankLabel(3.9)).toBe("3");
  });

  it("supports ranks beyond two with bounded labels", () => {
    for (const level of [1, 2, 3, 12, 999, 9999])
      expect(rankLabel(level)).toBe(String(level));
    expect(rankLabel(10000)).toBe("1.0e4");
    expect(rankLabel(Number.MAX_VALUE).length).toBeLessThanOrEqual(6);
  });

  it("uses one image and one numeric label in a fixed footprint", () => {
    for (const level of [1, 2, 12, 9999, 10000, Number.MAX_VALUE]) {
      const html = rankBadge(level);
      expect(html.match(/<img /g)).toHaveLength(1);
      expect(html).toContain("battle-icons-v1/marker.webp");
      expect(html).toContain(`aria-label="Rank ${rankLabel(level)}"`);
      expect(html).toContain(`>${rankLabel(level)}</span>`);
      expect(html).toContain("width:40px;height:44px");
      expect(html).not.toContain("of 2");
    }
  });

  it("reuses the text texture and uploads only when the normalized rank changes", () => {
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
    };
    const texture = new THREE.Texture();
    // Exercise the real renderer method without constructing a WebGL context.
    const renderer = Object.assign(Object.create(Battlefield.prototype), {
      selectedRank: "",
      rankCanvas: { getContext: () => context },
      rankTexture: texture,
    }) as { updateRank(level: number): void };
    renderer.updateRank(1);
    const version = texture.version;
    renderer.updateRank(1);
    renderer.updateRank(1.9);
    expect(context.fillText).toHaveBeenCalledTimes(1);
    expect(texture.version).toBe(version);
    renderer.updateRank(12);
    expect(context.fillText).toHaveBeenLastCalledWith("12", 20, 21);
    expect(texture.version).toBe(version + 1);
    texture.dispose();
  });
});
