# Battlefield artwork and route registration

Status: ready-for-agent
Delivery: deferred follow-up; continue the current woodland expansion
Owner scope decision: 4 October 2026

## Problem

The owner’s marked Mosswater screenshot shows four painted entrance/exit openings
that disagree with the live trail. Trail strips also protrude beyond the painting
into the surrounding frame. The fixed landscape frame prevents viewport-dependent
drift but does not establish that generated scenery fits authored route geometry.

The current scenery manifest identifies `twin-switchbacks` and records source
dimensions/hash, but has no measured entrance/exit landmarks. Existing renderer
checks derive their “painted” sample from the same world-to-image arithmetic as the
path. They prove transform consistency, not correspondence to features in the
actual bitmap. These are separate acceptance checks.

## Current scope exception

The owner permits the current mismatch to remain while the woodland expansion
continues, provided this effort is captured. The orchestrator chooses that option.
This exception covers the reported painted entrance/exit registration and trail
spill at the painting edges in the current candidate. It does not approve unrelated
art, effects, animation, balance or remaining profile/touch acceptance gates.

Retain the approved Twin switchbacks routes, combat, progression and the fixed
landscape frame. Do not silently move routes to suit generated art or regenerate
approved assets during the current expansion. This document specifies future work;
it does not authorize additional paid asset services.

## Intended behavior

Before scenery generation, export a dimensioned guide from resolved authored
content. After generation, measure the actual output against that guide. Accept
and promote a scenery/layout pairing only when its painted mouths, clear route
corridors and playable boundaries agree with the real game.

Simulation routes remain authoritative. Scenery is fitted, edited or regenerated
to support the approved layout. Any desired route or buildable-area change requires
separate layout and balance review.

## Decisions

### One image-space contract

- Define the battlefield painting’s reference frame as 1280×720, with image origin
  at the top left and positive y downward. The renderer’s additional actor headroom
  belongs to the scene frame, not to bitmap coordinates.
- Extract the existing world-to-painting mapping into one presentation seam used
  by generation guides, workbench preview, runtime route drawing and registration
  checks. Keep browser/rendering dependencies out of simulation.
- Record native source dimensions, delivered dimensions, any crop/padding and the
  source-to-reference transform. The current 1672×941 painting must use its actual
  dimensions; requesting 16:9 is not evidence of an exact aspect ratio.
- Use one uniform scenery transform and known import operations. Do not add hidden
  per-route offsets, independently warp scene layers or adjust the camera to mask
  a local artwork mismatch.

### Guide before generation

- Export the resolved route centerlines, rendered trail footprint, bends,
  crossings, buildable-area boundaries and important scenery exclusion areas.
- Label stable layout/route identities, route direction, simulation spawn/leak
  points and where each route intersects the visible painting boundary. These
  points may differ and must not be conflated.
- Give every entrance/exit a stable identity and reference coordinates. Include
  dimensions, a ruler/grid, the layout fingerprint and the intended scenery id.
- Supply the guide as a visual generation/editing reference alongside explicit
  framing instructions. Exact prompt text and guide hashes join asset provenance.
  Generated output still requires measurement; generation need not obey the guide
  perfectly.
- Keep cobblestones as the existing runtime trail material. Scenery should provide
  compatible clear mouths/corridors without adding a competing painted road.

### Measure the actual artwork

- Provide a review surface showing the unaltered bitmap, canonical route overlay,
  image boundaries and all entrance/exit labels. Support opacity toggling and
  zoom so the owner can distinguish art from the runtime trail.
- Annotate observed opening centers and opening widths in native source pixels,
  independently of expected route coordinates. Store measured annotations against
  the exact delivered asset hash, transform and layout fingerprint.
- Report expected versus measured positions and displacement in reference pixels.
  Initial point tolerance is 5 reference pixels; each opening must also contain the
  full rendered trail footprint. Review the entire corridor for painted obstacles,
  crossings and useful buildable areas. Numerical success alone is not approval.
- If a uniform registration correction cannot align every measured anchor, edit
  or regenerate the scenery rather than altering individual route segments.
  Compare variants in an owner design session and preserve catalogue/provenance.
- Invalidate approval when the image, transform, dimensions or route layout changes.
  Older unmeasured scenery remains explicitly legacy/unmeasured; never manufacture
  a calibration record from expected coordinates.

### Edges, entities and input

- Deliberate visible trail continuations must terminate at the agreed painting
  boundary or an explicitly authored scenery extension. Ordinary letterbox gutters
  must not contain floating trail strips.
- Keep logical spawn/leak timing and enemy trajectories unchanged. A visual trail
  clipping policy must not clip character silhouettes or change simulation rules.
- Verify enemy feet, the visible trail, ghost placement, selection and popup
  anchors against the registered bitmap throughout bends and crossings.
- Retain fixed landscape sizing, portrait guidance and rejection of gutter input.

### Authoring and promotion

- Make the resolved layout/scenery pairing and its registration status visible in
  the workbench. Preview uses the same mapping and data as the game.
- Validate measured metadata and prevent a newly registered pairing from promotion
  when its asset/layout fingerprint is stale or its required anchors are missing.
  Preserve explicit compatibility for existing unmeasured content and the current
  owner exception; do not retroactively block old campaigns.
- Keep draft migration, scoped promotion, unrelated edits, immutable running
  attempts and content reload without JavaScript recompilation intact. Adopt a
  versioned schema only if the implementation needs authored registration fields.

## Delivery phases and merge points

1. **Measurement tools and shared mapping.** Deliver guide export, independently
   measured annotations and a comparison preview using existing art. A standalone
   tooling PR can merge without activating new scenery. See issue 01.
2. **Owner art session.** Measure Twin switchbacks/Mossy Poolbanks first, then the
   Rainstone-derived new encounters. Refine and approve corrected mouths, complete
   corridors and edge treatment. Audit original encounters without committing to
   a full repaint. Approved asset deliveries can have standalone PRs. See issue 02.
3. **Authoring and runtime delivery.** Land metadata validation, workbench controls,
   promotion/loading and the accepted trail-edge policy. Stage against tooling and
   an approved pairing; synthesize dependent changes before canonical activation.
   See issue 03.

Do not create new chats as part of capturing this spec. A later spinout can assign
implementation/tooling to one chat and interactive artwork review to another.

## Acceptance and testing

- Prove the real mapping with resolved authored layouts and imported asset
  metadata. Include independently measured opening coordinates, not only samples
  recomputed from the route formula.
- A deliberately shifted opening or cropped/changed bitmap must fail registration
  and stale-pairing checks. The approved corrected bitmap must pass. Test missing,
  duplicate and out-of-bounds anchors and layout/asset changes at the public seam.
- Overlay the real Game/Battlefield on the bitmap. Verify all four crossing-map
  mouths, both routes and crossings; verify the single-route pair. Observe enemies
  traversing bends and reaching the actual spawn/leak transition points.
- Show that painted mouths contain the trail and that trails do not spill into
  ordinary gutters. Verify tower placement and selection after resize and reload.
- Exercise edit → draft save → draft reload → Playtest → Promote → uncached game
  reload with a disposable pairing. Reject stale registration without writes and
  retain unrelated edits, ordinary save progress and immutable attempts.
- Review desktop 1280×720, phone landscape 844×390, tablet 1024×768, both portrait
  rotations and a narrow Codex panel. Save matched before/after captures with
  measured anchor errors. These are viewport checks, not physical performance.
- Owner approval is required for corrected scenery in ordinary gameplay, including
  crowded paths and full HUD. Generated guides, scalar error reports and passing
  tests cannot replace that review.
- Run required checks and both builds, record the consequential seam and measured
  benefit under the architecture procedure, and verify deployment after release.

## Non-goals

New map topology, enemy rules, balance changes, biome expansion, image generation
in the runtime game, a general image editor, automatic inference of acceptable
landmarks from AI output, and a mandatory full repaint.

## Evidence and pointers

- Owner-marked screenshot supplied on 4 October 2026: four circled side openings
  are vertically offset from the live trail; trail strips cross the image edges.
- `src/render/battlefield.ts`: painting frame, world projection and padded trail.
- `public/art/v2/mossy-poolbanks-candidate-v1/manifest.json` in the held expansion:
  source dimensions/hash and layout clearance, without measured mouths.
- `tests/battlefield-aspect.test.mjs`: resize/transform consistency checks.
- `docs/decisions/040-fixed-battlefield-frame.md`,
  `docs/decisions/twin-switchbacks-layout.md`, `docs/ART-PIPELINE.md` and
  `docs/agents/content-authoring.md`: existing contracts to preserve.
