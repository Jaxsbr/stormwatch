# Tower animation review

The owner selected option B: one four-direction board, tower selection and
play/pause. Feedback forms, notes, exports, diagnostics and layout switching have
been removed. Earlier variants are preserved in prototype commit `675a7f9`.

Run `npm run prototype:animations`. The local page is
`/review/2026-09-28-animation-prototype/index.html`.

Choose Squirrel, Turtle or Skunk. All four views play in sync. Pause, take a
screenshot and annotate it. Space toggles playback when the page itself is
focused. Each view displays its frame number and elapsed time after a shot.

The page imports the actual `DefenderRig` and unchanged runtime assets, with the
base tower cadence from runtime game content. It adds no alternate animation,
pose, layer ordering or visibility behavior. North is rear, south is front,
and west mirrors the east side rig. All directions share the same display scale.

For exact reproductions, `?tower=turtle&frame=11` opens paused at F11. Playing
removes the frame parameter; pausing writes the current frame to the address.
These are 30 fps review samples of continuous poses, not spritesheet frames.

This is an isolated repeating attack fixture. It omits initial idle, moving
targets, projectiles and battlefield effects. It is a local development page
outside the production entry graph. No character art has been corrected yet.

The annotated-issue diagnosis is in
`../2026-09-28-animation-diagnosis/README.md`.
