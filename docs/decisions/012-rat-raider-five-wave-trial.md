# 012 — Start the Rat Raider lesson with a five-wave trial

## Status

Owner-selected first playable trial, 25 September 2026. The wave values are for playtesting and may change after review.

## Context

The Rat Raider guard already exists as a periodic shield that halves tower projectile damage while raised. The owner wants wave order to teach predictable patterns players can remember and plan around. The first experiment focuses on shield duration, reduced movement speed, and solo versus staggered-pair arrivals. The requested sequence is five waves for the opening Lantern Pass encounter.

## Decision

Use this five-wave sequence in Lantern Pass:

| Wave | Total rats | Arrival pattern | Guard cycle | Movement |
| --- | ---: | --- | --- | --- |
| 1 | 20 | Single every 3 seconds | Up 2s, down 8s | Base |
| 2 | 23 | Single every 2 seconds | Up 2s, down 8s | Base |
| 3 | 20 | Pairs staggered by 0.3s; batch starts every 3s | Up 4s, down 6s | 25% slower |
| 4 | 23 | Single every 3 seconds | Up 6s, down 4s | Base |
| 5 | 20 | Pairs staggered by 0.3s; batch starts every 2s | Up 6s, down 4s | 25% slower |

Each custom cycle begins with its down interval, so the first visible guard follows an unguarded approach. `count` means total rats, including all batches. For paired groups, `gap` is the time between batch starts and `batchStagger` is the delay between the two rats. The pair stagger and 25% movement reduction are implementation defaults because the owner did not specify exact values; they are trial parameters.

Apply the per-wave values to Lantern Pass's deterministic content and simulation. Keep Rainstone Crossing and the base Rat Raider catalog values unchanged for this first playtest. Do not add another enemy behavior or a new tower counter as part of the trial.

## Consequences

Lantern Pass becomes a five-wave Rat Raider lesson. Wave 1–2 establish the same guard rhythm at different arrival rates; wave 3 introduces slower paired arrivals with a different guard ratio; wave 4 isolates a longer guard on base-speed singles; wave 5 combines the slower paired pattern with the longer guard. The sequence tests memory and prep spending while retaining the existing fixed route and wave-end economy.

The trial does not establish balance. Large total counts, guard uptime, tower mix, and route coverage must be observed in play before tuning. A dense batch may reward splash and concentration as well as distributed coverage, so both placement ideas need a fair comparison.

## Verification

Focused deterministic tests cover custom shield timing, default Rat Raider behavior, movement scaling, staggered spawn timing and total counts. Scenario tests compare one spending-led and one investment-led line. Build/type checks and normal-speed browser play are required before the trial is considered reviewed. Owner playtest and any resulting tuning remain open.
