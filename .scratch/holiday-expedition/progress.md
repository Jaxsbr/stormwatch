# Holiday chapter progress

## Current state

The spec remains `ready-for-agent` for the unfinished campaign. Tickets 01–03 are complete at the owner-approved scope; tickets 04–06 remain. The initial planning handoff did not implement gameplay; historical ticket 02 review and current closeout are recorded below.

Current gameplay baseline is `1c72f84`; owner playtest completion is recorded in `153e1b9`. Two player slots, Squirrel upgrade discovery, four-wave mixed Rainstone, deterministic Weasel evasion and Turtle discovery are implemented. The Last Lantern, attached-net feedback, boss ending and replay advantages remain tickets 04–05. Earlier observations below are historical snapshots.

## Owner context

- Children are six and nine; target devices are tablets and a laptop.
- CuteDefense is a favorite and a read-only reference.
- Boss maps are delivery milestones. The chapter ends in a Roadwarden victory; Skunk, Boar and a larger campaign remain later work.
- The owner wants ordinary corrective feedback to steer semi-autonomous implementation.
- The to-spec skill's test-boundary check has been sent: real Game scenarios, existing persistence functions, and browser/family-device play. No answer is recorded yet; the spec uses these as proposed boundaries without claiming confirmation.

## Ready handoff

- `spec.md`: canonical Day 2-onward specification, using the requested template and extensive user stories.
- `wave-plan.md`: Map 3 implementation recipes plus Maps 1–2 prerequisite context; numeric values untested and tunable.
- `issues/04-turtle-and-final-route.md`: Day 2 entry ticket; prerequisite audit, net feedback, route and teaching waves.
- `issues/05-boss-and-chapter-ending.md`: Day 2 boss, required defeat, ending and replay rewards.
- `issues/06-family-release.md`: Day 3 corrective feedback, broader integration and family-device readiness.
- Tickets 01–03: complete at the owner-approved scope. Tickets 04–06 remain ahead.
- `expanded-wave-plan.md`: optional future design, excluded from this release.

## Next execution step

Begin ticket 04, Turtle feedback and The Last Lantern route/teaching waves. Preserve the completed Lantern/Rainstone lessons and earned progress. Integrate ticket 05 before making the final encounter a normal campaign destination. Maintain a candidate/version and append evidence, next action and owner feedback after each playable slice.

## Known release dependencies

- No public holiday deployment route is established by this planning work.
- Actual tablet models/browser behavior and physical performance require owner/device evidence.
- Proposed wave balance, rally, boss objective and final rewards have not been implemented or verified by this spec-writing task.

## Resume prompt

Implement the remaining campaign in `.scratch/holiday-expedition/spec.md`, starting at ticket 04 and continuing through 05–06. Preserve existing progress and leave CuteDefense unchanged. Use existing Game and persistence test boundaries, keep playable candidates, and maintain this progress record. Tune routine details from evidence and incorporate simple owner feedback. Report missing dependencies and required physical-device observations precisely. Do not create a new public deployment destination or buy assets without authorization.

## Explicit historical-ticket review — 02 (25 September 2026)

The owner explicitly requested ticket 02 despite tickets 01–03 remaining historical Day 1 references outside the active Day 2-onward queue. This review does not certify ticket 01 or the broader Day 2 prerequisites.

- Browser observations used the local candidate at `e422ee0` (`fix: keep build tray available when waves start`). The final source helpers and automatic-start HUD refresh were checked afterward at `e5ba05d`; the required type-check, test suite and production build all passed at that revision.
- In a clean, isolated browser session, the new profile showed Lantern Pass available, Rainstone locked, 100 starting gold, only the Squirrel build choice, and an upgrade-disabled inspection panel explaining the Lantern unlock.
- Live first-wave check: two Squirrels cost 80 gold. Their kills raised the balance to 42; a third Squirrel was bought during wave 1. That line cleared wave 1 at 12/12 lives and entered wave 2 with 49 gold. Build confirmation appeared after placement. The HUD counter reflected kill income. A later full browser play-through on the same fresh profile won Lantern with two stars, persisted the stars and unlocked Rainstone.
- Weak/delayed-spending observation: a separate run kept only two Squirrels through wave 1 and reached defeat in wave 2. This is one observed delayed-purchase failure, not a claim that all novice placements fail or a campaign balance conclusion.
- Existing `tests/lantern-pass-strategy.test.ts` exercises all five Lantern waves with Squirrels only, upgrades locked, two opening towers, a third bought from wave-one kills, later spending, and full-health victory. This is deterministic simulation evidence, separate from the completed browser play-through.
- Required verification passed on the current checkout: `npm run check`, `npm test` (27 files, 151 tests), and `npm run build`.
- Starting a wave previously preserved the last preparation selection, leaving the tower-inspection panel open over the build tray. Starting a wave now clears that temporary selection so Squirrel build controls remain available during combat; a browser check confirmed the build card is visible immediately after wave start. The broader selection flow is unchanged.
- The fresh browser screen showed only Squirrel build controls, with no economy-building or supply controls. After the first victory, the next attempt showed an enabled `Upgrade · 55` action; using it changed the Squirrel to Rank 2 and the expected combat stats. The first-win reward explanation is asserted by `tests/game-chrome.test.ts`; the banner itself was not manually observed during this run.
- Rat shield timing/hit response, Squirrel release/projectile behavior, first-win reward persistence, and inter-wave/pause behavior have focused code/tests in the checkout. Browser review confirmed the visible guard cue, fresh-profile upgrade lock, Start control, build selection, Cancel, the restored build tray, and a large build action at a landscape viewport. It did not exercise the countdown, Start Early, or pause controls in the browser; tests cover their state/timing logic, while control clarity in play remains unverified. It also did not observe the full normal-speed draw/release/contact sequence, Rat shield fade/hit-flash sequence, upgrade celebration, or upgraded appearance across reload; those visual checks remain unverified. Physical touch and child comprehension were not checked.
- Audio was not listened to in this review, so audio quality remains unverified. No asset regeneration or new gameplay rule was justified by the evidence.

Ticket 01 was a historical dependency reference; see the owner-approved resolution appended below. At that earlier checkpoint, its completion and three-map presentation were unverified.

## Owner follow-up and ticket 01/02 verification — 26 September 2026

- Owner playtest accepts Lantern Pass economy: about ten Squirrels can be built across five waves, and placing one mid-wave gives a useful reduction in pressure. Keep those current economy values. This is owner play evidence, not a fresh balance simulation.
- Ticket 01 candidate now has two local player slots. The existing single save is migrated into Player 1, retains stars, settings and derived Squirrel upgrade, and remains in the legacy storage key as a backup. Player 2 starts fresh. Focused tests exercise migration, reload and isolation. A clean browser flow confirmed Player 1's Lantern win/unlocked Rainstone, Player 2's locked Rainstone, persistence on reload, and return to Player 1's two stars.
- Encounter opening and Continue now check the prior map's best stars. Advantage selection and attempt creation check earned cards, with Longer Nets filtered from maps without Turtle. Fresh Lantern starts with only base Squirrel and no card. The map and two current briefings were inspected at 844×390 and 1024×620 landscape viewports.
- A sole applicable earned advantage now appears equipped with a No advantage option; two applicable cards present a choice. These states are covered with focused rendering and selection tests. No current victory awards an advantage yet, so those cases are prospective until later reward content lands.
- Only Lantern Pass and Rainstone Crossing are registered. The Last Lantern has no encounter content or plotted node yet. The owner later accepted that this node and Turtle-after-Rainstone arrive with later content tickets; no unfinished node should be shown. Rainstone still uses its older eight-wave mixed roster, not the planned Squirrel-only Weasel sprint from ticket 03. At this historical checkpoint, Ticket 01 was not complete; the owner's later two-map scope decision below closes it.
- The owner requested a dedicated outcome screen. A fresh Player 2 Lantern Pass browser win showed 2 stars, 101 Rat raiders stopped with the enemy portrait/count, +357 gold with the in-game coin icon, the illustrated Tower Upgrade card, and the single Back to map action. Player 1's progress remains separate. Deterministic tests cover stats and result variants.
- The initial wave remains opt-in. The automatic between-wave timer is ten seconds, with a prominent battlefield countdown and an early-start button. Tests cover automatic start, manual start and pause. An actual browser defeat also showed the outcome totals and retry action. The first 2× browser attempt passed through the countdown before capture; later browser observations showed the battlefield cue and automatic transition at 1× and 2×, while focused timing coverage verifies the full ten-second interval at 2×.
- Hit/shield gain was raised and music gain lowered. Automated checks confirm the new relative levels; the owner listened to the corrected mix and reported that it is better.
- CuteDefense's visible-viewport sizing was reviewed read-only as the reference for browser chrome that steals tablet space. Stormwatch now fits its shell to `visualViewport` dimensions and updates on viewport resize/scroll. A focused test simulates a 1024×768 layout viewport with only 1024×620 visible, plus an 844×390 fallback. Browser captures show the map, briefing and result controls within the simulated 1024×620 tablet viewport and the map, battle and result within 844×390 phone landscape. No physical-device performance claim is made.
- The available local-network preview would require the hosting computer to remain on and the server running. No public family-device delivery destination is established; actual tablet access remains unverified.
- Final integration checks passed: `npm run check`, `npm test` (32 files, 164 tests), `npm run build`, and `git diff --check`.

## Countdown presentation follow-up — 26 September 2026

The owner supplied a browser screenshot showing the preparation text bar consuming battlefield height and a countdown that ran too quickly at 2× combat speed. The bar has been removed. The battlefield cue now reads “Next wave in {seconds}”; its ten-second interval uses elapsed real time while combat alone follows the speed control. Pause and early start still work. A focused speed-2× timing test covers the regression. A browser play at 1024×620 showed the bar absent and the compact countdown centered over the battlefield during an intermission at 2×. The next wave started automatically afterward. Final checks passed: `npm run check`, `npm test` (32 files, 165 tests), and `npm run build`.

## Result presentation follow-up — 26 September 2026

Owner screenshot feedback requested a quieter victory screen. The level/status eyebrow, escaped/heart boxes, explanatory upgrade text, and direct replay/Continue actions were removed. The outcome now shows total enemies stopped, per-kind portraits and kill counts, and earned gold with the existing coin icon. The Squirrel first-win reward is a compact “Tower Upgrade” portrait card. The outer panel uses the same current wood/metal-corner skin as buttons, and one action returns to the map. Easier retry remains reachable from a defeated map's briefing. A reusable card row fits one to three centered fixed-size cards. Type check and build passed; sample-result visual review covered one and three cards at 1024×620 and 844×390. A fresh Player 2 browser win has now shown the live result with 101 Rat raiders, +357 gold, the Tower Upgrade card and the single map action.

### Result design choice — option C

Owner chose option C; implemented the open reward stage, vertical illustrated tally, compact repeat-win state, responsive arched reward cards and single map action. Prototype archived at `codex/result-screen-concepts` (`f0f34c6`), `review/2026-09-26-result-concepts/`. See ADR 016 for decision and visual verification. Check, 165 tests and build pass.

## Final closeout verification — 26 September 2026

Fresh Player 2 browser victory confirmed the live result content and map action; Player 1's saved progress stayed separate. Final `npm run check`, `npm test` (32 files, 167 tests), `npm run build`, and `git diff --check` all passed. The build reports the existing 625 kB battlefield chunk size advisory.

## Owner scope resolution — Ticket 01 — 26 September 2026

The owner confirmed Ticket 01 complete at the current two-map scope. The existing profiles, legacy-save migration, registered-map gates, briefing/advantage eligibility, and simulated landscape layouts satisfy this ticket. Do not add a third placeholder node. The Last Lantern node and Turtle reward/use are later encounter work in tickets 03–05. Actual device access and candidate hosting are recorded for the family-release handoff in ticket 06; browser viewport simulation is the agreed current layout evidence. The issue status is now `complete`.

### Ticket 02 audio follow-up — 26 September 2026

The owner reported the previous defaults remained too quiet; arrow hits were especially hard to hear, though distinct from shield hits. The supplied settings reference shows music at 20% and effects at 100%. Both UI sliders now default to 50%; midpoint maps internally to those reference gains (music 0.20, effects 1.0). The arrow-hit gain is slightly above shield-noise peak (0.32 vs 0.30), while both remain user-adjustable. Existing saved preferences are preserved. The owner listened to the corrected midpoint defaults and confirmed the mix is better.

The owner confirmed the corrected slider interpretation: both visible defaults are centered at 50%, with midpoint output music 0.20/effects 1.0. A fresh browser settings view showed Music 0.5 and Sound effects 0.5. Save schema 2 migrates previous defaults/reference values to center and translates custom legacy values to preserve effective gain. The arrow impact (0.32) is slightly above shield-noise peak (0.30). A normal-speed browser observation confirmed Squirrel aim/release/impact, Rat guard/hit feedback, mid-wave placement and the visible countdown. Type check, all 167 tests, and build passed.

## Ticket 02 closeout — 26 September 2026

The owner confirmed the revised default mix sounds better. Together with the previously recorded new-profile first-wave, reward, progression, map, result, viewport, and countdown checks, this closes Ticket 02. The completion evidence and remaining family-device scope are recorded in `issues/02-first-watch-feedback.md`.

A fresh Player 2 browser run at 1× showed Squirrel draw/aim and arrow impact, the Rat guard icon/hit spark, kill gold, and mid-wave placement. It entered intermission with “Next wave in 3” and Start Early visible, then automatically started the next wave. The owner-requested 10-second timing independent of 2× combat speed is covered by a focused test and an earlier 2× browser observation. For weak-placement evidence, a deliberate single-tower layout near the late bend left the earlier route uncovered; after raiders passed, lives fell from 12 to 10 with ten still on the trail. This under-covered trial complements the two-Squirrel successful first-wave and full-clear evidence above; it does not generalize novice behavior.

## Ticket 03 approved amendment and candidate — 26 September 2026

Implemented the owner-approved three longer mixed Rainstone waves, replacing the previous five-wave sprint-only contract. See decision 017 and review/2026-09-26-rainstone/README.md. Gameplay candidate is 4ee0534 on main; local Vite preview supplies the ordinary game and a normal-speed wave-two fixture. The 20-second capture is committed with the candidate evidence. No public destination is claimed.

Weasels have a slightly reduced baseline speed, deterministic periodic evasion, a faint advance warning, a yellow chevron/flash, a short sidestep and floating Evade text. Arriving projectiles miss during evasion; missed nets do not apply slow and existing slow still expires normally. Rainstone has only earned-upgrade Squirrels on arrival, and discovers Turtle on victory. The third encounter and first Turtle use remain ticket 04/05 work.

Two real Game strategies win with actual arrival tools: wider coverage (11 hearts, 260.77 combat seconds, 12 base Squirrels) and saving for upgrades (3 hearts, 252.33 seconds, five Squirrels/four upgraded). Poor coverage loses during wave one. Focused rule tests cover net interaction, pause and replay; save tests cover reward and legacy/profile preservation. Full suite passed 173 tests; additional spawn cadence coverage and type check passed afterward. Production build passed. Standards review clear; spec review handoff request resolved by capture and checkpoint instructions. Physical-device play, child understanding and audio listening remain unverified. Ticket 03 awaits owner playtest; use the three questions in its review README.

## Rainstone opening and fourth-wave playtest correction — 26 September 2026

Owner feedback: wave one slightly too hard. Rat-to-Weasel quiet gap increased to six seconds; opening Rats shield for four seconds and remain exposed for six. Added wave four: the whole 1 Rat/5 Weasels, 2 Rats/4 Weasels, 3 Rats/3 Weasels sequence repeats three times. Each mini cycle has six enemies 0.2s apart; five seconds from the last spawn to the next mini cycle. Finale Rats guard 5s/rest 5s; Weasels use 1.1× catalog movement and 2s evasion every 5s. Wave three awards 35 gold ahead of the finale.

Both actual-earned-tool scenarios clear all four waves at twelve hearts: coverage 323.97 combat seconds; upgrades 317.23 seconds. Both now finish wave one at full hearts. Poor coverage still loses. All 176 tests in 33 files, type check and production build pass. Normal-speed 1024×620 browser fixture shows tightly spaced finale groups with active yellow markers/Evade text and blue Rat shields; no browser errors observed. These are automated and browser observations, not proof of family-device balance or child understanding. Owner playtest remains the next step.

## Fourth-wave expansion — 26 September 2026

Owner requested one additional full set and revised mini cycles: 1 Rat/6 Weasels, 2 Rats/5 Weasels, 4 Rats/4 Weasels. Repeat the entire pattern four times: twelve mini cycles, twenty-eight Rats and sixty Weasels (88 enemies). Retain 0.2s between spawns and five seconds from a mini cycle's last spawn to the next one's first spawn. Shield timing, extra-fast movement and two-second evasion every five seconds are unchanged. The prior nine-cycle recipe and its balance figures are historical.

Real Game spawn coverage verifies all twelve variable-size mini cycles and pauses. Both existing Squirrel spending strategies still clear all four waves; owner playtest remains the balance check.

## Ticket 03 closeout — 26 September 2026

The owner reported the final playtest completed. Ticket 03 is complete at the amended four-wave scope, gameplay revision 1c72f84. Implementation, scenarios, committed capture, checks and both review axes are complete. Next is ticket 04: Turtle feedback and The Last Lantern route/teaching waves; ticket 05 integrates the boss and chapter ending. Actual family-device release evidence remains ticket 06.

## Ticket 04 route and Turtle cue — 26 September 2026

The first-board progression amendment is recorded in ADR 018: Lantern Pass → Rainstone Crossing → The Last Lantern, whose Roadwarden boss gates a future board. Iron Boars stay on the next board. Ticket 04 content is authored as an unregistered five-wave level so it can be integrated with the ticket 05 boss instead of exposing an early victory after wave five.

The Last Lantern starts at 120 gold with base Turtle and Squirrel, and only the earned Squirrel upgrade. Its five waves teach net slow on non-evasive Weasels, then practise Weasel evasion, Rat guard, and mixed pressure; wave five is the hardest rehearsal below the boss. Deterministic first-arrival strategy evidence is in `wave-plan.md`: the mixed Net/Squirrel line clears with five of twelve lives after 243.7 simulated seconds; a nine-Squirrel line clears with all twelve after 213.6 seconds. A remote-Net comparison starts with three Squirrels at the first two bends, then buys a Net at `(10,4)` without adding damage support on the final stretch; it loses in wave 4 after 192.1 simulated seconds and 12 leaks. This is seed-42 simulation, not child or device balance evidence.

The original full-body net was rejected by the owner. A live browser prototype offered three floor-level variations on A's aura: woven lattice, tightening loops, and ground tethers. The owner selected woven underfoot. That floor cue now tracks active slow state, remains during pause, and clears with expiry/death; it sits below characters and overhead status markers. Browser review at 1024×620 showed it active in wave 4 with no symbol overlap. This is a browser observation, not physical-device or child-play evidence.

Ticket 04 is complete at its content/rendering scope. `npm run check`, all 181 tests, `npm run build`, and formatting checks for changed code passed. The production build still reports the large battlefield bundle advisory. The Last Lantern remains unregistered until ticket 05 integrates the Roadwarden boss, required defeat, board advance and ending. Ticket 06 still owns family-device checks and release readiness.
