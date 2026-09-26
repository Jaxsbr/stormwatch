# 02: production separation

Status: resolved
Type: task
Blocked by: none

Specification: [designer workbench](../spec.md).

## Scope and acceptance

Separate production and workbench/QA entry graphs and outputs. Remove existing production diagnostics and fixture controls. Assert artifact and reachable graph exclusion, preserve Pages subpath. Build checks.

Follow the applicable implementation and testing decisions in the spec. No campaign retuning, profile writes, publishing or new assets.

## Comments

- Implementation task graph synthesized from the authorized specification.

- Implemented in `226d6e7`: separate game/workbench/QA outputs, development-only capture/load controls, compile-time removal of renderer profiling, emitted module-graph exclusion and copied-artifact checks. Production and QA builds pass; 194 tests pass. Relative assets preserve Pages subpaths; integrated browser boot remains part of final verification.
