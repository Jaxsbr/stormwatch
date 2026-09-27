# Map and wave authoring contract

Read this before adding or changing maps, waves, shared ability settings, content
schemas, or the workbench-to-game loading/promotion path. Architecture details are
in [ARCHITECTURE.md](../ARCHITECTURE.md); designer controls are in
[WORKBENCH.md](../WORKBENCH.md).

## One source and one interpretation

- Author accepted content in `src/content/recipes.json`. The workbench holds one
  separate draft until Promote. Encounter TypeScript exports are derived adapters;
  generated `dist` files are build outputs.
- Route content through `validateContent`, `compileLevel` and
  `resolveConfiguration`. The workbench preview and simulation share
  `compileSpawnSchedule`. Preserve stable map, wave, packet and group IDs.
- Runtime game startup loads and validates `game-content.json` before importing
  adapters that derive catalogs, levels and save IDs. Local dev/preview serves the
  canonical recipe on each uncached request; static builds emit a JSON asset.
  Promotion changes data only. Keep code compilation out of Promote and preserve
  the immutable snapshot of an already-running attempt.
- Store ability timing once in `abilityDefaults`. Waves select Rat shield and
  Weasel evade with booleans. Shared timing changes affect every enabled wave;
  individual groups carry arrival timing and count, not ability timing overrides.
- Playtest and Promote must resolve the same authored settings. Preserve scoped
  promotion: selected map settings and wave, plus changed shared ability defaults.
  Keep unrelated content and pending draft edits, validate the result, check stale
  scopes, and atomically replace the canonical file.

## Workflow and completion

1. Inspect the canonical recipe and current draft workflow before editing. For a
   new map, use an existing supported layout as a starting point and supply stable
   IDs. Canonical array order controls campaign order and unlock progression.
2. Keep authored fields editable and understandable in the workbench. If a change
   needs a new schema field or mechanic, implement its validation, compilation,
   appropriate workbench control, persistence/migration and presentation together.
   Support old saved drafts through an explicit migration. Record consequential
   changes in a decision record.
3. Verify the effective compiled wave: counts, repeats, waits, stagger, ability
   flags and shared timings. Run deterministic simulation coverage for changed
   behavior and legal play evidence for balance changes. When intentionally
   accepting new tuning, refresh its recorded balance expectations and state why
   the outcome changed; retain the assertions that protect mechanics and scope.
4. For new content or editor/loading changes, check the complete round trip in a
   disposable copy: edit → automatic draft save → reload draft → Playtest → Promote
   → reload game. Confirm the game uses the promoted settings without rebuilding
   JavaScript, and unrelated maps/waves remain intact. Check campaign registration
   and save compatibility for new maps. Exercise draft migration for schema changes.
5. Run `npm run check`, `npm test`, `npm run build`, and
   `npm run build:workbench`. Inspect the production boundary result; authoring and
   QA modules stay outside the production game. Relevant regression seams include
   `runtime-content.test.ts`, `workbench-api.test.mjs`,
   `workbench-working-draft.test.ts`, `wave-abilities.test.ts` and
   `authored-campaign.test.ts` under `tests/`.

Completion means the accepted configuration is represented by the workbench,
validated and played through the shared model, and loaded by the reloaded game.
Report verification gaps explicitly. Local promotion, committing, and publishing
are distinct actions; a published site receives content through its deployment.
