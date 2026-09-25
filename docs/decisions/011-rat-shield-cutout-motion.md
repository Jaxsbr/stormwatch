# 011 — Rat guard uses complete torso frames

Status: art reviewed and guard implementation authorized, 25 September 2026.

## Context

Separate rat arms and shield introduced inconsistent scale, shoulder joins and silhouette. The owner rejected both the animation and its part assembly page, and identified duplicated leg anatomy. They requested the original complete torso plus a generated shield-up version, with correct paired legs.

## Decision

Keep the original torso byte-for-byte for shield down. Generate one complete shield-up torso per side, front and rear view, retaining both arms and shield in the painting. Switch between these whole torso frames; do not deform regions or animate separate rat arms/shield. Generate outer/inner leg surfaces for the side view and anatomical left/right pairs for front and rear. Each pair has a shared fixed scale.

The review page compares assembled down/up frames, demonstrates switching and gentle leg motion, exposes the unoccluded leg pairs, and permits position/rotation export. The owner reviewed the assembly and authorized its integration.

## Consequences

The game now uses the reviewed torso frames and paired legs. Guard damage and sound are implemented; recoil is intentionally absent. Impact feedback is sound only while guarding. Generated frames can still drift in fine detail, so frame registration and identity require visual review.

## Verification

Original down files are byte-identical copies. Native generated alpha is retained in lossless WebP crops. Prompts, native source hashes, crop rectangles and fixed assembly transforms are retained with the review assets. Inspect all three assembled views and the frame switch before integration. Automated checks do not constitute art approval.

Front guard anatomy: the raised shield presents its flat outer face toward the viewer. The carrying hand and forearm are hidden behind it; never paint a hand on the outward shield face.

Review refinement: front legs need fuller proportions and hip spacing consistent with the belt width. Rear guard must show the broad inner shield face and raised carrying arm, matching the forward-facing shield plane. Preserve the reviewed rear leg proportions.

## Implemented guard rule

The owner authorized game integration after the torso and anatomy refinements. Each rat raises its shield at age 1.1 seconds, lowers it at 3.1 seconds, and repeats every 5 seconds while walking. Simulation time freezes the cycle during pause. Tower projectile damage (including splash and net damage) is halved after ordinary armor calculation when the shield is raised at impact. Rescue remains unchanged. Net slowing still applies.

Guarded projectile hits emit the shield thud instead of the ordinary hit cue and do not update the unprotected hit animation. Rendering also suppresses any residual hit shake or flash while raised. There is no shield recoil: the complete torso switches between the two reviewed frames. Runtime v3 rigs use the reviewed paired legs and fixed torso registration. Focused simulation and renderer tests cover damage, timing, pause, projectile impact state, torso visibility and absence of guarded recoil.
