# 020 — Increase Last Lantern boss pressure and reduce directive copy

**Status:** Implemented at the owner's request, 26 September 2026.

## Context

The owner playtested The Last Lantern and reported wave 6 was too easy compared with wave 5. The two escort parties worked, but their towers still defeated the Roadwarden easily. The owner requested double boss health and five escort parties total. The owner also identified unwanted text in the attachment: the escort-call toast, a boss-defeat directive beside the wave control, and the boxed boss explanation on the Last Lantern briefing.

## Decision

- Double the Roadwarden's health from 1100 to 2200; retain 6 armor and its existing speed.
- Keep the 8-Rat vanguard and add five post-boss escort parties. The owner later set them to 7 Weasels or 5 Rats. Start them at boss ages 4.5s, 14.5s, 24.5s, 34.5s and 44.5s, in 7 Weasel / 5 Rat / 7 Weasel / 5 Rat / 7 Weasel order. Preserve the existing movement, guard and evasion rules. Each party enters just before one of the first five rally pulses.
- Remove boss-arrival and rally text toasts, the defeat directive beside the wave control, and the boxed briefing directive. Keep the Roadwarden health bar, visual rally tell, audio cues and required-defeat simulation rule.
- Keep the 235-gold arrival budget for now. The earlier seed-42 candidate clears were made against the previous boss and two-party wave; they do not demonstrate that the updated wave is beatable.

## Consequences

The updated wave now sustains escort pressure for five rally cycles while the player damages a double-health boss. In seed 42 the upgraded-Squirrel line loses to boss escape with one life remaining; the mixed and poor-opening lines lose when they run out of lives. Exact times, lives, leaks, bank and income for the final 7/5 party sizes are recorded in [the active wave plan](../../.scratch/holiday-expedition/wave-plan.md) and asserted in `tests/the-last-lantern-strategy.test.ts`.

These runs demonstrate increased pressure only. They do not demonstrate that a fresh player can finish the board. Owner/family play against this version should decide whether further tuning is needed. The mechanical escape loss remains, but the player no longer sees repeated boss-defeat copy in the specified screens or toasts.

## Verification

The strategy test asserts the 2200 health value, five 7/5 party sizes and their preserved spawn ages. Encounter-preview coverage asserts that the separate briefing directive is absent. Boss-rally tests continue to cover rally recipients and timing, boss escape, required defeat and same-update loss precedence. Verification for this party-size update is recorded in ticket 05 and the active wave plan.
