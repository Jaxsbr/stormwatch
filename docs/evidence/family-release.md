# Family release candidate — 27 September 2026

Ticket: holiday-expedition 06. Baseline: `7045287`. The release-hardening commit
adds journey coverage and handoff instructions; it changes no campaign content,
combat rules or assets. Ticket acceptance remains pending public access and human
play observations.

## Candidate and delivery

The production artifact is `dist/`, built with Node 24.3.0 / npm 11.4.2.
For a commit-identical candidate, check out the release-hardening commit shown by
`git log -1 --oneline`, install with `npm ci`, then `npm run build`.
Keep a copy of a verified `dist/` outside the checkout before rebuilding; that copy
remains playable while a later build is corrected. Label it with the commit and
retain its emitted `game-content.json`; do not substitute a newer content file.

The configured destination is [Jaxsbr/stormwatch](https://github.com/Jaxsbr/stormwatch),
with expected [Pages URL](https://jaxsbr.github.io/stormwatch/). Both repository and
Pages API checks returned HTTP 404 with the current authentication on 27 September.
This does not distinguish a missing repository from unavailable account access.
No deployment or public availability is claimed. Historical publication evidence
from 20 September is not evidence of current availability.

Once repository access is restored, use Settings → Pages → GitHub Actions.
The existing main-branch workflow installs pinned dependencies, checks types and
formatting, runs tests, builds and uploads only `dist`. Push the reviewed candidate
only when publication is authorized. Check its workflow commit and successful
Pages deployment, then open the exact URL from each family device. No alternate
public destination is authorized by this ticket.

A plain HTTP server served the emitted files under `/stormwatch/` for local
production verification, without Vite's development content adapter. The local
candidate was opened at `http://127.0.0.1:4187/stormwatch/`; it requires that local
server and is not a device-accessible public URL. README describes reproducible
local and Pages delivery.

## Automated chapter evidence

`tests/family-release.test.ts` drives actual `Game` commands once per simulated
second using canonical encounters, earned capabilities and no setup overrides.
Both routes start with a fresh Player 2 and an untouched Player 1:

- Win Lantern Pass and Rainstone on normal difficulty, saving/reloading each reward.
- Verify subsequent maps stay locked until the preceding victory.
- Lose an empty final-map attempt; retry without changing saved progress.
- Complete all six Last Lantern waves, kill the Roadwarden and retain lives, once
  on normal difficulty and once with assistance.
- Save/reload the first-board completion, Reach and Longer Nets. No fourth map.
- Win a Reach replay of Lantern with the earned Turtle roster available; retain
  best stars and final-map progress. Player 1 remains fresh throughout.

The normal final-map plan places Squirrels at `(8,4)`, `(3,3)`, `(5,3)`, `(6,3)`,
`(3,2)`, `(8,3)`, `(5,4)`, `(6,4)`, `(8,5)`, `(3,4)`, `(1,2)`, `(5,2)` in that
order as affordable, upgrading an existing eligible Squirrel before buying the
next. This is a reproducible legal strategy, not a claim about novice difficulty.
Earlier failing strategies remain useful pressure evidence.

Existing tests supplement this journey with legacy-save migration, independent
settings/slots, boss escape and simultaneous loss precedence, rally, countdown,
pause, entitlement enforcement, malformed saves and runtime-content failure.
The full suite result and browser coverage are recorded below after verification.

## Human acceptance still required

- Both children choose their own slot, understand the early lessons, reach the
  Roadwarden, retry and recognize the ending/replay rewards.
- Open the deployed candidate on the actual tablets and laptop; record browser,
  orientation, controls, stalls and any console/asset failures.
- Listen to music/effects through gesture unlock, pause, resume, mute and replay.
- Report unclear damage/leaks, boss escape, difficulty or placement feedback with
  map/wave and a short description. Fix and recheck the relevant encounter.

Viewport review is emulation. Automated strategy success does not establish
physical performance, enjoyment, comprehension or a full human browser chapter.

## Remaining work and future ideas

Public repository access and family observations are release blockers. Normal
boss balance still needs owner feedback despite a legal winning plan. The large
battlefield bundle build advisory remains a minor technical issue; this pass does
not establish a new loading/performance measurement. Next-board maps, Iron Boar,
Skunk, Turtle upgrades and additional artwork remain future scope.

## Verification results

- `npm run check`: passed before and after adding journey coverage.
- Focused family-release tests: 2 passed (normal and assisted final-map routes).
- `npm test`: 260 tests passed in 48 files.
- `npm run format:check`: passed.
- `npm run build`: passed; production boundary checked 222 files. The existing
  658.41 kB main JavaScript chunk advisory remains.
- `git diff --check`: passed.
- Standards review: no findings. Spec review: no implementation findings; public
  access and human observations remain explicit acceptance gaps.

### Production browser observations

Codex in-app browser, pointer input on a fresh loopback origin. Emulated viewport
sizes: 1280×720, 844×390, 1024×768, and portrait 390×844. No physical touch or
performance claim. Gameplay was run at 2× after confirming the initial 1× state.

Observed title → fresh map with two slots → Lantern briefing → placement → battle.
An under-covered two-Squirrel attempt lost; returning to the map and reopening
Lantern exposed Easier retry. It started a fresh attempt with 170 gold and 20 hearts.
The first arrival still showed locked upgrades. Live placement, Cancel, defender
inspection, pause → Settings → mute → menu → Continue, wave-clear payout and the
visible next-wave countdown were exercised. Phone/tablet landscape controls and
battlefield were visually inspected; inspected visible tablet buttons were at
least 44 CSS pixels high. Portrait displayed Turn to landscape and Game paused;
returning to landscape and Continue restored play. Captured console error/warning
logs were empty during these checks; the candidate loaded its local runtime assets.

The full three-map chapter, boss finish and replay are verified through simulation
and persistence tests, not yet a complete pointer/touch browser playthrough.
Background/resume, actual audible mix, physical touch and the final-map browser
fight remain explicit checks for owner handoff. No stronger claim is implied by
the browser sample or the passing test suite.

The production browser retry subsequently completed Lantern Pass with three
stars, 106 Rat kills and the Squirrel upgrade reward. After reloading, Player 1
retained those stars and Rainstone was unlocked; switching to Player 2 showed a
fresh locked route. This browser sample used Player 1; the automated chapter
uses Player 2. Both were created on the disposable verification origin.

A fresh exported committed tree installed successfully using `npm ci --offline`
(the local npm cache supplied pinned public packages). Typecheck and production
build/artifact verification then passed without ignored source assets or local
configuration. This proves independence from the working checkout; it does not
verify a remote clone or fresh network download while repository access is blocked.
