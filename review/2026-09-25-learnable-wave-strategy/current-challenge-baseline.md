# Current challenge baseline — 25 September 2026

This is the **historical pre-guard** deterministic simulation with the shipped Lantern Pass and Rainstone Crossing definitions at `b164152`. The Rat Raider guard was added later; see the [post-guard scenario check](reconciliation-2026-09-25.md) for the current build. No combat, economy, content, or rendering rule was changed for this audit. The complete per-wave command, position, shot, leak, payout, and state record is in [challenge-baseline.json](challenge-baseline.json). Reproduce it from a clean install with `node tools/run-challenge-baseline.mjs > baseline.jsonl`; the runner uses the real `Game` at 30 fixed ticks per second. It bundles the TypeScript entry with the pinned Vite dependency's Rolldown package. The six lines use Far-sight scouts, seed 42, 12 starting hearts, no assist, no rescue, and no purchases during a wave. Each command is checked for success; a wave times out as an error after 240 simulated seconds.

These runs measure rules and authored waves, not human play, visuals, sound, device performance, or global balance. Current targeting and damage do not draw random numbers, so a repeated run of the same line is deterministic. Wall-clock runtime is not used as a game metric.

## Plans and placements

`A` and `B` are fixed placements. The broad line starts with one each of archer (`boltA`), slinger (`stoneA`), and trapper (`netA`), then builds the second triad by wave 4. It upgrades the first archer/slinger before wave 5, the second before wave 6, both trappers before wave 7, then saves. The focused line opens with two archers and a slinger, adds a third archer before the first fast-weasel wave, places its first trapper and upgrades a second archer before the first iron-boar wave, then adds damage for the larger mixed waves. This chooses early direct fire against fast, low-health enemies and extra control/fire time against armored enemies; it is based on existing speed, health, and armor differences, with no proposed abilities assumed. The greedy line opens with one trader and one archer, saves the first payout, then buys a second trader before wave 2. The exact action and post-purchase balance for every wave are in the JSON record.

| Map | Archer A/B/C/D | Slinger A/B | Trapper A/B | Trader A/B |
| --- | --- | --- | --- | --- |
| Lantern Pass | (1,4) / (3,2) / (5,2) / (7,5) | (3,0) / (7,4) | (5,0) / (8,5) | (0,1) / (10,1) |
| Rainstone Crossing | (0,4) / (3,2) / (6,2) / (9,5) | (2,6) / (9,4) | (7,5) / (5,2) | (0,1) / (11,1) |

Both maps start on the left and exit on the right. The first archer and slinger cover the early bends; the B positions test middle/late coverage. Rainstone's extra left bend makes its first archer at (0,4) and slinger at (2,6) a different placement choice from Lantern's (1,4)/(3,0). A tower's shot count is evidence of engagement at its position, not proof of its individual kill contribution.

## Outcome summary

| Map | Line | Waves started/completed | Result | Hearts | Crowns | Total interest / trader income | Simulated seconds |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| Lantern Pass | Broad, two triads | 8/8 | Win | 12 | 1,191 | 136 / 0 | 280.5 |
| Lantern Pass | Focused damage | 8/8 | Win | 12 | 1,147 | 117 / 0 | 256.3 |
| Lantern Pass | Greedy trader | 2/1 | Loss in wave 2 | 0 | 96 | 9 / 12 | 83.7 |
| Rainstone Crossing | Broad, two triads | 8/8 | Win | 12 | 1,102 | 142 / 0 | 300.3 |
| Rainstone Crossing | Focused damage | 8/8 | Win | 12 | 1,063 | 128 / 0 | 257.1 |
| Rainstone Crossing | Greedy trader | 2/1 | Loss in wave 2 | 0 | 105 | 10 / 12 | 92.1 |

The broad two-triad line holds every wave on both maps in this deterministic setup. Its second Lantern trapper at (8,5) never fires, yet is upgraded, so even this no-leak win contains clearly redundant spending. Rainstone's second trapper at (5,2) fires 51 times across the run; the same tower mix does not have identical coverage value on the two routes.

The focused line also holds all hearts. It completes Lantern 24.2 simulated seconds sooner and Rainstone 43.2 seconds sooner than the broad line. It ends with 44 fewer crowns on Lantern and 39 fewer on Rainstone: it spends 25 more on structures and upgrades and earns less interest while building earlier. The difference is an attack-timing and early-coverage advantage, not a survival advantage in these runs. Both lines have ample reserves by late waves. No time-based income is earned from the quicker clear.

The greedy line has only one combat tower at the opening bend and spends its wave-1 payout on a second income building rather than exit coverage. On Lantern it kills 3 of 9 rats in wave 1 and leaks 6, dropping from 12 to 6 hearts. On Rainstone it kills 2 of 10 and leaks 8, dropping to 4. Wave 2 adds fast weasels and finishes the loss: 6 more one-heart leaks on Lantern, 4 on Rainstone. Wave 2 ends immediately at zero hearts, so its crown balance includes kill rewards but **no** wave payout, interest, or trader income. The second trader never pays. This is a visible planning failure in simulation terms: income cannot compensate for a missing firing line before the first wave clears.

## Wave record

In each cell below: `hearts after wave / crowns after wave / interest paid`. `—` means the attempt had already ended. Crowns are after kills and any wave payout; the detailed JSON also records the pre-wave balance, each purchase, individual tower shots, leak types and times, and trader payout. The greedy wave-2 cells show no payout.

| Map and line | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lantern broad | 12 / 96 / 6 | 12 / 161 / 12 | 12 / 234 / 18 | 12 / 358 / 20 | 12 / 426 / 20 | 12 / 566 / 20 | 12 / 736 / 20 | 12 / 1,191 / 20 |
| Lantern focused | 12 / 107 / 7 | 12 / 112 / 7 | 12 / 136 / 9 | 12 / 189 / 14 | 12 / 267 / 20 | 12 / 477 / 20 | 12 / 692 / 20 | 12 / 1,147 / 20 |
| Lantern greedy | 6 / 141 / 9 | 0 / 96 / no payout | — | — | — | — | — | — |
| Rainstone broad | 12 / 116 / 8 | 12 / 185 / 14 | 12 / 274 / 20 | 12 / 392 / 20 | 12 / 454 / 20 | 12 / 567 / 20 | 12 / 702 / 20 | 12 / 1,102 / 20 |
| Rainstone focused | 12 / 127 / 9 | 12 / 136 / 9 | 12 / 178 / 13 | 12 / 228 / 17 | 12 / 300 / 20 | 12 / 483 / 20 | 12 / 663 / 20 | 12 / 1,063 / 20 |
| Rainstone greedy | 4 / 150 / 10 | 0 / 105 / no payout | — | — | — | — | — | — |

## What the baseline establishes

- Repeating one of each combat tower into two triads is sufficient for an eight-wave perfect-hearts win on each current map with these placements. This is one reproducible line per map, not a claim that every one-of-each layout wins.
- An archer-heavy opening and earlier damage upgrades are also sufficient. They shorten the clear but do not change the win/loss result here. The current rules give no tested survival reason to prefer one successful line over the other.
- An understandable greedy plan leaks immediately and loses on wave 2. Wave 1 is already unforgiving for a player who opens with one archer and a trader; this should inform later first-lesson pacing, not be presented as a proposed tuning change.
- Placement matters within the broad line: the second trapper does nothing on Lantern but engages on Rainstone. This is route-specific coverage evidence. It does not establish that players can read that difference in the rendered game.

No new mechanics or tuning are proposed by this ticket. Visual explanation of leaks, player comprehension, and normal-speed play remain for the roster and encounter review; this deterministic baseline alone cannot certify them.
