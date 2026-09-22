# 008 — Battle information, selected defender and visible income

Status: implemented for owner review; not yet approved visually. Supersedes the battle HUD presentation in 007, not simulation rules.

## Context

The owner found the small serif counters unimportant, “village” ambiguous, static range/selection effects intrusive, tower inspection too small, and income hard to understand. The owner authorized a creative battle-screen pass after committing existing work.

## Decision

- Bold tabular sans-serif values with original generated coin, heart and pennant icons. “Lives” replaces “village”; a life meter and completed-wave progress bar make loss and completion legible.
- Selection belongs primarily to the defender's base: pulsing warm ground halo and corner accents, plus a gently bobbing illustrated gold/teal marker. The large hard ring is replaced by an optional, softly feathered coverage boundary with moving highlights, explicitly toggled by Range.
- A taller inspection tray gives the portrait a prominent framed position, rank badges and a breathing presentation. Current damage, range and attack interval are paired with actual upgrade values. No invented HP/mana mechanics. Donkeys show actual gold per wave and automatic collection instead.
- Reuse the wood/gold button skin for the forecast. Its initially collapsed breakdown closes by toggle, Close or Escape. Automatic wave-end donkey income produces a floating coin reward at its source. The persistent end-wave economy popup is replaced with a short celebration.
- Preserve wave-boundary income, capped savings bonus and all rates. There was no manual deposit operation to remove. A continuous/time-based coin factory remains an alternative for a separate balance decision, not a silently introduced gameplay change.

## Consequences

Selection takes more vertical room; the battlefield resizes to avoid clipping. Compact layouts retain 44px action targets. Existing high-resolution portrait crops are enlarged with subtle motion, not replaced by newly rigged facial animations. Reduced-motion preferences stop decorative pulsing/bobbing. Simulation is unchanged; effects never grant money.

## Verification

See `review/2026-09-22-battle-ui/`. Unit tests cover displayed upgrade values, trade income, rank state and forecast semantics. Desktop/landscape checks include selection, range toggle, disabled upgrade, actual upgrade, dismissible income and a completed live wave. Motion evidence and limitations are recorded separately; no physical-mobile or enjoyment claim.
