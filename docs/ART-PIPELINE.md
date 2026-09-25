# Art production and animation

Stormwatch separates generated illustration from deterministic animation. Every
new asset begins with a description, camera rules, a descriptor and a review gate.
An attractive source image is not a finished game asset.

## Approved projection

- Biomes: elevated, consistently scaled ground plane. No horizon, vanishing point,
  distant valley, or oversized foreground framing. Woodland v3 is the approved
  projection reference.
- Animal defenders: upright woodland characters standing on a ground tile, matching
  the approved enemies. Author side, front and rear views; reflect the side view
  with its attachment points for left-facing combat. Preserve consistent body
  height, ground contact, equipment and lighting across views.
- Mechanical tower art is historical reference only. The former mostly-overhead
  platform recipe was superseded by `decisions/005-animal-defenders.md`.

The reusable camera and material language lives in
`assets/pipeline/templates/style.json`. Exact generation prompts belong alongside
runtime assets; source images remain in ignored `assets/source/`.

## Choose the production recipe

| Content | Generated pieces | Runtime motion |
|---|---|---|
| Walking character | Body plus separate near/far legs, with overlap at hips | Two-bone leg deformation, alternating stance and swing; fixed scale |
| Proposed Rat Raider shield | Original complete torso for shield down; generated complete torso for shield up; anatomical leg pair per view | Switch whole torso frames; simple separate leg motion; review before integration |
| Squirrel archer | Planted body, holding/action arms, bow | Draw string, release arrow, recover; target-facing direction |
| Skunk rock thrower | Planted body, holding/action arms, rock | Wind up, release rock, recover; target-facing direction |
| Turtle net thrower | Planted body, holding/action arms, net | Wind up, release net, recover; target-facing direction |
| Donkey trader | Planted body, arms, purse | Restrained side-facing purse gesture; no attack or payout-synchronized animation claim |
| Biome | Opaque, open-center battlefield plate | Fixed scene plate with consistent map scale |
| Trail | Opaque overhead cobblestone material | Clipped to the simulation's continuous rounded route |
| UI | Transparent timber/brass frame | Nine-slice sizing; text remains accessible HTML |

Start animal defenses from `assets/pipeline/templates/animal-defender-recipe.json`
and the detailed animal recipe below. Consult the current review reports for the
assessed views and motion limits; numeric validation is not visual approval.

## Generate and import an illustration

1. Copy the closest descriptor in `assets/pipeline/specs/`; give it a new versioned
   id and replace the subject/role details. Keep the approved camera constraints.
2. Generate the exact prompt:

   ```sh
   node tools/art-pipeline.mjs prompt assets/pipeline/specs/woodland-clearing.json
   ```

3. Use native image generation. Require genuine alpha for isolated parts. Never
   key out a painted checkerboard or background. Save the exact prompt actually
   sent; do not regenerate a different prompt afterward and call it provenance.
4. Inspect the source at full size and game size. Reject wrong projection before
   generating the rest of a family.
5. Inspect/import a sheet or plate:

   ```sh
   node tools/art-pipeline.mjs inspect descriptor.json source.png
   node tools/art-pipeline.mjs import descriptor.json source.png
   ```

The importer preserves alpha, records dimensions/hash and refuses to overwrite an
existing atlas id. Odd dimensions are valid: explicit frame rectangles partition
the actual source instead of assuming the requested generation resolution.

## Separated-part rigs

Generate isolated parts, with enough illustrated overlap to hide joints. Do not
cut an occluded limb out of a flattened whole-body image. A rig descriptor declares
source crop rectangles, pivots, fixed scale, layer order, attachment landmarks and
mechanical/leg joints. Landmarks use local source pixels. Runtime positions use Y
up; image coordinates use Y down.

For Rat Raider guard, preserve the original torso byte-for-byte as the down frame.
Generate a complete matching up torso, including both arms and shield. Do not
split or warp the arms, shoulders or shield. Side legs must show outer and inner
surfaces of opposing legs; front and rear must contain anatomical left/right
pairs. Use one shared scale per pair. Review the assembled frame switch at large
and game-like sizes before integration; a successful generation is not approval.

For other held equipment that moves during play, regenerate the complete body behind it
and supply each movable arm and object as its own transparent part. Match the
original assembled rest pose before adding motion. Swing arms within a restrained
range around that pose; move a shield at its own pivot for guard and recoil. Do
not warp a region of a flattened torso texture to imitate a separate limb.
The armless body must not retain a painted sleeve cup or shoulder pad underneath
the detached arm. The arm sprite owns that red shoulder and seats directly into
the torso; inspect the join throughout its swing, not only at rest.

```sh
node tools/cutout-pipeline.mjs inspect descriptor.json source.png
node tools/cutout-pipeline.mjs import descriptor.json source.png
```

One root part owns attachment points; other parts attach directly to it. The
importer validates crops, alpha, pivots and attachment references, extracts native
pixels without repainting, and records hashes. A new version is required to
replace a source. Current animal parts retain their reviewed descriptors and native crops.
Create new versioned ids instead of overwriting an accepted family.

`CutoutResource` owns shared textures; `CutoutInstance` owns per-actor materials
and part transforms. `CharacterRig` deforms the leg mesh around its annotated knee;
the boot remains on the lower bone. `Game` retains all gameplay authority.
Animation reads simulation distance, clock and shot counters, so pauses freeze
poses and speed changes do not create an independent animation clock.

Do not normalize every animation frame to its own bounding box. That changes
scale and causes pumping. Use one scale with explicitly reviewed contact anchors.

### Directional characters

Author side, front and rear bodies with their own two legs. Supply the accepted
side character as the identity reference for the two additional views. Keep the
same clothing, equipment hand, body height, ground contact and illumination;
front/rear boots must face along travel. Use anatomical near/far hip anchors,
not a copied screen-left/screen-right assumption. Each view declares its own
`animation.hipHeight` and fixed leg scale. Review all three assembled views
together before motion review. The renderer selects front/rear on vertical path
segments and side on horizontal segments, retaining simulation-driven gait phase.
Current routes travel right; future left-travelling content needs a reviewed
left-facing view or equipment-aware mirror treatment.

### Delivery encoding

Lossless native sources remain the source of truth. After assembly review, derive
smaller delivery textures without resizing or changing pivots:

```sh
node tools/encode-rig.mjs public/art/v2/rat-front-rig-v1/rig.json
```

The encoder verifies the native source hash, crops directly from that source,
encodes WebP RGB at quality92 with alpha100, and compares every decoded alpha byte
before writing. It records delivery hashes and encoding settings in the descriptor.
Repeated runs do not recompress prior WebPs. Review native/delivery comparisons at
playing size; exact alpha alone does not prove acceptable color/detail quality.
The current command supports rigs whose parts share one native source.

## Review gates

1. **Projection:** compare to the approved in-game reference before roster expansion.
2. **Source:** true alpha, no clipped parts, no neighboring-cell contamination,
   stable materials, usable overlaps, recorded exact prompt and source hash.
3. **Assembly:** parts meet, layers occlude correctly, correct footprint, consistent
   scale and ground anchor at normal play size.
4. **Mechanics:** base never deforms; release matches projectile creation; character
   legs alternate and stance feet stay planted; pause freezes the current pose.
5. **Motion:** inspect consecutive poses and actual normal-speed footage. A sprite
   sheet, screenshot, recording file's existence or passing test alone does not
   establish convincing motion.
6. **Game:** both desktop and landscape phone composition, picking, hit feedback,
   contrast, performance and disposal/replay pass. Update the review status only
   for the gates actually assessed.

`review/2026-09-20-reboot/animation-lab.html` retains the rejected sheet experiment.
`defender-lab.html` is the current staged animal assembly fixture. The historical
`tower-lab.html` retains mechanical assembly experiments. Staged fixture footage must never be labelled ordinary gameplay.

## Why frame generation was not sufficient

The first rat sheet repeated the same leading-leg configuration in both halves.
A targeted opposite-contact generation repeated the same error. Anchor correction
improved grounding but could not repair gait topology. The tower sheet changed
bow shape and architecture between frames. These candidates remain review evidence;
they are not approved production animation. Separated native parts keep identity
and structure fixed while authored joints control motion.


## Animal defender recipe

The active defense presentation uses squirrel (focused arrows), skunk (splash rocks), turtle (slowing nets) and donkey (income). Each role has native side, front and rear sheets. Mirror the side rig for the fourth direction; reflect geometry, sprite anchors, bowstring and projectile origin together.

Source sheets and exact generation prompts are retained under `assets/source/defenders-v1/`. Runtime crops, prompt copies and descriptors live under `public/art/v2/<animal>-<view>-defender-v1/`. Import specifications live under `assets/pipeline/specs/`. Preserve transparent source pixels; delivery encoding uses WebP quality 92 with alpha verified byte-for-byte against the native crop.

Each sheet separates a planted body, holding arm, action arm and bow or payload. Body attachment landmarks specify shoulders; each arm requires a shoulder pivot, elbow and grip. Mark these in crop-local pixel coordinates. The bow additionally needs two string tips, brace and draw positions. The payload pivot must align with the hand. `DefenderArm` solves two fixed-length bones and blends native texture geometry at the elbow; it must never scale an entire arm to reach a target. Unreachable targets clamp to arm reach, and the held object follows the resolved hand. This keeps cuffs and paws stable.

`DefenderRig` draws and releases arrows, winds up and releases rocks/nets, and gives the trader a purse gesture. The renderer chooses facing from the target and uses the resolved hand/bow position for projectile handoff. Simulation statistics and cooldowns stay in the simulation adapter boundary. Review at actual gameplay size as well as in the directional lab: all four views, release timing, hand contact, stable feet, mirrored layering, selection and pause. Artwork generation and passing numeric validation are not visual acceptance.


The current reusable starting point is `assets/pipeline/templates/animal-defender-recipe.json`, with camera/style guidance in `templates/style.json`. Copy the closest animal/action/view specification into a new id and replace the source description, crops and landmarks. The importer validates required action objects and nonzero elbow/grip bones before writing a new delivery directory. The regression suite compares all12 saved specifications with their delivered runtime parts, action and portrait metadata so a later import cannot silently discard reviewed fixes. Portrait crops and prompt copies remain explicit delivery steps; the cutout importer creates the separated parts, not a complete publishing workflow.

Front guard anatomy: the raised shield presents its flat outer face toward the viewer. The carrying hand and forearm are hidden behind it; never paint a hand on the outward shield face.
