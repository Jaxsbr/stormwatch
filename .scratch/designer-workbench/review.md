# Designer workbench implementation review

Reviewed changes from `afc5da19c056fa2dfb0026784d37656ddf83a638` through the implemented workbench, with followup fix `3451f8a` integrated as `c319b78`.

## Standards axis

- Encounter-authoring guidance still described editing compatibility TypeScript modules. Fixed the architecture guide to identify the canonical recipe, stable identities, shared validation and deliberate promotion workflow.
- Reporting and runner termination duplicated completion, required-boss and no-lives-lost logic. Both now consume one goal evaluator.
- No private machine/access paths, browser-dependent simulation imports or unsupported asset spending were found in reviewed changes. Tool-enforced formatting/type checks were outside the manual standards axis.

## Specification axis

- Matched comparison now removes a named candidate from the baseline, retains it for the candidate, and replays the baseline trace without adaptive plan execution.
- Effective inspector, timeline and map preview resolve the selected scenario/difficulty recipe rather than displaying an unrelated editor recipe. Origins and effective starting capabilities/resources are visible.
- Isolated-wave selection updates its stable scenario wave identity. Replay actions remain locked until explicit preparation-point takeover; offline inspection rejects invalid campaign numbers.

## Verification

After integration, `npm run check` and all 221 tests across 40 files pass. Root-owned browser visual/journey checks and production boot under the Pages project subpath remain separate handoff evidence. This review does not establish physical-device performance or child suitability.
