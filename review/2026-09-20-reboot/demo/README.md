# Stormwatch demo review cut

Current artifact: `stormwatch-demo-review.mp4` — 50 seconds, 1280×720, 30 fps container, silent. It uses actual game screenshots and normal 1× gameplay recordings, including a roadwarden boss, mixed late-wave enemies and the busy final wave. No synthetic or laboratory combat appears.

Rebuild with `node review/2026-09-20-reboot/demo/compose.mjs`. Exact source paths, excerpt starts/durations and the single result crop are in `shots.json`. Encoding preserves source proportions with letterboxing. Menu/inspection/result shots are held screenshots; combat is captured animation. Canvas footage excludes HTML HUD. The result crop removes the review toolbar and inactive build tray while preserving the complete outcome panel and its controls. Both environments are shown as a montage, not an uninterrupted run.

The combat was recorded before the subsequent fixed-camera adjustment to include top-row animal heads/markers. The ordinary runs did not place cropped top-row animals; the separate edge-placement review caught the issue and verified the correction at desktop and emulated phone sizes (see `../camera-edge-fix-review.md`). Do not present this recording as validation of the camera change.

`stormwatch-demo-draft.mp4` is the historical 26-second early-wave draft. The revised cut resolves its missing busy-footage content, and the independent consecutive-frame review supports 4/5 for demo coherence and character/combat motion (see `../lantern-consecutive-motion-review.md`). This is not a claim of continuously watching the complete video. Final renderer performance verification remains open. Audio is unassessed, and nominal 30 fps is not a smoothness guarantee.
