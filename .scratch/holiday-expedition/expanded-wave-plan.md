# Historical five-map expansion draft — superseded

> This draft predates the owner's map-board direction and is not an implementation plan. The first board is Lantern Pass → Rainstone Crossing → The Last Lantern, ending in a required Roadwarden boss victory. Iron Boars are reserved for the next board. Any future expansion must be replanned as sequential maps followed by a boss map; do not treat the old five-map order or recipes below as approved.

Status: historical future-design option — superseded, outside the three-map holiday release; untested, not validated balance

The owner suggested boss maps as the delivery target. The current recommendation is the three-map chapter in `spec.md` and `wave-plan.md`. This longer draft preserves possible Skunk/Boar lessons for later adaptation. Its level order, rewards, and numbers are not approved implementation work, and would need reconciliation with saves from the three-map release.

These recipes make the map plan implementable. Change counts, gaps and budgets during measured playtesting while preserving the first sighting → practice → combination order. The existing Lantern plan is the owner-selected baseline. First-time play uses only the rewards earned from previous maps. No scripted success using extra unlocks counts as acceptance.

## Recipe notation

- `R20@3` means 20 Rats, one every 3 seconds. `R20[2]@3` means 20 Rats total, pairs every 3 seconds, 0.3 seconds between the two members. `W` = Weasel, `B` = Boar, `K` = Roadwarden. Batch size never multiplies the stated total.
- `+` separates sequential spawn groups using the current scheduler; it does not mean simultaneous starts. Earlier enemies can still be on the trail when the next group begins. Check actual overlap and position in play.
- Ordinary Rat guard uses 2 seconds up / 8 down. `G` denotes Rats with 4 up / 6 down and 0.75× movement. `H` denotes 6 up / 4 down, with movement stated separately. All begin shield-down, as the current game does.
- Map 2 onward: Weasel sprint follows the spec. Boars keep current armor. Health scale starts at 1 for all five maps. Avoid multiplying global enemy health merely to offset an over-generous economy.
- Starting budgets: Map 1 100; Map 2 100; Map 3 120; Map 4 145; Map 5 160. These are starting hypotheses. Map 3 can open Squirrel + Turtle; Map 4 can open two Squirrels + Skunk; Map 5 can open one of each. Map 5's required boss must remain beatable after ordinary early leaks.
- Begin with `enemyRewardScale: 0.4` across the campaign: Rats/Weasels pay 2, Boars 4, boss 26. Never add passive income. The income column below assumes every enemy is defeated and includes the fixed wave reward.

## 1 — Lantern Pass

Use the current path, prices and owner-selected content. Squirrel only; upgrades locked on first arrival. Victory unlocks Squirrel upgrades.

| Wave | Spawn recipe | Guard and movement | Fixed reward / total income | Purpose |
| --- | --- | --- | --- | --- |
| 1 | R20@3 | 2 up / 8 down; normal movement | 25 / 65 | See shield protection; afford third Squirrel from kills |
| 2 | R23@2 | Same | 28 / 74 | Spend and cover a busier trail |
| 3 | R20[2]@3 | 4 up / 6 down; 0.75× movement | 30 / 70 | Notice pairs and longer exposure |
| 4 | R23@3 | 6 up / 4 down; normal movement | 34 / 80 | Find the second firing opportunity |
| 5 | R20[2]@2 | 6 up / 4 down; 0.75× movement | 38 / 78 | Combine long guards and pairs |

## 2 — Rainstone Crossing

Reauthor the existing map. Retain its longer route and separate bends; make a second firing area useful when a runner exits the first. Squirrel only, with upgrades earned from Map 1. First wave pays enough to make the first upgrade affordable after a two-Squirrel opening. Victory unlocks Turtle.

| Wave | Spawn recipe | Fixed reward / total income | Purpose |
| --- | --- | --- | --- |
| 1 | R16@2.8 | 25 / 57 | Safely try the newly unlocked upgrade |
| 2 | W3@6 + R10@2.5 | 28 / 54 | Three separated first sprints, with room to recover |
| 3 | R10@2 + W8@2.5 | 30 / 66 | Extend coverage beyond the first bend |
| 4 | G12[2]@3 + W10@2 | 32 / 76 | Guards occupy archers while faster enemies catch up |
| 5 | W12[2]@3 + R16[2]@2.5 | 35 / 91 | Sustain two useful firing areas |

Watch for the alternative of several base Squirrels versus fewer upgraded Squirrels. Both should be defensible choices; do not require an exact upgrade timing or Turtle before it has been earned. If the final wave creates excessive spare cash, reduce its kill count/reward before inflating every enemy's health.

## 3 — Reedbend Trail

New woodland route: one generous bend with adjacent buildable space for a Turtle and a damage tower, then a second viable downstream position. Avoid a route where a single net covers almost everything. Squirrel upgrades available; Turtle base form only. Victory unlocks Skunk.

| Wave | Spawn recipe | Fixed reward / total income | Purpose |
| --- | --- | --- | --- |
| 1 | W4@5 + R10@2.8 | 25 / 53 | Show a net holding a runner in arrow range |
| 2 | W12@2.4 | 28 / 52 | Make the slow effect and its expiry visible |
| 3 | G14[2]@3 | 30 / 58 | Slow also buys time through a Rat guard |
| 4 | R10[2]@3 + W12[2]@2.5 | 32 / 76 | Choose where slow supports a second firing area |
| 5 | G14[2]@2.8 + W14[2]@2.5 | 35 / 91 | Combine timing and speed on the full route |

Compare Turtle plus damage against the same money spent on extra Squirrels. The mixed layout should have an observable benefit in suitable locations; a well-placed Squirrel-heavy alternative may still win. A Turtle stranded away from damage should reveal why placement matters.

## 4 — Ironwood Gate

New route with two useful turns and an exposed connecting stretch. The turns offer splash opportunities; the connecting stretch offers sustained focused fire. All three towers; only Squirrel upgrades on arrival. Victory unlocks Turtle and Skunk upgrades in one Veteran training panel.

| Wave | Spawn recipe | Fixed reward / total income | Purpose |
| --- | --- | --- | --- |
| 1 | R18[3]@4 | 25 / 61 | Make the first Skunk visibly hit several targets |
| 2 | B2@7 + R12[2]@3 | 28 / 60 | Two separated Boars reveal heavy armor and impacts |
| 3 | B4@5 + R12[3]@3 | 30 / 70 | A tough target and clustered escorts reward heavy fire |
| 4 | W8@2.5 + B4@4 + R10[2]@2.5 | 32 / 84 | Keep coverage for runners while engaging armor |
| 5 | B6@4 + R12[3]@2.8 + W6@2.5 | 35 / 95 | Combine armor, crowd clearing, and movement control |

Do not show a cracking/breaking armor state: that rule is explicitly deferred. Check Skunk's actual splash radius against the visible impact and the batch spacing after movement; close spawning alone does not guarantee grouped targets at impact time.

## 5 — The Last Lantern

New final route with two worthwhile defense areas rather than one dominant firing pocket. Allow enough route length for the boss's windup and at least one rally to be seen. All towers and their earned upgrades available. Ordinary victory requires the boss to die. Reward two optional replay advantages and the expedition ending.

| Wave | Spawn recipe | Fixed reward / total income | Purpose |
| --- | --- | --- | --- |
| 1 | R16[2]@3 + W4@3 | 28 / 68 | Reestablish a line and try a newly unlocked upgrade |
| 2 | B3@5 + R12[3]@3 | 30 / 66 | Practice heavy damage and splash |
| 3 | W12[2]@3 + G10[2]@3 | 32 / 76 | Practice slow and staggered firing positions |
| 4 | B4@4 + R12[3]@3 + W8@2.5 | 35 / 91 | A final ordinary defense check with time to invest |
| 5 | R8[2]@2.5 + K1@2 + R18[3]@3 + W6[2]@4 | 0 / 90 | Boss procession and visibly rallied escorts |

The boss arrives after the opening Rats. Nearby trailing Rats must actually enter rally range; adjust group gaps or route placement if they do not. Do not add a second boss to extend the ending. The final wave has no clear-reward coins because the attempt is over; display the persistent reward instead.

Start the boss at the existing catalog stats. Tune final-wave composition and boss stats from full campaign play with actual arrival unlocks. If this requires excessively precise placements, lower final pressure or lengthen useful firing exposure. The boss should be tense and understandable; one mistaken purchase must not automatically make the attempt unwinnable.

## Tuning record required from implementation

Each map's checkpoint records the actual accepted recipe, route, unlock state, two viable strategies, one weak/delayed-spending observation, wave times, and owner feedback. Describe alternatives by their placement and budget rather than by a claimed universal win rate. Initial income totals are arithmetic projections, not simulation evidence. Validate route visibility and buildable space on the actual landscape tablet layout.
