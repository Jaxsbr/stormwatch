# Designer workbench verification

Local implementation and verification, 27 September 2026. No campaign tuning,
canonical promotion, publication or deployment was performed. The accepted authored
content identity remains `v1-00ff3b08`.

## Automated behavior and builds

`npm run check`, `npm test`, `npm run format:check`, `npm run build` and
`npm run build:workbench` pass. The suite contains **223 tests in 40 files**.
`npm run build:qa` also passes independently. Build output retains the existing
large-chunk advisory; this is not a physical performance measurement.

Existing Lantern, Rainstone, finale, guard/evasion, boss, progression, profiles and
countdown scenarios continue to pass. The current finale's recorded strategy
losses were preserved. New real-attempt tests cover shared nominal/fixed-tick
scheduling, partial batches and rejected nonmonotonic edits, frozen per-attempt
catalogs, legal capabilities/formations, command replay, completion/no-loss goals,
matched comparisons and reproducible bounded search. Replay can hold at an
authentic later-wave preparation checkpoint without advancing ticks or countdown;
continuation and manual branching retain the preceding legal trace.

Draft/import tests cover complete content and evidence identities, namespace
isolation, unavailable storage with in-memory/export continuation, and malformed
payload rejection. Disposable-workspace CLI tests cover scoped promotion,
stale-base rejection, atomic error preservation and tested-configuration
equivalence. Catalog/rule promotion checks every affected encounter. Artificial
resources/formations remain scenario data rather than production defaults.

The production graph plugin rejects reachable utility/QA modules. The artifact
check passes across **220 production files**; QA, workbench, automation/search,
fixtures, diagnostic controls/workers and local writing support are excluded.
The QA heartbeat remains in its separate output. The Pages workflow uploads only
`dist`, and there are no new runtime assets or asset charges.

Two-axis review found two standards concerns and three specification concerns.
All were corrected: canonical authoring navigation, shared goal evaluation,
matched named-difficulty comparisons, removal of adaptive plan execution from
fixed replay, and previews resolved from the selected difficulty/scenario.
Additional browser findings corrected battlefield sizing, explicit replay holds
and isolated CLI dependency caches. See the local implementation review record
under the designer-workbench issue directory.

## Browser journey

Used the Codex in-app browser through its documented accessibility/DOM controls
and screenshot-based battlefield coordinates. Most inspection/play used
**1280 × 720**; battle layout was also inspected at **844 × 390**. Input was
pointer input with viewport overrides, not a physical touch-device test. Browser
version, physical frame rates and audible mix were not measured.

- Expanded the campaign register and selected The Last Lantern wave 6. The
  released preview showed 40 enemies and a last scheduled spawn at **52.80s**,
  with separate nominal/fixed-tick appearances, ability windows and fixed route.
- Forked a named revision, changed the first Rat cadence from **0.8s to 1s** and
  guard-down timing from **5s to 6s**, then validated/saved. The preview updated to
  **54.40s** without changing the released recipe.
- Selected isolated-wave mode with a declared **500-crown wallet**, a rank-2
  Squirrel and a Turtle formation. Legal purchases left **355 crowns**. The actual
  painted battlefield, defenders and Rat animation appeared; start, **4×** combat,
  pause, resume controls and defender inspection were exercised. The inspected
  upgraded Squirrel showed **17 damage, 3.1 range and 0.8s attack interval**.
- Inspected desktop and landscape layouts. The essential buttons measured at
  least **44 CSS pixels** high at the landscape breakpoint; build/inspection
  controls and village resources remained visible. An initial zero-height stage
  caused by a workbench CSS override was fixed and visually rechecked.
- Saved scenarios and attempt evidence, reloaded, selected saved entries and
  exported through the UI. Imported a complete validated transfer bundle through
  the file chooser, selected its revision and observed the same **54.40s** preview.
  The transfer bundle came from the shared export interface; no hidden game state
  was injected.
- Selected a named difficulty recipe while viewing the released editor baseline.
  Its timeline changed to **54.40s**, with explicit preview origin and effective
  roster, upgrade, advantage, wallet and heart summary. A short matched comparison
  returned different baseline/candidate configuration identities and equal
  five-command traces, labeled `fixed-plan` with zero invalidated commands.
- Replayed saved evidence. Replay held at selected-wave preparation with start and
  purchasing locked. **Take manual control at preparation** unlocked legal start
  and placement and displayed that the prior replay was retained.
- Ran a real local promotion **preview** against the exported candidate, confirming
  selected encounter scope and identities. No apply command touched accepted
  content. The apply/rollback behavior is covered in disposable-workspace tests.
- Opened the built ordinary game under **`/stormwatch/`** with diagnostic query
  flags present. Title → map → first-arrival briefing → battle showed the ordinary
  **100 crowns, 12 hearts, five Lantern waves and Squirrel-only roster**, with
  Rainstone/Last Lantern locked and no utility/recording controls. Sampled console
  inspection returned no warnings/errors.
- Verified the development workbench loads after structured CLI operations. CLI
  servers have an isolated dependency cache and emit clean JSON, preventing their
  SSR work from invalidating the live developer page.

## Limits and family-release boundary

This verifies local designer behavior, deterministic evidence and build
separation. It does not establish child enjoyment/comprehension, physical mobile
performance, tablet/laptop release acceptance, audio quality or a deployed update.
Existing owner observations are referred to by the specification, but detailed new
family-device observations were not collected here. Those belong to the separate
holiday-expedition family-release ticket; prior demonstrated owner evidence should
be collected there before repeating work.

The implementation is retained on one local branch with the spec and task graph.
Remote PR handoff remains pending authorization. No new upstream or hosting route
was configured.
