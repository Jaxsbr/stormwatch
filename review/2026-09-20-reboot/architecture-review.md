# Stormwatch visual reboot architecture review

**Review date:** 20 September 2026
**Scope:** horizontal close 2D battlefield, continuous painted biome/path art, animated characters and towers, and a repeatable descriptor-driven art import pipeline.
**Repository reviewed:** Stormwatch at revision `f778671` (`main`, `origin/main`).
**Review mode:** read-only repository and local asset inspection. No browser session was opened and no source gameplay code was changed.

## Finding

The visual overhaul can remain bounded if it replaces the renderer implementation behind the existing `Battlefield` adapter and adds a render-only visual manifest. The simulation, economy, level ids, wave data, save format, and semantic HTML flow do not need to change.

The smallest viable implementation is a 2D scene built with the already pinned Three.js dependency and an orthographic camera. It should draw a level-specific painted scene plate and transparent path plate, then render atlas-backed animated planes in explicit layers. This keeps the current WebGL lifecycle, resize path, picking entry points, performance fixture, and asset hosting while removing the tile-by-tile 3D ground and single-view billboard limitations.

Do not add Phaser or a runtime generation service for this change. A second rendering framework would duplicate pointer mapping, disposal, asset loading, and performance work. Generation remains an offline input; the browser receives committed atlases and manifests.

## Evidence from the current repository

The simulation boundary is already the right seam. `src/sim/game.ts` owns fixed-step movement, targeting, damage, wave outcomes, and events, while `src/sim/economy.ts` owns interest, trade income, rewards, and refunds. The six current test files cover those rules and strategy/replay behavior. Nothing in the requested presentation change requires altering these rules.

Content supplies integer `x,z` coordinates, fixed axis-aligned paths, blocked cells, and wave data through `src/sim/types.ts`, `src/content/lantern-pass.ts`, and `src/content/rainstone-crossing.ts`. Those coordinates can remain the authority for movement, valid placement, and hit testing. A visual mapping can project them into a close horizontal composition without changing a path or a reward.

The current presentation limitation is concentrated in `src/render/battlefield.ts`:

- `BoxGeometry` tiles and a repeated `ground.webp` texture form the battlefield.
- A camera at `(18,20,22)` looks toward the grid, producing the fixed isometric presentation described by ADR 001 and the current architecture/research docs.
- The eight figures are cropped from one 4×2 `sprite-atlas.webp`. A figure has one `THREE.Sprite`, one shadow, and an optional health bar; there is no clip or frame player.
- Motion is a sinusoidal enemy bob and a tower scale pulse based on cooldown. Attacks, hits, and deaths are represented by meshes and colour changes rather than authored character motion.
- `pick()` raycasts the current sprites and otherwise intersects a horizontal plane. This is a reusable adapter operation, but its grid projection and isometric camera assumptions must be replaced.

`src/main.ts` drains `GameEvent`s for audio before calling `field.update(game, selected, dt)`. `GameEvent` currently identifies an event type and optional numeric value, but not the tower or enemy that caused it. That is sufficient for sound and state rendering, but insufficient for reliably starting a particular attack, hit, or death clip. Passing the drained events into `Battlefield.update` and adding optional source/target ids is a small presentation contract change; it does not couple the simulation to a renderer.

The art pipeline in `tools/encode-art.mjs` is deterministic encoding for five static runtime assets. It does not discover animation frames, validate frame anchors, assemble animation atlases, or describe a battlefield plate. The checked-in runtime art is self-contained, while `assets/source/` is intentionally ignored. The existing policy should remain: generation is offline, generated runtime assets and manifests are committed, and clean checkout/build never needs generation access.

The current atlas is 1774×887 with real alpha and eight visible-subject bounds in `public/art/atlas-layout.json`. Its transparent cutouts are useful source material, but `docs/ROADMAP.md` explicitly records that they are single-view sprites with subtle motion rather than rigged animation. The visual inspection also found the existing ground texture is not mathematically tileable; using it as the principal battlefield surface would preserve the visible repetition risk the reboot is meant to remove. There is no committed battlefield-wide painted plate today.

## Recommended scene boundary

Keep the public `Battlefield` methods used by `main.ts`:

```text
new Battlefield(host)
load(level)
update(game, selected, dt, presentationEvents)
pick(clientX, clientY)
project(point)
highlight(point, valid)
dispose()
```

Replace its internals with these layers:

1. **Scene plate.** One opaque, level-specific painted biome image fills the playable composition. It includes the close horizontal forest, river, bridge, settlement, weather and atmospheric depth that currently come from flat tiles and perimeter props.
2. **Path plate.** A transparent painted road/causeway layer shares the exact design coordinate system with the scene plate. It can contain soft edges, wheel marks, puddles, bridge material and local highlights without repeating a tile. A machine-readable path mask or control-point list remains available for debug alignment and picking; the painted pixels are presentation only.
3. **Grounding and interaction overlays.** Shadows, valid-placement tint, range, rescue targeting, hit flashes and selection rings are separate transparent layers. They must not be baked into the scene plate, because they depend on current state.
4. **Animated entity layer.** Towers and enemies use atlas-backed planes with an explicit foot pivot and a depth key. The renderer sorts by the visual lane/depth key, not by DOM order or texture cell order.
5. **Effects layer.** Projectile, impact, slow, supply, payout, rain and defeat/win effects use small sprite clips or restrained vector/particle primitives. They are state/event driven and remain bounded by the existing QA population.

Use one orthographic 2D camera. Map the existing simulation grid to a design rectangle through a per-level affine transform rather than embedding screen coordinates in `Game`:

```text
screen = visual.worldToDesign * (x, z)
```

The visual descriptor should specify the design width/height, playable rectangle, crop policy, and the transform that places the simulation bounds over the painted plate. The camera uses `cover` behavior with an explicit safe rectangle for landscape phone, tablet, and desktop. It must preserve aspect ratio; a phone crop may remove decorative sky or foreground, but never a path entrance, exit, placement region, or HUD-safe area.

This is a horizontal close view without changing the simulation's `x,z` path. A level can gain a wide plate and a closer focal crop while `Game` continues to move enemies along the same polyline and `canPlace` continues to reject path/blocked cells. If a new visual crossing needs an over/under relationship, encode that in the plate and visual depth descriptor; do not change gameplay routing merely to solve draw order.

## Minimal code and data changes

The implementation should be split into small render-only modules rather than expanding `main.ts`:

| Change | Purpose | Simulation/economy impact |
|---|---|---|
| Replace `Battlefield` internals with a 2D orthographic scene | Scene plate, path plate, layers, 2D projection and picking | None |
| Add `src/render/animation-player.ts` | Deterministic clip selection, frame timing, loops, one-shots and final-frame hold | None |
| Add `src/render/visual-manifest.ts` | Load and validate committed atlas/plate metadata | None |
| Add a render-only level visual registry | Map `level.id` to scene plate, path alignment, crop and lane data | `LevelDef` remains unchanged |
| Pass drained events to `Battlefield.update` | Start attack/hit/death clips on the correct entity | Event metadata only; no rule change |
| Add optional `sourceId` and `targetId` fields to `GameEvent` | Route presentation events to the right entity | Browser-independent typed event extension |
| Add an offline animation/plate build command | Validate source frames, assemble atlases, emit manifest and hashes | Build-time only |

The current `main.ts` should drain once, play each sound, and pass the same array to the renderer. This avoids a second event queue and keeps audio and animation synchronized. A renderer can still derive idle/walk from state when no event is present. Entity presentation state should be keyed by simulation id and discarded when an id disappears, exactly as the current figure map is discarded.

For the first slice, do not add a new gameplay coordinate system, content editor, camera rotation, skeletal runtime, or third-party animation framework. Implement one complete Lantern Pass plate, one ordinary enemy, one bolt tower, walking/idle/attack/hit clips, picking, and one close 2D capture before converting all roles.

## Descriptor and import contract

Use committed descriptors as the source of truth for runtime layout. A descriptor should contain only reviewable, portable data; generation prompts may be recorded as provenance, but no private paths, credentials, or service configuration:

```json
{
  "schema": 1,
  "id": "rat",
  "canvas": [256, 256],
  "pivot": { "x": 128, "y": 232 },
  "clips": {
    "idle": { "frames": ["idle-000", "idle-001", "idle-002"], "fps": 6, "loop": "loop" },
    "walk": { "frames": ["walk-000", "walk-001", "walk-002", "walk-003", "walk-004", "walk-005"], "fps": 10, "loop": "loop" },
    "hit": { "frames": ["hit-000", "hit-001", "hit-002"], "fps": 14, "loop": "once", "hold": "idle" },
    "die": { "frames": ["die-000", "die-001", "die-002", "die-003"], "fps": 12, "loop": "once", "hold": "last" }
  },
  "provenance": { "style": "stormwatch-2d-close-v1", "view": "side-three-quarter", "source": "reviewed local generation" }
}
```

The exact schema can be smaller, but it must make frame order, clip timing, loop behavior, pivot, canvas size, and source identity explicit. Use the same schema for towers, enemies, effects, and any animated background prop. A separate level descriptor should define `plate`, `pathPlate`, `designSize`, `worldRect`, `cropSafeRect`, path control points, and expected entrance/exit markers.

An offline `tools/build-animations.mjs` (or a bounded extension of `encode-art.mjs`) should:

1. Read descriptors and reviewed local RGBA frames from an ignored source directory.
2. Reject missing or duplicate frame ids, mixed dimensions, opaque corners, invalid clip names, absent pivots, and non-finite timing.
3. Check alpha bounds and foot-pivot drift before packing. A frame may have a different pose, but the ground contact point must stay inside the declared tolerance.
4. Pack frames in deterministic descriptor order into one or a small number of atlases, preserving alpha and recording every rectangle.
5. Emit a versioned manifest with descriptor hash, source-frame hashes, atlas hash, dimensions, frame rectangles, pivot, fps, loop/hold behavior, and total bytes.
6. Provide a no-source `--check` mode for clean checkout/CI that validates the committed manifest and all committed runtime assets. Normal `npm run build` must continue to use committed outputs only.

For generated backgrounds, use the same two-stage boundary: reviewed scene plate and path plate are inputs; the importer validates dimensions, alpha/opaque expectations, hashes, and declared transform. Do not attempt to infer a gameplay path from painted pixels at runtime. The path control points remain authoritative and the importer should render a debug alignment preview during asset review.

## Animation model

Use generated frame sequences for the close-view characters and towers where pose and silhouette carry the trailer quality. The runtime player can remain simple:

- `idle` and `walk` loop by elapsed presentation time.
- `attack`, `hit`, `die`, `build`, and `payout` are one-shots with an explicit hold/fallback clip.
- A new event restarts or queues a one-shot according to descriptor policy; it must never leave an entity on a missing frame.
- Enemy movement comes from simulation state. Animation is visual state layered over the authoritative position; it must not move or reroute an enemy.
- Foot pivots and scale are descriptor data, so a generated frame cannot make an entity bounce because its transparent margin changed.
- Animation clocks use presentation time; simulation speed may pass a scaled presentation delta if the desired effect is to make attacks feel faster at 2×. This choice must be consistent and tested.

The current event flow lacks actor identity. Add optional ids to events that already have an actor: tower source on `shot`, enemy target on `hit`/`kill`/`leak`, and an ability or location id for `supply`. Keep payout values numeric and preserve event ordering. This lets the renderer start the correct clip without making it inspect private simulation fields or guess from cooldown deltas.

## Objective validation gates

The reboot is ready to expand beyond the first slice only when each gate passes. A human style review remains necessary, but the gates prevent temporal and integration regressions from being described as animation.

### Descriptor and asset gates

- Every catalog role used in a scene has an `idle` clip and every action requested by the game has a declared fallback.
- All frames in a clip share the declared canvas dimensions and RGBA mode. No frame has a nontransparent corner where transparency is expected.
- Atlas and manifest hashes reproduce byte-for-byte from the same reviewed source set and descriptor ordering.
- Foot-pivot drift is at most 2% of canvas height or 4 px at a 256 px source canvas, whichever is smaller after normalization. Subject scale drift is at most 3% unless the descriptor explicitly marks a hit/death squash.
- No frame is clipped at the declared visible bounds; a contact-sheet review catches malformed tails, weapons, ears, and tower projectiles that alpha bounds alone cannot.
- Scene and path plates declare the same design size and transform. All entrance, exit, bend, and placement-safe control points project within 0.15 simulation cells of the painted path centerline in a debug overlay.

### Runtime animation tests

Add focused Vitest tests for the render-independent `AnimationPlayer` and manifest validator:

- idle loops at the declared FPS, including a `dt` that crosses multiple frames;
- one-shots finish exactly once, hold the declared fallback/final frame, and do not restart on an unrelated state update;
- hit/death events route to the matching simulation id and stale ids are disposed after a replay or level reload;
- pause freezes the animation clock, resume continues without a giant catch-up step, and a fresh `Game`/renderer has no previous clip state;
- invalid dimensions, missing clips, bad pivots, duplicate frame ids, and malformed manifests fail closed;
- world-to-design projection round-trips representative path points and valid placement cells within the declared tolerance.

These tests should not duplicate combat or economy logic. Existing simulation tests remain the authority for movement, payout, pause, victory/defeat, and replay.

### Deterministic scene captures

Create a development-only animation review fixture with a fixed seed and fixed presentation times. Capture at least:

1. an empty close 2D battlefield with the full painted path;
2. idle and walking ordinary/fast/armored enemies;
3. all three towers idle, firing, upgraded, and selected;
4. simultaneous walk, attack, hit, slow, splash, supply, and death states;
5. a path bend, a foreground/background overlap, tower picking, and a level transition;
6. 1280×720, 1024×768, and 844×390 landscape layouts.

The review fixture should expose frame index, clip, entity id, world point, projected point, and asset hash in JSON beside each capture. Compare static plate regions with a pixel-diff budget after establishing a baseline; compare animation captures at named deterministic states rather than arbitrary wall-clock frames. A failed capture is evidence to investigate, never a reason to hide a missing frame.

### Performance and loading gates

Run the existing artificial stress scenario with animation enabled: 60 enemies, 12 defenses, three lodges, up to 150 active shots/effects, simultaneous statuses, and result transitions. Keep the existing desktop target of approximately 60 FPS, p95 interval ≤20 ms, and zero gameplay-caused frames over 100 ms; retain the documented mobile target of 30 FPS/p95 ≤35 ms as unverified until physical devices are tested. Record atlas count, compressed bytes, entity count, frame switches, viewport, DPR, browser, and console errors.

Keep the approved ≤8 MB initial transfer and ≤20 MB full runtime asset budgets. Prefer a small number of packed atlases and avoid creating/destroying textures per frame. The benchmark must include texture load and animation frame switching in the scene after warmup; a static background-only run is insufficient.

## Cutout, skeletal, and generated-frame trade-off

The current single-view cutouts are cheap, readable, and stable, but their bob and cooldown scale are not character animation. Keeping them as the primary close-view solution would produce a trailer with static figures, repeated floating motion, and no convincing attack or impact poses.

Runtime skeletal animation has attractive properties: a small number of textures, cheap blending, adjustable timing, and predictable file sizes. It is a poor default for this art direction, however. Painterly animal armor, tails, hands, weapons, cloth, and tower mechanisms expose rigid joints, rubber limbs, incorrect occlusion, texture stretching, and lighting that does not follow the painted volume. A generic rig also makes every role share the same motion language and can create a toy-like cutout result.

Generated frame sequences preserve painterly volume, contact shadows, armor overlap, and action-specific silhouettes. They are the better choice for the few high-salience roles in a close 2D battlefield. Their risks are temporal identity drift (face, markings, armor, weapon), foot/scale drift, alpha halos, background contamination, inconsistent lighting, duplicate or missing poses, large atlases, and nondeterministic regeneration. A prompt alone cannot catch these failures or reproduce a runtime atlas.

Use a hybrid at the asset level, not a hybrid gameplay model:

- generated, reviewed frames for ordinary/armored/boss close-view characters, tower attacks, hit/death moments, and high-salience effects;
- a smaller generated idle set or existing static cutout with restrained transform for low-salience lodge/background props;
- no runtime skeleton requirement for the first slice;
- one descriptor and one player for both kinds of asset so the renderer does not know whether a clip came from generated frames or a static fallback.

This gives the visual result a chance to reach the requested trailer quality while keeping the first implementation and failure surface bounded. If generated frames cannot meet identity and anchor gates, a deliberately limited static fallback is safer than shipping visibly broken temporal continuity; that limitation should be recorded as unverified visual quality rather than concealed by extra bobbing.

## Delivery sequence and risks

1. **Slice:** add one Lantern Pass scene plate/path plate, one ordinary enemy, one bolt tower, and the manifest/player. Preserve `Game`, economy, card flow, save, and all current rule tests.
2. **Adapter:** pass presentation events with actor ids, implement 2D projection/picking, and prove pause/replay/dispose reset animation state.
3. **Content:** add the remaining towers/enemies/effects and Rainstone's plate through descriptors only. Keep level gameplay files unchanged unless a visual alignment review proves a content path must change.
4. **Verification:** run descriptor tests, deterministic captures, viewport checks, and the existing stress/load budgets. Update the acceptance report only with observed results.
5. **Documentation:** add a superseding ADR for the horizontal 2D direction and revise the current fixed-isometric statements in `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/RESEARCH.md`, `docs/ASSETS.md`, `docs/ROADMAP.md`, and the glossary once implementation is accepted. Keep ADR 001 as historical context; do not silently rewrite it.

The main risks are path/plate drift, cropped entrances on landscape phones, transparent frame halos, incorrect draw order at bends, texture churn, and event/animation desynchronization. The proposed transform, manifest, actor ids, debug overlay, and deterministic captures address those risks without moving gameplay authority into rendering. If the first slice cannot keep feet planted, path alignment within tolerance, and picking reliable at all three required landscape viewports, rework the approach before expanding the roster.
