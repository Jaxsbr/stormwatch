# 026 — Shared ability timing and per-wave switches

## Context

The owner requested predictable Rat shield and Weasel evade behavior rather than
per-group timing variations, specified shield 3s on/5s off and evade 2s on/3s off,
and requested shared timings editable and promotable in the workbench.

## Decision

Canonical content has one `abilityDefaults` object. Each wave carries only
`abilities.ratShield` and `abilities.weaselEvade` booleans. Compilation applies the
shared timing to all matching groups and repeats. Shield off explicitly disables
both simulation guard behavior and its presentation; absence alone cannot disable
the legacy simulation guard default.

The workbench exposes two wave checkboxes and a collapsed Shared ability settings
section with active/exposed durations. Values auto-save in the single draft;
Playtest resolves the same candidate as Promote. Promote atomically saves the
selected map/wave plus changed shared defaults, while preserving unrelated waves
and global catalogs. Concurrent shared edits retain conflict protection. Existing
running game attempts keep their immutable snapshot; game reload loads promotion.

Legacy drafts retain arrival settings, infer evade on from prior use within each
wave, retain Rat shield on, and remove legacy group timing values. Newly created
waves start with shield on and evade off. The low-level simulation still accepts
explicit timing for deterministic fixtures; authored content compilation only
uses shared defaults.

## Consequences

Every enabled wave now shares the same ability behavior. This intentionally
supersedes timing variations in earlier balance decisions. Timing changes affect
all enabled waves, including ones outside the currently selected map. Last Lantern
strategy evidence changes, although the sampled strategies still lose to the
required boss. Balance evidence is refreshed; owner playtesting remains needed.

## Verification

Focused tests cover uniform timing, shield/evade off across repeated groups,
presentation parity, saved-draft migration, global/wave promotion, unchanged
unrelated waves, invalid timing and conflict retention. Browser checks verify
simultaneous global and wave promotion, changed timing on another wave, validation
blocking actions, and existing draft migration. See the iteration report.
