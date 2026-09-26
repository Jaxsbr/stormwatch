# 019 — Tune Last Lantern's packet pressure and arrival budget

**Status:** Implemented; later boss-balance results superseded by ADR 020, 26 September 2026.

## Context

The owner asked for ticket 05's proposal to be checked against Rainstone Crossing's exact spawn sequencing. The earlier Last Lantern waves 4–5 did not approach Rainstone's close 0.2-second packets, repeated structure, 88-enemy finale and five-second rests. The owner approved a six-wave replan that adds denser Rat/Weasel packets and times both escort columns around the Roadwarden's rally.

The replan retained the earlier 120-gold arrival budget as a hypothesis. Once implemented in the real deterministic Game, candidate defenses at 120 and 180 gold lost before clearing the chapter. This made the approved packet plan infeasible with reasonable Squirrel-heavy and Net/Squirrel placements at that funding level.

## Decision

- Keep the approved six-wave packet sequence and its Rainstone-derived final rehearsal: twelve mini-cycles, 28 Rats and 60 Weasels, with 0.2-second internal spacing and four-second rests. Keep wave 4 at three pattern repetitions and five-second rests.
- Set Last Lantern's first-arrival budget to 235 gold. Retain the 0.4 enemy reward scale and authored clear rewards. First-arrival equipment remains upgraded Squirrels and base Turtles only.
- At the time of this decision, keep boss stats at 1100 health and 6 armor. The later owner-requested increase and five-party escort are recorded in ADR 020.
- Treat deterministic seeded candidate lines as evidence of simulation feasibility. They do not establish a child's comprehension, a novice win rate, or family-device performance.

## Consequences

With the original 1100-HP boss and two escort parties, a Net/Squirrel line and an upgraded-Squirrel line cleared all six waves at 235 gold. A line with one opening Squirrel at `(0,6)` also cleared. These outcomes are historical: under the owner-requested 2200-HP boss and five parties in ADR 020, the same three candidate lines now lose at wave 6 before defeating the Roadwarden. Exact current outcomes are in [the active wave plan](../../.scratch/holiday-expedition/wave-plan.md) and asserted in the strategy test.

The starting budget is higher than the old assumption, and the scripted mixed line is less forgiving than the Squirrel line. Ticket 06 should review whether the opening budget, packet pressure and placement feedback feel clear on family devices; this ADR does not claim a target difficulty or an observed child win rate.

## Verification

`tests/the-last-lantern-strategy.test.ts` runs the actual Game at seed 42 with the first-arrival upgrade roster and records two prior build lines and one poor-placement line against the updated boss. All three now lose at wave 6 before killing the Roadwarden. `tests/boss-rally.test.ts` verifies pulse timing, path-distance selection, speed/slow order, expiry, boss escape, required defeat and post-death pulse suppression. Verification of the current update is recorded in ADR 020. The new simulation profiles do not establish that the updated encounter is completable for a new player; physical-device performance, child comprehension and family balance remain unverified.
