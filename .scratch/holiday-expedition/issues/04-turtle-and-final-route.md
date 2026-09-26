# 04 — Teach the Turtle before the boss

Status: complete

Depends on: 03 (complete).

Execution entry: ticket 04. Tickets 01–03 are complete, including two player slots, sequential map gates, earned Squirrel upgrades, the four-wave Rat/Weasel lesson and persistent Turtle discovery. Verify these existing prerequisites while integrating the final encounter; preserve the completed lessons and progress. The owner completed Rainstone playtesting after gameplay revision 1c72f84.

Author The Last Lantern route and its first five waves from `../wave-plan.md`. Give Turtle plus Squirrel a useful shared firing position and another viable downstream defense area. Only Squirrel upgrades are available; Turtle stays in its base form. Ensure the starting budget permits a reasonable mixed opening.

This is the final map of the first three-map board. Make waves 1–5 a clear difficulty ramp: wave 1 is the generous net introduction; each later wave adds pressure or combines a learned behavior; wave 5 is a hard combined rehearsal but remains below the distinct boss wave in ticket 05. Iron Boars are reserved for the next board and must not be introduced here.

Show a clear floor-level net/snare cue for exactly the active slow duration, including refresh, expiration, enemy death and pause. It follows its slowed target while keeping the animal silhouette and overhead symbols clear. Show net travel/release clearly using the existing Turtle rig. Reuse the status/effect boundary without coupling browser rendering to simulation rules.

Compare a well-positioned mixed line with extra Squirrel spending and a net placed away from useful damage. Tune until the mixed approach has a visible reason to exist without making Turtle an unexplained mandatory purchase. Record budgets, wave times and leaks for every wave, showing the rising pressure and a recoverable line into wave six. Keep the existing release candidate available while the finale is incomplete; do not ship a premature victory after wave five as a completed chapter.

Done when the opening lessons work, spending remains useful, and the route leaves enough time and space for the boss fight in ticket 05. The map becomes a normal campaign destination only when that finale is integrated.

## Comments

Owner requested publication through to-spec, assuming a Day 2 start. This is the first active implementation ticket. Use the updated spec's Testing Decisions and existing real-game scenario seam; exact wave numbers remain tunable starting content.

## Completion — 26 September 2026

The owner selected the woven underfoot cue (prototype A). The Last Lantern has a five-wave route/content definition with no premature chapter victory and remains outside the campaign registry until ticket 05 supplies its boss finale. The floor cue is rendered below the character from the same active `slowUntil` state as movement; pause preserves it, and expiry/death cleanup removes it. Net travel and release continue to use the Turtle rig.

Seed-42 first-arrival simulation evidence for five waves is recorded in `../wave-plan.md`. Mixed Net/Squirrel and Squirrel-only lines clear all five waves. A delayed remote-Net line starts with three Squirrels at the first two bends and later buys one Net at `(10,4)` without adding damage support to the final stretch; it loses in wave 4. This demonstrates that slow needs useful follow-up damage. Browser review at 1024×620 showed the woven cue below the character and separate from overhead symbols during wave 4, with the cue held during pause. This is a local browser observation, not family-device or child-play evidence.

Verification: `npm run check`, all 181 tests, `npm run build`, and Prettier checks for changed code passed. The production build retains the existing large-battlefield-chunk advisory. Ticket 05 still owns the Roadwarden wave, required boss defeat, board advance, ending, and chapter rewards.
