import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { EffectBatch } from "../src/render/effect-batch";
import type { Effect } from "../src/sim/types";

const project = ({ x, z }: { x: number; z: number }) => ({
  x: 112 + x * 96,
  y: 614 - z * 74,
});
const effect = (id: number, kind: Effect["kind"], age = 0.4): Effect => ({
  id,
  kind,
  age,
  ttl: 1,
  x: id % 12,
  z: id % 8,
});

describe("batched effect appearance", () => {
  it("matches individual ring geometry, transformed positions, colour and fading", () => {
    const batch = new EffectBatch();
    const source = new THREE.RingGeometry(0.7, 1, 24);
    const effects = [
      effect(1, "hit"),
      effect(2, "splash"),
      effect(3, "supply", 0.75),
    ];
    batch.update(effects, project);
    const positions = batch.mesh.geometry.attributes.position;
    const colors = batch.mesh.geometry.attributes.color;
    const v = source.attributes.position;
    effects.forEach((fx, n) => {
      const center = project(fx);
      const size =
        (fx.kind === "supply" ? 130 : fx.kind === "splash" ? 60 : 18) *
        (0.2 + fx.age * 0.8);
      const color = new THREE.Color(fx.kind === "supply" ? 0xf5d085 : 0xdab575);
      for (let i = 0; i < v.count; i++) {
        const index = n * v.count + i;
        expect(positions.getX(index)).toBeCloseTo(
          center.x + v.getX(i) * size,
          3,
        );
        expect(positions.getY(index)).toBeCloseTo(
          center.y + v.getY(i) * size * 0.45,
          3,
        );
        expect(colors.getX(index)).toBeCloseTo(color.r, 6);
        expect(colors.getY(index)).toBeCloseTo(color.g, 6);
        expect(colors.getZ(index)).toBeCloseTo(color.b, 6);
        expect(colors.getW(index)).toBeCloseTo((1 - fx.age) * 0.7, 6);
      }
      for (let i = 0; i < source.index!.count; i++)
        expect(
          batch.mesh.geometry.index!.getX(n * source.index!.count + i),
        ).toBe(source.index!.getX(i) + n * v.count);
    });
    expect(batch.mesh.geometry.drawRange.count).toBe(
      effects.length * source.index!.count,
    );
    source.dispose();
    batch.dispose();
  });

  it("grows for the stress population and removes stale rings after shrinking or clearing", () => {
    const batch = new EffectBatch();
    batch.update([effect(1, "hit")], project);
    const first = batch.mesh.geometry;
    batch.update(
      Array.from({ length: 150 }, (_, i) => effect(i, "slow")),
      project,
    );
    expect(batch.mesh.geometry).not.toBe(first);
    const capacityGeometry = batch.mesh.geometry;
    batch.update([effect(2, "coin")], project);
    expect(batch.mesh.geometry).toBe(capacityGeometry);
    expect(batch.mesh.geometry.drawRange.count).toBe(144);
    batch.update([], project);
    expect(batch.mesh.visible).toBe(false);
    expect(batch.mesh.geometry.drawRange.count).toBe(0);
    batch.dispose();
  });
});
