import { describe, expect, it } from "vitest";
import { snapTime, timelineGrid } from "../src/workbench/timeline-grid";

describe("timeline snapping and zoom grid", () => {
  it("aligns off-grid positions to 0.05 seconds without crossing a timing limit", () => {
    expect(snapTime(3.731)).toBe(3.75);
    expect(snapTime(3.719)).toBe(3.7);
    expect(snapTime(-1)).toBe(0);
    expect(snapTime(0.71, 0.713)).toBe(0.75);
    expect(snapTime(0.7, 0.7)).toBe(0.7);
  });
  it("reveals fine subdivisions at high zoom while keeping lines and labels apart", () => {
    expect(timelineGrid(20)).toEqual({ minor: 0.5, major: 5 });
    expect(timelineGrid(160)).toEqual({ minor: 0.05, major: 0.5 });
    for (const scale of [1.5, 20, 50, 160, 800]) {
      const grid = timelineGrid(scale);
      expect(grid.minor * scale).toBeGreaterThanOrEqual(8);
      expect(grid.major * scale).toBeGreaterThanOrEqual(60);
    }
  });
});
