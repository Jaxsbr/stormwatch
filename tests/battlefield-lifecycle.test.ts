import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { Battlefield } from "../src/render/battlefield";

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
