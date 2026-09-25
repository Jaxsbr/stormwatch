# Design the current enemy and tower matchups across both maps

Status: resolved

## Goal

Give each current enemy and combat tower a memorable role while keeping more than one useful defense path open. Design scenarios for all four enemy roles, all three combat towers, and both existing maps before expanding the roster. Stress-test the current game first so later tuning has a baseline.

This issue is a roster design and current-build challenge audit; do not implement new abilities here. After the owner reviews the matrix and map plan, add each selected gameplay rule through a small, production-lineage slice in the real simulation/content/rendering boundaries. Keep validated code; do not build the same mechanic once in a toy prototype and then port it.

## Confirmed design rules

- Every enemy and tower has a distinctive, visually legible job.
- Matchups overlap: a tower can be a particularly effective answer, but other towers remain useful through different trade-offs. Do not make one enemy require exactly one tower.
- Teach an enemy behavior with a clear visual tell and a low-risk first encounter; revisit it, then combine learned enemies.
- Progress strategy through authored wave contents and route/terrain placement differences, not only higher health, damage, speed, or wave count.
- A weak plan can eventually lose, but the player should see which decisions caused leaks and have room to learn on retry.
- Keep the audience at ages six through adult in view: short visual explanations, no hidden stat puzzle or required grind.

## Current implementation baseline

These are the existing roles, not the final matchup decisions.

| Role | Current behavior | Intended identity already communicated |
|---|---|---|
| Squirrel archer | Focuses one target with reliable direct shots | Precision and single-target damage |
| Skunk slinger | Slow attacks damage enemies grouped around the impact | Splash and crowd damage |
| Turtle trapper | Low damage; each hit slows movement for a short time | Control that gives other defenses more time |
| Donkey trader | Does not attack; adds fixed income at wave end | Economy role; keep outside the combat-matrix pass |

| Enemy | Current distinction | Candidate direction from owner; not an approved rule |
|---|---|---|
| Rat raider / little mouse | Ordinary speed, low health, no armor or active behavior | Baseline enemy; possibly a brief, animated shield block |
| Fleet weasel | Fast, low health, no armor or active behavior | May evade some attacks; precise aim could be valuable |
| Iron boar | Slow, high health and armor, no active behavior | Iron-bar shield could stay raised longer than the mouse's |
| Roadwarden | Very high health and armor, slow, high leak cost, no active behavior | Needs a distinct readable role; could reinforce or combine known lessons rather than merely gain more health |

All four enemy roles already appear in both eight-wave maps. The current `EnemyDef` has no active ability state; the simulation applies the same flat armor reduction to all tower damage. Evasion, shield windows, flying, piercing and accuracy are not existing rules. The two maps use similar enemy combinations, so adding more stats alone will not create the requested tactical variety.

## Work

1. Fill a 4-enemy × 3-combat-tower matrix. For each cell, describe the tower's role, current interaction, likely trade-off (crowns, coverage, time, or another opportunity), and why another tower may be a reasonable alternative.
2. Propose one memorable signature behavior and visible tell per enemy. Keep the mouse shield and longer iron shield as related variants only if their timing creates genuinely different decisions. Give the Roadwarden a clear lesson role without stacking several unreadable abilities.
3. Map the behavior lessons through Lantern Pass and Rainstone Crossing. Identify a small first sighting, a clearer practice wave, and a later mixed wave. Make the routes change useful placements while preserving fixed trails and the existing two-map scope.
4. Define three repeatable strategy lines for each map: the current broad one-of-each baseline, a deliberate matchup-driven mix, and an intentionally weak or greedy plan. Record waves started/completed, leaks/hearts remaining, tower mix and upgrades, crowns/interest, placement coverage, and whether the visual tells explained the result.
5. Stress-test the current build before new abilities: check whether the baseline one-of-each plan wins by repetition, whether a thoughtful alternate plan wins for a different reason, and whether a poor plan can lose in an understandable way. Tune wave groups and rewards before adding tower types if content changes can create the decision. Do not mistake lowering stats or increasing counts for new tactical depth.
6. Write the next small gameplay-slice ticket after the owner reviews this design pass. Implement and test one complete enemy lesson in the real simulation and current content, then keep or revise it based on play. Add each later ability as a small follow-on slice; add a new tower or upgrade only where the matrix shows current roles cannot express a useful trade-off.

## Matrix template

| Enemy / behavior | Archer: strength and cost | Slinger: strength and cost | Trapper: strength and cost | Useful alternatives / placement effect | Visual tell and lesson wave |
|---|---|---|---|---|---|
| Rat raider / mouse | To decide | To decide | To decide | To decide | To decide |
| Fleet weasel | To decide | To decide | To decide | To decide | To decide |
| Iron boar | To decide | To decide | To decide | To decide | To decide |
| Roadwarden | To decide | To decide | To decide | To decide | To decide |

## Acceptance

- The matrix explains a meaningful trade-off in all 12 enemy/tower combinations, with at least two viable tower responses per enemy and no exclusive counter.
- Every enemy has a proposed role distinguishable by play and animation, not only hit points or speed.
- Both maps have a reviewable teach → practice → combine arc, and their routes create different placement choices.
- Current-build runs establish whether repeating a generic one-of-each build is dominant and under what placement; alternate and weak runs expose the present failure pressure.
- The design explains how a later weak plan can leak and eventually lose, while the first sighting of a new behavior stays low-risk and a retry teaches the answer.
- No long text, hidden stat thresholds, required grind, maze-building, new map scope, placeholder mechanics, or unapproved asset spending is required.
- New simulation behavior is tested deterministically and demonstrated in normal-speed play before its later enemy applications are added.

## Out of scope

- Recreating the Warcraft III / Warhammer 40K map's maze construction or extreme memorization difficulty.
- Implementing all four new abilities, adding new towers/upgrades, or changing the simulation architecture in one batch.
- Redesigning the donkey or supply/economy loop in this combat pass. Track that separately so economy changes do not hide whether the enemy/tower matchup itself creates decisions.
- Adding more than the two current maps or buying new assets.

## Reconciliation

This older umbrella ticket is superseded by the eight tickets in `.scratch/learnable-wave-strategy/`. The current status is recorded in [reconciliation](../../../review/2026-09-25-learnable-wave-strategy/reconciliation-2026-09-25.md). Do not count this as a ninth independent gameplay task.
