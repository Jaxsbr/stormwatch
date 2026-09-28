# 030 — Prototype a shared animation review desk

Status: prototype delivered; permanent layout pending owner feedback.

## Context

The owner reported north-facing squirrel bow layering, a north-facing turtle net
appearing over its shell, and an unclear side-arm bend. Animation discussion needs
repeatable poses and marked evidence rather than ambiguous descriptions.

## Decision

Try a development-only review page with three layouts: close-up, simultaneous
directions and a frame storyboard. Import the existing defender renderer and
runtime assets, and read the canonical attack cadence. Capture notes with exact
pose parameters and PNG evidence; permit local export/reopen and text sharing.
The owner authorized trying a tool, not a new game direction or asset purchase.

## Consequences

This fixture does not change gameplay or production assets. It exercises isolated
repeating attacks, so target transitions and projectile handoff still need later
in-game review. Session data is explicitly exported, not silently persisted.
A permanent editor or animation changes remain follow-up decisions. Keep this
prototype on its branch until the owner chooses what is useful.

## Verification

See `review/2026-09-28-animation-prototype/README.md` for browser verification,
export/restoration evidence, limits and successful repository checks.
