# Squirrel motion study 01 — awaiting owner review

Question: can a planted squirrel communicate a forceful archery action through
stronger key poses and contrasting draw/release timing, while preserving the
existing illustration?

Run `npm run prototype:squirrel`. The page compares the unchanged side-view game
rig with a proposed cycle. Play/pause, slow playback, a scrubber and four pose
buttons support review. Small scale renders a 112 CSS-pixel figure reference;
this is not a battlefield integration or mobile performance test.

## Repeatable process, first iteration

1. **Bound the experiment.** Squirrel only, side view first. Turtle and skunk are
   outside this step. No new image generation or source artwork edits.
2. **Write the action.** Rest → raise and draw → hold effort → snap/release →
   follow through → recover. Precise and spring-loaded, with planted feet.
3. **Keep a baseline.** Left panel uses `DefenderRig` unchanged. Its shot is
   phase-aligned with the study's release. Right panel uses the same committed
   body, arm and bow textures with an isolated prototype pose function.
4. **Make the four poses reviewable.** Buttons select rest, full draw, release
   and recovery. Timing is normalized to the canonical base attack interval
   (currently 1 second); no content or simulation timing was changed.
5. **Inspect, then revise.** The first pose kept the drawing hand at chest level.
   Raising the bow/hand toward the cheek made the action read more clearly.
   The full draw uses opposing bow-hand and drawing-hand positions, mild bow
   compression, and a 16-art-unit continuous lean above the hips. Boots stay
   fixed. The body remains one textured surface; no head/tail/leg separation.
6. **Expose the release.** The hand follows through independently while the
   string returns over 0.05 of the cycle. The study arrow departs from the full
   draw position; a brief damped string oscillation follows. These are review
   visuals, not the simulation projectile.
7. **Record limitations before proceeding.** See below. Owner approval of action
   readability is pending; this is not an approved final animation.

## Proposed timing

| Cycle   | Beat           | Intent                                   |
| ------- | -------------- | ---------------------------------------- |
| 0–12%   | Rest           | Settle and prepare                       |
| 12–60%  | Raise/draw     | Build effort rather than drift uniformly |
| 60–74%  | Full draw      | Give tension time to register            |
| 74–79%  | Release        | Fast contrast with the long draw         |
| 79–82%  | Follow-through | Hand separates from string; bow responds |
| 82–100% | Recovery       | Return smoothly to rest                  |

## Findings and remaining work

- Current `DefenderRig` string/arrow materials are opaque while body sprites are
  transparent. Three.js renders the opaque queue before the transparent queue,
  so painter order alone does not put these lines over the body. The study uses
  transparent line materials; the string and arrow now remain visible there.
  This is an additional renderer finding, not a production fix in this step.
- Stronger poses expose the existing sleeve/shoulder seam. The current arm
  artwork also limits the elbow silhouette. Do not approve these joins as final.
- No facial expression, separate tail motion, new hand poses, or actual curved
  bow deformation is authored. Bow compression is an approximate shape study.
- The arrow nocking transition is still a placeholder appearance at 12% of the
  cycle. A final reload must make this intentional.
- The first gameplay shot can occur without a preceding draw cycle. Production
  work must reconcile readiness, target acquisition and projectile timing;
  simply copying this loop into the game would not solve that lifecycle.
- Front/rear anatomy, occlusion and foreshortening remain unmodified. West would
  mirror the side view, but is not part of this first action review.
- The comparison is silent. Judge visual effort before adding sound/effects.

## Evidence and provenance

All textures come directly from `public/art/v2/squirrel-side-defender-v1`; its
`rig.json` and `prompt.txt` retain original provenance. No generated runtime
assets were added. `full-draw.png` and `release.png` are browser captures of this
study. Original source crops and production rig code remain unchanged.

Verification: visually inspected full draw, release and small scale; playback
and pose controls exercised in a browser. Standard check/test/build results are
recorded on the implementation issue. No claim of finished animation quality.

Next checkpoint: owner reviews whether the effort and release feel appropriate.
Then refine poses/seams and establish per-view drawings before runtime integration.

## Iteration 02 — owner correction: forward brace, level pull

Owner found iteration 01 substantially better than the game, but identified the
upward bow sweep as the wrong action. Preserve the energy/timing; change the
force directions. This supersedes the raised-draw choice in step 5 above.

### References consulted

- [World Archery: Coach Kim Hyung Tak’s five technique keys](https://www.worldarchery.sport/news/157499/coach-kim-hyung-taks-5-keys-great-recurve-archery-technique).
  Inspected its full-draw photograph: extended bow arm, drawing hand by the jaw,
  and draw elbow behind the hand. The accompanying guidance emphasizes balanced
  opposing forces and stable expansion powered by the back.
- [USA Archery: sight-pin location](https://www.usarchery.org/article/transitioning-from-indoors-to-outdoors-sight-pin-location).
  Maintaining grip height during the draw is a useful cue; rising shoulders and
  drifting bow height undermine the stable draw we want to communicate.
- [UNH Archery Club: shot cycle](https://sites.usnh.edu/archeryclub/shot-cycle/).
  Keep the bow arm directed toward the target through follow-through.

These inform a stylized squirrel action, not an exact human sports technique.
Reference photographs are linked, not copied into game assets.

### Applied changes

- Bow grip stays at local height 370 for the whole cycle (previously rose 110).
- Grip advances from x190 to x240 during loading, keeping the bow arm almost
  straight at full draw without overextending it.
- Drawing hand moves horizontally from x94.1 to x35; release follows another
  10 units backward. The hand stays lower, beneath the muzzle, rather than
  travelling up the cheek. It does not chase the returning string.
- Bow arm remains extended through release, then relaxes during recovery.
- Reduce torso shift from 16 to 4 units and remove forward body rebound.
- Retain the 50ms string snap, short loaded hold and visible departing arrow.
- Release origin now matches the revised full-draw hand at (35, 370).

The original sleeve seam and draw-elbow silhouette remain artwork constraints.
Do not mistake this iteration for final anatomy or projectile integration.

`level-draw.png` records iteration 02; `full-draw.png` and `release.png` preserve
iteration 01 so the feedback and response remain reproducible. Owner review of
iteration 02 is pending.

## Iteration 03 — north and south

Owner accepted iteration 02 as a keeper improvement and requested north/south.
The accepted side pose function remains unchanged. A Direction selector now
compares current/proposed North, South, East and mirrored West at the same time
in the cycle. This preserves the useful before/after layout.

Directional projection choices:

- Upright bow in both views; aim direction no longer rotates the bow sideways.
- Narrower bow profile (38% horizontal scale) approximates its depth projection.
- Per-view grip, rest-hand and anchor positions replace side-view coordinates.
- Arm meshes are posed at longer virtual reach, then projected to 72% around
  their shoulder anchors. This is an illustrative depth approximation, not a
  true 3D limb or new drawn arm pose.
- Rear bow, string, arrow and arms draw behind the body. Only exposed portions
  remain visible. A small elliptical shoulder overlap pass reveals the existing
  arm texture at each painted sleeve opening while keeping the remaining arm
  behind the torso. No new raster artwork was generated.
- String release and hand follow-through use the same accepted timing. Review
  arrows indicate north/south travel; they are still isolated study graphics,
  not verified gameplay projectile handoffs. In particular, the projected shaft
  and grip alignment need final art/integration review.

Remaining limits: existing arm texture orientation, sleeve silhouettes and the
bounded shoulder overlap are candidates for owner review, not approved final
anatomy. Real foreshortened hand/arm drawings may still be needed. No runtime
code, content balance, turtle or skunk art changed.

Evidence: `north-draw.png`, `south-draw.png`; browser inspection of north rest
and south release. Standard check, 276 tests and production build passed.

## Iteration 03 rejected — research reset

Owner rejected both cardinal poses: incorrect bow/string geometry, hand-through-
shoulder artifact in north, shrunken arms and wrong anatomy in south. The code
and screenshots remain failure evidence; do not promote this iteration.
See [the subsequent archery study](pose-research/README.md) for source references,
causes, an alternative-parts recommendation, and an assembled concept candidate.
The accepted side-view animation remains the keeper baseline.
