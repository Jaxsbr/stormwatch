# Squirrel action study

Type: prototype
Status: ready-for-human

Owner requested step-by-step work, squirrel first, before beta. The goal is both
correct anatomy/occlusion and a characteristic, forceful archery action, with a
repeatable process. Turtle follows after squirrel; skunk is outside beta scope.
The owner's skunk lower-body annotation concerns the tail attachment, not fur.

Step 1 delivered: side-view pose/timing study with unchanged current comparison,
four pose buttons, playback/scrubbing, slow speed and small-scale reference.
Source and evolving recipe:
`review/2026-09-28-animation-prototype/squirrel-study/README.md`.
Run `npm run prototype:squirrel`.

Verdict: awaiting owner review of action direction. Shoulder joins and reload
remain visibly unfinished. No runtime animation or artwork was promoted.
Next: refine the accepted action, repair seam/artwork needs, then extend to views
and synchronize the actual projectile handoff.

Verification: `npm run check`, `npm test` (276 tests / 50 files), and
`npm run build` passed. Browser captures cover full draw and release; small-scale
playback and pause were checked. Existing build size warning remains.

## Owner decision and next study

Owner accepted the level push–pull side improvement as a keeper, then requested
north and south. Iteration 03 adds their projected pose candidates and a four-way
direction selector. North/south are awaiting visual feedback; they are not yet
promoted into runtime. See the recipe's iteration 03 for projection/occlusion
choices and known anatomy/projectile limitations.

## North/south rejected

Owner rejected iteration 03. A second archery study identifies uniform arm
scaling and the rear socket overlay as invalid techniques. New assembled
upper-body poses are recommended before any part extraction. See
`review/2026-09-28-animation-prototype/squirrel-study/pose-research/README.md`.
Concept 01 failed the front shooting-axis check; concept 02 corrects that aspect
and awaits owner pose review. Neither is a runtime asset or an approved animation.
