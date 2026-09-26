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

Reauthor the current eight-wave encounter. Squirrel only, upgrades available. Start at 100 gold. Retain the different route and separate bends so successive firing areas matter. Victory earns Turtle and Map 3. The opening clear funds an upgrade after a two-Squirrel opening.

| Wave | Recipe                | Fixed reward / total income | Lesson                                               |
| ---- | --------------------- | --------------------------- | ---------------------------------------------------- |
| 1    | R16@2.8               | 25 / 57                     | Try an upgrade or extend coverage                    |
| 2    | W3@6 + R10@2.5        | 28 / 54                     | Three separated, forgiving first sprints             |
| 3    | R10@2 + W8@2.5        | 30 / 66                     | Continue firing after a runner leaves the first bend |
| 4    | G12[2]@3 + W10@2      | 32 / 76                     | Guarded Rats occupy towers as runners catch up       |
| 5    | W12[2]@3 + R16[2]@2.5 | 35 / 91                     | Sustain a defense across the route                   |

Compare several base Squirrels against fewer upgraded Squirrels. Neither must require an exact memorized timing. Turtle is unavailable and cannot be required for a win. Check whether the final wave awards too much unused money; tune pressure and income together.

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
