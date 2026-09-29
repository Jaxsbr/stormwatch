# 034: Roadwarden rage and readable rally

## Context

The owner requested a livelier boss finale for family playtesting. A long slowed
health bar offered tension but little change. Turtle is newly earned; immunity
would undermine its introduction. The rally already accelerates escorts, but its
speaker glyph did not communicate speed and competed with their shield/evade tells.

## Decision

At two-thirds health the Roadwarden becomes angry; at one-third he rages. The
thresholds are inclusive and shared by simulation and rendering. Initial speed
multipliers are 1.35 and 1.8, with the full Turtle slow applied in every phase.
HP, armor, wave composition and rally cadence remain at their existing values.
The owner approved side and front expression edits before integration. Those
views show progressively flushed, angry faces; the rear retains its existing art.
All views gain stronger distance-driven body sway, suppressed by reduced motion.

Rally uses a double-chevron above the boss and an expanding amber pulse on a
successful cast. Boosted escorts have amber movement streaks beside their feet,
leaving overhead shield/evade indicators available. The cast marker lasts through
the boost duration. There is no new in-battle explanatory text; the briefing lists
rage and the nearby speed boost.

The shared ability settings author the two rage multipliers. Legacy drafts gain
canonical defaults without losing other edits. Validation requires both to be at
least 1 and raging to be no slower than angry. Promotion, immutable attempt
snapshots and uncached runtime loading use the same values.

## Consequences

These are playtest speeds, not a claim of final balance. Recorded losing campaign
policies now reach the boss exit approximately 8–10 seconds sooner. Their first
five waves are unchanged, and their final loss/pressure assertions are retained.
Turtle remains valuable; the boss can still be slowed at one-third health.
Expression variants share the existing leg assets and attachment joints. Generated
runtime WebP assets and provenance are versioned; native sources remain ignored.

## Verification

Focused simulation coverage checks inclusive thresholds, skipping directly into
rage, full slow multiplication, pause and existing rally/escape rules. Shared
settings coverage checks legacy drafts, invalid values, isolated Playtest,
atomic promotion in a disposable file and uncached runtime reload.

The review fixture replays the existing mixed campaign policy to wave six, then
records actual fixed-step gameplay at normal speed using Squirrels and Turtle.
It does not inject damage, health phases, currency or towers. See
`review/2026-09-30-boss-rage` for visual evidence and verification results.
