# Designer workbench

Run `npm run dev:workbench` for local authoring. For a built preview, run
`npm run build:workbench` and `npm run preview:workbench`, then open
`/workbench.html` on the printed local URL. `npm run build` still produces only
the ordinary game in `dist`; the workbench output is `dist-workbench`.

## First tweak

The workbench opens in **Tune**, at Lantern Pass's first wave. Choose another
wave in the left register if needed. Change starting crowns, wave-end crowns,
enemy count or time between enemies, then choose **Save & play**. This validates
and saves a local draft before launching the exact edited settings. No naming or
scenario setup is required for the first playtest. **Save draft** keeps changes
without starting a game.

The rhythm preview updates for valid edits. It shows arrival timing, not wave-clear
time; combat and travel determine clearing. More timing options expose repetition,
batches, stagger, preceding silence, movement and supported guard/evasion cycles.
Encounter modifiers and design notes are separate from wave settings. Catalog,
rule and packet JSON editors remain under advanced disclosures.

Switching between **Tune**, **Test** and **Experiments** keeps pending inputs.
Switching waves or loading other saved settings asks you to save, discard or keep
editing when there are pending changes. Validation errors retain the inputs.
The play-setup line states whether the test starts at wave 1 or plays only the
selected wave, and discloses any custom starting resources. Short landscape
screens keep Save & play available in a persistent action bar.
An active attempt retains its original immutable snapshot; later edits apply to a
new attempt. The save indicator distinguishes released settings, unsaved changes
and saved local drafts.

**Test** contains manual setup and automated checks. Results lead with the outcome
and key values; expand full evidence for commands, configuration identities and
provenance. Results from earlier settings are labeled. **Experiments** contains
named drafts, earlier revisions, saved scenarios/results/traces, import/export and
canonical promotion. These tools are available without crowding the basic edit loop.

Choose first-arrival or earned replay tools independently of normal/assist or a
named design-only difficulty recipe. First arrival includes discoveries from
previous encounters. Explicit overrides can set `towers`, `upgrades`, `card`,
`coins` and `lives`; a formation is an array such as
`[{"kind":"bolt","point":{"x":1,"z":4},"upgraded":false}]`. Formation
placement and upgrades must be legal and affordable from the declared wallet.
Isolated waves and overridden setups are synthetic, without any claim that the
preceding campaign could afford them.

Play uses the actual battlefield, defender inspection, placement, upgrades,
selling, range, wave start, pause and sound. Combat acceleration uses fixed steps;
preparation retains its real-time decision window. Return to the workbench to
preserve evidence. A recorded replay holds at the selected wave preparation without advancing its
countdown. Choose Continue replay or Take manual control at preparation.
Saved traces/results can be selected after reload or import and replayed in fresh
attempts. The workbench never awards stars/discoveries or writes family profiles.

Policies disclose their cadence, action budget, tool restrictions and live-spending
assumptions. The default recorded strategies may act every fixed tick; a longer
cadence must be selected when comparing slower decisions. Completion goals require
a wave clear or encounter win, including required boss defeat. Optional no-lives-
lost requires actual completion and preserves every declared starting heart.
Matched comparisons replay the baseline commands against the candidate and report
rejections. Bounded search varies legal defense plans; failure is not proof of
impossibility. A found plan has a trace checked through fresh replay. Neither
policies nor search establish child suitability or physical-device behavior.

Drafts, scenarios, traces and reports use an independent browser namespace. If
storage is unavailable, the status explicitly says edits remain in memory; export
is still available. Export/import validates schema versions, complete content,
stable identities, legal setup and evidence references.

## Structured operations

`npm run workbench -- list` lists campaign numbers and stable encounter/wave IDs.
Other operations accept a JSON request file:

```sh
npm run workbench -- inspect request.json
npm run workbench -- validate request.json
npm run workbench -- run request.json
npm run workbench -- compare request.json
npm run workbench -- search request.json
```

Inspect accepts `{ "map": 3, "wave": 6 }` or stable `levelId`/`waveId`. Run uses
`{ "scenario": {...}, "options": {...} }`. A scenario contains `id`, `levelId`,
`mode` (`encounter` or `wave`), `progression` (`first-arrival` or `replay`),
`difficulty` (`normal` or `assist`), and `seed`; isolated mode also requires
`waveId`. Optional fields are `overrides`, `formation` and
`difficultyCandidate: { id, content }`.

Run options include `policyId`, `cadenceTicks`, `maxTicks` and
`goal: { type: "encounter-win" | "wave-clear", waveId?, noLivesLost? }`, or
`trace` instead of a policy. Policies are `lantern-growth`, `coverage-first`,
`upgrades-first` and `finale-mixed`. Compare takes `candidate` authored content;
search takes `goal`, `budget` and `maxTicks`. Optional `content` supplies a draft;
otherwise canonical content is used. Use `npm run --silent workbench -- ...` or `node tools/workbench.mjs ...` for clean
machine-readable output. JSON output records effective identity,
engine revision, fixed step, seed/setup, actions, checkpoints and outcomes.

## Deliberate canonical promotion

Export experiments and choose a revision plus an explicit selection JSON file:

```json
{ "levels": ["the-last-lantern"] }
```

Preview before applying:

```sh
npm run workbench:promote -- experiments.json revision-id selection.json
npm run workbench:promote -- experiments.json revision-id selection.json --apply
npm run check
npm test
npm run build
```

Selection also supports explicit `towers`, `enemies` and `rules` field lists.
Promotion validates all content, rejects stale baselines, checks tested effective
identity for affected encounters under the same declared scenarios, and stages
atomic replacement. Include all authored scopes needed to reproduce the tested
configuration. A different nested difficulty recipe must first become the selected
authored revision. Synthetic resources, tools, formation, policies and results are
never implicitly promoted. Errors leave the accepted source intact. Inspect the
diff and keep accepted history in source control; the command never commits,
publishes or deploys. Tests use disposable workspaces for writes.

The remaining family release observations belong to the existing holiday-expedition
family-release ticket. Prior owner observations should be collected there; bot
results and viewport emulation do not replace them.

## Shape waves visually

The Shape wave workspace opens an arrival canvas. Choose a group using its enemy image. Move the group to adjust the wait before it; later groups move with it. Stretch its timing to change batch spacing, and use the separate quantity handle to change enemy count. The selected group's batch detail provides a closer view of spacing and uniform staggering. Step controls offer precise and keyboard-accessible alternatives.

Sequences may contain several groups and linked repeated copies. Editing a copied group changes its source pattern in every repeat. Extra repeat wait is additional to the pattern's existing spacing. The shaded tail includes final batch spacing; the last arrival and the next group's start need not coincide. Species rows are guides for a single ordered schedule, rather than independently movable tracks.

Undo and redo act on accepted visual edits. Cancel a drag with Escape. Invalid timing leaves the recipe unchanged. Save & play saves the current draft before launching it. Encounter resources, behavior/configuration details and technical recipe editing remain available below the canvas; invalid expert input is retained and pauses the canvas until corrected.
