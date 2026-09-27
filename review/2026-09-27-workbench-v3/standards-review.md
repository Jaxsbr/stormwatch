# Standards review

Reviewed `ed7f1fc...50d9856` against `AGENTS.md`, `docs/SCOPE.md` and `docs/ARCHITECTURE.md`.

## Hard standard breaches

No actionable breaches found. The change stays within the workbench adapter boundary; it does not change simulation rules, canonical recipes, campaign persistence or production entry points. Proposed visual edits clone the authored wave and validate it through the existing compiler, level validator and scheduler before accepting it. Pointer cancellation restores the original wave, and committed history snapshots preserve recipe identities and optional fields. Invalid external editor input is retained while the canvas is disabled. Focused model tests, visual captures, an ADR and verification evidence accompany the change. No private machine paths or access details were found in the added public documentation.

## Heuristic findings

No actionable findings. The gesture-specific mappings repeat some numeric conversions, but the shared `WaveEdit` operation and validation boundary already centralize the consequential semantics; this alone does not justify a refactor finding.

This assessment is a source/documentation review. Recorded check and browser results were inspected, not independently rerun for this axis.

## Final delta audit

Reviewed the working-tree delta after `50d9856`, including current integration code. Drag cancellation before history actions, explicit experiment/discard history boundaries, arrival extents and contextual guidance preserve the workbench/simulation boundary. No additional hard standards breach found.

One actionable integration issue was found and resolved: raw scenario JSON comparisons treated omitted formation and `formation: []` as different, leaving exact Undo falsely unsaved. The final fix normalizes optional empty formation/overrides, compares canonical identities and preserves omitted numeric defaults when their controls are unchanged. The specification reviewer verified the fix by source inspection; the integrating agent verified edit → Undo returns Released settings in the browser.
