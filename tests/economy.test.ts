import { describe, expect, it } from "vitest";
import {
  interestFor,
  refundFor,
  tradeIncome,
  wavePayout,
} from "../src/sim/economy";

describe("economy rules", () => {
  it("calculates interest from the pre-payout balance and combines each income source once", () => {
    expect(wavePayout(199, [{ kind: "trade", level: 1 }], 25)).toEqual({
      interest: 19,
      trade: 12,
      reward: 25,
      total: 56,
    });
  });

  it("reaches the interest cap at the boundary and never returns fractional coins", () => {
    expect(interestFor(199)).toBe(19);
    expect(interestFor(200)).toBe(20);
    expect(interestFor(9999.9)).toBe(20);
    expect(wavePayout(199.9, [], 25.9).reward).toBe(25);
  });

  it("treats invalid balances, rewards, and structure values as safe zeroes", () => {
    expect(interestFor(Number.NaN)).toBe(0);
    expect(interestFor(Number.POSITIVE_INFINITY)).toBe(0);
    expect(interestFor(-200)).toBe(0);
    expect(wavePayout(Number.NaN, [], Number.NEGATIVE_INFINITY)).toEqual({
      interest: 0,
      trade: 0,
      reward: 0,
      total: 0,
    });
    expect(
      tradeIncome([
        { kind: "trade", level: 0 },
        { kind: "trade", level: 1.9 },
        { kind: "trade", level: 2.1 },
        { kind: "bolt", level: 2 },
        null as never,
      ]),
    ).toBe(34);
  });

  it("refunds only the documented fraction of a structure investment", () => {
    expect(refundFor(95)).toBe(61);
    expect(refundFor(-1)).toBe(0);
    expect(refundFor(Number.NaN)).toBe(0);
  });
});
