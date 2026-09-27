# Visual wave authoring — iteration 3

## Outcome and review synthesis

The owner accepted V2 as clearer than V1 but still rejected its form-first approach. Their new direction is a visual tool that generates configuration through manipulation of enemy groups, batches and cycles. The fixed baseline is `ed7f1fc`; the criteria were recorded before implementation in `rubric.json`.

Independent GPT-6 Astra and Claude Opus 5.5 critiques incorporated the previous rounds and this feedback. Both recommended promoting the timeline into the editor, using existing enemy imagery, showing linked repeats and limiting forms to contextual precision. Their central caution was that a free-looking canvas must not promise independently positioned or overlapping groups: the game has one ordered schedule. The synthesis preserves species rows as guides and connects their timing strips in actual arrival order. Moving a group adds a preceding wait and shifts later arrivals. Linked copies highlight together and disclose their edit scope.

The reviews differed on some gesture details and on track layout. We use a separate count handle, a duration/spacing handle and a detailed batch view, with explicit step alternatives. Timing strips are separate from minimum-sized portrait targets; a short group is not silently stretched to match its hit target. Existing hand-unrolled patterns remain separate authored groups. No automatic retuning, configuration compaction, independent tracks, new artwork or canonical gameplay edits were introduced.

Opus raised a possible zero-batch scheduling hang. Source verification showed that `validateContent` calls the existing `validateLevel` before `compileSpawnSchedule`; it already rejects zero/fractional batch sizes and counts. That finding was not reproduced, and no speculative simulation change was made.

## Implementation

- `wave-graph.ts` is an immutable authoring model using the existing recipe compiler, level validator and spawn scheduler. It keeps group identity, partial batches, linked repeats and final batch spacing explicit.
- `wave-canvas.ts` is the browser adapter. It supports pointer placement, timing extent, count, batch size, uniform stagger, repeat count and extra rest. Accepted drags create one undo transaction. Escape/pointer cancellation restores the source; invalid endpoints restore it too. Undo/redo, zoom and selection survive save/play remounts.
- Enemy-image palettes insert groups and sequences; explicit ordering actions preserve source identities. Precise timing and ordering controls are disclosed locally. Technical configuration stays available below the canvas. Valid recipe edits refresh the canvas and are undoable; invalid external input is retained and pauses visual editing to prevent stale overwrites.
- The shell has a compact encounter/wave picker, visible test setup and one primary Save & play action. Test and experiment capabilities remain available. Unused enemy rows disappear, and the timeline has intentional internal zoom/scroll.

## Verification

Browser interaction evidence includes body dragging (first-group wait 0 → 3.1s), timing-extent dragging (gap 3 → 2.8025s), count dragging (20 → 23), and three undos returning the exact original group with absent optional timing fields still absent. Selecting pairs and dragging the final enemy set uniform stagger to 0.6s. Save & play launched the draft, returning retained the exact recipe and enabled undo, and the report marked it as the current saved settings.

Selecting the third Weasel copy in A Net in the Lanternlight highlighted all three source-linked groups and disclosed all three repeats. Dragging the repeat handle changed 3 → 4 and drew four copies. Dragging extra repeat rest from 3 → 4s left the first copy unchanged and shifted later copies by 1s and 2s; Undo restored the source and Released settings status. Keyboard wait editing retained focus and updated all linked copies.

Direct batch size, uniform stagger and next-batch spacing edits compiled immediately. An invalid stagger endpoint restored the source without adding history. Enemy palettes added a group and a separate sequence; Undo restored the original. Invalid expert batch size zero retained and focused the input, blocked Play and disabled the stale canvas. Corrected expert JSON refreshed the canvas and could be undone. Save & play also worked at 844×390; the page had no horizontal overflow and handles measured 44 pixels. This is viewport verification, not physical touch-device testing.

Final specification and standards reviews found two integration issues: history during an active drag could desynchronize the recipe, and equivalent optional defaults could falsely mark an exact Undo as unsaved. Both were corrected and source-reviewed. Active-drag keyboard cancellation is verified by source tracing, not a held-pointer browser test. The final browser check confirmed edit → Undo restores Released settings without adding optional numeric defaults.

The focused model suite covers shared spawn records, additive repeat rests and final spacing, immutable edits/rejections, partial batches, simultaneous versus invalid nonmonotonic transitions, stable insert/reorder identities and every canonical wave. Final checks pass: all 235 tests in 41 files, type checking, formatting, production build and workbench build. Production isolation is verified across 220 files. The existing large-bundle advisory remains.

| Criterion | Evidence and remaining uncertainty |
| --- | --- |
| Visual primary | Matched captures show editable enemy-image timeline before disclosed forms. Owner first-use response pending. |
| Direct manipulation | Browser drag workflows change wait, count, spacing, batches, stagger, repeats and rest. |
| Hierarchy and scope | Selected shared copies highlight; contextual batch view and all-repeat scope appear. |
| Semantic truth | Canonical schedule equivalence tests, partial batches, trailing gaps and invalid transition rejection pass. |
| Recoverability | Browser Undo, expert recovery and save/play return pass; active cancellation/history source-reviewed. |
| Accessibility | Keyboard edits, scoped step alternatives, focus recovery, 44px handles and landscape layout checked. Physical touch and assistive-technology acceptance pending. |
| Prior criteria | Primary action, visible test setup, hidden default JSON, feedback and production isolation retained. |

## Captures and provenance

All PNGs in this directory are browser captures of the local workbench, generated during this iteration. They are review evidence, not runtime artwork. `before-desktop.png` and `after-desktop.png` show the released first-wave view at 1280×720. `before-complex.png` and `after-complex.png` show Fleetwater Finale at the same viewport and scroll position. `after-selected.png` shows linked Weasel groups and rest handles; `after-landscape.png` shows the 844×390 layout; `after-error.png` shows retained invalid expert input. Existing enemy body assets retain their original provenance; none were generated or altered for this UI.

## Limits and acceptance

### Timing snapping follow-up

The owner confirmed the reported continuous stream came from leaving no wait between groups. No Save & play defect was established, and no attempt handoff change was made. Their subsequent request adds 0.05-second timing snapping and zoom-dependent thin grid lines. Group start and extent drags now align absolute timing positions, while local batch spacing/stagger and repeat rest retain 0.05-second value snapping. Counts retain integer snapping. Minor lines remain at least 8 pixels apart and labels at least 60 pixels apart; higher zoom reveals 0.05-second subdivisions. The local batch view also has timing lines.

Browser checks on the owner's saved escalating groups verified wait 2 → 2.2s from a body drag and extent 10.7 → 10.95s from a handle drag. Undo restored the saved recipe after each. Zoom revealed 0.05-second grid lines; Fit restored the whole-wave view. The saved groups and waits were preserved. `snap-grid.png` is a browser capture of that high-zoom verification, not generated runtime art. Final checks pass: 237 tests in 42 files, type checking, formatting, production build, workbench build and production isolation. The existing bundle-size advisory remains.

The canvas shapes release rhythm at the arrival gate, not battlefield pressure or a difficulty score. Travel, guard and evade behavior still affect gameplay and remain accessible through configuration. Groups follow one cursor and cannot be pinned independently. Repeated copies cannot differ individually without an explicit structural rewrite. Undo history is session-local and bounded; it is not persisted across reloads.

Expert critique, automated checks and viewport emulation do not establish owner acceptance or physical-device performance. The owner still needs to try the visual authoring workflow without coaching. No deployment, push or pull request was performed.
