# 024 — One working draft and direct local promotion

## Context

The owner approved visual wave shaping but rejected Test/Experiments navigation,
revision management and instruction-heavy promotion. They requested one auto-saved
draft, direct Playtest/Promote actions and creation of maps/waves from existing
layouts. This supersedes the browser workflow portions of decisions 021–023.

## Decision

Keep one browser working draft containing authored content and a comparison base.
Preserve legacy experiments for recovery, importing the latest valid revision's
map/wave work. Remove automated tests, scenario forms, revision selection and
export/promotion instructions from the browser. Keep their agent-facing modules
and CLI operations.

Playtest uses the selected wave from the same scoped candidate as Promote.
Promotion writes selected map metadata and one selected wave to the canonical
recipe through a loopback-only workbench endpoint. Validate complete content,
reject selected-scope drift, serialize writes and replace the fixed file atomically.
Retain conflict baselines for pending unrelated scopes. Explicit conflict recovery
keeps the draft and adopts latest comparison content before a new Promote action.

New map drafts copy an existing layout and start with an empty wave. Blank new
waves can persist but cannot run or promote. Canonical recipe order registers
promoted maps in the game and save whitelist; longer campaigns use a scrollable
map-card grid. Existing encounter rewards and gameplay remain unchanged.

## Consequences

The owner can edit, test and save to game config without managing revisions.
Drafts are local to the browser and promotion changes local source files, not a
published deployment. Global tuning and automated analysis remain agent workflows.
New map layouts copy route geometry; new IDs use the existing woodland scenery.
One draft may contain pending edits on multiple maps/waves, promoted individually.

## Verification

Model tests cover blank drafts, scope preservation, insertion, stale conflicts and
conflict-safe rebasing. Middleware tests write disposable files and reject invalid,
unauthenticated and cross-origin requests. Browser checks use a disposable config
for promotion, map/wave creation, layout changes, reload, playtest and input errors.
Campaign tests cover dynamic registration and progress round trips. Required
checks, builds and production isolation are recorded in the iteration evidence.
