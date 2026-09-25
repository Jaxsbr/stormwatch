# 013 — Clarify guard state and wave pacing in Lantern Pass

## Status

Implemented for owner follow-up playtesting, 25 September 2026.

## Context

The owner reported that Rat Raider shield poses did not make the damage-reduction window clear enough to read during play. They also found the five-wave trial's `0 / 5` wave counter misleading, wanted a short between-wave countdown with a skip action, and ended a run with more unused gold than desired after building three Squirrel archers.

## Decision

- Add a reusable overhead status-glyph renderer for enemy and tower figures. Start with a translucent blue shield above guarding Rat Raiders; fade its opacity with the guard cycle and flash it bright when a guarded projectile hits.
- Use one Rat shield timing calculation for simulation damage state and glyph strength so the visual cue follows the gameplay state.
- Show the current or upcoming wave ordinal, beginning at `1 / 5` and ending at `5 / 5`.
- After each non-final wave, start a five-second countdown. The player can start the upcoming wave early. Pausing freezes the countdown. The initial preparation period remains available for tower placement without a timer.
- Set Lantern Pass starting gold to 100. Preserve tower prices, enemy kill rewards, wave payouts, and Rainstone Crossing's economy.

## Consequences

Two Squirrel archers (80 gold) fit the initial allowance. A Skunk slinger (65 gold) also fits alone. Players can skip most between-wave waiting, while the pause menu lets them hold their planning time. The status-glyph component accepts per-actor effect views for reuse when other visible effects are introduced; only the Rat shield is shown for this trial. The countdown and starting balance are tuning values and need playtesting with multiple tower types.

## Verification

Focused tests cover wave ordinals, five-second countdown, automatic and manual starts, pausing the timer, and glyph fade/flash behavior. Run the project's type checks, test suite, and production build, then inspect the shield cue at normal speed in the browser. Owner follow-up playtesting remains open.
