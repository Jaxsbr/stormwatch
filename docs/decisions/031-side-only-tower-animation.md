# 031 — Side-only towers and pose-first animation

Date: 2026-09-29. Status: accepted by owner.

## Context

Squirrel side animation improved through pose research and continuous rig motion.
North/south attempts exposed bow geometry, anatomy and occlusion defects. Generated
whole-character cardinal frames improved poses but changed scale, style and motion
feel. The owner accepted a side-only battlefield playtest and selected it as the
approach for all towers going forward.

## Decision

Render towers only in right/left side views, mirrored toward the target. Retire
north/south tower directions. Research a distinct action per tower, review and
rework coherent poses until accepted, then animate and playtest. Follow
[Tower animation process](../TOWER-ANIMATION-PROCESS.md).

## Consequences

One coherent side rig avoids directional style splits. Shots to vertically offset
targets use a deliberately stylized side pose. Target selection and combat rules
remain unchanged. Enemies retain directional walking. Old cardinal assets and
studies remain historical evidence but are no longer loaded as tower combat rigs.
The temporary facing toggle is removed; side-only is the normal game behavior.
New pose drawings require review before being treated as animation-ready parts.

## Verification

The owner accepted the development side-only playtest. Production adoption uses
that same left/right rule and short release lock, now for every tower. TypeScript check, 276 tests and production build pass. The prior development
playtest supplies the visual evidence for this same facing policy. A fresh browser
walkthrough did not advance past the title screen in the automation session, so
no new battlefield verification is claimed. Subsequent action changes must still
pass their own pose, motion and battlefield review gates.

## Skunk action and effects — 4 October 2026

The owner selected the underhand action from A with B's corked flask, approximately
2× the prior bomb size and bright neon green for visibility. The revised poses and
continuous motion were accepted, followed by B's soft puffs with no “Poisoned”
text. This extends the existing side-only decision; battlefield acceptance remains
pending. [Study and provenance](../../review/2026-10-03-skunk-study/README.md).

The runtime keeps the original body and continuous arm rig, sampling the exact
release pose to hand the same texture and dimensions to the real projectile.
Soft puffs read living enemies' authoritative poison status and the existing
transient splash event. There is no additional combat timer or ground damage zone.
Pause, expiry, immunity and evasion remain simulation decisions. Reloading the
flask is a brief visual fade, as accepted in the motion study; vertical targets
retain stylized side poses. The crowd fixture deliberately exaggerates overlap
and does not establish encounter balance or physical-device performance.

Focused tests cover mirrored release, first/late rendering, planted feet, pause,
cadence scaling, pooled idle reset, reduced motion, actual Game poison outcomes,
expiry and buffer reuse. The real Battlefield fixture covers both facings,
vertical targets, a crowd, sale while a bomb is in flight and fresh-attempt cleanup.
See [runtime verification](../../review/2026-10-03-skunk-study/battlefield/README.md).
