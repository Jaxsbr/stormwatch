# Animal defenders replace mechanical tower presentation

The owner approved the enemy, map and background art but found mechanical towers difficult to read. They requested animal defenders standing on their placement tiles, with directional views and moving limbs matching the enemy presentation: squirrel archer, skunk rock thrower, turtle net thrower and donkey trader.

Keep the existing focused, splash, slow and income simulation roles and economy. Replace their visual presentation through the rendering adapter. Prototype the squirrel's draw/release at gameplay size before broad integration. Use native separated body/arm/weapon artwork and explicit attachment landmarks, preserving planted feet and consistent character scale. Four facing directions can use front, rear and reflected side artwork with properly reflected anchors and layering. Direction changes must not break projectile handoff.

The prior tower projection approval applies to the mechanical assets; it does not require the new upright animal characters to use that overhead camera. Match the approved enemy character camera instead. Keep the approved biome plates and path composition.

The implementation-stage verification scope was: normal-size readability, directional identity, action timing, projectile origin, pause, upgrade/selection, economy feedback and full gameplay footage. All four roles now have side/front/rear assets and are integrated in the battlefield, UI names and portraits. Side art is mirrored for left/right. Fixed-length elbow animation replaces the initial whole-arm scaling after motion review identified stretching. The directional lab and normal game expose the current implementation; this is not whole-roster acceptance.

Current verification is recorded in `review/2026-09-20-reboot/current-rubric-audit.md`, with directional limb review, normal play in both encounters, selection/upgrade and pause/re-entry checks. Final performance qualification and delivery verification remain separate gates; this decision record is not an acceptance report.
