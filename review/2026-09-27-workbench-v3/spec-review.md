# Specification review

Reviewed `ed7f1fc...50d9856` against `.scratch/designer-workbench/v3-spec.md`, the V3 rubric, the V2 report and both V3 critiques. Source inspection; I did not rerun browser workflows or repository checks.

## Finding

**[P1, fixed in follow-up] Undo during a drag could make the displayed recipe differ from Save & play.** The rubric requires “cancellation leaves recipe intact; visual and expert edits cannot silently overwrite each other; Save & play uses current recipe.” `src/workbench/wave-canvas.ts:600–603` calls `history()` even when a gesture is active. Initial reproduction: committed count A→B; begin preview from B; Cmd/Ctrl+Z then Escape. Undo wrote A to JSON, while cancellation restored B only to the canvas. Save & play collected A.

**[P2, fixed in final delta] Empty default formation created false unsaved setup.** The final delta derives dirty state by serialized setup comparison, but initial `scenario` omits `formation` while `readScenario()` always adds `formation: []`. Exact undo therefore remained falsely unsaved. This conflicted with the retained honest save-state/recoverability criterion. Final source verification confirms normalized empty formation/overrides and canonical identity comparison remove the false difference. Unchanged numeric controls now retain omitted optional defaults through `data-original`.

## Coverage

Canvas, enemy imagery, compact picker, contextual controls, linked repeats, ordered schedule, trailing-spacing geometry and keyboard/step alternatives are present. Pure edits preserve authored identity and validate through the existing compiler/scheduler; add/reorder/delete remain bounded authoring operations rather than new scheduling semantics. Valid expert edits enter visual history; invalid expert input pauses the canvas. Normal save/play remounts preserve history and selection when the recipe matches. Independent critiques and matched desktop captures are recorded.

No canonical balance change, new scheduling rule, asset spending or external publication was found. Owner first-use acceptance remains expressly unverified. Browser verification must establish narrow/touch, keyboard, cancellation and recovery behavior; model tests cannot establish gesture integrity.

## Follow-up verification

The working-tree fix cancels the active candidate before `history(event.shiftKey)`. Source tracing confirms both undo and redo now snapshot the accepted original, not the preview; `onChange` synchronizes the resulting history entry to JSON. Later Escape only clears selection, and pointer release cannot recommit the discarded candidate because `gesture` is null. Empty history also leaves the restored original intact. No extra source change was necessary. This is source verification, not browser proof.

Final delta audit also confirms explicit discard/revision loads clear cached histories, expert edits remain undoable, repeat rest targets its actual interval, and strips extend through the last arrival while preserving the timing cursor. No other confirmed issue was found.
