# 016 — Illustrated encounter results

## Status

Implemented for owner playtesting, 26 September 2026. This supersedes decision 015's result-screen layout and actions.

## Context

The owner found the first dedicated result screen text-heavy. Its wide reward panel, old border, four horizontal statistic boxes and three competing actions weakened the sense of earning a reward. Future encounters may stop several enemy kinds and grant more than one reward.

## Decision

- Keep the outcome title and stars, then show a compact vertical summary: total enemies stopped, portrait and count for each enemy kind stopped, and earned gold with the battle HUD's gold icon. Remove the level/status eyebrow, escaped/heart boxes and explanatory reward paragraph.
- Record per-kind kills in the deterministic attempt state. Use the existing enemy art and show only kinds with a positive count.
- Present newly earned rewards as individually sized portrait cards. The Squirrel reward says “Tower Upgrade” and names its tower. Cards stay centered at fixed sizes for one or two rewards and can form a three-card row; short landscape layouts reduce card size so the map action remains visible. A subtle reveal animation respects reduced-motion preferences.
- Use the same wooden frame asset and metal-corner treatment as the game's current buttons for the outer result panel.
- Show one result action, Back to map. The player can select the next map or replay from there. After a defeat, the easier retry remains available in that map's briefing.

## Consequences

The result screen conveys more through existing game art and has room for later reward cards without widening a single reward. Repeat victories do not present the already owned Squirrel upgrade as newly earned. The outcome screen no longer offers direct replay or Continue. Gold remains attempt income from kills and wave payouts; starting gold and sales are excluded.

## Verification

Type check and production build pass. Browser visual review covered one and three reward cards at 1024×620 and 844×390 landscape sizes, including the map button remaining in view. The browser previews used sample result data; a subsequent live campaign victory should confirm the full transition and actual per-kind totals.


## Selected design: option C (26 September 2026)

The owner selected option C from three interactive compositions. The result now uses an open woodland stage instead of an outer frame, with a vertical enemy tally beside arched, fixed-width reward cards. Gold uses the game icon; the duplicate visible enemy total is removed (retained for assistive technology). One wooden Back to map action remains. Repeat wins without rewards use a compact centred tally. Cards wrap at narrow widths and reduce in size at short landscape heights; overflow remains scrollable. Reduced-motion preferences disable the reward reveal.

Prototype source is preserved on `codex/result-screen-concepts`, commit `f0f34c6`, under `review/2026-09-26-result-concepts/`. The prototype and switcher are removed from the implementation tree. Illustrative future unlocks have not been added to progression.

Verification: the production result renderer was visually inspected with four enemy types and three tower-upgrade cards at 844×390 and 1024×620, plus a repeat victory with no rewards at 844×390. Temporary fixtures were removed. `npm run check`, all 165 tests, and `npm run build` passed. This verifies browser layout, not physical-device performance.
