# Woodland capability integration

## Baseline and scope

The isolated integration branch starts from main `98cfea9` and combines poison/immunity (`52553c0`), multiple routes/twin bosses (`b51c534`), and boards/profiles (`8b7fb07`). The assembled capability commit is `9319b74`.

This is an integration baseline for authoring and review. It preserves the existing three-encounter campaign. New encounters, discovery activation, approved scenery and final character presentation remain separate delivery and owner acceptance work.

## Merge resolution

Configuration and simulation retain each capability's independent fields. Workbench controls expose combat settings, shared route layouts and board editing together. Promotion and rebasing retain all three scopes and their conflict checks. Both branches' API regression suites remain intact.

A combined API regression edits board metadata, a shared layout, poison duration/cadence, poison damage and immunity in one restored draft. It checks Playtest versus promoted uncached game reload, preservation of an unrelated live encounter edit, immutable existing attempts, and rejection of a repeated stale promotion.

## Verification

- Type checking passed.
- All 65 test files and 382 tests passed.
- Formatting passed.
- Production and workbench builds passed; production boundary verification passed across 241 files.
- Both builds report the existing large-chunk advisory. No physical-device performance claim is made.

## Outstanding independent review findings

Two reproduced authoring defects in the incoming capabilities remain release blockers: combat rebasing restores unrelated old catalog fields, and an unfinished map on a board blocks an unrelated selected-wave Playtest/promotion. Their owners are preparing focused fixes. This integration baseline does not claim those defects are resolved, and remains off main pending fixes and review of the merge resolution.

## Follow-on checkpoint

At `20524db`, poison fieldwise rebasing (`ab9176a`), selected-wave board projection (`783844d`) and the approved geometry decision (`be072df`) are included. All 387 tests, type checks, formatting and both builds pass. Independent review verified both initial repros are fixed.

A further review repro remains blocking: when a pending draft map and a newly added live map share a board, selected-wave promotion preserves the live recipe, but subsequent draft rebasing drops its membership and fails validation. The board owner is correcting that scope reconciliation. PR17's previous authoring-only update also failed the simulated Last Lantern warm art-readiness threshold (1917 ms against 1773 ms); acceptance is diagnosing the measurement and checking the latest candidate with unchanged thresholds.

These are capability delivery checks. Owner motion/scenery/battlefield gates and full five-encounter acceptance remain pending.
