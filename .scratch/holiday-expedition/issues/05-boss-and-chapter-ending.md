# 05 — Deliver the boss-map finish line

Status: ready-for-agent

Depends on: 04

Implement the final-wave procession, boss entrance/health, required-defeat objective, and the spec's visible escort rally. Use path distance for recipients so nearby bends do not incorrectly connect separate parts of the column. Speed uses max(sprint, rally), then net slow. Read the spec for exact initial timing; tune the wave gaps so a rally actually affects escorts. Use current boss art, motion and sound; no healing, summons or invulnerability.

The Last Lantern is the boss map that closes the first map board. Wave 6 must be the board's hardest wave, distinctly above ticket 04's hard wave-5 rehearsal. The Roadwarden should feel like a very strong single boss through its health/armor, escort pressure, and unique rally rule; do not add another boss just to raise difficulty. Defeating it is required to complete the board. Future board advancement belongs to later content and must not appear as a phantom Map 4 in this release.

Boss escape loses the attempt even with hearts remaining. Defeating the boss does not ignore surviving enemies or existing loss conditions. Win the chapter only after all required threats are cleared with lives remaining. Explain the objective before wave 6 and give an ordinary free/assisted retry after loss.

Apply the required-defeat objective only to the authored finale. Village loss takes precedence over a final kill in the same update; retry clears objective state. Select ordinary rally recipients at pulse time using path distance, let the granted three-second effect expire normally, and stop future pulses when the boss dies. Include these player-visible distinctions in focused scenarios through the existing Game commands/state.

Tune against upgraded Squirrels and base Turtles with funds earned through this actual map. Existing boss HP/armor are tunable, not sacred. A missing Skunk must never make the fight unwinnable. Compare at least two sensible defense lines and a recoverable mistake; avoid a puzzle requiring one exact layout.

On first victory, show a first-board-complete celebration and award Reach/Longer Nets for replays; do not show an unfinished next board or phantom Map 4. Replayed victories keep best stars and do not repeat first-time rewards. Validate saved/reloaded advantage availability and actual effect in replay.

If time forces the explicitly allowed rally cut, retain the full boss procession, health, readable impact, required defeat and ending; remove false rally cues and record the omission. Done when a fresh-profile chapter and a reward-enabled replay are playable end to end. Supply the day-two checkpoint with actual evidence, remaining concerns, and the release scope achieved.

## Comments

Published ready-for-agent under the Day 2-onward spec. Ticket 04 remains the implementation dependency. Day 1 availability must be verified before the fresh-profile acceptance claim; an all-unlocked fixture is insufficient.
