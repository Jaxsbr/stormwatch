# First three-map board: initial wave plan

Status: supporting content for the Day 2-onward spec; Map 3 ticket 04 has single-seed simulation evidence, while the boss recipe and family playtesting remain open

Execution begins with Map 3. Maps 1–2 describe the assumed arrival state and the earlier Day 1 plan, not additional implementation work under this spec. Confirm those prerequisites in the integration checkout; this document does not claim they have shipped. The first board ends on The Last Lantern's Roadwarden boss wave; defeating the boss is required before any later board can open. The optional five-map draft is superseded by this board pattern. Iron Boars are reserved for the next board.

## Common notation and tuning

`R` = Rat, `W` = Weasel, `K` = Roadwarden. `R20@3` means 20 total Rats, one every 3 seconds. `R20[2]@3` means 20 total Rats, pairs every 3 seconds, with 0.3 seconds between members. `+` means sequential spawn groups through the existing scheduler. It does not start groups simultaneously; check their actual overlap on the route.

Normal Rat guards use 2s up / 8s down. `G` means 4s up / 6s down and 0.75× movement. All Rats begin shield-down. Weasels use the spec's deterministic sprint. Start all three maps at health scale 1 and kill reward scale 0.4: Rats/Weasels 2 gold, boss 26. Fixed rewards below are added once when a wave clears. Income totals assume every enemy is killed and are arithmetic projections, not balance evidence.

Agents may tune count, gap, starting gold, health, and reward data based on real simulation and play, while preserving the lesson and reward order. Prefer local changes over globally weakening the roster to rescue one bad wave. Preserve the owner-selected Map 1 recipes until play feedback identifies a concrete problem.

## Map 1 — Lantern Pass

Existing route; Squirrel only. Start at 100 gold. First-arrival upgrades locked. Victory earns Squirrel upgrades and Map 2. A replay may use earned Squirrel upgrades and, after Rainstone victory, the unlocked Turtle to improve its star rating.

| Wave | Recipe   | Guard / movement      | Fixed reward / total income | Lesson                                         |
| ---- | -------- | --------------------- | --------------------------- | ---------------------------------------------- |
| 1    | R20@3    | 2 up / 8 down; normal | 25 / 65                     | See guard and buy a third Squirrel during play |
| 2    | R23@2    | 2 up / 8 down; normal | 28 / 74                     | Respond to a busier trail                      |
| 3    | R20[2]@3 | 4 up / 6 down; 0.75×  | 30 / 70                     | Notice pairs and slower movement               |
| 4    | R23@3    | 6 up / 4 down; normal | 34 / 80                     | Cover the shield-down opening                  |
| 5    | R20[2]@2 | 6 up / 4 down; 0.75×  | 38 / 78                     | Combine guard duration and pairs               |

## Map 2 — Rainstone Crossing

Owner-approved amendment and playtest revision, 26 September 2026: four mixed waves. Squirrel only, earned Squirrel upgrade, 120 starting gold, 2 gold per kill, health scale 1. Turtle is awarded on victory and becomes available on completed-map replays as well as the later final encounter.

| Wave | Cycles | Lesson | Clear reward |
| --- | --- | --- | --- |
| 1 | Five cycles of six Rats 2s apart, 6s quiet, four non-evasive Weasels 0.45s apart; 3.45s before the next cycle | Fast arrivals without evasion | 35 |
| 2 | Eighteen alternating Rat/Weasel pairs, 1.1s Rat-to-Weasel and 2.2s until the next Rat | 1:1 mixed guard/evasion | 40 |
| 3 | Twelve cycles of three Rats 1s apart, then two Weasels 0.45s apart; 3s quiet after the second Weasel | Repeated overlapping bursts | 35 |

Wave 1 Rats use 6s down/4s up; later Rats use 5s down/5s up. Weasels run at 85% of catalog speed, with a 15% relative bonus during evasion. Wave 2: 3s exposed/2s evasive. Wave 3: 2.6s exposed/2.4s evasive. A 0.6s warning precedes each evasion window. Exact values are initial tuning for owner playtest; Lantern is unchanged.

Wave 4 repeats all three mini cycles three times: 1 Rat/5 Weasels, 2 Rats/4 Weasels, 3 Rats/3 Weasels. Every mini cycle has six enemies at 0.2s intervals and five seconds from its last spawn to the next cycle. Total 18 Rats/36 Weasels. Finale Weasels move at 1.1× catalog speed with 2s evasion every 5s; Rats retain 5s shield up/5s down. Final clear reward is zero; discovery is the reward.

## Map 3 — The Last Lantern (first board's boss map)

New woodland route with two worthwhile firing areas. The first bend should have room for a Turtle and a Squirrel; a downstream area should provide a recovery opportunity. No single placement should cover nearly the entire trail. The route must be long enough to show the boss windup/rally and give a competent defense time to defeat it.

Start at 120 gold. Available: Squirrel with its upgrade, base Turtle. No Skunk, Boar, Turtle upgrade, or prebattle advantage. The first four waves teach and practice slow before the finale. Tune boss stats for these actual tools; the current 1100 HP / armor 6 catalog values are a starting hypothesis, not a requirement.

| Wave | Recipe                           | Fixed reward / total income | Lesson                                       |
| ---- | -------------------------------- | --------------------------- | -------------------------------------------- |
| 1    | W4@5 + R10@2.8                   | 25 / 53                     | Generous Turtle introduction: net a runner for arrow follow-up |
| 2    | W12@2.4                          | 28 / 52                     | Practise net timing, coverage, and expiration |
| 3    | G14[2]@3                         | 30 / 58                     | Slow also buys time through a Rat guard cycle |
| 4    | R10[2]@3 + W12[2]@2.5            | 32 / 76                     | Combine learned roles across both firing areas |
| 5    | G14[2]@2.8 + W10[2]@2.5          | 35 / 83                     | Hard combined rehearsal and final investment; below boss pressure |
| 6    | R6[2]@3 + K1@2 + R12[2]@3 + W4@3 | 0 / 70                      | Hardest wave: strong Roadwarden, escorts, unique rally, required defeat |

### Ticket 04 simulation evidence

The following lines use the real `Game` with seed 42, 120 starting gold, first-arrival tools and fixed build orders. The mixed line opens with one Net and one Squirrel, then spends on eight base Squirrels. The Squirrel line opens with three Squirrels and adds six more. Both clear all five teaching waves while prioritizing coverage over upgrades; separate rule coverage verifies that only the Squirrel upgrade is available. This is one scripted candidate comparison, not a player balance result.

| Wave | Mixed: seconds / leaks / lives / bank | Squirrels: seconds / leaks / lives / bank |
| --- | --- | --- |
| 1 | 56.5 / 0 / 12 / 43 | 52.5 / 0 / 12 / 53 |
| 2 | 34.1 / 0 / 12 / 55 | 29.6 / 0 / 12 / 65 |
| 3 | 46.1 / 0 / 12 / 33 | 40.6 / 0 / 12 / 43 |
| 4 | 48.1 / 4 / 8 / 61 | 43.6 / 0 / 12 / 39 |
| 5 | 58.9 / 3 / 5 / 58 | 47.4 / 0 / 12 / 82 |

The mixed line clears all five waves in 243.7 simulated seconds with five lives remaining; the Squirrel line clears in 213.6 seconds at full lives. Cumulative enemy-plus-clear income is 308 and 322 gold respectively. The mixed line gives up damage coverage for control but still reaches the boss attempt with a recoverable life reserve.

A delayed remote-Net comparison opens with three Squirrels at the first two bends, then buys one Net at `(10,4)` as soon as it can afford it and makes no further investments. The late Net slows enemies without damage support on the final stretch. It reaches wave 4, then loses with all 12 lives gone; this shows why slow needs useful follow-up damage. Total simulated time is 192.1 seconds. This is a scripted placement lesson, not a player balance result.

| Wave | Remote: seconds / leaks / lives / bank |
| --- | --- |
| 1 | 52.5 / 0 / 12 / 3 |
| 2 | 29.6 / 0 / 12 / 55 |
| 3 | 64.5 / 2 / 10 / 109 |
| 4 | 45.5 / 10 / 0 / 129 |

Preview the final-wave objective: defeat the Roadwarden. This must feel clearly harder than wave 5 while remaining beatable with the earned roster and more than one reasonable defense. Its rally makes this boss wave distinct. Its escape loses the attempt regardless of remaining hearts. Its defeat, after remaining ordinary enemies are cleared and with hearts remaining, completes the first board. Show boss health only during the encounter.

The proposed rally has a 1s windup and applies 3s of +25% speed to ordinary enemies within 3 path-distance units, first at boss age 6s and every 10s thereafter. Use the stronger of sprint/rally, then multiply by existing net slow. The boss does not buff itself, create enemies, heal, or become invulnerable. Tune spawn gaps so an escort actually receives the rally. If the optional rally is cut for schedule, remove its tells and retain the deliberate moving boss/escort challenge.

Victory shows the chapter-complete celebration and awards Reach (+18% range) and Longer Nets (+50% slow duration) for replay. Choose one applicable advantage or None. Longer Nets only applies to Map 3. No higher star count is required. Replay does not reset the sibling's save or repeat the unlock celebration.

## Evidence to record

For each map, record two viable defenses with actual arrival unlocks, weak placement and delayed-spending observations, and per-wave bank, income, builds/upgrades, lives/leaks, and duration. On Map 3 compare well-placed Turtle support against extra Squirrel spending. The goal is visible value and overlapping solutions, not a requirement that every tower type can win alone.

Use actual family devices for touch/readability checks and a short child play observation before calling a lesson understood. Do not infer enjoyment or a beginner win rate from an optimized scripted strategy.

## Fourth-wave expansion — 26 September 2026

Owner requested one additional full set and revised mini cycles: 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels. Repeat the entire pattern four times: twelve mini cycles, twenty-eight Rats and sixty Weasels (88 enemies). Retain 0.2s between spawns and five seconds from a mini cycle's last spawn to the next one's first spawn. Shield timing, extra-fast movement and two-second evasion every five seconds are unchanged. The prior nine-cycle recipe and its balance figures are historical.

Real Game spawn coverage verifies all twelve variable-size mini cycles and pauses. Both existing Squirrel spending strategies still clear all four waves; owner playtest remains the balance check.
