# 03 — Validate pairings and deliver matching routes at scenery edges

Status: ready-for-agent
Type: task
Blocked by: 01
Activation blocked by: 02
Delivery: deferred implementation

Expose scenery/layout registration status in the workbench and preserve the same
mapping in Playtest/runtime. Validate measured pairing metadata against its asset
hash and layout fingerprint. Reject stale/missing new registrations on promotion,
while explicitly retaining legacy content and the current owner exception.

Implement the agreed visual boundary policy so runtime trails do not protrude into
ordinary gutters. Preserve enemy spawn/leak timing, routes, silhouettes, picking
and fixed landscape framing. Any schema fields require draft compatibility and
the complete scoped authoring/loading round trip.

Acceptance: deliberately changed art/layout fails before a write; accepted art
loads after Promote/reload without recompilation; unrelated edits and active
attempts survive; real enemies/placement align in all viewport checks. Required
checks/both builds and independent review pass. Synthesize with approved assets
before campaign activation; verify deployment after the authorized merge.
