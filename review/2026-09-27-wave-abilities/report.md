# Shared wave abilities

Implemented per-wave Rat shield/Weasel evade switches and shared timing inputs.
Owner-selected defaults: Rat shield 3s active/5s exposed; Weasel evade 2s active/3s
exposed. The same Promote action writes selected map/wave plus changed defaults.
Existing spawn edits and draft patterns are preserved.

Checks: typecheck, formatting, game/workbench builds and production boundary pass.
All 258 tests pass with the migrated committed baseline. With the owner's current
spawn edits, 257/258 pass; the pre-existing first-wave count/gap expectation still
assumes 20 rats at 3s. No spawn edits were reverted to satisfy that test.

Five new focused tests cover uniform cycles, off mechanics/presentation, repeated
groups, draft migration, shared promotion and conflicts, and invalid settings.
The goal-evaluator test now guarantees its intended leak independently of balance.
Last Lantern deterministic golden results were refreshed for the deliberately
changed shield timing: sampled strategies still fail the required boss, with
fewer ordinary leaks. This is recorded evidence, not renewed usability/balance
acceptance.

Browser verification used disposable content: turned off first-wave shields,
changed shared shield timing to 4s, promoted both, switched waves and saw 4s on the
next enabled wave. Zero timing disabled Playtest/Promote. Inspected the control
layout. Opened the existing workbench draft and confirmed migration to requested
3s/5s and 2s/3s defaults while preserving its group pattern. Screenshot included.
