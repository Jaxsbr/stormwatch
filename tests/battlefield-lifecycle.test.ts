import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";
import { LEVELS } from "../src/content/levels";

// Mock only the browser/WebGL boundary; execute real Battlefield ownership.
vi.mock("three", async (original) => {
  const actual = await original<typeof THREE>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = { setAttribute() {}, addEventListener() {}, remove() {} };
      setSize = vi.fn();
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
      set src(_path: string) {}
    },
  );
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  let notify = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation(
    () => new THREE.Texture(),
  );
  const bounds = { width: 1024, height: 520 };
  const host = { append() {}, getBoundingClientRect: () => bounds };
  return {
    field: new Battlefield(host as unknown as HTMLElement),
    bounds,
    notify: () => notify(),
  };
}

it("rebuilds scenery for a backdrop-only edit and retains unchanged scenery", () => {
  const { field } = fixture();
  const loadTexture = vi.mocked(THREE.TextureLoader.prototype.load);
  const level = LEVELS[0];
  const rainstone = { ...level, visual: { backdrop: "rainstone" } };
  const woodlandPath = "art/v2/woodland-clearing-v3/atlas.webp";
  const rainstonePath = "art/v2/rainstone-riverbank-v2/atlas.webp";
  const sceneryLoads = (path: string) =>
    loadTexture.mock.calls.filter(([url]) => url.endsWith(path)).length;

  field.load(level);
  expect(sceneryLoads(woodlandPath)).toBe(1);
  const woodlandIndex = loadTexture.mock.calls.findIndex(([url]) =>
    url.endsWith(woodlandPath),
  );
  const oldBackdrop = loadTexture.mock.results[woodlandIndex]
    .value as THREE.Texture;
  const disposeOldBackdrop = vi.spyOn(oldBackdrop, "dispose");
  field.load(level);
  expect(sceneryLoads(woodlandPath)).toBe(1);
  expect(disposeOldBackdrop).not.toHaveBeenCalled();

  field.load(rainstone);
  expect(sceneryLoads(rainstonePath)).toBe(1);
  expect(disposeOldBackdrop).toHaveBeenCalledTimes(1);
  field.load(rainstone);
  expect(sceneryLoads(rainstonePath)).toBe(1);
  field.dispose();
});

it("retires an attempt's context and cancels a queued resize when leaving the battlefield", () => {
  const { field, bounds, notify } = fixture();
  const context = field.renderer.getContext();
  expect(context.isContextLost()).toBe(false);
  bounds.height = 560;
  notify();
  const allocations = vi.mocked(field.renderer.setSize).mock.calls.length;
  field.dispose();
  vi.runAllTimers();
  expect(context.isContextLost()).toBe(true);
  expect(vi.mocked(field.renderer.setSize).mock.calls).toHaveLength(
    allocations,
  );
  field.dispose();
});

it("allocates only once after a toolbar-height burst and ignores unchanged or subpixel sizes", () => {
  const { field, bounds, notify } = fixture();
  const setSize = vi.mocked(field.renderer.setSize);
  setSize.mockClear();
  for (let event = 0; event < 20; event++) {
    bounds.height = event % 2 ? 520 : 560;
    notify();
    vi.advanceTimersByTime(16);
  }
  bounds.height = 560.8;
  notify();
  expect(setSize).not.toHaveBeenCalled();
  vi.advanceTimersByTime(100);
  expect(setSize.mock.calls).toEqual([[1024, 560, false]]);
  for (let event = 0; event < 20; event++) field.resize();
  bounds.height = 560.9;
  field.resize();
  expect(setSize).toHaveBeenCalledTimes(1);
  field.dispose();
});
