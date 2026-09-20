# 004 — Horizontal animated presentation and reusable art production

Status: authorized direction, implementation in progress; supersedes ADR001's distant isometric terrain presentation where conflicting.

Context: Functional MVP checks passed, but the owner rejected its visual/animation quality as insufficient for a convincing game demo. Static cutouts, obvious tiles, distant framing and generic text-heavy UI failed the intended atmosphere.

Decision: Preserve pure simulation/economy and replace the presentation. Favor a close horizontal landscape composition with cohesive painted scenery framing an open playable center, connected rounded trails, expressive 2D character/tower animation, and game-specific illustrated UI materials. Maintain description-driven production templates, validation and review rather than ad-hoc image prompts for each asset. Prove animation quality before scaling the roster.

Consequences: Old camera/tile screenshots and visual acceptance are historical, not proof of the new goal. Existing functional tests remain relevant. Asset generation alone does not prove usable animation: normal-speed clips and in-game review are required. Landscape handling may restrict play in portrait. Numerical quality ratings cannot override a visibly failed gate.

Verification: review/rubric.json and successive sessions under review/. Completion requires actual demo footage and reviewed runtime behavior, not only concepts or screenshots.

## Projection correction — product owner review

The first replacement biome plates were rejected: their large foreground props,
small distant trees and visible valley/horizon create perspective recession.
Direct comparison with Tower Legends gameplay captures `video-c` and `video-d`
shows a consistently scaled elevated battlefield. Its top cliffs are local raised
perimeter geometry, not distant landscapes. Close-up trailer shots must not be
used to infer depth scaling.

Biome production must use terrain filling the frame, no horizon, no vanishing
point, no scale reduction toward the top, and consistent-size environmental props.
Visible top/front faces provide volume while the map remains near orthographic.
The rejected woodland-clearing-v2 and rainstone-riverbank-v1 plates are iteration
evidence only; replace them before visual acceptance.

## Tower projection correction — explicit owner feedback

The 45-degree front-right cutout bolt tower was also rejected. The owner wants
**top down with a slight angle**, explicitly excluding the isometric appearance
of three visible cube faces. Towers must use a predominantly overhead view:
aligned rectangular footprints, top surfaces dominant, only a shallow front edge,
no diamond platform and no prominent left/right side walls. A roughly 75-degree
camera elevation with straight screen-axis azimuth is the next production trial,
not an independently approved numeric camera requirement. Verify one assembled
tower against the accepted biome before expanding its parts or the roster.

The owner subsequently reviewed two top-down bolt proofs in the tower lab and
explicitly selected **“Yes—use this view for all towers.”** The accepted visual
reference is `review/2026-09-20-reboot/superseded-mechanical-assets/v3/bolt-overhead-proof.webp`, captured in
`review/2026-09-20-reboot/after/tower-overhead-projection-proof.png`.
All tower roles and separated animation parts must match this projection.
The proof establishes projection only; it is static and is not animation approval.
