# Route capability verification

## Baseline and scope

Implementation began from verified remote `c8a5c4b`; its required checks passed
with 324 tests. Before final verification the feature branch incorporated verified
remote `98cfea9538f1006b822421578e6d49731684bd46`, including the art capture hook.
That intervening PR changes no simulation code. Measurements reproduce the
baseline from a clean archive of `c8a5c4b`, using the same benchmark script.

The measured capability benefit is one authored geometry resolving identically
in three independent fixture maps, plus two immutable enemy route identities,
two exits, route-local rallies and two required boss defeats. Baseline content
validation rejected these fields; the candidate validates, plays, promotes and
reloads them. There is no content or draft schema-version bump. The committed
campaign still contains only its three existing encounters with unchanged waves,
legacy paths and targeting policy. Twin switchbacks is an unused layout library
entry, not a new campaign encounter or accepted scenery asset.

## Reproduce the simulation measurement

Run `node tools/route-benchmark.mjs` on the baseline and candidate. Run
`node tools/route-benchmark.mjs --two-routes` only on the candidate. The script
uses five warmup runs followed by 25 measured runs of 5,400 fixed ticks (180
simulated seconds). Each fresh synthetic attempt has 60 enemies and 12 legally
placed defenders. Enemy speed/health are intentionally adjusted to keep that
population alive throughout the run. This is a synthetic capacity measurement,
not a legal campaign strategy, balance result or frame-time measurement.

The recorded runs were serial on Node v24.3.0, Darwin arm64. No builds, installs
or second benchmark ran concurrently. Early exploratory runs overlapped browser
compilation/dependency work and showed large outliers, so these fresh serial runs
are the comparison; raw values are retained in the linked JSON files.

| Scenario                      | Median total simulation elapsed (ms) | p95 total simulation elapsed (ms) | Raw samples                                      |
| ----------------------------- | ----------------------------: | -------------------------: | ------------------------------------------------ |
| Baseline legacy single route  |                       148.175 |                    154.246 | [baseline-single](routes/baseline-single.json)   |
| Candidate legacy single route |                       170.148 |                    174.009 | [candidate-single](routes/candidate-single.json) |
| Candidate explicit two routes |                       126.800 |                    129.033 | [candidate-two](routes/candidate-two.json)       |

The legacy candidate costs 14.8% more median simulation elapsed in this synthetic test.
Its average elapsed per fixed tick is about 0.032 ms. This records an overhead,
not a performance improvement. The two-route scenario places towers on different
valid cells and has different combat, so its lower elapsed time is not a fair
speed comparison with the single route. These results do not measure browser
rendering, GPU work, input latency or physical mobile performance. Timing remains
informational; deterministic capability/compatibility tests gate CI rather than
an unreliable machine-specific timing threshold.

## Behavior and authoring evidence

`tests/routes.test.ts` resolves authored content through the actual `Game` and
uses the exact approved 12×8 Twin switchbacks paths. It checks both crossings,
route retention, union occupancy, both exits/shared hearts, current-speed threat
ordering and stable ties, splash across routes, independent rage, own-route rally,
simultaneous arrival/deaths, one death then escape, either boss escape before
same-tick impacts, pause and fresh replay. Existing first-board strategy snapshots
remain unchanged. Projection compares both route samplers against simulation.

`tests/routes-authoring.test.ts` checks old version-one draft normalization,
shared geometry across three fixture maps, immutable attempts, selected/all/CLI
promotion, preservation of unrelated scopes and atomic shared-layout conflicts.
`tests/workbench-api.test.mjs` writes only a disposable content file, testing
saved draft → Playtest → Promote → uncached game-content read → new attempt;
repeated stale promotion rejects without replacing the file. Renderer lifecycle
coverage checks retry reuse and a change affecting only route B.

In a disposable browser/server copy, the workbench selected Twin switchbacks,
assigned a Rat group to route B, reloaded the saved draft and confirmed the
assignment. Playtest rendered both trails and route-B traffic, pause froze the
scene, and Promote all changes completed. A separate game server loaded the
promoted content, showed both entrances/exits in its briefing and retained that
preview after a page reload. Both tabs reported no warning/error console entries.
The waypoint editor also saved a diagnostic route edit through draft reload,
Playtest and selected promotion; an uncached game reload displayed those exact
edited coordinates. That edit stayed in the disposable copy.
The fixture reused existing woodland scenery for functional verification only;
it is not new-encounter scenery or balance acceptance.

## Checks and remaining gates

Final verification passed `npm run check`, all 356 tests across 62 files,
`npm run build` and `npm run build:workbench`.
The production graph/artifact check excludes authoring/QA modules. No new raster
art was generated in this task, so no originating art session needs a sweep.
Diagnostic browser screenshots remain local evidence rather than catalogue art.

Parent review, integration with overlapping combat/board configuration changes,
safe merge order and deployed-main verification remain pending. Campaign
activation must use the approved shared reference in encounters 1/2/5, explicit
route assignments, simultaneous boss groups and accepted scenery/rosters; it
requires its own legal balance and owner battlefield acceptance. Physical-device
performance is unverified.
