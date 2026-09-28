# A shared tower animation review desk

Type: prototype
Status: ready-for-human

Question: which layout helps the owner identify the exact pose and explain the
required visual change most clearly?

## Initial prototype (superseded below)

Three working layouts with actual runtime rigs: A close-up, B direction board,
C frame storyboard. Controls include slow playback, frame stepping, direction,
zoom, normal/diagnostic layers, and base/upgraded cadence. Notes include frame,
direction, component, marked spot, observed/wanted text and original PNG.
Export/reopen and readable feedback support subsequent agent work.

## Evidence and context

Branch: `codex/tower-animation-review-prototype`.
Source and verification: `review/2026-09-28-animation-prototype/README.md`.
Decision record: `docs/decisions/030-animation-review-prototype.md`.

The squirrel bow-over-back and turtle net-over-shell reports reproduce in the
shared renderer. The turtle side-arm report still needs owner review to identify
the intended correction. No animation changes have been made.

## Answer

Owner selected option B. The simplified review tool is delivered; permanent
workbench integration remains a separate decision.

## Owner decision — 28 September 2026

Option B is sufficient. Keep only the four directions, tower selection and
play/pause, so the owner can screenshot and annotate. Feedback UI removed.
The simplified board is delivered at the same URL. Owner-supplied screenshots
and the requested self-diagnosis are recorded in
`review/2026-09-28-animation-diagnosis/README.md`.
