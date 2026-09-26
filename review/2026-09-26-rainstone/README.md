# Rainstone ticket 03 candidate

Implements the owner-approved three-wave amendment; see [decision 017](../../docs/decisions/017-rainstone-evasion-and-mixed-waves.md).

## Candidate and checks

Gameplay build: `4ee0534` on `main`. Run `npm run dev` and open the local URL printed by Vite for the ordinary game; append `/review/2026-09-26-rainstone/index.html` for the focused fixture. This preview requires the hosting computer and server to remain running. No public release is established by this ticket.

Type check and production build passed. The full suite passed 173 tests in 33 files; an additional focused spawn-cadence test subsequently passed, along with type checking. Standards review found no actionable findings. Spec review found gameplay aligned and requested the capture/checkpoint handoff supplied here.

[Normal-speed evasion capture, 20 seconds](weasel-evasion-20s.webm) — actual wave-two renderer at 1024×620 viewport (1024×540 canvas), with three base Squirrels. Video contains no audio and does not establish physical device performance. Capture uses the fixture's declared wave-two starting state.

## What to try

Win Lantern, then enter Rainstone with Squirrels and the earned upgrade. Wave one mixes shielded Rats and non-evasive fast Weasels. Wave two introduces the yellow chevron and floating Evade label. Wave three repeats compact mixed bursts with longer evasion windows. Winning Rainstone discovers Turtle; its first usable encounter arrives in ticket 04.

The local review fixture at `review/2026-09-26-rainstone/index.html` starts wave two with three base Squirrels, normal speed, and recording/pause controls. It uses the real Game and Battlefield, but deliberately skips campaign navigation and cannot certify first-arrival progression. The ordinary game remains the playtest candidate.

## Strategy evidence

No advantages, assist or Turtle; earned Squirrel upgrade enabled. Seed 42, 30Hz. Purchases use affordable real commands throughout each wave.

| Strategy                                                         | Result  | Hearts | Combat seconds  | Final defenses   | Bank           |
| ---------------------------------------------------------------- | ------- | ------ | --------------- | ---------------- | -------------- |
| Wider coverage, buy base Squirrels as coins arrive               | Victory | 11     | 260.77          | 12 base          | 5              |
| Three opening Squirrels, then save for upgrades before extending | Victory | 3      | 252.33          | 5, four upgraded | 49             |
| One Squirrel away from useful coverage; delay further purchases  | Defeat  | 0      | During wave one | 1 base           | Unspent income |

Coverage line: wave-one clear at 107.20s, 11 hearts, 13 gold; wave-two clear at 176.53s, 11 hearts, 5 gold. Upgrade line: 102.70s, 3 hearts, 7 gold; then 163.63s, 3 hearts, 24 gold. These scripted lines demonstrate alternatives and pressure, not a child win rate or global balance.

## Visible review

At 1024×620 landscape, normal-speed wave-two rendering showed yellow chevrons above evasive Weasels, blue shields above guarding Rats, and Evade text on missed projectiles. The new glyph is distinct by shape and color. Pause and recording are available in the fixture. Physical touch, child understanding and audio listening remain unverified.

## Owner playtest questions

1. Does the yellow marker plus Evade make missed shots understandable?
2. Do the fast arrivals and final bursts feel exciting or unfair?
3. Is there enough money and time to extend coverage or try upgrades?

## Opening and fourth-wave revision

Owner playtest requested easier wave one and a fourth wave. Wave one now pauses six seconds before Weasels and uses four-second Rat shields/six seconds exposed. Wave four repeats 1 Rat/5 Weasels → 2 Rats/4 Weasels → 3 Rats/3 Weasels three times, with 0.2s spawn spacing and five-second rests. Its Rats guard five seconds, rest five seconds; its extra-fast Weasels evade two seconds every five seconds. Wave three awards 35 gold before the finale.

The earlier three-wave strategy table is historical. Current coverage line: four-wave victory, twelve hearts, 323.97 combat seconds, twelve Squirrels/two upgraded, forty gold remaining. Upgrade line: victory, twelve hearts, 317.23 seconds, seven Squirrels/six upgraded, twenty gold remaining. Both finish wave one at twelve hearts. Poor coverage still loses. The review fixture adds Wave 1 and Wave 4 buttons; these deliberately start with only three base Squirrels rather than campaign-earned wave-four defenses. The existing clip shows wave two, whose behavior remains current.

Revision verification: all 176 tests in 33 files, type checking and production build passed. Normal-speed fourth-wave fixture review at 1024×620 showed the compact groups, yellow evasion markers/Evade text and blue Rat shields without browser errors. Family playtest remains pending.

## Fourth-wave expansion — 26 September 2026

Owner requested one additional full set and revised mini cycles: 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels. Repeat the entire pattern four times: twelve mini cycles, twenty-eight Rats and sixty Weasels (88 enemies). Retain 0.2s between spawns and five seconds from a mini cycle's last spawn to the next one's first spawn. Shield timing, extra-fast movement and two-second evasion every five seconds are unchanged. The prior nine-cycle recipe and its balance figures are historical.

Real Game spawn coverage verifies all twelve variable-size mini cycles and pauses. Both existing Squirrel spending strategies still clear all four waves; owner playtest remains the balance check.
