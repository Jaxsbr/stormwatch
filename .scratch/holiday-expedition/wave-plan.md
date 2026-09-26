# Three-map boss chapter: initial wave plan

Status: supporting content for the ready-for-agent Day 2-onward spec; numeric recipes are untested tuning values

Execution begins with Map 3. Maps 1–2 describe the assumed arrival state and the earlier Day 1 plan, not additional implementation work under this spec. Confirm those prerequisites in the integration checkout; this document does not claim they have shipped.

## Common notation and tuning

`R` = Rat, `W` = Weasel, `K` = Roadwarden. `R20@3` means 20 total Rats, one every 3 seconds. `R20[2]@3` means 20 total Rats, pairs every 3 seconds, with 0.3 seconds between members. `+` means sequential spawn groups through the existing scheduler. It does not start groups simultaneously; check their actual overlap on the route.

Normal Rat guards use 2s up / 8s down. `G` means 4s up / 6s down and 0.75× movement. All Rats begin shield-down. Weasels use the spec's deterministic sprint. Start all three maps at health scale 1 and kill reward scale 0.4: Rats/Weasels 2 gold, boss 26. Fixed rewards below are added once when a wave clears. Income totals assume every enemy is killed and are arithmetic projections, not balance evidence.

Agents may tune count, gap, starting gold, health, and reward data based on real simulation and play, while preserving the lesson and reward order. Prefer local changes over globally weakening the roster to rescue one bad wave. Preserve the owner-selected Map 1 recipes until play feedback identifies a concrete problem.

## Map 1 — Lantern Pass

Existing route; Squirrel only. Start at 100 gold. First-arrival upgrades locked. Victory earns Squirrel upgrades and Map 2. A replay may use earned Squirrel upgrades; other towers remain unavailable.

| Wave | Recipe   | Guard / movement      | Fixed reward / total income | Lesson                                         |
| ---- | -------- | --------------------- | --------------------------- | ---------------------------------------------- |
| 1    | R20@3    | 2 up / 8 down; normal | 25 / 65                     | See guard and buy a third Squirrel during play |
| 2    | R23@2    | 2 up / 8 down; normal | 28 / 74                     | Respond to a busier trail                      |
| 3    | R20[2]@3 | 4 up / 6 down; 0.75×  | 30 / 70                     | Notice pairs and slower movement               |
| 4    | R23@3    | 6 up / 4 down; normal | 34 / 80                     | Cover the shield-down opening                  |
| 5    | R20[2]@2 | 6 up / 4 down; 0.75×  | 38 / 78                     | Combine guard duration and pairs               |

## Map 2 — Rainstone Crossing

Owner-approved amendment and playtest revision, 26 September 2026: four mixed waves. Squirrel only, earned Squirrel upgrade, 120 starting gold, 2 gold per kill, health scale 1. Turtle is awarded on victory and first used in the later final encounter.

| Wave | Cycles | Lesson | Clear reward |
| --- | --- | --- | --- |
| 1 | Five cycles of six Rats 2s apart, 6s quiet, four non-evasive Weasels 0.45s apart; 3.45s before the next cycle | Fast arrivals without evasion | 35 |
| 2 | Eighteen alternating Rat/Weasel pairs, 1.1s Rat-to-Weasel and 2.2s until the next Rat | 1:1 mixed guard/evasion | 40 |
| 3 | Twelve cycles of three Rats 1s apart, then two Weasels 0.45s apart; 3s quiet after the second Weasel | Repeated overlapping bursts | 35 |

Wave 1 Rats use 6s down/4s up; later Rats use 5s down/5s up. Weasels run at 85% of catalog speed, with a 15% relative bonus during evasion. Wave 2: 3s exposed/2s evasive. Wave 3: 2.6s exposed/2.4s evasive. A 0.6s warning precedes each evasion window. Exact values are initial tuning for owner playtest; Lantern is unchanged.

Wave 4 repeats all three mini cycles three times: 1 Rat/5 Weasels, 2 Rats/4 Weasels, 3 Rats/3 Weasels. Every mini cycle has six enemies at 0.2s intervals and five seconds from its last spawn to the next cycle. Total 18 Rats/36 Weasels. Finale Weasels move at 1.1× catalog speed with 2s evasion every 5s; Rats retain 5s shield up/5s down. Final clear reward is zero; discovery is the reward.

## Map 3 — The Last Lantern

New woodland route with two worthwhile firing areas. The first bend should have room for a Turtle and a Squirrel; a downstream area should provide a recovery opportunity. No single placement should cover nearly the entire trail. The route must be long enough to show the boss windup/rally and give a competent defense time to defeat it.

Start at 120 gold. Available: Squirrel with its upgrade, base Turtle. No Skunk, Boar, Turtle upgrade, or prebattle advantage. The first four waves teach and practice slow before the finale. Tune boss stats for these actual tools; the current 1100 HP / armor 6 catalog values are a starting hypothesis, not a requirement.

| Wave | Recipe                           | Fixed reward / total income | Lesson                                       |
| ---- | -------------------------------- | --------------------------- | -------------------------------------------- |
| 1    | W4@5 + R10@2.8                   | 25 / 53                     | A visible net keeps a runner in arrow range  |
| 2    | W12@2.4                          | 28 / 52                     | Notice net duration and where it expires     |
| 3    | G14[2]@3                         | 30 / 58                     | Slow also buys time through a guard cycle    |
| 4    | R10[2]@3 + W12[2]@2.5            | 32 / 76                     | Support damage in a second firing area       |
| 5    | G14[2]@2.8 + W10[2]@2.5          | 35 / 83                     | Final practice and money to improve the line |
| 6    | R6[2]@3 + K1@2 + R12[2]@3 + W4@3 | 0 / 70                      | One boss with a readable escort procession   |

Preview the final-wave objective: defeat the Roadwarden. Its escape loses the attempt regardless of remaining hearts. Its defeat, after remaining ordinary enemies are cleared and with hearts remaining, wins the chapter. Show boss health only during the encounter.

The proposed rally has a 1s windup and applies 3s of +25% speed to ordinary enemies within 3 path-distance units, first at boss age 6s and every 10s thereafter. Use the stronger of sprint/rally, then multiply by existing net slow. The boss does not buff itself, create enemies, heal, or become invulnerable. Tune spawn gaps so an escort actually receives the rally. If the optional rally is cut for schedule, remove its tells and retain the deliberate moving boss/escort challenge.

Victory shows the chapter-complete celebration and awards Reach (+18% range) and Longer Nets (+50% slow duration) for replay. Choose one applicable advantage or None. Longer Nets only applies to Map 3. No higher star count is required. Replay does not reset the sibling's save or repeat the unlock celebration.

## Evidence to record

For each map, record two viable defenses with actual arrival unlocks, weak placement and delayed-spending observations, and per-wave bank, income, builds/upgrades, lives/leaks, and duration. On Map 3 compare well-placed Turtle support against extra Squirrel spending. The goal is visible value and overlapping solutions, not a requirement that every tower type can win alone.

Use actual family devices for touch/readability checks and a short child play observation before calling a lesson understood. Do not infer enjoyment or a beginner win rate from an optimized scripted strategy.
