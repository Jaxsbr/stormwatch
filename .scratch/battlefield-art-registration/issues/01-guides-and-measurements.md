# 01 — Export route guides and measure actual scenery

Status: ready-for-agent
Type: task
Delivery: deferred follow-up

Implement phase 1 of [the spec](../spec.md): one presentation mapping, a dimensioned
guide from resolved authored content, and a bitmap/route comparison surface with
independently measured native-image anchors and displacement reports.

Record stable route/mouth identities, source dimensions, import transform, asset
hash and layout fingerprint. Separate simulation endpoints from painting-boundary
intersections. Use current images to demonstrate the mismatch; do not repaint or
change gameplay. Protect the evidence with deliberately misregistered/stale cases.

Acceptance: guide and real Battlefield overlay agree; measured openings can fail
independently of transform arithmetic; missing/stale anchors are reported; existing
frame, picking and simulation behavior remain intact. Required checks/both builds
pass. Record the architecture seam and before/after measurement. This tooling can
ship as a standalone PR without activating new scenery.
