# Designer utility: manual play and automated scenarios

Date: 27 September 2026. Research for a reviewable implementation plan; no gameplay or balance changes made.

## Findings from the current game

- **The simulation already exists.** `Game` is independent of the browser and renderer. Its command surface validates placement, funds, roster, upgrade access and phase. It advances combat in fixed 1/30-second steps through `advance`; tests call `tick(1/30)` directly. Build a utility around this engine rather than a second approximation. Sources: [architecture](../ARCHITECTURE.md), [Game](../../src/sim/game.ts).
- **The existing automated play is scripted strategy evidence.** Lantern Pass has a fixed placement plan; Rainstone compares placement and upgrade priorities; The Last Lantern compares three openings and records per-wave money, lives, leaks, duration and tower counts. The latter two policies reconsider spending every simulation tick. These are useful reproducible lines but do not search all legal strategies or approximate a child's reaction time. Sources: [Lantern Pass](../../tests/lantern-pass-strategy.test.ts), [Rainstone](../../tests/rainstone-strategy.test.ts), [The Last Lantern](../../tests/the-last-lantern-strategy.test.ts).
- **An old baseline tool is stale.** It requests unavailable Stone/Trade roles and reads removed economy/ability statistics. A read-only run of `node tools/run-challenge-baseline.mjs` exited 1 with `lantern-pass broad wave 1: stoneA failed`. Use the current strategy tests as the starting examples. Source: [baseline tool](../../tools/challenge-baseline.ts).
- **The real attempt includes progression resolution.** The normal screen resolves earned replay defenders, card availability and upgrade permissions before constructing `Game`. A sandbox must display these effective choices and offer explicit overrides without reading or writing the family's save. Sources: [progression](../../src/content/progression.ts), [attempt creation](../../src/main.ts), [progression tests](../../tests/progression-gates.test.ts).
- **Catalog changes currently require a new seam.** `Game`, the defender stats UI and the renderer read shared imported catalogs. Draft speed, HP or tower-stat changes must be resolved into an immutable per-attempt configuration consumed by all three, rather than mutating global catalog objects. Sources: [Game](../../src/sim/game.ts), [defender stats](../../src/ui/battle-ui.ts), [Battlefield](../../src/render/battlefield.ts).
- **Public state is not a complete snapshot.** Spawn queue, wave clock, id counter, frame accumulator, seed, boss-kill baseline and upgrade access live outside `GameState`. Cloning `game.state` cannot produce a faithful save/resume. There is no simulation snapshot/restore API today. Source: [Game private fields and constructor](../../src/sim/game.ts).
- **The benchmark is deliberately synthetic.** It injects enemies/effects, resets lives, and replenishes populations for rendering stress. It is valuable performance evidence, not a legal balance playthrough. Keep this separate from the designer's goal-runner. Source: [benchmark fixture](../../src/qa/benchmark.ts).

## Recommended manual-play workflow

1. Select a map, wave, named draft and attempt context. Show the authored values and the resolved values beside a spawn timeline. Let the designer change a draft, then launch the same `Game` and `Battlefield` used by normal play.
2. For v1, support full-map attempts and an **isolated wave with an explicit loadout preset**: gold, lives, defenders, upgrade access and advantage. Mark the latter as a synthetic scenario; the result cannot establish that the normal campaign can afford or reach that setup.
3. Capture accepted legal commands at integer simulation ticks. Restarting a scenario replays its initial configuration and command trace in a fresh `Game`; manual control can take over at a chosen point. This provides before/after comparisons with the same player decisions.
4. Later, support an authentic inherited wave by replaying an earlier full-map command trace to its between-wave boundary. Only add a versioned complete checkpoint API if replay becomes too slow or inconvenient; include private execution state and reject incompatible rules/content versions.
5. Keep pause, normal speed and clear restart/take-over controls. Fast-forward performs more fixed steps, never a larger combat step. Normal play currently speeds combat while leaving the between-wave decision window on wall time; a laboratory clock must describe its treatment of preparation explicitly. Source: [battle clock](../../src/ui/battle-clock.ts).

Draft configuration is fixed for one run. Editing during play should restart or create a new branch of the experiment, so a result has an unambiguous configuration.

## Recommended automated-play workflow

Start with reusable **policies**, including recorded owner play, fixed opening plans, spread placements, upgrade-first and coverage-aware mixed defense. Every policy calls legal `Game` commands and records accepted/rejected actions. Give policies visible constraints: decision interval, actions per decision, permitted live spending, selling, available unlocks and information access. Do not label a heuristic policy “optimal.”

Support goals as result predicates: complete selected wave, win map, lose no lives, defeat required boss, or finish with a specified life margin. A goal does not itself choose towers. A later bounded search can try legal candidate plans and return a successful replay, with a search budget and “no plan found” outcome; that outcome is not proof that the level is impossible.

Report first leak time and enemy, lives lost by wave, boss killed/escaped, wave duration, money before/after spending and payout, tower loadout and upgrades, rejected commands, and goal status. Add damage/guard/evasion and source/target diagnostics through a separate observer contract if required: current events expose only a type and optional number, insufficient for all attribution. Source: [event and state types](../../src/sim/types.ts), [Game event emission](../../src/sim/game.ts).

Every run should identify its scenario schema version, engine revision, content/draft fingerprint, seed, difficulty, progression preset, starting loadout, policy version/cadence and accepted command trace. Compare a candidate with a named baseline; preserve outcome differences without turning every numeric balance result into a brittle test.

Use automation to find pressure points and to rerun known routes after tuning. Keep manual observation of rhythm, readability, effort and enjoyment beside the numerical report. A perfect-spending policy's success does not establish accessibility for either child; repeated seeds also add little evidence until gameplay actually uses randomness. Source: [Game randomness and deterministic targeting](../../src/sim/game.ts), [family-release acceptance](../../.scratch/holiday-expedition/issues/06-family-release.md).

## Read-only comparison with CuteDefense

Its `tools/balance/harness.mjs` separates a command-only `Bot` from `drive`/`runGame`; policies act at a declared interval (default 500 ms), and path-coverage helpers rank placements. `tools/balance/policies.mjs` keeps policy decisions out of simulation rules. These are useful patterns for Stormwatch, without importing CuteDefense's mechanics or tuning goals.

Its `tools/tests/balance-ladder.test.mjs` fixes outcome bands for particular policies. Those bands characterize the authored policies, not universal player skill. Its `v2/docs/v2.2/research/V6-catalog-admin.md` also records catalog drift caused by transcribing configuration: Stormwatch's map/wave register should derive values directly from the same resolved content consumed by `Game`.

CuteDefense was inspected only; no changes made. Comparison citations above use repository-relative source identifiers and contain no environment access information.
