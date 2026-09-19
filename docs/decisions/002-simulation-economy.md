# 002 — Deterministic attempts and a bounded economy

**Status:** accepted.

**Context:** Players should make readable spending/saving choices without earning money by waiting. Future agents need testable rules independent of a browser.

**Decision:** A pure TypeScript attempt advances at 30 Hz. Interest is floor(10% × pre-payout savings), capped at 20. Credit interest, fixed wave reward and lodge income atomically once at wave completion. A lodge costs 55 and pays 12 per completed wave; a 40-crown upgrade raises payout to 22. Selling refunds floor(65% × total spent). Only stars, settings and a tactical card unlock persist locally.

**Consequences:** The first lodge recovers its initial cost in five completed waves; the upgrade recovers its additional cost in four. Defense opportunity cost makes early investment risky. The interest cap limits runaway saving but the friendly first encounter still permits a large late reserve. Balance evidence establishes viability, not universal balance or playtest enjoyment. Fresh attempt construction prevents previous coins/cooldowns leaking into replay.

**Verification:** `tests/economy.test.ts`, `tests/simulation.test.ts`, persistence and strategy tests; `../evidence/balance.json`. Revisit rates only with a repeatable before/after scenario.
