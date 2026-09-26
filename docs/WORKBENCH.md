# Designer workbench

Run `npm run dev:workbench` for local authoring. For a built preview, run
`npm run build:workbench` and `npm run preview:workbench`, then open
`/workbench.html` on the printed local URL. `npm run build` still produces only
the ordinary game in `dist`; the workbench output is `dist-workbench`.

Expand the encounter register and select a stable wave. The rhythm view shows
individual nominal spawns, fixed-tick appearances, packet composition and
spawn-relative ability windows; the map shows the existing fixed trail. The last
scheduled spawn is not the wave-clear time. Authored lesson and target outcome are
separate from observed reports; missing intent is displayed as unspecified.

Fork a named draft before editing. Adjust counts, cadence, batches, stagger,
preceding silence, repetition or supported cycles in the packet form. Advanced
JSON exposes catalog/rule parameters and packet structure with explicit scope.
Validate/save creates another revision. An active attempt retains its original
snapshot; restart applies the selected revision. No infrastructure work retunes the
released campaign.

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
preserve evidence. A recorded replay can branch to manual control at preparation.
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
otherwise canonical content is used. JSON output records effective identity,
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
