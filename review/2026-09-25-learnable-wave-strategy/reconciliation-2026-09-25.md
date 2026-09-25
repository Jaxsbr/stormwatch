# Reconciled wave-strategy work

The eight tickets remain the working sequence. This audit compares their original scope with the game after commit `8dd18eb` (periodic Rat Raider guard). It separates a finished combat rule from the still missing wave lesson.

| Ticket | Current state | Remaining work |
| --- | --- | --- |
| 01 Challenge baseline | Done as a **historical pre-guard baseline** at `b164152`. | Use the post-guard check below for current decisions; repeat after future lessons. |
| 02 Matchup roster | Twelve pairings and four candidate signatures proposed. Rat guard was chosen and approved through direct play/art feedback. | Weasel, boar, and Roadwarden signatures remain proposals, not approved mechanics. Their exact order and rules need review with ticket 03. |
| 03 Two-map learning arc | Not done. | Plan forgiving first sightings, practice, and combinations across both actual routes; begin with the shipped rat guard and show where spending and placement change a result. Review the wave plan before changing encounter content. |
| 04 First enemy lesson | **Mechanic and art done; lesson incomplete.** Rat guard cycles, halves tower projectile damage, makes a thud and suppresses hit shake. | Put it into an intentional teach/practice/combine wave sequence, check at least two useful tower responses and player comprehension, and verify normal-speed play on both maps. |
| 05 Second enemy lesson | Not started. | Select and approve one of the remaining signatures, then build and review its complete slice. |
| 06 Third enemy lesson | Not started. | Select and approve the remaining ordinary enemy signature, then build and review its complete slice. |
| 07 Roadwarden lesson | Not started. | Give the boss an approved distinct behavior and readable combined encounter. |
| 08 Encounter challenge review | Not started. | Re-run and compare plans on both maps after the lessons, then tune waves/rewards where evidence warrants. |

## Post-guard scenario check

Re-ran `node tools/run-challenge-baseline.mjs` on the current guard implementation with the six saved deterministic plans. This script uses the real 30 Hz simulation and actual map waves. It is a small scenario check, not a human playtest or proof of balance.

| Map | Plan | Result | Hearts | Final crowns |
| --- | --- | --- | ---: | ---: |
| Lantern Pass | Broad two-triad | Won 8/8 | 12 | 1,191 |
| Lantern Pass | Focused archer | Won 8/8 | 12 | 1,147 |
| Lantern Pass | Greedy trader | Lost in wave 2 | 0 (4 after wave 1) | 80 |
| Rainstone Crossing | Broad two-triad | Won 8/8 | 12 | 1,102 |
| Rainstone Crossing | Focused archer | Won 8/8 | 12 | 1,063 |
| Rainstone Crossing | Greedy trader | Lost in wave 2 | 0 (3 after wave 1) | 94 |

The two strong saved plans still clear both maps perfectly. That means the shield is a working, visible rule, but these scenarios do **not** yet show a new tower or placement decision. The greedy plan became harsher in wave 1. Ticket 03 should account for that before making the first lesson more demanding. The owner's earlier four-upgraded-archer run is valuable feedback but was not recorded as a repeatable scenario.

## Sequence

Next: ticket 03, then finish ticket 04. After reviewing that complete rat lesson, choose the order and exact rules for tickets 05 and 06. Finish the boss lesson in 07 and compare/tune both maps in 08. Keep the existing first-wave economy choice and free retry.
