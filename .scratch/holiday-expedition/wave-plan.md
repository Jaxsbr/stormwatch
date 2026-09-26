# First three-map board: initial wave plan

Status: implemented checkpoint for the first three-map board; scripted balance evidence is recorded below, and family-device/child playtesting remains ticket 06

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

| Wave | Cycles                                                                                                                                       | Lesson                              | Clear reward |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------ |
| 1    | Five cycles of six Rats 2s apart, 6s quiet, four non-evasive Weasels 0.45s apart; 3.45s before the next cycle                                | Fast arrivals without evasion       | 35           |
| 2    | Eighteen alternating Rat/Weasel pairs, 1.1s Rat-to-Weasel and 2.2s until the next Rat                                                        | 1:1 mixed guard/evasion             | 40           |
| 3    | Twelve cycles of three Rats 1s apart, then two Weasels 0.45s apart; 3s quiet after the second Weasel                                         | Repeated overlapping bursts         | 35           |
| 4    | Repeat 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels four times; 0.2s between enemies and 5s between mini cycles (28 Rats, 60 Weasels) | Twelve tight, fast, evasive packets | 0            |

Wave 1 Rats use 6s down/4s up; later Rats use 5s down/5s up. Weasels run at 85% of catalog speed, with a 15% relative bonus during evasion. Wave 2: 3s exposed/2s evasive. Wave 3: 2.6s exposed/2.4s evasive. A 0.6s warning precedes each evasion window. Exact values are initial tuning for owner playtest; Lantern is unchanged.

Wave 4 Rats retain 5s shield up/5s down. Weasels move at 1.1× catalog speed with 2s evasion every 5s. Each mini-cycle is scheduled as sequential groups; the pause is measured from its last Weasel to the next Rat. This is the current four-wave, 88-enemy recipe; earlier three-wave and nine-cycle drafts are historical.

## Map 3 — The Last Lantern (first board's boss map)

The two-bend route offers several firing areas and downstream recovery options. The first bend supports a Turtle/Squirrel pair; later sites cover the center and village approach. No single placement covers the whole trail. The route is 26 path units long, giving the procession time for its rally and the defenses time to damage the Roadwarden.

Start at **235 gold**. The earlier 120-gold budget was a hypothesis; deterministic candidate lines at 120 and 180 failed the original six-wave recipe. The 235-gold opening remains active with Squirrel and its earned upgrade plus base Turtle; no Skunk, Boar, Turtle upgrade, or prebattle advantage on first arrival. Enemy health and reward scales are 1 and 0.4; Rats and Weasels yield 2 gold each and the Roadwarden yields 26. The owner doubled Roadwarden health from 1100 to 2200; armor remains 6. The old 235-gold clear results below are superseded by the updated boss and five-party pressure.

| Wave                          | Exact sequence                                                                                                                                       | Guard, speed and evasion                                                                                                             | Clear reward / maximum enemy income | Lesson                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------- |
| 1 — A Net in the Lanternlight | Three cycles: 6 Rats at 2s intervals; wait 6s; 4 non-evasive Weasels at 0.45s intervals. The next cycle starts 3.45s after the last Weasel. 18R/12W. | Rats: 4s raised/6s down. Weasels: 0.85×.                                                                                             | 25 / 85                             | Learn slow on a clear runner packet, then handle the returning Rat column.              |
| 2 — Crossing Pairs            | Eighteen pairs: Rat, then Weasel 0.9s later; next Rat 1.6s after the Weasel. 18R/18W.                                                                | Rats: 5s/5s. Weasels: 1.0×; 2.6s exposed/2.4s evading.                                                                               | 28 / 100                            | Time slow against alternating guard and evasion without a long reset.                   |
| 3 — Through the Guard         | Five cycles: 5 Rats at 0.2s intervals, then 3 Weasels at 0.2s intervals; 5s from last Weasel to next Rat. 25R/15W.                                   | Rats: 5s/5s; 0.75×. Weasels: 1.0×; 2.6s/2.4s.                                                                                        | 30 / 110                            | Protect two firing areas through compact mixed packets.                                 |
| 4 — Both Bends                | Repeat three times: 1R/6W, 2R/5W, 4R/4W. 0.2s between enemies and 5s from each mini-cycle's last Weasel to next Rat. 21R/45W.                        | Rats: 5s/5s. Weasels: 1.0×; 2.6s/2.4s.                                                                                               | 32 / 164                            | Hold the full road against repeated runner-heavy then Rat-heavy packets.                |
| 5 — The Last Rehearsal        | Repeat wave 4's mini-cycle set four times. 28R/60W (88 enemies); 0.2s within cycles and 4s between cycles.                                           | Rats: 5s/5s. Weasels: 1.1×; 2s exposed/3s evading.                                                                                   | 35 / 211                            | Rainstone-sized sustained pressure; save and invest while covering both bends.          |
| 6 — The Roadwarden's Column   | Send 8 guarded Rats at 0.8s intervals as the vanguard, then the 2200-HP Roadwarden. Five parties start at boss ages 4.5s, 14.5s, 24.5s, 34.5s and 44.5s: 7 Weasels, 5 Rats, 7 Weasels, 5 Rats, 7 Weasels. Spacing is 0.2s for Weasels and 0.15s for Rats. | Rats: 5s/5s. Weasels: 1.1×; 2s exposed/3s evading. Rally starts at age 7s and repeats every 10s; +25% for 3s to ordinary enemies within 3 path units. | 0 / 104 | Five timed escort parties keep pressure around the required Roadwarden fight. |

Wave groups are sequential under the current scheduler: a group's `gap` advances the spawn clock after its final enemy, and `delayBefore` adds silence before the next group. The authored escort start times align one party before each of the first five rally pulses at boss ages 7s, 17s, 27s, 37s and 47s. Rally selects by path distance, not straight-line proximity; it uses the stronger of sprint/rally before applying net slow. The boss creates no enemies, does not heal, and is not invulnerable.

The Roadwarden is a required defeat only on this map. A leak loses even if hearts remain; boss death alone does not complete a wave while enemies remain. The first-board ending appears only after the procession is clear and hearts remain. No separate defeat directive is shown in the briefing, beside the wave control, or in text toasts; boss health remains visible while it is alive. The first win unlocks Reach (+18% range) and Longer Nets (+50% slow duration) for replays. No future board/node is exposed. Replay keeps best stars and does not repeat the first-win celebration.

### Seeded real-Game evidence

These deterministic candidate runs use seed 42, the first-arrival roster and 235 starting gold. They are balance evidence for scripted build plans, not child comprehension, enjoyment, or device-performance evidence. The first summary set is a mixed opening with one Net and three Squirrels; the second spends on upgraded Squirrels. Rows show `wave: duration / lives / cumulative leaks / bank / wave income / towers (upgraded)`.

| Wave | Net + Squirrels | Upgraded Squirrels | Poor-opening Squirrel |
| ---- | --------------------------------- | --------------------------------- | --------------------- |
| 1    | 68.4 / 12 / 0 / 55 / 85 / 5 (1)   | 63.9 / 12 / 0 / 50 / 85 / 4 (2)   | 64.6 / 12 / 0 / 50 / 85 / 4 (2) |
| 2    | 56.0 / 12 / 0 / 60 / 100 / 6 (2)  | 53.5 / 12 / 0 / 30 / 100 / 7 (2)  | 51.4 / 12 / 0 / 30 / 100 / 7 (2) |
| 3    | 61.4 / 12 / 0 / 35 / 110 / 8 (3)  | 46.6 / 12 / 0 / 60 / 110 / 9 (2)  | 51.2 / 12 / 0 / 60 / 110 / 9 (2) |
| 4    | 71.6 / 6 / 6 / 67 / 152 / 11 (3)  | 64.6 / 10 / 2 / 45 / 160 / 12 (3) | 64.6 / 9 / 3 / 43 / 158 / 12 (3) |
| 5    | 75.1 / 2 / 10 / 65 / 203 / 12 (6) | 75.5 / 7 / 5 / 85 / 205 / 12 (6)   | 75.1 / 2 / 10 / 75 / 197 / 12 (6) |
| 6    | 68.8 / 0 / 11 / 29 / 74 / 12 (8) | 63.6 / 1 / 6 / 51 / 76 / 12 (8) | 63.6 / 0 / 11 / 41 / 76 / 12 (8) |

After the owner-requested boss increase and final 7-Weasel / 5-Rat party sizes, all three candidate lines lose during wave 6 before killing the Roadwarden. The upgraded-Squirrel line loses to boss escape at 367.7s with one life and 6 cumulative leaks; the mixed line loses at 401.3s with no lives and 11 leaks; the poor-opening line loses at 370.6s with no lives and 11 leaks. This is seed-42 evidence of pressure, not proof that the finale is beatable or balanced. Ticket 06 should capture owner/family play against the updated wave.

Browser inspection and family-device/child play remain separate verification. Use actual family devices for touch/readability checks and a short child observation before calling a lesson understood. Do not infer enjoyment or a beginner win rate from these optimized scripted strategies.
