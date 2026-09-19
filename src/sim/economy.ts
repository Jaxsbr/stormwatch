// Economy rules for a child-friendly tower-defense game.
// All coin amounts are integers; inputs are clamped safely (nonfinite -> 0, negatives -> 0).

export interface StructureIncome {
  kind: string;
  level: number;
}

export interface Payout {
  interest: number;
  trade: number;
  reward: number;
  total: number;
}

// Nonfinite guard: NaN/Infinity are treated as zero.
function safeFinite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

// Clamp to a nonnegative integer (floors fractional values).
function nonnegInt(n: number): number {
  const v = safeFinite(n);
  return v >= 0 ? Math.floor(v) : 0;
}

// Interest: 10% of the nonnegative balance, capped at 20.
export function interestFor(balance: number): number {
  return Math.min(20, Math.floor(nonnegInt(balance) * 0.1));
}

// Trade buildings pay per level: level 1 -> 12 coins, level >= 2 -> 22 coins.
// All other kinds pay zero.
function tradeForStructure(s: StructureIncome): number {
  if (s.kind !== 'trade') return 0;
  const level = nonnegInt(s.level);
  return level >= 2 ? 22 : level === 1 ? 12 : 0;
}

// Total trade income from a list of structures (no mutation).
export function tradeIncome(structures: readonly StructureIncome[]): number {
  if (!Array.isArray(structures)) return 0;
  let sum = 0;
  for (const s of structures) {
    if (s) sum += tradeForStructure(s);
  }
  return sum;
}

// Wave payout order:
// 1. Interest is computed from the balance BEFORE any income is added.
// 2. Trade income is summed from the given structures.
// 3. Reward is taken as-is but floored and clamped to nonnegative.
// 4. Total is the sum of the three parts (all integers).
export function wavePayout(
  balance: number,
  structures: readonly StructureIncome[],
  reward: number,
): Payout {
  // Interest from the pre-income balance (step 1).
  const interest = interestFor(balance);
  // Trade income from structures (step 2).
  const trade = tradeIncome(structures);
  // Nonnegative floored reward (step 3).
  const rewardPart = nonnegInt(reward);
  return {
    interest,
    trade,
    reward: rewardPart,
    // Total of all parts (step 4).
    total: interest + trade + rewardPart,
  };
}

// Refund: 65% of the nonnegative amount spent, floored.
export function refundFor(totalSpent: number): number {
  return Math.floor(nonnegInt(totalSpent) * 0.65);
}
