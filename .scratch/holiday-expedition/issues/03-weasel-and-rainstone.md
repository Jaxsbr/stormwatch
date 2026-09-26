# 03 — Teach the Weasel sprint in Rainstone

Status: complete

Scope: follow-on encounter work. Ticket 01 is complete; ticket 02 first-watch polish is being closed separately. This ticket owns the Weasel/Rainstone lesson and Turtle progression needed by later maps.

Depends on: 02

Historical brief (superseded by the approved amendment below): implement the sprint contract in `../spec.md` through deterministic simulation state. Use a readable anticipation and speed tell from the current rig/effects. No dodge, missed-shot probability, invulnerability, or new sprite-set dependency. Shots and slow keep their existing meanings; movement bonuses later share a bounded composition rule with rally.

Replace Rainstone's current eight mixed waves with its five-wave recipe. Remove early Boars, bosses and other tower choices from the first-arrival roster. Tune for Squirrels with their earned upgrade. The first three Weasels are separated and forgiving; later waves use guards and fast followers. Do not require Turtle before it is earned.

Done when two viable placement/spending approaches can clear the map, a poor coverage choice produces understandable pressure, and the player sees and uses the upgrade/Turtle progression correctly. Verify sprint boundaries, pause, slow interaction, replay reset, and actual first-arrival unlocks. Supply the day-one playable checkpoint, a short sprint capture, and at most three questions about understanding or feel.

## Approved amendment — 26 September 2026

The owner approved three longer mixed Rat/Weasel waves and deterministic evasion instead of sprint-only movement. Wave 1 repeats steady Rats, a 3–4s quiet gap and four closely spaced non-evasive Weasels. Wave 2 alternates Rats and Weasels 1:1, with Rats shielding 5s up/5s down and periodic Weasel evasion. Wave 3 repeats three Rats 1s apart, followed by two Weasels, then 3s quiet. Use a yellow evasion marker, anticipation, miss flash, brief sidestep and floating Evade text. Retain the Squirrel-only arrival and earned upgrade, Turtle victory reward, deterministic/pause/replay checks and playable checkpoint. Existing five-wave/no-evasion wording is superseded.

## Owner playtest revision — 26 September 2026

Opening difficulty reduced: six-second Rat-to-Weasel pause, four seconds guard up/six seconds down. Add wave four: repeat the entire (1 Rat/5 Weasels → 2 Rats/4 Weasels → 3 Rats/3 Weasels) sequence three times. Within each mini cycle, spawns are 0.2s apart; five seconds from the last spawn to the next mini cycle. Finale Rats use 5s up/5s down; Weasels run extra fast at 1.1× catalog movement and evade 2s every 5s. Existing cues and discovery progression continue.

## Fourth-wave expansion — 26 September 2026

Owner requested one additional full set and revised mini cycles: 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels. Repeat the entire pattern four times: twelve mini cycles, twenty-eight Rats and sixty Weasels (88 enemies). Retain 0.2s between spawns and five seconds from a mini cycle's last spawn to the next one's first spawn. Shield timing, extra-fast movement and two-second evasion every five seconds are unchanged. The prior nine-cycle recipe and its balance figures are historical.

Real Game spawn coverage verifies all twelve variable-size mini cycles and pauses. Both existing Squirrel spending strategies still clear all four waves; owner playtest remains the balance check.

## Closeout — 26 September 2026

The owner reported the final playtest completed after the fourth-wave expansion. This closes ticket 03 at the approved four-wave scope. The final gameplay revision is 1c72f84; all 176 tests, type check, build, standards and spec reviews passed. Rainstone earns Turtle on victory; first Turtle use and the final map belong to tickets 04/05. Family-device release evidence remains ticket 06. No specific device, audio or child-observation result is inferred from the owner's completion message.
