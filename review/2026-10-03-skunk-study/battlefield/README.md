# Skunk runtime presentation — 4 October 2026

Status: implemented from the accepted pose, continuous motion and B soft-puff
studies. **Owner battlefield acceptance pending; hold merge for integration.**

Open `/review/2026-10-03-skunk-study/battlefield/index.html` with the normal Vite
server. The fixture starts paused. Resume or step at normal/slow speed to inspect
release; Advance 5 seconds is for crowd snapshots, not continuous-motion review.
It uses actual Game shots, poison and Battlefield rendering with synthetic high
resources, high enemy health and compressed spawn gaps. It is not balance evidence.

## Runtime contract

- Existing visual catalog ID: `skunk-side-defender-v1` for the `stone` defender.
  No recipe, workbench control, schema, catalog ID or combat rule changes.
- Original body and arms remain. The near arm uses the existing open-paw texture,
  as in the accepted continuous study. Feet stay planted under small body effort.
- Held and real flying bombs share `neon-flask.webp`, a 280×264 logical plane,
  and the exact mirrored release origin. The release is sampled independently
  of the render frame; a live shot's age aligns animation after a late frame.
  If the flight was skipped entirely, cooldown estimates the current phase.
- Six low-opacity procedural puffs follow each living poisoned enemy. Eight
  transient burst puffs use the real splash event's lifetime. No Poisoned text,
  damage timer or persistent damaging ground cloud is introduced. Existing
  Evade, Immune and Shield outcome cues remain separate.
- One reusable gas geometry is grown only when capacity is exceeded. Simulation
  clock controls motion and expiry; pause repeats the same geometry. Attempt
  changes clear it, and disposal releases geometry/materials.
- The brief flask reload fade and stylized side pose toward vertical targets
  remain limitations inherited from the accepted study. If a tower is sold
  before its projectile is ever rendered, the projectile uses the source-cell
  fallback origin; an already-rendered projectile retains its actual origin.

## Provenance and regeneration

`neon-flask.webp` is the native transparent `../motion/flask.png` encoded with
Sharp WebP quality 92, alphaQuality 100, effort 6, without resizing. The original
ImageGen prompt is `../flask-prompt.txt`. Source SHA-256:
`5518d9833a727715ef8f976cf1f4ad60dea307497480afa7a0c053ad9a6a0aac`.
Runtime SHA-256: `1452848598f661c0c77655fa41b3cff46a1b6a4d507625caf60c28640012a887`.
The rig's `runtimeOverrides.payload` records this separate source, display size
and validation. Base part landmarks remain the original sheet's reassembly
specification; its old payload sprite is hidden. If regenerating that base rig,
reapply the separate payload texture and runtimeOverrides provenance.

The complete art session contributed five distinct originals to the ideas
catalogue: seedpod lob, shoulder toss, two-paw heave, revised neon poses, isolated
flask. Repeated inventory: five already catalogued, zero new, zero missing.
Carousel captions, origins, assets and forward/back navigation were checked.
Diagnostic screenshots are excluded with content-hash-bound reasons.

## Verification

- `npm run check`, `npm test`: 349 tests across 62 files pass.
- `npm run build`: passes, production boundary verified across 242 files.
- `npm run build:workbench`: passes. Existing large-chunk advisories remain.
- Four focused presentation tests cover mirrored release and texture/size
  continuity, first/late rendering, cadence scaling, planted feet, pause, pooled
  reset, reduced motion, real Game poison eligibility/expiry and buffer reuse.
- Browser: both facings, vertical targets, overlapping Rat/Weasel/Boar crowd,
  active real poison with zero poisoned Boars, sale during a live bomb, subsequent
  expiry, and fresh-attempt cleanup. No browser warnings or errors.
- Repeated paused captures at 10 seconds were visually stable; decoded JPEGs
  differed by at most 5/255 per channel, mean 0.00048. Geometry equality is tested
  directly; byte-identical screenshot output is not claimed.
- [Crowd capture](crowd.jpg), [release capture](release.jpg). Diagnostic header
  reports status counts only; the battlefield contains no Poisoned label.

Verification is desktop browser/automated tests, not physical mobile performance.
The parent integration task combines this bounded renderer contribution with
routes, board authoring and encounters, then owns the final owner playtest and
post-merge deployment checks. This branch is based on poison-combat `52553c0`;
it has not absorbed the parent's later integration branch.
