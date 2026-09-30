import { describe, expect, it } from "vitest";
import { artRegressions } from "../tools/art-benchmark-gate.mjs";

const report = (before, after) => ({
  levels: {
    "lantern-pass": {
      cold: {
        baseline: { p95Ms: before },
        candidate: { p95Ms: after },
      },
    },
  },
});

describe("art benchmark merge gate", () => {
  it("allows up to 300 ms for a short baseline", () => {
    expect(artRegressions(report(1000, 1300))).toEqual([]);
    expect(artRegressions(report(1000, 1301))).toHaveLength(1);
  });

  it("uses 25% for a long baseline", () => {
    expect(artRegressions(report(5000, 6250))).toEqual([]);
    expect(artRegressions(report(5000, 6251))).toHaveLength(1);
  });
});
