# 04: drafts and promotion

Status: implemented
Type: task
Blocked by: 01

Specification: [designer workbench](../spec.md).

## Scope and acceptance

Independent revision/scenario/result storage; validated export/import; visible storage failures; local promotion preview/apply with stale-baseline rejection, scoped canonical-only writes and tested identity equivalence. Disposable workspace promotion tests.

Follow the applicable implementation and testing decisions in the spec. No campaign retuning, profile writes, publishing or new assets.

## Comments

- Implementation task graph synthesized from the authorized specification.

- Implemented namespaced revision/evidence persistence with honest in-memory failure status; complete-content and stable-reference validated export/import; explicit authored-scope promotion preview and local atomic apply. Seven focused persistence/promotion tests include disposable-workspace writes and stale/error preservation. Scenario payload validation is integrated as the scenario contract lands.
