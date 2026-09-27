# 022 — Task-first designer workbench and reliable edit/play loop

## Context

The owner's first visual reaction rejected the workbench's dense text, similarly
weighted panels, version-management terminology and lack of a clear first action.
Independent Astra and Claude Opus 5.5 reviews agreed. They also identified that
pending form edits could be ignored by Play or lost during whole-page rendering.
A tuning interface must make the tested configuration trustworthy.

## Decision

Organize the existing capabilities into Tune, Test and Experiments. Open on the
first encounter's first wave with a short choose/edit/play introduction, common
numeric controls and one primary Save & play action. Create named local drafts as
part of saving, rather than requiring a separate fork ceremony before editing.
Keep detailed timing, global catalogs, JSON, experiment setup and promotion under
explicit disclosures. Give navigation, editable controls, preview and outcomes
separate visual hierarchy.

Preserve pending editor state across workspace navigation. Context replacement
requires saving or explicitly discarding pending changes. Validate and save current
inputs before a new manual or automated test. Keep invalid values visible with
nearby feedback. Show outcome summaries and tested-setting provenance before raw
evidence. Keep the canonical source, simulation and production separation intact.

## Consequences

The ordinary first task needs fewer concepts. Expert capabilities remain available,
but require deliberate navigation. A saved draft is still a snapshot, and a running
attempt still cannot be mutated. This iteration changes the presentation and edit
workflow, without campaign tuning, new rules, assets, services or deployment.
Expert reviews and browser checks provide evidence for this iteration; the owner
must still judge whether the resulting tool is inviting and usable for their work.

## Verification

The fixed criteria, independent critiques, matched captures, interaction checks
and limitations are retained in the [V2 review](../../review/2026-09-27-workbench-v2/report.md).
