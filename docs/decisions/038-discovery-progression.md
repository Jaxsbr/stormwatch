# 038 — One discovery decision for victories and replays

**Status:** implemented; deployment verification follows merge.

## Context

The result screen, save writer and old-save loader each repeated encounter-specific
reward decisions. Replay roster resolution separately checked Turtle. A later
discovery could therefore be shown without being saved, saved without being
shown, or omitted from an earlier encounter replay. Existing local profiles,
legacy progress and first-board rewards must survive this change.

## Decision

Deepen the existing `src/content/progression.ts` module. Its discovery
definitions connect each approved reward to its encounter, result meaning,
legacy derivation rule and optional replay defender. Its victory interface
returns the next stars, unlocks, newly earned result rewards and first-board
completion together. The save adapter validates and stores that outcome; the
result adapter displays it. Profile storage remains separate for each player.

Keep legacy derivation for Squirrel upgrades and Turtle, as previously promised
to players with older saves. Reach and Longer Nets continue to require a
recorded first-board victory or an existing saved entitlement. No new discovery
or product mechanic is introduced.

## Consequences

The result screen no longer decides rewards from encounter IDs. Repeated wins
show no duplicate reward. A replay roster uses the same Turtle discovery rule
as victory and old-save load. Adding a future approved reward has one
progression definition, with focused tests for its profile and replay behavior.
The result renderer still controls card appearance, and persistence still owns
save validation and serialization.

## Verification

The [progression benchmark](../benchmarks/discovery-progression.md) records the
before and after branch count and the repeatable player-flow checks. Focused
tests cover first and repeated victory, legacy reload, a second profile, earlier
encounter replay, result card agreement and first-board rewards. Run
`npm run check`, `npm test`, `npm run build` and formatting checks. No authored
map, wave, ability, content schema or workbench loading contract changes, so
the promotion round trip is unchanged.
