# Shared game UI and gold

## Status

Owner-directed, 22 September 2026. Extends the approved advantage design across the game and supersedes the screen-only rollout limit in decision 006.

## Decision

Use the same timber/brass illustrated action controls for title, map navigation, setup, gameplay, settings, pause, results and leave confirmation. Keep labels as live text; navigation uses plain words, without glyph arrows. Compact gameplay controls retain 44px touch targets. Keep settings on the title and during gameplay, removing the intermediate map header. The title action is always Play; the map footer contains Back only.

Remove narrative filler and repeated advice. Keep concrete information needed for decisions: lock requirement, enemy traits, advantage effects, combat statistics, costs, payout breakdown, earned stars, unlocks and the effect of assisted retry. Credits remain available inside settings. Result headings use Victory/Defeat; leave confirmation states what resets.

The player-facing currency is gold. Internal `coins` fields and save formats stay stable, as do prices, payouts and interest rules. Historical review evidence remains unchanged. Runtime labels and the current README use gold.

## Consequences and verification

Shared button generation and result markup live in `src/ui/game-chrome.ts`, with global presentation rules in `src/ui/game-chrome.css`. Existing map/tower illustrated cards retain their artwork. See `review/2026-09-22-all-screens/README.md` for screen captures and checks.
