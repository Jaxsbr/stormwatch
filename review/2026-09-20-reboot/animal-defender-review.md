# Independent upright animal defender review

Reviewed actual `after/animal-defender-combat-10s.webm` through supplied consecutive frames/contact sheet and an additional turtle crop; source `src/render/defender-rig.ts` and direction selection in `battlefield.ts` inspected. Recording1280×660,29.97fps,9.970s; root reports IAB1280×720, staged5×HP, normal speed wave16.4–26.4s, source frozen during capture. No browser, generation or runtime edits.

## Judgment

**Targeted defender animation3/5, medium confidence.** Do not inherit the old mechanical tower score. The new upright animal identity/readability is stronger: squirrel tail/bow, skunk contrasting fur, turtle shell/scarf and donkey ears clearly identify roles; planted bodies keep fixed ground anchors and fit the enemy style. At normal game size this is a promising coherent direction, but throwing-arm deformation is visibly distracting.

## Concrete findings

- **Material: arm size changes with reach.** In `after/animal-skunk-frames.png`, cuff/forearm become visibly thick and large when the hand extends, then contract near the face. `after/animal-turtle-review-frames.png` shows the same behavior. Source `reach()` computes one scale from shoulder-to-hand distance and applies it to both sprite dimensions. This preserves grip position but changes anatomy. Use articulated bending/deformation with stable thickness, or constrain pose targets to a stable limb reach. No new asset requirement is implied if the existing complete arm can be deformed appropriately.
- **Archer contact/release largely coherent in reviewed side poses.** `after/animal-archer-frames.png` shows hold hand meeting bow, draw hand at string, and a distinct outgoing arrow. Body/boots do not shift. Fine string movement remains smaller than the animal silhouette, but the role/action reads more directly than the former platform mechanism.
- **Throwing cycle exists, but currently exaggerated resizing carries part of the apparent action.** Skunk raises hand near head then extends; turtle cycles between held bundle and empty/forward hand. Held payload and release need not be made larger; correcting stable limb anatomy is the priority.
- **View continuity:** supplied full contact sheet includes cardinal changes, with planted footprint/identity retained. Discrete swaps are acceptable under the current agreed direction. No visible muzzle jump was found in these samples; source preserves release view for0.16s. This clip does not cover every view/angle for every role, so it cannot certify the whole directional collection.
- **Trader:** donkey is visible and recognizable, but this interval does not demonstrate payout-triggered feedback. Do not invent an attack requirement for the trader.

Evidence: supplied `after/animal-defender-combat-contact.png`, `after/animal-archer-frames.png`, `after/animal-skunk-frames.png`; additional native150×160 crop `after/animal-turtle-review-frames.png` samples8fps beginning1s into actual clip. Continuous perceptual cadence and audio remain unassessed through extracted frames. These findings are targeted animation/art review, not full gameplay acceptance.

## Fixed-length two-bone follow-up — current targeted score4/5

Reviewed latest dev live through CUA Chrome at1280×720: tower-lab combat sample at wave30s, then defender-lab repeating actions with squirrel, skunk and turtle selected in turn. Top row explicitly shows right, mirrored left, front and rear; lower row shows all four roles. Captures: `after/animal-two-bone-archer.png`, `after/animal-two-bone-skunk-a.png`, `after/animal-two-bone-skunk-b.png`, `after/animal-two-bone-turtle-a.png`, `after/animal-two-bone-turtle-b.png`. Browser closed and viewport reset. No source/assets/build edits.

**Current targeted defender animation4/5, medium confidence**, superseding the earlier3/5 swelling defect assessment. The conspicuous whole-arm expansion/contraction is absent in reviewed poses. Hands/cuffs retain their size, elbows fold, and shoulder overlap remains intact. No obvious detached payload or shoulder tear was found. Archer hand/bow/string contact remains coherent in sampled side/front/rear poses; planted bodies and directional identities remain stable. Source `DefenderArm` now uses two fixed-length bone transforms blended at elbow, consistent with what is visible.

Also inspected root-provided `after/animal-normal-wave-one-contact.png` from `after/animal-normal-wave-one-20s.webm`, showing latest arms in an ordinary Rainstone wave rather than only the lab. Its reduced full-scene contact sheet supports production integration, not fine joint measurement. This bounded review does not certify continuous perceptual cadence, all target-angle transitions, audio or the entire demo. No new concrete material limb defect was found that warrants holding the targeted gate below4.
