# 01: configuration and parity

Status: resolved
Type: task
Blocked by: none

Specification: [designer workbench](../spec.md).

## Scope and acceptance

Canonical schema-versioned serializable recipes, stable IDs, repeated packets, validation, shared schedule, immutable per-attempt catalogs/rules. Preserve current outcomes and inject effective settings into simulation/presentation. Focused parity and isolation tests.

Follow the applicable implementation and testing decisions in the spec. No campaign retuning, profile writes, publishing or new assets.

## Comments

- Implementation task graph synthesized from the authorized specification.

- Implemented in `47cef27`: canonical versioned recipes and stable packet identities, immutable attempt catalogs/rules, shared authored-order scheduling and effective simulation/presentation settings. Reviewed shared modules for browser/utility boundary preservation. Integrated check, 198 tests, production build and 220-file artifact boundary pass; existing strategy outcomes remain covered.
