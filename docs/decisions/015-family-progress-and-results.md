# 015 — Separate family progress and show encounter results

## Status

Implemented for owner playtesting, 26 September 2026. The third encounter and later reward definitions remain in subsequent tickets.

## Context

The household needs two independent local players without losing the original save. A first victory previously ended in a small battle overlay, which did not clearly explain the reward or the outcome of the run. The owner also found the between-wave countdown too short and hard to notice, and reported that hit sounds were too quiet next to the music. A tablet browser can reserve visible space outside the game's layout viewport.

## Decision

- Store two local player slots. Migrate the existing single save into Player 1, start Player 2 fresh, and leave the legacy key intact as a backup. Keep each player's stars, unlocks and sound settings separate.
- Gate registered encounters by prior victory and gate advantage selection by earned entitlements. Do not present an unfinished encounter as playable. Registered content currently has two maps; the third map awaits its authored content and layout.
- Show a dedicated result screen with earned gold, enemies stopped, enemies escaped and remaining hearts. A first Lantern Pass victory illustrates the Squirrel upgrade and offers replay, map and Continue actions as applicable. Later victories still explain the earned skill.
- Count only kill income and fixed wave payouts as earned gold. Starting gold and tower resale are excluded. Count escaped enemies separately from hearts lost.
- Increase the automatic between-wave countdown from five to ten real seconds, independent of combat speed, and place a compact “Next wave in {seconds}” countdown in the battlefield. Remove the redundant preparation text bar so the battlefield stays visible. Keep manual early start and pause behavior. This supersedes the five-second timing in decision 013.
- Fit the game shell to the browser's visible viewport when available, including changes as browser chrome moves. Raise hit and shield feedback gain and lower music gain for an owner listening trial.

## Consequences

Two children can share one browser without overwriting progress. Existing saves gain Player 2 without a reset, and the old single-save data remains available. The results screen provides a clear place for future rewards. The countdown gives more time to build between waves. The sound changes improve the relative mix by gain settings, but clarity and comfort still require listening. The visible-viewport fit can be checked in simulated browser sizes; it does not establish physical tablet performance.

## Verification

Focused tests cover save migration and separation, gates, deterministic result counters, ten-second automatic and manual starts, audio gain settings, and visible-viewport sizing. Browser checks cover independent profile flow, fresh and returning victory screens, map and briefing layout, and landscape phone and tablet viewports. Run type checks, the full test suite and production build for integration. Owner listening and the third authored map remain open.
