# 011 — Rat guard uses complete torso frames

Status: owner-directed art approach; generated candidate awaits visual review, 25 September 2026.

## Context

Separate rat arms and shield introduced inconsistent scale, shoulder joins and silhouette. The owner rejected both the animation and its part assembly page, and identified duplicated leg anatomy. They requested the original complete torso plus a generated shield-up version, with correct paired legs.

## Decision

Keep the original torso byte-for-byte for shield down. Generate one complete shield-up torso per side, front and rear view, retaining both arms and shield in the painting. Switch between these whole torso frames; do not deform regions or animate separate rat arms/shield. Generate outer/inner leg surfaces for the side view and anatomical left/right pairs for front and rear. Each pair has a shared fixed scale.

The review page compares assembled down/up frames, demonstrates switching and gentle leg motion, exposes the unoccluded leg pairs, and permits position/rotation export. Review art remains outside the game until the owner reviews the assembly.

## Consequences

The game retains the original rat appearance and behavior. Guard damage, sound and recoil remain unshipped. Any later impact pose must follow this complete-torso art approach. Generated frames can still drift in fine detail, so frame registration and identity require visual review.

## Verification

Original down files are byte-identical copies. Native generated alpha is retained in lossless WebP crops. Prompts, native source hashes, crop rectangles and fixed assembly transforms are retained with the review assets. Inspect all three assembled views and the frame switch before integration. Automated checks do not constitute art approval.

Front guard anatomy: the raised shield presents its flat outer face toward the viewer. The carrying hand and forearm are hidden behind it; never paint a hand on the outward shield face.

Review refinement: front legs need fuller proportions and hip spacing consistent with the belt width. Rear guard must show the broad inner shield face and raised carrying arm, matching the forward-facing shield plane. Preserve the reviewed rear leg proportions.
