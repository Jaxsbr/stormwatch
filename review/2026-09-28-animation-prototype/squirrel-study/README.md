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
