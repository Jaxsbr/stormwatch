# Designer experiments and promotion

The workbench stores named revisions, scenarios, command traces and results in its own `stormwatch.designer-workbench.v1` browser key. It does not read or write family profiles. A storage error leaves the current experiments available in memory and shows that they are unsaved; export them before closing the browser.

Exports carry schema version 1, complete authored content and stable revision/encounter/wave references. Import validates the content and references before replacing the current experiment set. A draft retains the accepted authored-content identity from the moment it was forked.

## Review a selected change

Export the experiment and prepare a selection JSON file. For example:

```json
{ "levels": ["lantern-pass"] }
```

Selections accept explicit encounter IDs under `levels`, defender IDs under `towers`, enemy IDs under `enemies` and individual gameplay rule keys under `rules`. Unselected content is retained from the accepted baseline. Starting formations, scenario wallets, tool overrides, policies, traces and results cannot be selected; they do not become production defaults. To change an authored starting wallet, edit the recipe itself and select that encounter.

```sh
npm run workbench:promote -- experiment.json revision-id selection.json
```

The command previews the before/after authored scopes and configuration identities. It rejects stale baselines, invalid content, unsupported selections and selections that fail to reproduce a selected encounter's tested effective configuration. Resolve any unrelated authored edits or select their relevant scopes explicitly.

To apply the reviewed selection locally:

```sh
npm run workbench:promote -- experiment.json revision-id selection.json --apply
npm run check
npm test
npm run build
```

Validation and staging precede atomic canonical-file replacement. Rejected operations leave the accepted file intact. The command does not commit, publish or deploy; source control retains the previous accepted recipes. Tests use `--workspace` with a disposable directory containing `src/content/recipes.json`.

Recipe equivalence is independent of scenario reachability. An artificial wallet or formation is not a claim that the same defense is affordable in the campaign; effective attempt comparisons must declare the same setup.
