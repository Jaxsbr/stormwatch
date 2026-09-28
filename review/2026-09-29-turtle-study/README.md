# Turtle side pose study — 29 September 2026

Status: **v3 two-handed load pose and continuous motion study accepted as keepers**. No new turtle animation or replacement runtime art
has been promoted. Research → coherent pose review → rig/motion → game review is
required by the [tower process](../../docs/TOWER-ANIMATION-PROCESS.md).

## Proposed character action

Two-handed gather → backward load → forward/upward cast → open-handed follow-through.
A broad weighted rope-mesh net opens in flight. Feet remain planted and the heavy
shell limits the body turn. This is the deliberate, weighty counterpart to the
squirrel's tense brace and snap. See [primary-source research](research.md).

## Revisions and review

- `poses-v1.png`: initial native ImageGen concept. Good readable net and release;
  preparation too weak, follow-through turtle smaller.
- `poses-v2.png`: stronger backward load, more consistent follow-through scale,
  detached release. Rejected load hand: far hand rested at belt instead of gripping.
- `poses-v3.png`: corrected far-hand grip. Current pose-review candidate.

All images are **concepts**, not animation atlases. The generated head/shell shapes,
mesh topology and costume details drift between frames and from the original;
reusing these complete frames would repeat the squirrel consistency problem.
Keep the original body for the eventual rig; use these to judge hand paths, load,
release and net silhouette. Review still needs to determine whether the backward
load reads as enough effort. A final rig must also show recovery into ready pose,
which is not illustrated by the departing-net follow-through panel.

## Provenance

Generated with built-in native ImageGen, no CLI/API fallback. Initial identity
reference: `public/art/v2/turtle-side-defender-v1/body.webp`. Exact request in
`prompt.txt`; revision 2 used v1 plus the original body and `revision-v2.txt`;
revision 3 used v2 and `revision-v3.txt`. No external reference photographs copied
into the artwork. Outputs retained unmodified as evidence, not runtime assets.

## Verification

Normal side-only tower adoption: `npm run check`, 276 tests across 50 files and
`npm run build` pass. Existing large-bundle warning remains. Turtle motion and
battlefield approval remain pending; static concept inspection cannot verify either.

## Motion study

Open `motion/index.html` through the development server. Current and proposed
animations play together with East/West, pause, slow speed, pose buttons, scrubber
and a 112px figure reference. No generated complete-character frames are used.

The existing body mesh shifts -24 source pixels during load and +24 during cast;
its upper body dips 14 pixels and rises 5, fading to zero movement near the feet.
Shoulder anchors use the same transform. Near shoulder registration is corrected
by (-20,+35) source pixels to cover the original sleeve opening. Both real solved
grips drive the hanging net. The mesh opens after release, leaves the hands, fades
out and the next gathered net fades in during recovery.

Cycle fractions: gather 0–.12, load .12–.52, hold to .57, cast .57–.70, release at
.70, follow-through to .82, recovery to 1. Canonical turtle interval (currently
1.35 seconds) supplies playback speed. This study demonstrates flight only; real
projectile integration must synchronize with the shot event and target.

Limitations: original closed hands remain, original sleeve artwork overlaps, and
the net is procedural geometry rather than finished painted rope. Open release
hands and final net appearance need an art pass. This is a continuous rig motion
review, not a claim that these details or the game integration are finished.

Browser review inspected gather/load, release and mirrored follow-through; the
controls freeze exact poses for annotated screenshots. Static captures cannot
establish physical-device performance. Check, all 276 tests and build pass.

## Owner acceptance

29 September 2026: owner accepted the motion study as a keeper and requested a
commit. This accepts the motion direction demonstrated in `motion/`, including
subtle body effort. It does not erase the documented closed-hand/net-art work or
claim runtime integration and battlefield approval.
