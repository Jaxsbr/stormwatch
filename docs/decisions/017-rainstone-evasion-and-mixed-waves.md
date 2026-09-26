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

## Owner playtest revision — 26 September 2026

The owner found the opening slightly too hard and requested a fourth wave. The opening Rat-to-Weasel silence is now six seconds, with four-second shield-up/six-second shield-down Rat timing. Waves two and three retain their authored sequence. Wave three now gives a 35-gold clear reward ahead of the finale.

Wave four repeats this entire sequence three times: one Rat/five Weasels, two Rats/four Weasels, three Rats/three Weasels. Each six-enemy mini cycle has 0.2-second spawn intervals and five seconds from its final spawn to the next mini cycle. There are nine mini cycles, eighteen Rats and thirty-six Weasels. Rats retain five seconds up/five seconds down. Weasels use 1.1× catalog movement (1.375 units/s exposed; 1.58125 during evasion), with two-second evasion windows every five seconds and the existing advance warning.

Real-spawn tests verify all nine cycles, rests, order, fast movement and shortened opening guards. Both existing earned-tool strategies now win all four waves at full hearts. See the updated candidate evidence; these scripted outcomes remain separate from owner/child play.

## Fourth-wave expansion — 26 September 2026

Owner requested one additional full set and revised mini cycles: 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels. Repeat the entire pattern four times: twelve mini cycles, twenty-eight Rats and sixty Weasels (88 enemies). Retain 0.2s between spawns and five seconds from a mini cycle's last spawn to the next one's first spawn. Shield timing, extra-fast movement and two-second evasion every five seconds are unchanged. The prior nine-cycle recipe and its balance figures are historical.

Real Game spawn coverage verifies all twelve variable-size mini cycles and pauses. Both existing Squirrel spending strategies still clear all four waves; owner playtest remains the balance check.
