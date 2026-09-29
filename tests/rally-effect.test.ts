import { expect, it } from "vitest";
import { RallyEffect } from "../src/render/rally-effect";
it("keeps escort-only feedback transforms finite and freezes presentation at a paused clock", () => {
  const effect = new RallyEffect();
  effect.update(12, { x: 1, y: 0 }, true, Infinity, false);
  effect.group.updateMatrixWorld(true);
  effect.group.traverse((object) =>
    expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true),
  );
  const before = effect.group.children.map((object) =>
    object.matrixWorld.toArray(),
  );
  effect.update(12, { x: 1, y: 0 }, true, Infinity, false);
  effect.group.updateMatrixWorld(true);
  expect(
    effect.group.children.map((object) => object.matrixWorld.toArray()),
  ).toEqual(before);
  effect.update(15, { x: 1, y: 0 }, false, Infinity, false);
  expect(effect.group.visible).toBe(false);
  effect.dispose();
});
