import { describe, expect, it } from "vitest";
import { refundFor, waveReward } from "../src/sim/economy";

describe("economy rules", () => {
  it("pays only the authored fixed wave reward as whole coins", () => {
    expect(waveReward(25.9)).toBe(25);
    expect(waveReward(Number.NaN)).toBe(0);
    expect(waveReward(Number.POSITIVE_INFINITY)).toBe(0);
    expect(waveReward(-200)).toBe(0);
  });

  it("refunds only the documented fraction of a structure investment", () => {
    expect(refundFor(95)).toBe(61);
    expect(refundFor(-1)).toBe(0);
    expect(refundFor(Number.NaN)).toBe(0);
  });
});
