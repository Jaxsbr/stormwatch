# 021 — Local designer workbench and canonical attempt configuration

## Context

The designer needs to inspect rhythm, test edits through the actual game, preserve
experiments and choose which authored changes become accepted content. Global
catalog reads and embedded parameters prevent reliable per-attempt experiments;
existing production QA diagnostics also cross the intended release boundary.

## Decision

Keep one serializable canonical authoring source, stable encounter/wave/packet
identities, and readable repeated recipes. Compile schedules once through the
same interpretation for simulation and timeline. Resolve and freeze catalog,
rule and encounter snapshots for each attempt; never mutate a running draft.
Preserve existing normal/assist values and current campaign outcomes.

Build the local workbench as a separate entry/output. It uses the same simulation,
renderer, sound and battle components without campaign profile writes. Scenarios
resolve difficulty candidates, legitimate progression presets and explicit setup
overrides in that order. Record legal commands at fixed ticks instead of copying
incomplete display state. Automated policies/search produce reproducible evidence
with declared limits, not judgements about feel or proof of impossibility.

Store independent experiment revisions/scenarios/traces/results. Validated export
and a local promotion command preview scoped canonical edits, reject stale bases,
and apply atomically. Synthetic setup and automation never implicitly become game
content. No server writer, new mechanics, retuning, assets or deployment is added.

## Consequences

Encounter edits have one source. A draft cannot alter another attempt or either
family profile. Production still contains its necessary gameplay rules/content,
but excludes the editor, fixtures, policies, diagnostic workers and writing code.
Search is bounded and heuristic; real play observations remain necessary for child
comprehension and physical-device claims. Named difficulty candidates remain local
until player-facing selection and progression behavior are separately approved.

## Verification

Existing strategy/rule/progression tests establish extraction parity, including
recorded finale losses. New real-attempt tests cover isolated configurations,
scenario capabilities, legal replay, completion goals, search and comparison.
Disposable-workspace tests cover promotion and error preservation. Graph/artifact
checks establish production separation; browser journey evidence is recorded in
[workbench verification](../evidence/designer-workbench.md).
