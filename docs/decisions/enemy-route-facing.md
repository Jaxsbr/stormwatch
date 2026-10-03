# Enemy facing follows route travel

Status: owner-requested bug fix, 4 October 2026; standalone main PR20 merged at `9e0b65a`; build and deployment verified successful.

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
seams. Whole-torso variants use the same generic sprite reflection. This fix
changes no asset catalog or campaign content.

## Verification

`tests/enemy-facing-render.test.mjs` provides 11 checks on actual Game movement,
Battlefield and CharacterRig, mocking browser/GPU I/O only. It covers all four
roles' left/right/front/rear turns, a late first frame, immutable simulation state,
pause, reduced motion, source texture isolation, pooled reuse and disposal. Actual
reflected Rat boot contact remains within one stage pixel during the sampled stance;
the native fixed-length IK retains its existing full-extension clamp.

The four original symptom checks fail on the main baseline and pass with this
patch. Standalone verification passes the required check, 412 tests, formatting,
production build (241-file artifact boundary) and workbench build.
Browser verification uses normal-mode crossing play on the shared renderer, with
paused left-return and right-forward Rats visible together. This is desktop browser
behavior evidence, not physical mobile performance or whole-expansion art approval.
Independent review of the identical renderer implementation and its standalone
main adaptation passes. Main workflow `37162460066` verifies successful build and deployment of `9e0b65a`.

The held feedback build combines the independently reviewed Boar immunity torso with this repair. All 433 integrated tests, type checking, formatting and both builds pass; a retained actual Game/Battlefield regression verifies the reflected brace, pause, 300 ms recovery and neutral pooled reuse. This integration does not close owner directional or battlefield-art acceptance.
