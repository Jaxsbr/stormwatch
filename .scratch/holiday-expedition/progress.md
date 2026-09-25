# Holiday chapter progress

## Current state

The owner invoked to-spec for this plan, assuming a Day 2 start. The spec is published in the local issue tracker with `Status: ready-for-agent`. Active tickets 04–06 are ready-for-agent in dependency order. The initial planning handoff did not implement gameplay; the later explicit historical-ticket 02 review is recorded below. Day 2 tickets 04–06 have not started.

The planning-time gameplay baseline is local main at `4e25438`. Inspection still found only two registered encounters, the old eight-wave Rainstone roster, and only the Squirrel-upgrade entitlement. Weasel sprint, player slots and the full Day 1 progression work were not found. Day 1 is an assumed prerequisite, not verified completion. Integration may need work produced elsewhere; report exact missing dependencies rather than claiming an all-unlocked debug run proves readiness.

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
- Tickets 01–03: historical Day 1 dependency references, excluded from the active queue; not marked complete.
- `expanded-wave-plan.md`: optional future design, excluded from this release.

## Next execution step

Begin ticket 04 in the actual integration checkout. Verify the declared Day 1 dependencies, integrate completed work if available, and record any unavailable dependency. Continue independent Day 2 work where useful. Maintain a candidate/version and append the actual evidence, next action, and owner feedback here after each playable slice.

## Known release dependencies

- No public holiday deployment route is established by this planning work.
- Actual tablet models/browser behavior and physical performance require owner/device evidence.
- Proposed wave balance, rally, boss objective and final rewards have not been implemented or verified by this spec-writing task.

## Resume prompt

Implement the Day 2-onward specification in `.scratch/holiday-expedition/spec.md`, starting at ticket 04 and continuing through 05 and 06. Verify the Day 1 dependency contract without restarting its historical backlog. Preserve existing progress and leave CuteDefense unchanged. Use existing Game and persistence test boundaries, keep playable candidates, and maintain this progress record. Tune routine details from evidence and incorporate simple owner feedback. Report missing dependencies and required physical-device observations precisely. Do not create a new public deployment destination or buy assets without authorization.

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

Ticket 01 remains a separate historical dependency reference: three-map/progression data, two isolated local player slots with legacy-save preservation, enforced earned capabilities and Continue flow, responsive three-node map/briefing corrections, and an authorized family-device delivery route. Its completion is still unverified; the active Day 2 specification says to audit/integrate available work rather than restart that backlog.
