import { describe, expect, it, vi } from "vitest";
import { ResourcePool } from "../src/render/resource-pool";
const make = () => ({ dispose: vi.fn() });
describe("render resource ownership", () => {
  it("reuses only released matching resources and never shares an active rig", () => {
    const pool = new ResourcePool<ReturnType<typeof make>>();
    const a = pool.acquire("side:88", make);
    const b = pool.acquire("side:88", make);
    expect(b).not.toBe(a);
    pool.release(a);
    expect(pool.acquire("front:88", make)).not.toBe(a);
    expect(pool.acquire("side:88", make)).toBe(a);
    pool.dispose();
    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(b.dispose).toHaveBeenCalledTimes(1);
  });
  it("disposes overflow and releases all retained resources exactly once", () => {
    const pool = new ResourcePool<ReturnType<typeof make>>(1);
    const a = pool.acquire("a", make),
      b = pool.acquire("a", make);
    pool.release(a);
    pool.release(b);
    expect(b.dispose).toHaveBeenCalledTimes(1);
    expect(a.dispose).not.toHaveBeenCalled();
    expect(() => pool.release(a)).toThrow("not checked out");
    pool.dispose();
    pool.dispose();
    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(b.dispose).toHaveBeenCalledTimes(1);
  });
});
