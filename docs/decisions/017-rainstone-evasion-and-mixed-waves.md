# 017: Rainstone evasion and mixed waves

**Status:** Accepted by owner, 26 September 2026; implemented candidate awaiting playtest.

## Context

The original holiday ticket 03 proposed five waves and sprint without missed shots. The owner approved a replacement: three longer waves with internal cycles, mixed Rats/Weasels, and visible periodic evasion. This supersedes that ticket's five-wave and no-evasion clauses. Lantern's existing lesson remains the arrival prerequisite.

## Decision

Rainstone uses only Squirrels with their earned upgrade. Start with 120 gold; defeated Rats and Weasels award two gold. Keep the existing route.

1. Repeat five cycles of six Rats two seconds apart, 3.5 seconds quiet, then four non-evasive Weasels 0.45 seconds apart. Between cycles there is 3.45 seconds quiet.
2. Alternate eighteen Rat/Weasel pairs, 1.1 seconds from Rat to Weasel and 2.2 seconds to the next Rat. Weasels first evade after three seconds, for two seconds, repeating every five seconds.
3. Repeat twelve bursts: three Rats one second apart, two Weasels close behind 0.45 seconds apart, then three seconds quiet. Weasels alternate 2.6 seconds exposed and 2.4 seconds evasive.

Rainstone Rats alternate five seconds shield-down and five seconds raised. Weasel baseline movement is 85% of catalog speed (1.0625 units/s). During evasion it increases by 15% (1.221875 units/s), still below its old catalog speed. The state is deterministic and relative to each spawn, with a 0.6-second warning.

Projectile outcomes use the evasion state at impact. Arrows, stones and nets cannot damage an evasive Weasel; a missed net does not apply or refresh slow. Existing slow still reduces movement and expires normally. There is no random miss probability. A yellow chevron becomes faint during warning, solid during evasion and flashes on a miss. A brief perpendicular sidestep and floating “Evade” label explain the outcome. Simultaneous misses coalesce into one cue; reduced motion suppresses the sidestep. No new generated assets are needed.

Rainstone victory awards the persistent Turtle discovery, including assisted victories and existing saved victories. Show an illustrated New Defender reward only on discovery. Turtle is first used in the later final encounter; that encounter is ticket 04/05 work.

## Consequences

Longer coverage and spending timing matter: a short firing window may coincide with evasion. Three longer waves reduce intermissions while retaining short internal rests. The final-wave evasion duty cycle adds pressure without introducing another rule. Counts, budgets and timings are initial local tuning, subject to owner feedback.

## Verification

The real Game seam covers hits before/during/after evasion, nets, pause and retry state. Save tests cover Turtle discovery, replay, reload and legacy migration. Earned-tool strategy scenarios clear all three waves with wider coverage or fewer upgraded Squirrels; poor coverage loses. Browser review uses the actual renderer at normal speed, with explicit fixture state rather than a claim of campaign completion. See [candidate evidence](../../review/2026-09-26-rainstone/README.md). Physical devices, child comprehension and global balance remain owner-playtest work.
