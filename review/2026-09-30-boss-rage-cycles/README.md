# Repeating Roadwarden rage

The silent `boss-wave.mp4` captures the current final wave at normal speed with
Squirrels and two Turtles. Three complete damage-triggered cycles are followed by
permanent full rage below 25% health. Turtle slow stays active through the later
cycles and permanent rage. The run ends in a loss; a separate normal-mode family
release strategy still wins in the regression suite.

Approximate landmarks:

- 00:33 angry → 00:36 full rage → 00:40 calm.
- 00:44 angry → 00:47 full rage → 00:51 calm.
- 00:55 angry → 00:58 full rage → 01:02 calm.
- 01:03 permanent full rage, continuing until the boss escapes around 01:14.

The fixture replays the existing `finale-mixed` campaign through five waves,
branches at final-wave preparation, sells the Squirrel at (3,7), and buys a Turtle
at (8,3) through normal game commands. There are no health, damage, timing,
currency or placement overrides. Remaining automatic purchase commands are
cleared when branching. `playthrough.json` records phase changes, permanence,
slow status, successful rallies and the final capture's empty browser-error list.
The health overlay marks 25%; it adds no gameplay explanation text.

Run `npm run dev:workbench`, open `/review/2026-09-30-boss-rage-cycles/`, allow
assets to load, then click Record boss wave. Browser automation can export the
completed WebM blob from `window.bossReview.completed`; encode it as H.264 MP4.
This is desktop visual evidence, not a physical mobile performance claim.

Verification:

- Type check passed; 304 tests passed across 52 files.
- Production and workbench builds passed, including production-boundary checks.
- Existing normal-mode family release strategy still wins. Full-rage speed was
  tuned from 1.8× to 1.6× to account for its increased uptime; HP is unchanged.
- Focused tests cover post-armor damage accumulation, timed escalation without
  additional hits, fresh damage after recovery, permanent rage from every phase,
  full Turtle slow and paused clocks.
- Old speed-only drafts preserve speed values and gain the new cycle defaults.
- An isolated browser changed trigger/durations to 12% / 2s / 5s and restored
  all three after reload; no browser errors. The screenshot shows those test
  values, not the canonical 10% / 3s / 4s defaults.
- Disposable-file integration covers saved-draft reload, Playtest, authenticated
  Promote, uncached runtime reload, identical attempt configuration and unchanged
  unrelated maps.
