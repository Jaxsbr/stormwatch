# 011 — Rat shield and arm cutout motion

Status: implemented candidate for in-game review, 25 September 2026.

## Context

The owner wants Rat Raiders to raise a shield for short periods while walking, take half damage during guard, and absorb guarded hits with visible shield recoil and a thunk. The existing directional rat bodies have both arms and the shield painted into the torso texture. A trial that displaced a region of that texture produced unsuitable deformation and hid the physical relation between arm and shield. The owner also requested free-arm swing.

## Decision

The rat's side, front and rear runtime rigs use newly generated transparent cutouts for the body, free arm, shield arm, shield and two legs. The shoulder and shield positions are descriptor landmarks. Animation rotates the two arm sprites around their shoulders and moves the shield sprite with small fixed transforms for guard and impact. Body artwork is never warped to raise the shield. The free arm has a restrained gait-synchronized swing; the shield arm settles into guard and the shield recoils and returns while guard remains active.

The body texture contains no sleeve cup or shoulder pad. Each detached arm owns its red shoulder, which overlaps a clean torso seam. The free arm's rest angle and scale were compared with the previous painted arm before its swing range was accepted as an implementation candidate.

The initial gameplay cadence is a five-second cycle: 1.1 seconds lowered after spawn, two seconds raised, then 1.9 seconds lowered. Guarded damage is half of post-armor damage. A guarded hit emits a distinct shield-hit event and thunk and suppresses body hit shake. These values are first playable tuning values, not a final balance claim.

## Consequences

Separate parts cost three new directional source sheets and six textures per view. The old complete-body art remains available for static portraits; animated battlefield rats use v2 rigs. This character establishes the rule for future equipment motion: generate complete movable parts with clean overlap and explicit pivots, then animate them with simple transforms. Do not simulate a joint by moving pixels inside a flattened body texture.

## Verification

Cutout import checked alpha and bounds; delivery encoding verified exact alpha. `review/2026-09-25-rat-shield/rig-lab.html` shows actual runtime assembly at lowered, raised and impact poses in all three directions. The normal game was inspected at 1280×720. The focused simulation tests and full test suite pass; `npm run check` and `npm run build` are required before delivery. Final normal-speed motion and audio quality remain subject to owner play review.
