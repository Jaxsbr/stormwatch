# Designer utility: content, scheduling and progression

Research date: 27 September 2026. This is a proposal based on source inspection; no gameplay was changed and no balance or family-device claim is made.

## Existing foundation

Stormwatch already has the simulation needed by a designer utility. `Game` accepts a level, card, assist flag, seed and upgrade permissions, exposes commands, and advances independently of the browser. Production uses a 30 Hz fixed step; a utility should use the same step. It should share this implementation rather than develop an approximate combat engine. See [Game constructor and commands](../../src/sim/game.ts#L25), [fixed stepping](../../src/sim/game.ts#L220), and [architecture](../ARCHITECTURE.md).

The campaign registry contains three levels; order governs sequential unlocking. Level definitions evaluate to plain objects, but their source uses TypeScript helper functions and repeated arrays. An editor can serialize the evaluated objects today, but cannot round-trip those objects into the original helper-based recipes without losing authoring intent. Rainstone's repeated mini cycles and Last Lantern's `mixedPackets` are concrete examples. See [registry](../../src/content/levels.ts#L1), [progression](../../src/content/progression.ts#L5), [Rainstone recipes](../../src/content/rainstone-crossing.ts#L58), and [Last Lantern recipes](../../src/content/the-last-lantern.ts#L42).

## What must be visible and editable

The current content surface is small enough to expose directly, with human names and units:

| Scope | Authored settings |
| --- | --- |
| Map | ID, name/copy, width/depth, path, blocked cells, starting gold, available defenders, enemy reward multiplier, enemy health multiplier, required boss defeat, accent |
| Wave | Title, fixed clear reward, ordered spawn groups |
| Group | Enemy kind, total count, cadence, additional preceding silence, batch size, within-batch stagger, movement multiplier, Rat shield-up/down duration, Weasel exposed/evasive duration |
| Defender catalog | Purchase/upgrade cost, range, damage, firing interval; display metadata |
| Enemy catalog | Health, speed, armor, kill reward, leak damage; display metadata |

Sources: [content types](../../src/sim/types.ts#L6) and [catalog](../../src/content/catalog.ts#L8). Every inspector field should show its effective value, inherited/default value and scope: shared catalog/rule, map, wave/group, difficulty variant or temporary scenario override. Otherwise a local-looking edit can unintentionally retune other encounters.

Important combat knobs are still implemented as code literals: upgrade range/fire-rate/damage multipliers; shield damage reduction; evasion speed boost; projectile travel time; splash radius; net strength and duration; Roadwarden rally timing, radius, duration and boost. `Game` also imports the global catalogs directly. Shared typed rule/catalog snapshots are required if these become editable; mutating global exports would let one experiment contaminate another. New behaviors still require implemented typed rules, not arbitrary editable behavior names. See [attacks and movement](../../src/sim/game.ts#L271), [slow and splash](../../src/sim/game.ts#L336), [rally](../../src/sim/game.ts#L392), and [damage](../../src/sim/game.ts#L418).

## Scheduling semantics the visual timeline must preserve

Scheduling is deterministic, though not a simple constant-frequency stream:

1. The first scheduled spawn begins at 0.7 seconds plus the first group's additional silence.
2. Within a batch, enemies appear at `batchStart + index × batchStagger`.
3. Each batch advances the next batch start by `gap`, including the group's final batch.
4. The next group adds its `delayBefore` to that next batch start.

Therefore the visible silence between groups includes the preceding group's trailing cadence. Rainstone uses `4.8 + 0.2` to create five-second rests. Labeling only `delayBefore` as “rest” would misrepresent the playable wave. Extract one pure schedule compiler and use its resolved events for both `Game` and the timeline; show group/batch identity, timestamps and effective rest. See [queue construction](../../src/sim/game.ts#L171) and [Rainstone finale](../../src/content/rainstone-crossing.ts#L88).

Validation needs strengthening before accepting arbitrary edits. Current validation does not cover `delayBefore`, evasion cycles or every map/catalog numeric field. It allows larger batches whose last stagger extends past the next batch start, while the queue is consumed in insertion order. Decide whether to reject overlapping batches or stable-sort events; preserve every existing encounter's actual spawn timing during this extraction. See [validator](../../src/sim/path.ts#L27) and [queue consumption](../../src/sim/game.ts#L240).

Shield/evasion are relative to each enemy's spawn, not the wave clock. A custom Rat cycle starts exposed for its down duration; the omitted default has a special 1.1-second first guard. Weasel evasion is opt-in and includes a 0.6-second warning. A timeline should distinguish nominal spawn time, real tick-quantized spawn time and per-enemy ability windows. See [shield timing](../../src/sim/rat-shield.ts#L14), [evasion timing](../../src/sim/weasel-evasion.ts#L3), and [real-spawn coverage](../../tests/weasel-evasion.test.ts#L93).

## Campaign expectations and useful overrides

| Scenario | Expected tools |
| --- | --- |
| Lantern first arrival | Base Squirrel; no upgrades or earned advantage |
| Rainstone first arrival | Squirrel plus earned Squirrel upgrade |
| Last Lantern first arrival | Squirrel and Turtle; Squirrel upgrade; no earned advantage |
| Completed earlier maps after Turtle discovery | Add Turtle to authored roster; keep earned Squirrel upgrade |
| After Last Lantern victory | Earn Reach and Longer Nets, subject to card applicability |

Sources: [authored rosters](../../src/content/lantern-pass.ts#L12), [attempt roster resolution](../../src/content/progression.ts#L27), [production setup](../../src/main.ts#L199), [rewards](../../src/persistence/save.ts#L220), and [progression tests](../../tests/progression-gates.test.ts#L14).

Keep progression context separate from combat state. Resolve one attempt setup containing roster, upgrade permissions, card, starting resources, lives and rules. Both game and utility should use this resolver; the utility can then display explicit overrides for replay, future unlocks or a custom starting formation without writing player saves. Current card filtering and roster resolution are separate operations; consolidating them prevents an editor from reporting tools differently from gameplay. Omitting `unlockedUpgrades` currently permits every upgrade, whereas production explicitly supplies its earned list. Overrides must be explicit. Assist currently means +70 starting gold and 20 rather than 12 hearts; it is not a complete difficulty model. See [defaults](../../src/sim/game.ts#L46) and [card filtering](../../src/content/progression.ts#L18).

## Recommended bounded interface and workflow

Introduce three shared seams: `resolveContent(base, variant)`, `compileWaveSchedule(wave)`, and `resolveAttempt(content, progression, overrides)`. Pass the immutable resolved snapshot into `Game`. Keep visual editing, draft storage, automated policies and reports outside runtime content/rules.

Use schema-versioned declarative content with stable map/wave/group IDs. Display wave numbers, but use IDs for saved references and agent commands so insertion does not silently retarget an experiment. Preserve readable repeated packets through a small explicit repeat-pattern structure that compiles into today's `LevelDef`; avoid an arbitrary scripting language. Store named variants as explicit overrides with a base revision, then show their resolved values and diff. A named difficulty can alter counts, rests, ability duty cycles and resources independently; global health scaling alone cannot express the designer's pacing intent. Difficulty variants are proposals until their actual values are approved; preserve the existing assist baseline during extraction.

The first utility should list maps/waves, show a schedule and effective settings, clone a draft, run the actual game against that draft, compare results, and export/promote a validated reviewable change into the single canonical content source. Promotion must reject stale base revisions and produce an ordinary source-control diff. Run configuration and strategy logs should include content hash, seed, starting setup and fixed step so agents can reproduce them.

Existing strategy tests are scripted spending policies on fixed build sites; they provide reproducible checkpoints but do not search for a goal or establish child comprehension. Reuse those policies first as named baselines, then add bounded search that submits legal commands and evaluates survive-wave/map/no-leak goals. Report failed searches as “no solution found within this budget,” not “impossible.” See [strategy implementation](../../tests/the-last-lantern-strategy.test.ts#L46). Human play remains the authority for feel and difficulty; automated evidence is a comparison instrument.
