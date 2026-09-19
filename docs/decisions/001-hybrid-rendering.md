# 001 — Fixed-camera hybrid browser rendering

**Status:** accepted; product direction confirmed 20 September 2026.

**Context:** The game needs expressive painterly art, an isometric sense of place, and approachable browser distribution. Fully modeled/rigged characters would increase production work beyond the small MVP.

**Decision:** Three.js orthographic camera, 3D terrain and camera-facing illustrated sprites, with semantic HTML controls. No camera rotation. Cap render pixel ratio at 1.75 to limit fill cost. Use alpha-tested transparent sprites and grounded shadows; put tall scenery outside playable cells.

**Consequences:** One illustrated view per entity can work; no model-generation service is required at runtime or for a clean checkout. Perspective mismatch and occlusion need visual review. Sprites do not provide correct rotating viewpoints or articulated animation. Mobile performance needs device evidence, not assumptions based on desktop.

**Verification:** `src/render/battlefield.ts`; desktop/touch screenshots and measurement status in `../ACCEPTANCE.md`. The renderer explicitly releases attempt geometry/materials/textures on disposal.
