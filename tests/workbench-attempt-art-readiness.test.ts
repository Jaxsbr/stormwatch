import { describe, expect, it } from "vitest";
import { AttemptArtReadiness } from "../src/workbench/attempt-art-readiness";

describe("workbench Playtest art readiness", () => {
  it("keeps input locked until the current load is ready", () => {
    const readiness = new AttemptArtReadiness();
    const request = readiness.begin();

    expect(readiness.ready).toBe(false);
    expect(readiness.canAdvance).toBe(false);
    expect(readiness.settle(request, "ready")).toBe(true);
    expect(readiness.ready).toBe(true);
    expect(readiness.canAdvance).toBe(true);
  });

  it("keeps failures locked and ignores stale results after retry", () => {
    const readiness = new AttemptArtReadiness();
    const failedRequest = readiness.begin();

    expect(readiness.settle(failedRequest, "failed")).toBe(true);
    expect(readiness.status).toBe("failed");
    expect(readiness.ready).toBe(false);
    expect(readiness.canAdvance).toBe(false);

    const retry = readiness.begin();
    expect(readiness.status).toBe("loading");
    expect(readiness.settle(failedRequest, "ready")).toBe(false);
    expect(readiness.ready).toBe(false);
    expect(readiness.settle(retry, "ready")).toBe(true);
    expect(readiness.ready).toBe(true);
    expect(readiness.canAdvance).toBe(true);
  });

  it("ignores completions after the attempt is disposed", () => {
    const readiness = new AttemptArtReadiness();
    const request = readiness.begin();

    readiness.invalidate();

    expect(readiness.settle(request, "ready")).toBe(false);
    expect(readiness.ready).toBe(false);
  });
});
