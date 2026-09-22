# Button skin correction

User reference: clipped solid inset, uneven bottom spacing, and overly intricate/pixelated old borders. Preserve wooden rails joined by gold metal corners; apply across buttons.

## Decision and implementation

Generated a dedicated bitmap with native ImageGen, rather than shrinking the ornate large-panel frame. Source: `assets/source/ui/timber-button-v2.png`; runtime: `public/art/v2/timber-button-v2/skin.webp`. Exact prompt and provenance manifest live beside the runtime asset. `tools/encode-button.mjs` reproduces the crop and lossless encoding and verifies alpha preservation.

The frame and center are one filled nine-slice image. Four equal 166px source slices map to equal CSS corner sizes. Symmetric content padding is independent of the artwork. Shared implementation: `src/ui/button-skin.css`, imported last. Covers action buttons, map nodes, advantage options and tower buttons. Non-interactive large panels retain their existing artwork.

## Evidence / iteration

- Baseline: user-supplied close-up and prior `../2026-09-22-all-screens/` captures.
- `title-desktop.png`, `play-closeup.png`, `play-closeup-4x.png`: inset meets frame; no detached rectangle. 4× is nearest-neighbor magnification of the actual browser capture, not an upscaled asset.
- Desktop map, advantage and battle captures show consistent corners at different dimensions.
- Compact 844×390 captures cover title, map, advantage, battle, settings, confirmation, and result screens. Desktop viewport: 1280×720. Browser: Codex in-app Chromium.
- First compact pass exposed min-content overflow from tower cards. Fixed with shrinkable equal grid tracks. `battle-compact.png` records correction.
- Long upgrade labels wrapped in the first pass (`selection-compact.png`). Final content-sized, nonshrinking action buttons verified in `action-matrix-compact.png` using production CSS/helper in `buttons.html`.
- Selected advantage and tower controls, disabled supply and upgrade buttons checked. Actual navigation, pause/resume, settings/back, placement and upgrade interactions exercised. Victory/defeat staged through the production result renderer; not a full gameplay run.

Acceptance: frame/fill alignment passes; symmetric padding passes; readable wood/gold corners at actual size passes; compact fit passes after iteration. Implementing-agent visual judgment, not user approval of the new art. Animated scenes are not pixel-diff baselines.

Checks: TypeScript/production build and 114 tests (18 files) pass. Existing large battlefield chunk warning remains unrelated.
