# 033 — Integrate accepted side motions and promoted wave tuning

Date: 29 September 2026. Status: implementation authorized by owner.

## Context

PR 5 preserved accepted Squirrel and Turtle studies but only integrated side-only
facing. Gameplay still used the old motions. The owner requested both accepted
motions, their newly promoted map/wave settings and a PR that can merge after
checks pass.

## Decision

Use the accepted continuous side studies' pose paths and body effort in the real
defender rig. Keep the original generated body/arm art and provenance. Body
movement fades out near the feet; both facings use the same mirrored poses.
Normalize preparation and recovery against the authored attack interval, including
upgrades. Actual simulation shots own release and projectile flight. Turtle's held
rope net and projectile share geometry so the two-handed payload unfolds from the
real hands into a weighted disk. Idle and pause do not run an independent clock.

Ship the owner-promoted canonical recipes with their existing stable identities.
Refresh exact authored-arrival and deterministic strategy expectations to match
that tuning, without changing combat mechanics to make old tests pass.

## Consequences

The game and workbench share these motions. No new generated art or spending is
needed. Turtle's original closed hands and sleeve overlap remain known study
limitations; finished painted rope/open hands would require a separate art pass.
The procedural net is the accepted study implementation, not newly approved art.

Longer authored waits and more finale repeats extend the three recorded Last
Lantern strategies to approximately 8.7–9 minutes before defeat. The balance
harness now allows 900 simulation seconds to observe the complete result instead
of stopping halfway at 500. This records owner-promoted tuning; it does not prove
that the encounter meets the original 5–8 minute target or that it is balanced.

## Verification

Regression tests cover actual rig deformation, planted feet, mirrored geometry
and muzzle, pool reuse, pause, upgraded intervals and net hand-to-projectile shape.
Promotion tests cover draft serialization/reload, Playtest configuration identity,
all-scope write, runtime JSON reload, new maps and atomic conflict rejection.
Rendered evidence is in [runtime motion review](../../review/2026-09-29-runtime-defender-motion/README.md).
Offscreen battlefield checks exercise real simulation shots; no physical mobile
performance or fresh owner battlefield approval is claimed.

Type checking, formatting, all 288 tests, game/workbench builds and the production
artifact boundary pass. Built runtime JSON matches the canonical content exactly.
