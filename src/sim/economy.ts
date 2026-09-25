// Simple coin rules. Combat rewards are handled by the simulation; a wave clear
// adds only the fixed reward authored in the encounter data.

// Nonfinite guard: NaN/Infinity are treated as zero.
function safeFinite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

// Clamp to a nonnegative integer (floors fractional values).
function nonnegInt(n: number): number {
  const v = safeFinite(n);
  return v >= 0 ? Math.floor(v) : 0;
}

export function waveReward(reward: number) {
  return nonnegInt(reward);
}

// Refund: 65% of the nonnegative amount spent, floored.
export function refundFor(totalSpent: number): number {
  return Math.floor(nonnegInt(totalSpent) * 0.65);
}
