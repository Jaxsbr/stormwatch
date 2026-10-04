import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";
import { LEVELS } from "../src/content/levels";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../src/config/configuration";
import { useRouteLayout } from "../src/workbench/route-authoring";

// Mock only the browser/WebGL boundary; execute real Battlefield ownership.
let viewportBounds;
vi.mock("three", async (original) => {
  const actual = await original();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = {
        style: {},
        setAttribute() {},
        addEventListener() {},
        remove() {},
        getBoundingClientRect() {
          const width = parseFloat(this.style.width) || viewportBounds.width;
          const height = parseFloat(this.style.height) || viewportBounds.height;
          return {
            width,
            height,
            left: viewportBounds.left + (viewportBounds.width - width) / 2,
            top: viewportBounds.top + (viewportBounds.height - height) / 2,
          };
        },
      };
      setSize = vi.fn((width, height, updateStyle) => {
        if (updateStyle)
          Object.assign(this.domElement.style, {
            width: `${width}px`,
            height: `${height}px`,
          });
      });
      lost = false;
      setPixelRatio() {}
      dispose() {}
      getContext() {
        return { isContextLost: () => this.lost };
      }
      forceContextLoss() {
        this.lost = true;
      }
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function fixture() {
  vi.useFakeTimers();
  const context = new Proxy({}, { get: () => () => {} });
  vi.stubGlobal("document", {
    createElement: () => ({ getContext: () => context }),
  });
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal(
    "Path2D",
    class {
      moveTo() {}
      lineTo() {}
      quadraticCurveTo() {}
    },
  );
  vi.stubGlobal(
    "Image",
    class {
      addEventListener() {}
      set src(_path) {}
    },
  );
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  let notify = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation((url) =>
    Object.assign(new THREE.Texture(), { name: url }),
  );
  const bounds = { width: 1280, height: 720, left: 23, top: 47 };
  viewportBounds = bounds;
  const host = { append() {}, getBoundingClientRect: () => bounds };
  return {
    field: new Battlefield(host),
    bounds,
    notify: () => notify(),
  };
}

const SIZES = [
  [1280, 720],
  [844, 390],
  [1024, 768],
  [390, 844],
  [768, 1024],
  [420, 720],
];
it.each(SIZES)(
  "keeps painted landmarks registered to world paths at %s x %s",
  (width, height) => {
    const { field, bounds } = fixture();
    field.load(LEVELS[0]);
    bounds.width = width;
    bounds.height = height;
    field.resize();
    field.camera.updateMatrixWorld(true);
    let plate;
    field.scene.traverse((o) => {
      if (
        o instanceof THREE.Sprite &&
        o.material.map?.name.endsWith("/atlas.webp")
      )
        plate = o;
    });
    expect(plate).toBeDefined();
    for (const cell of [
      { x: 0, z: 0 },
      { x: 5, z: 4 },
      { x: 11, z: 7 },
    ]) {
      const world = new THREE.Vector3(
        112 + cell.x * 96,
        720 - 106 - cell.z * 74,
        0,
      );
      const painted = new THREE.Vector3(
        plate.position.x + (world.x / 1280 - 0.5) * plate.scale.x,
        plate.position.y + (world.y / 720 - 0.5) * plate.scale.y,
        0,
      ).project(field.camera);
      const r = field.renderer.domElement.getBoundingClientRect();
      const landmark = {
        x: r.left + ((painted.x + 1) * r.width) / 2,
        y: r.top + ((1 - painted.y) * r.height) / 2,
      };
      const anchor = field.project(cell);
      expect(
        Math.hypot(anchor.x - landmark.x, anchor.y - landmark.y),
      ).toBeLessThan(1e-8);
    }
    for (const x of [0, 1280])
      for (const y of [0, 720]) {
        const corner = new THREE.Vector3(x, y, 0).project(field.camera);
        expect(Math.abs(corner.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(corner.y)).toBeLessThanOrEqual(1);
      }
    field.dispose();
  },
);
it.each(SIZES)(
  "uses an unstretched landscape canvas with correct picking at %s x %s",
  (width, height) => {
    const { field, bounds } = fixture();
    field.load(LEVELS[0]);
    bounds.width = width;
    bounds.height = height;
    field.resize();
    field.camera.updateMatrixWorld(true);
    const r = field.renderer.domElement.getBoundingClientRect();
    expect(r.width / r.height).toBeCloseTo(16 / 9, 10);
    expect(r.width).toBeLessThanOrEqual(width);
    expect(r.height).toBeLessThanOrEqual(height);
    for (const cell of [
      { x: 0, z: 0 },
      { x: 5, z: 4 },
      { x: 11, z: 7 },
    ]) {
      const p = field.project(cell);
      const picked = field.pick(p.x, p.y);
      expect(picked?.x === cell.x && picked?.z === cell.z).toBe(true);
    }
    field.dispose();
  },
);

it("rejects gutter input before defender silhouette hit-testing", () => {
  const { field, bounds } = fixture();
  field.load(LEVELS[0]);
  bounds.width = 1024;
  bounds.height = 768;
  field.resize();
  field.camera.updateMatrixWorld(true);
  // A silhouette can extend past the frame; it must not make gutters interactive.
  field.figures.set(1, {
    enemy: false,
    point: { x: 5, z: 4 },
    sprite: { renderOrder: 1, position: { x: 0, y: 0 } },
    defender: {
      bounds: () => ({
        left: -10000,
        right: 10000,
        bottom: -10000,
        top: 10000,
      }),
    },
  });
  const r = field.renderer.domElement.getBoundingClientRect();
  for (const p of [
    [r.left - 1, r.top + r.height / 2],
    [r.left + r.width + 1, r.top + r.height / 2],
    [r.left + r.width / 2, r.top - 1],
    [r.left + r.width / 2, r.top + r.height + 1],
  ])
    expect(field.pick(...p)).toBeNull();
  field.figures.clear();
  field.dispose();
});
