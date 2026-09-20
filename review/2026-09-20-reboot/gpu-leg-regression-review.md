# GPU leg deformation visual regression

2026-09-20. Chrome extension, 1280×720, current dev4173 `character-motion.html` staged roster. Visible Start/Pause controls only; reloaded the fixture to catch fast weasel views. This is a visual regression fixture, not ordinary gameplay or a performance test. Exact Chrome version uncollected. No source/assets/build changes.

**Targeted visual regression passes, medium confidence.** Rat, weasel, boar and badger each retain visible side/front/rear legs in the sampled poses. No missing limbs, implausible stretched strips, crossed frontal legs, obvious detached hips, or shader-color mismatch observed. Front/rear boots remain upright; side boots retain rigid outlines rather than uniformly stretching. Heavy-body leg occlusion matches the retained art and is not a newly missing leg. The badger front pose agrees with the corrected upright-boot evidence; no return of the prior both-boots diagonal slant. Distinct successive poses establish animation remains active, not continuous smoothness or pixel-exact equivalence.

Saved under `after/` (all1280×720):

- `gpu-legs-opening.png`,23.9s: badger side, boar front, rat rear.
- `gpu-legs-front.png`,32.3s: badger front, boar rear.
- `gpu-legs-roster.png`,13.3s: badger rear, boar side, rat front, weasel front.
- `gpu-legs-runner-return.png`,22.2s: badger side, boar front, rat rear; despite filename, runner already exited.
- `gpu-legs-runner-side.png`,paused9.7s: filename is approximate; actual weasel **front**, rat side, boar rear, badger side.
- `gpu-legs-runner-rear.png`,paused20.0s: actual weasel **side** near exit; rat side, boar front, badger side.
- `gpu-legs-runner-upward.png`,paused17.3s: actual weasel **rear**, rat front, boar/badger side. This closes runner rear coverage.

`gpu-legs-start.png` is an empty0.3s startup state, not motion evidence. Console error/warning reads returned empty arrays on two inspected runs, including final fresh reload. Thus no observed shader compilation/runtime warning, without claiming unobserved browser states are error-free.

No new full animation rubric rescore: this focused change does not show a material regression from the previous4/5 character verdict, but staged no-combat samples do not independently repeat impact/removal or continuous cadence coverage. No performance figures inferred.

Old tab217889639 was absent from initial current Chrome inventory (no Stormwatch tabs remained). Created review tab217889729 was explicitly closed; temporary viewport override reset. No animated review tab retained.
