# 036 — Enemy mechanic lifecycles inside the simulation

## Context

Rat shield and Weasel evasion had focused timing helpers, but `Game` and the
battlefield each evaluated their windows. Evasion was evaluated twice in `Game`
(speed and projectile impact) and once in the renderer (tell); shield was
evaluated once in each. Impact cue cadence and visual state were separate again.
Adding a behavior therefore required its author to synchronize decisions across
simulation and presentation. Existing shared ability authoring and promotion
already have their own contract in ADR 026.

## Decision

Each behavior module owns its tick state and impact decision. `Game.tick`
advances shield and evasion before movement and projectile resolution. The
modules update semantic state on the actor and return movement or impact results;
`Game` applies damage and emits effects and events. The battlefield reads the
actor state and events, with visual animation remaining in the renderer. New
behaviors follow the same lifecycle order described in
`docs/agents/mechanic-lifecycle.md`. This is a concrete pattern, without a
general behavior registry.

## Consequences

The shield and evasion windows each have one simulation evaluator. Rendered
warning, active and guard cues use the state from the tick that governs movement
and impact. The focused modules remain browser-independent. The actor carries a
small derived presentation state (`shieldStrength` and `evasion`) that is reset
with each attempt. Existing content fields, shared ability controls, promotion
and saved data retain their meanings.

## Verification

Before the change, direct window evaluators appeared in three production modules
per behavior: its focused helper, `Game`, and the battlefield. After the change,
only the focused simulation module evaluates the window; `Game` orchestrates it
and the battlefield reads the result. The baseline focused suite passed 25 tests
across shield, evasion and shared ability authoring. A new real-`Game` test checks
live warning and active state, guard state, pause and fresh replay. Full checks,
before/after timing evidence, normal-speed visual review and the throwaway agent
trial are recorded in the PR verification report.
