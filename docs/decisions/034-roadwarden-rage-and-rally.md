# 034: Roadwarden rage and readable rally

## Context

The owner requested a livelier boss finale for family playtesting. A long slowed
health bar offered tension but little change. Turtle is newly earned; immunity
would undermine its introduction. The rally already accelerates escorts, but its
speaker glyph did not communicate speed and competed with their shield/evade tells.

## Decision

The owner revised the trigger after approving the original visuals: rage should
repeat throughout the wave. Losing 10% of max HP while calm triggers anger for
three seconds, followed automatically by four seconds of full rage. Recovery
resets the damage baseline to current HP; damage during the cycle is not banked.
At or below 25% HP the boss enters permanent full rage immediately, from any phase.

The simulation owns phase, damage baseline and deadlines; rendering reads that
same state. Pausing freezes the cycle. Speed multipliers are 1.35 and 1.6, with
the full Turtle slow applied in every phase. Full-rage speed was reduced from
1.8 because its higher uptime otherwise broke the existing normal-mode winning
family strategy. This preserves that win without reducing boss HP.
HP, armor, wave composition and rally cadence remain at their existing values.
The owner approved side and front expression edits before integration. Those
views show progressively flushed, angry faces; the rear retains its existing art.
All views gain stronger distance-driven body sway, suppressed by reduced motion.

Rally uses a double-chevron above the boss and an expanding amber pulse on a
successful cast. Boosted escorts have amber movement streaks beside their feet,
leaving overhead shield/evade indicators available. The cast marker lasts through
the boost duration. There is no new in-battle explanatory text; the briefing lists
rage and the nearby speed boost.

The shared ability settings author damage percentage, both durations and both
speed multipliers. Legacy drafts gain
canonical defaults without losing other edits. Validation requires both to be at
least 1 and raging to be no slower than angry; timings must be positive and
damage percentage must be in (0, 100]. Promotion, immutable attempt
snapshots and uncached runtime loading use the same values.

## Consequences

These are playtest speeds, not a claim of final balance. Recorded losing campaign
policies retain their previous losses while the family release policy still wins. Their first
five waves are unchanged, and their final loss/pressure assertions are retained.
Turtle remains valuable; the boss can still be slowed during permanent rage.
Expression variants share the existing leg assets and attachment joints. Generated
runtime WebP assets and provenance are versioned; native sources remain ignored.

## Verification

Focused simulation coverage checks accumulated post-armor damage, timed escalation,
reset and repeat, inclusive permanent rage from every phase, full slow multiplication,
pause and existing rally/escape rules. Shared
settings coverage checks legacy drafts, invalid values, isolated Playtest,
atomic promotion in a disposable file and uncached runtime reload.

The review fixture replays the existing mixed campaign policy to wave six, then
records actual fixed-step gameplay at normal speed using Squirrels and Turtle.
It does not inject damage, health phases, currency or towers. See
`review/2026-09-30-boss-rage-cycles` for visual evidence and verification results.
