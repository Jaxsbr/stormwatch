# 032 — Explicit workbench promotion scope

## Context

The single Promote label implied that all auto-saved draft edits would enter the
game, although only the selected wave, its map settings and shared ability changes
were written. Editing several waves could leave unnoticed pending work.

## Decision

Offer Promote wave and Promote all changes. Explain both scopes beside the
controls, and show when other draft changes remain after a scoped promotion.
All promotion merges changed map metadata, individual waves and shared abilities
against fresh canonical content. It preserves unedited disk scopes and rejects
conflicts before one atomic write. Empty draft waves cannot enter the game.
Catalog and rule promotion remains in the agent workflow.

## Consequences

Designers can accept a selected wave or the entire working draft explicitly.
Reloading the game remains necessary; existing attempts retain their snapshot.
Promotion does not build, commit or deploy.

## Verification

API regression coverage promotes multiple waves and map settings, reads the result
through the runtime content middleware, preserves unrelated disk edits, and
checks atomic rejection when any edited wave conflicts. Existing scoped promotion
coverage remains in place. Offscreen workbench rendering verifies both labels
and the remaining-changes status; see the runtime motion evidence.
