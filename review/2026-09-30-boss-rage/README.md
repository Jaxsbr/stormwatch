# Roadwarden rage playtest

Historical capture of the initial health-threshold version. The repeating-cycle
follow-up is in `../2026-09-30-boss-rage-cycles`; the live fixture now uses current
gameplay rules.

`boss-wave.mp4` is a silent, normal-speed 1280×720 capture of the final wave.
The fixture replays the existing `finale-mixed` policy through the first five
waves, then records wave six with its legitimately purchased Squirrels and Turtle.
No health, damage, currency or phase overrides are used. The run loses when the
boss escapes at about 25% health; victory and final family balance are not claimed.

Approximate video landmarks:

- 00:10: boss arrives.
- 00:17 and 00:27: successful rallies; double-chevron, amber pulse and escort streaks.
- 00:42: angry threshold (⅔ health); the boss is facing away at the instant of transition.
- 00:49: angry side expression clearly visible.
- 00:55: raging threshold (⅓ health), front expression.
- 00:57: raging side expression and faster final march.

The recording combines the actual rendered battlefield with a boss health overlay
and threshold ticks. It contains no explanatory gameplay captions. The preview
page's footer and capture controls are excluded from the video. `playthrough.json`
records deterministic phase/rally timestamps and the final capture's empty browser
error list. Screenshots preserve the transition checkpoints and workbench controls.

## Reproduce

Run `npm run dev:workbench`, open `/review/2026-09-30-boss-rage/`, allow the assets
to load, and click Record boss wave. The fixture exposes its completed WebM blob
as `window.bossReview.completed` for a browser automation export. Convert to MP4
using H.264 and yuv420p. This is a desktop browser capture, not physical mobile
performance evidence.

## Verification

- `npm run check`: passed.
- `npm test`: 293 tests passed across 52 files.
- `npm run build`: passed, including production boundary verification.
- `npm run build:workbench`: passed.
- Browser workbench: changed angry speed to 1.45, reloaded and observed 1.45,
  then restored 1.35 in an isolated browser profile; no errors.
- Disposable-file integration: edit → serialized draft reload → Playtest →
  authenticated atomic Promote → uncached game-content reload preserves tuning
  and unrelated maps. Runtime bootstrap also verifies the promoted speeds.
- Visual inspection: reviewed rally streaks/pulse, angry side, raging front/side,
  health transitions and silhouette/leg alignment in the capture.

Approved native ImageGen torso edits are encoded with
`node tools/encode-boss-rage.mjs side front` when their ignored source files are
present. The four runtime expression folders contain source hashes, approval,
prompt summaries and processing provenance. Original directional leg assets are
reused. Rear art retains its original expressionless view and gains the phase sway.
