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
