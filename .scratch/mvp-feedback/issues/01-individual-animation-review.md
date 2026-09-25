# Individually review tower and enemy animation

Status: ready-for-agent

## Problem

Several moving parts have looked wrong in play. Prior targeted reviews found and later corrected skunk/turtle limb swelling and a badger front-gait orientation issue, but did not assess the entire current roster and action set at normal speed.

## Provisional role-by-role notes

These are leads from existing review records and current code, not claims of newly verified defects.

### Defenders

- **Squirrel archer:** Existing side poses show the drawing hand meeting the bow/string and a distinct arrow leaving. The string is a very fine cue at small scale. Check that anticipation, release, and projectile hand-off read at normal speed across views.
- **Skunk slinger:** Earlier frames showed arm thickness changing with reach; the later fixed-length two-bone review says that defect is absent in its sampled poses. Recheck current four-direction throwing, stable limb proportions, stone release, and impact timing.
- **Turtle trapper:** The same arm fix was reported stable in targeted poses. Check net handling and release in each view, and whether the animation clearly connects to the enemy slow effect.
- **Donkey trader:** This is an economy role, not an attacker. Prior notes describe a small idle hand bob; a later capture showed a source-local payout cue. Check whether the donkey's own gesture clearly marks payout without looking like an attack.

### Enemies

- **Rat raider:** Prior directional assembly selects the expected views. Check grounded foot contact, corner changes, hit response, and whether simple removal reads clearly.
- **Fleet weasel:** The same review found correct view selection. Check whether the faster cycle stays grounded and distinct from the rat at small size, especially through turns.
- **Iron boar:** Targeted work reports corrected boot orientation, while short legs remain partly hidden by the heavy body. Check stride and foot contact during front/rear movement, and whether armor obscures too much motion.
- **The Roadwarden:** Uses the badger cutout as the boss presentation. Targeted gait samples corrected the earlier diagonal-boot defect, but the broad body remains relatively rigid. Check boss identity, directional continuity, hit/defeat readability, and any difference from the ordinary silhouettes.

## Work

- Capture a current normal-speed segment with every defender attacking or paying out and each enemy walking through a corner, taking a hit, and leaving play.
- Record one row per role: observed pose/part, moment and view, screen size, evidence link, severity, confidence, and proposed fix.
- Recheck older findings against current source and assets. Keep any unobserved action marked unknown; do not invent an attack for the trader.
- Separate motion/art findings from hit/splash/slow feedback findings.

## Acceptance

- All four defender roles and all four enemy roles have an individual evidence-backed note.
- Observed anatomy, grounding, contact, release, and view-transition defects are specific enough to reproduce.
- No physical-device, continuous-cadence, or sound claim is made without corresponding evidence.
- Only confirmed defects become production fixes; asset spending requires separate approval.

## Relevant evidence

- [Animal defender review](../../../review/2026-09-20-reboot/animal-defender-review.md)
- [Directional roster review](../../../review/2026-09-20-reboot/directional-roster-review.md)
- [Character rig](../../../src/render/defender-rig.ts)
- [Enemy motion](../../../src/render/character-rig.ts)
