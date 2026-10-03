# Enemy facing follows route travel

Status: owner-requested bug fix, 4 October 2026; parent integration and deployment verification pending.

## Context

The owner observed enemies moving left on crossing return segments while their
side art continued facing right. The shared Battlefield selected side/front/rear
resources but never reflected leftward side travel. A deterministic real-Game →
Battlefield → CharacterRig replay reproduced this for Rat, Weasel, Boar and boss:
four left-return checks failed because the body retained its right-facing UVs.
This is a shared renderer defect, independent of the feedback fixture.

## Decision

Reuse the immutable attempt's existing route sampler and lookahead for horizontal
facing; keep front/rear selection for vertical travel. CharacterRig owns immutable
reflection per actor. Its pool key includes reflection, so turns and pooled retries
cannot inherit another direction's pose or textures.

Reflect the group's limb meshes and anchors. Three.js billboard sprites use
unsigned world scale, so reflect their actor-owned texture clones and pivots
explicitly, including optional whole-torso variants. Convert world gait displacement
back into reflected local coordinates before solving the existing fixed-length
legs. Dispose cloned textures with their actor; shared source textures remain
unchanged. This follows the existing reflected defender resource convention.

## Consequences

All four enemy roles face along return segments without new artwork, content,
movement, damage, timing or simulation state changes. Existing vertical views,
shield torso swaps, rage, pause and reduced-motion behavior remain in their own
seams. The optional Boar immunity torso can use the same generic sprite reflection;
its visibility timing belongs to its separate integration.

## Verification

`tests/enemy-facing-render.test.mjs` provides 11 checks on actual Game movement,
Battlefield and CharacterRig, mocking browser/GPU I/O only. It covers all four
roles' left/right/front/rear turns, a late first frame, immutable simulation state,
pause, reduced motion, source texture isolation, pooled reuse and disposal. Actual
reflected Rat boot contact remains within one stage pixel during the sampled stance;
the native fixed-length IK retains its existing full-extension clamp.

The four original symptom checks changed from failing to passing. The required
check, 429 tests and production build pass; the production artifact boundary passes.
Browser verification uses normal-mode crossing play on the shared renderer, with
paused left-return and right-forward Rats visible together. This is desktop browser
behavior evidence, not physical mobile performance or whole-expansion art approval.
Parent review, combined Boar torso verification and post-merge deployment remain
separate handoff checks.
