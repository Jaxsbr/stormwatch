# Adjacent animal selection marker review

Current production4174, normal Rainstone preparation, no state injection. Placed skunk at(9,4) and squirrel at(9,5) through build controls; selected each by its visible head at1280×720 and844×390. No code edits or benchmark. Viewport restored and own Chrome tab closed.

**Targeted selection agreement passes.** Clicking the upper skunk head selects Skunk slinger in the tray, changes damage/range to22/3.3, and places the gold downward chevron above the skunk. Clicking the lower squirrel head selects Squirrel archer, changes damage/range to14/3.2, and moves the chevron down above the squirrel. Tight floor brackets/range circle also move to the corresponding ground position. This works at both tested sizes; no wrong-animal selection was observed.

The additional head marker resolves the reported floor-bracket ambiguity sufficiently for this pair. Remaining minor visual limitation: when the lower squirrel is selected, its chevron occupies the upper skunk's lower-body area because their silhouettes overlap vertically. Its downward point still indicates the squirrel and the tray agrees, but this is not proof that all dense groups/aim directions are unambiguous. Phone marker is small but visible. No physical touch accuracy claim.

Matched evidence: `after/selection-chevron-desktop-skunk.png`, `after/selection-chevron-desktop-squirrel.png`, `after/selection-chevron-phone-skunk.png`, `after/selection-chevron-phone-squirrel.png`. Desktop1280×720; phone844×390. This verifies selection UI only, not adjacent-combat motion or performance.
