import { expect, it } from "vitest";
import * as THREE from "three";
import { OverlayBatch } from "../src/render/overlay-batch";
import type { Enemy, Tower } from "../src/sim/types";
const project = ({ x, z }: { x: number; z: number }) => ({
  x: 112 + x * 96,
  y: 614 - z * 74,
});
const enemy = (id: number, hp = 50): Enemy => ({
  id,
  kind: "raider",
  x: 2,
  z: 3,
  hp,
  maxHp: 100,
  distance: 1,
  slowUntil: 0,
  alive: true,
  hitAt: -1,
  spawnedAt: 0,
  shieldRaised: false,
  shieldChangedAt: -1,
  shieldHitAt: -1,
});
const tower: Tower = {
  id: 1,
  kind: "bolt",
  x: 1,
  z: 1,
  level: 1,
  spent: 55,
  cooldown: 0,
  shots: 0,
};
it("preserves shadow and injured health-bar transforms and painter layers", () => {
  const batch = new OverlayBatch();
  batch.update([tower], [enemy(2), enemy(3, 100)], project);
  const matrix = new THREE.Matrix4();
  batch.shadows.getMatrixAt(0, matrix);
  expect(matrix.elements[0]).toBe(36);
  expect(matrix.elements[5]).toBeCloseTo(36 * 0.35);
  expect(matrix.elements[12]).toBe(208);
  expect(matrix.elements[13]).toBe(540);
  batch.shadows.getMatrixAt(1, matrix);
  expect(matrix.elements[0]).toBe(22);
  expect(batch.backgrounds.count).toBe(1);
  batch.health.getMatrixAt(0, matrix);
  expect(matrix.elements[0]).toBe(0.5);
  expect(matrix.elements[12]).toBe(304);
  expect(matrix.elements[13]).toBe(614 - 3 * 74 + 88 + 9);
  expect(batch.backgrounds.renderOrder).toBeGreaterThan(3000);
  expect(batch.health.renderOrder).toBeGreaterThan(
    batch.backgrounds.renderOrder,
  );
  expect(batch.shadows.renderOrder).toBe(45);
  batch.dispose();
});
it("grows without extra scene objects and clears stale instances", () => {
  const batch = new OverlayBatch();
  batch.update(
    [tower],
    Array.from({ length: 60 }, (_, i) => enemy(i + 2)),
    project,
  );
  expect(batch.group.children).toHaveLength(3);
  expect(batch.shadows.count).toBe(61);
  expect(batch.health.count).toBe(60);
  batch.update([], [], project);
  for (const mesh of [batch.shadows, batch.backgrounds, batch.health]) {
    expect(mesh.count).toBe(0);
    expect(mesh.visible).toBe(false);
  }
  batch.update([], [{ ...enemy(5, 0), kind: "boss" }], project);
  const matrix = new THREE.Matrix4();
  batch.health.getMatrixAt(0, matrix);
  expect(matrix.elements[0]).toBe(0);
  expect(matrix.elements[13]).toBe(614 - 3 * 74 + 142 + 9);
  expect(batch.group.children).toHaveLength(3);
  batch.dispose();
  expect(batch.group.children).toHaveLength(0);
});
