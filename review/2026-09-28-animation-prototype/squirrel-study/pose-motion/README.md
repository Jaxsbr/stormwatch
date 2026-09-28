# Assembled squirrel animation — motion test 04

Owner approved concept 02's north/south poses and asked to animate them. This is
an isolated whole-pose keyframe test, not a production rig or finished animation.
Run `npm run prototype:squirrel-poses`.

## Technique and reproducible steps

1. Start with the approved `../pose-research/concept-02-review.png`.
2. Generate a matched 4-column, 2-row transparent atlas through built-in ImageGen.
   Exact request: `prompt.txt`. Row 1 is south; row 2 north. Columns are ready,
   full draw, release and recovery. Keep anatomy connected throughout.
3. Verify the PNG contains actual alpha (1536×1024 RGBA; 48.8% fully transparent).
   The tool preview's colored hidden RGB is not a painted opaque background.
4. Inspect alpha-connected character bounds. Some tails cross nominal 384×512
   cell boundaries, so render each measured character rectangle instead of blindly
   slicing uniform cells. `rects` in `main.js` records those source coordinates.
5. Register frames at the boot baseline with per-frame translations (`anchors`).
   Use a single scale per view; do not resize arms or individual frames.
6. Read the canonical squirrel base interval. At its current 1 second: ready to
   0.36s, loaded hold to 0.74s, release to 0.85s, recovery to the cycle boundary.
   Use hard pose changes for this test; no crossfade ghosts or interpolated limbs.
7. Add a separate short review projectile at release. South sees it end-on;
   north sees it only above the body silhouette. This is illustrative and does
   not establish the real game projectile handoff.
8. Review both directions together, normal/slow playback, pause/scrub and 112px
   size reference. Record findings before generating intermediate poses.

## Evidence / limits

Browser inspected loaded and release poses, alpha and atlas edges. The release
hand is connected to the south forearm; north contains no free moving hand or
socket reveal overlay. Loaded/release screenshots are stored here.

This is four-pose animation, not smooth interpolation. Ready and loaded are
similar, north shoulder movement is subtle, and generated coat/tail/face shapes
are not pixel-identical between frames. Registration stabilizes placement but
cannot fix drawing drift. The reload remains an un-authored transition from
recovery to the nocked ready pose. Exact front arrowhead contact and north
projectile emergence need final integration review.

Do not promote the atlas as production-ready. Next gate is owner judgement of
motion/character coherence. Then preserve approved poses, add only necessary
in-betweens and a deliberate reload, and verify the actual projectile lifecycle.
The accepted side animation and game runtime remain unchanged.

## Provenance

`atlas.png`: native ImageGen output using the approved concept as the sole image
reference. Original output copied intact; no raster extraction or retouching.
`prompt.txt`: exact generation instructions. Prior concept provenance is recorded
in `../pose-research/prompts.md`. Canvas crops are playback metadata, not modified
source imagery. No CLI/API fallback or additional external asset service used.
