# 04: drafts and promotion

Status: resolved
Type: task
Blocked by: 01

Specification: [designer workbench](../spec.md).

## Scope and acceptance

Independent revision/scenario/result storage; validated export/import; visible storage failures; local promotion preview/apply with stale-baseline rejection, scoped canonical-only writes and tested identity equivalence. Disposable workspace promotion tests.

Follow the applicable implementation and testing decisions in the spec. No campaign retuning, profile writes, publishing or new assets.

## Comments

- Implementation task graph synthesized from the authorized specification.

- Implemented namespaced revision/evidence persistence with honest in-memory failure status, validated export/import and explicit authored-scope promotion preview and atomic apply. Disposable-workspace tests cover stale/error preservation. Scenario payloads, legal formations, traces and complete reports are validated against their referenced revision; effective identities and stable references must agree. Catalog/rule-only promotion checks all affected encounters under the same declared setup. Integrated implementation `191a5ad` and hardening `88b9123`.
