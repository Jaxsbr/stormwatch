# Workbench V3: adversarial visual-authoring review

Date: 2026-09-27. Reviewer: Astra. This is an independent source-informed design critique, not a browser interaction test or owner acceptance. Inputs: both V2 initial reviews, the V2 follow-up critique, report and rubric, the current workbench controller and styles, `compileLevel`, and `compileSpawnSchedule`. The owner's latest first-look response supersedes the prior expert judgment that V2 was ready: easier settings management still does not meet the desired way of designing waves. The Rat/Weasel timeline reference is described in the review brief; I have not independently inspected that reference image.

## Verdict and two highest-friction points

**Make the wave itself the editor.** Adding draggable decorations above the existing form would leave the primary problem intact. V2's `packetControls()` still presents repeated numeric fields as the editing surface; `timeline()` produces a small read-only SVG in an aside. On narrower widths the entire preview follows the form. V3 should invert that hierarchy: a large timeline of enemy sequences, selectable groups and visible repetitions, with a small inspector that follows the selection. The user should be able to make a useful edit without opening the inspector.

### 1. Designing still requires translating a picture into settings

The owner thinks in bursts, pauses, size and rhythm. The current interface asks for count, gap, batch size, stagger and repeat settings, then shows the result elsewhere. Even clearer labels cannot remove that translation. Showing every group's fields also gets less useful as waves become more interesting.

Give the owner directly manipulable group nodes. Their width represents elapsed sequence time; their stack height/count badge represents enemy quantity; the spacing of visible arrival marks represents density. Use existing enemy images with readable names, not colored dots alone. Clicking a group opens its batch pattern, where dragging one batch or one within-batch handle changes the repeated timing pattern. Keep exact numbers available alongside those gestures. A circle that can be freely resized with no declared meaning would merely replace obscure numbers with obscure geometry.

**Acceptance:** From fresh opening, the owner can make a Rat group longer without changing its count, add enemies without accidentally changing its spacing, and move a group later while seeing the following arrivals move. Each result is apparent on the timeline before saving. Observe the task without coaching; screenshots are insufficient evidence.

### 2. Free-looking tracks could promise timing the game cannot express

Separate Rat and Weasel rows naturally suggest independent audio-style tracks. The current model has an ordered list, repeated in whole sequences. Moving one Weasel earlier while leaving later Rats in place is not generally representable. Edits to one displayed repeat affect its source and therefore every repeat. Unexplained snapping, hidden sorting, or silently breaking a repeat would be worse than an honest constraint.

Draw one connected sequence above the species guide rows. Show repetitions as linked, faint copies under one enclosing repeat bracket. Use explicit insertion slots to reorder; ordinary horizontal dragging changes a wait and pushes following groups. During a move, show the whole affected tail as a ghost. Say “Following arrivals move with this group.” A selected repeated copy says “Editing all 3 repeats,” and highlights them together. Reject an impossible move with an inline explanation and preserve the last accepted state; never sort arrivals to make it fit.

**Acceptance:** A user can explain which arrivals will change before releasing a drag. A forbidden earlier placement does not reorder, overlap, detach a repeat, or alter unrelated fields. Editing the second visual repeat predictably changes the shared pattern and all its copies.

## A bounded, implementable V3

Keep Tune / Test / Experiments and the verified save/play loop. Replace Tune's two-column form/preview arrangement with a full-width authoring stage. Place compact encounter/wave selection, save state, Undo/Redo and Save & play near the stage. Crowns, encounter modifiers, global settings and existing specialist capabilities remain in clearly scoped disclosures. Avoid another introductory panel above the actual work.

The stage has a seconds ruler, sequence brackets, group nodes containing enemy art, and Rat/Weasel/other present-species guide rows that show the generated arrival marks. Provide Fit wave and zoom controls. The first/last arrival and total count stay visible in a fitted overview; zoomed detail may scroll inside the stage, never the page. Keep the time scale fixed for the duration of a gesture, otherwise the item moves under the pointer as the wave rescales. Dense arrivals may aggregate visually with a count label, with exact positions accessible after zoom/selection.

Use three authored levels only: **sequence → enemy group → batches**. A sequence is the existing repeatable packet, an enemy group is the existing group, and batches are a view of that group's count/batch settings. Do not imply arbitrary nested repeat structures. If someone needs several different mini-cycles, author several sequences. Guard/Evade timing remains a separate “Enemy behaviour” disclosure because it is measured from each enemy's appearance, not the wave clock.

| Manipulation | Visible action and exact meaning | Non-drag alternative |
| --- | --- | --- |
| Add a group | Drag a Rat/Weasel image from a small palette to a marked insertion slot. Insert one valid group with an explicit visible starter pattern; no silent retuning of existing groups. | Select an insertion slot and choose Add Rat/Add Weasel. |
| Move later/earlier | Drag the group's body horizontally to adjust its wait before arrival. Following groups shift; earlier movement stops when no removable wait remains. | Select the node, use Earlier/Later step buttons or edit “Wait before group.” |
| Reorder | Use a distinct grip and insertion marker to move a group within its sequence, or a whole sequence among sequences. Timing drag never reorders. | Move before/Move after buttons. |
| More/fewer enemies | Drag an explicitly labeled quantity handle vertically; snap to whole enemies. Height/stack and count change; spacing stays fixed. The time footprint can grow when another batch is needed. | Visible −/+ count controls and exact count entry. |
| Wider/denser group | Drag the right timing handle; change the time between batch starts while preserving count, batch size and within-batch stagger. Preview labels the new spacing. | “Time between batches” slider/step buttons and exact seconds. For batch size 1, call this “Time between enemies.” |
| Edit a batch pattern | Select the group to expand a short local timeline. Move the second batch-start handle to set spacing for every batch. Move the second enemy's within-batch handle to set equal staggering in every batch. | Selected group inspector with Enemies per batch and Time within a batch. A single batch/enemy still has explicit spacing controls. |
| Repeat a mini-cycle | Drag a repeat handle outward through discrete copy slots; show linked copies and “×3.” Adjust the marked extra-rest handle between copies to add rest before repeats. | Repeat −/+ and exact “Extra wait before each repeat.” |
| Remove/duplicate | Selected node has explicit actions; duplicate creates new authored identity while retaining the pattern. | Same ordinary buttons with focus returned predictably. |

Do not make every individual arrival independently draggable: a single mark is a sample of a shared pattern. On selection, show the handle that changes that pattern and highlight all affected marks. A group with one batch cannot infer its trailing batch spacing from first-to-last enemy duration; show a labeled tail handle instead of dividing by zero or inventing a duration. Deleting the last required group/sequence should explain the minimum-content constraint; do not silently insert replacement content.

For V3, support reordering inside a sequence and reordering whole sequences. Moving an existing group between sequences can remain a deliberate inspector action if implemented with clear consequences for repeats; do not add free cross-container dragging before that interaction is dependable. Resizing a whole sequence should change its repeat count only through the repeat handle. It must not proportionally retune all its internal groups.

## Timing must match the existing compiler

These details are consequential, even if most stay behind the visuals:

- The first nominal arrival starts from 0.7 seconds plus the first group's wait. The graph cannot drag it before that fixed lead-in by creating a negative wait.
- A group's wait is added to the running sequence cursor. Each batch begins at that cursor, its members appear at equal stagger increments, and the cursor advances by `gap` **after every batch, including the final batch**.
- Therefore the node needs to show both the last visible arrival and the point where its sequence cursor advances to the next group. The latter can be drawn as a lightly shaded tail labeled “Spacing before next group.” They are not interchangeable measures of duration.
- A repeat replays the same groups and their waits. Extra repeat rest is added before the first group of repeat two onward, on top of that group's own wait and the preceding group's final batch spacing. Label the handle “Extra wait” and also display the resulting last-arrival-to-next-arrival interval. Calling the underlying field the entire “Rest between cycles” would mislead.
- Authored arrivals must remain nondecreasing. Simultaneous arrivals can be valid; an earlier next arrival is invalid. Validate the complete compiled sequence, including transitions into the next group and the next repeat, rather than using a blanket visual box-overlap rule.
- A final batch may contain fewer enemies. Preserve that partial batch when count changes. Do not round count to full batches.
- Width and position show nominal time; detailed inspection can show actual 30 Hz appearance times. Do not suggest that a more precise pointer position changes the simulation's fixed-step rule.

A useful boundary fixture: count 4, batch size 2, gap 2 seconds, stagger 0.25 seconds, no waits produces arrivals at 0.70, 0.95, 2.70 and 2.95 seconds, with the cursor for the following group at 4.70. If this one-group sequence repeats with 1 second extra wait, its second copy starts at 5.70, a 2.75-second visible arrival-to-arrival rest. This makes incorrect “rest” and node-width implementations easy to detect.

## Input, state and trust

Use pointer capture for direct manipulation. Commit one undoable edit on release, not one per movement event. Escape or pointer cancellation restores the original; releasing outside the stage must not leave a stuck drag. Invalid proposed timing can stay visible as a rejected ghost, with a reason, while the accepted draft remains unchanged. Do not silently clamp a rejected proposal and then claim it was accepted exactly.

Every essential operation must also work through labeled 44 CSS px buttons and native numeric controls. Tab reaches nodes and their actions; Enter selects/opens details; arrow-key timing adjustments apply only in an explicit adjustment state and announce their step; Escape exits. Keep ordinary text-field undo native. App Undo/Redo reverses complete authored actions, including add/remove, repeat and reorder, and restores selection. On touch, tapping selects and exposes handles; scrolling the stage background remains usable. No hover, double-click, tiny dot, right-click, or long-press-only action is essential.

Maintain one working recipe outside the DOM. Derive graph, inspector and advanced JSON from it, with an explicit Apply/Cancel transaction for raw JSON. Do not let a visual drag coexist with an independently dirty stale JSON editor. Source identity is recipe identity, not a coordinate or array index; preserve stable authored IDs on reorder and allocate new IDs for duplicate/add. Repeated appearances refer back to their shared source.

Show “Unsaved changes,” “Saved locally,” last valid preview and tested earlier settings honestly. Save & play must validate and save the exact accepted working recipe, then launch that immutable snapshot. Keep the visible test scope and effective overrides beside Play, including “Starts at wave 1” for full-encounter tests. Returning restores selected node, expanded group and zoom. Saving does not erase undo history; undoing after save correctly marks the result dirty. A new edit after undo clears redo. A saved revision switch needs the existing save/discard guard and a deliberate new history boundary. Storage failure cannot be labeled “Saved locally.”

## Acceptance gate

Retain all V2 rubric categories; adapt “common editable field visible” to “editable timeline node and a discoverable direct manipulation visible.” Do not weaken edit integrity, advanced capability access, responsive targets or runtime isolation to make the new canvas look finished.

1. **First use:** At 1280×720 the graph is the dominant editable surface; at 844×390 a useful selected-wave view and Play remain reachable without horizontal page overflow. Observe the owner making fewer Rats, a later Weasel burst, and a repeated mini-cycle without entering JSON or a full settings form.
2. **Directness:** Verify body drag, quantity resize, spacing resize, repeat handle, local batch timing, reorder, add/remove, cancel and undo/redo. Complete the same essential task by keyboard and tap controls. Verify real pointer/touch event behavior; a screenshot alone does not count.
3. **Exact timing:** Compare generated recipe and shared compiled schedule for single enemies, partial batches, zero stagger, simultaneous arrivals, additional waits, repeat rest and multi-group repeats. Include the numeric fixture above and rejection of nonmonotonic proposals. No sorting or new independent tracks.
4. **Preview/play identity:** After several gestures and one numeric edit, Save & play uses the same count, sequence order, spacing and repetitions. Invalid edits retain feedback without becoming a false current preview. Old results remain labeled earlier settings; scenario overrides stay visible.
5. **Round trip:** Existing complex recipes open without being rewritten merely by viewing, selecting or changing zoom. Save/load and export/import preserve group IDs, order, repeat structure and omitted defaults. A single gesture changes only its declared authored field(s), not global catalogs or canonical content.
6. **Persistence and recovery:** Undo/redo works across save and a return from Play; selection is stable after remove/reorder; guarded revision changes and unavailable storage remain honest. No stale JSON can overwrite a graphical edit.
7. **Visual evidence:** Capture matched first-wave and complex final-wave views at desktop and narrow sizes, selected-node details, drag ghost, invalid proposal, and return-from-play result. Inspect image readability and collapsed repeats. Do not claim physical-device performance from emulation.
8. **Regression:** Run required check/test/build plus the workbench build. Add focused tests for gesture-to-recipe transforms and undo transactions; retain the shared simulation compiler. Exercise existing comparison, search, replay, import/export and promotion access. No campaign tuning, new simulation rule, new artwork spending or public deployment belongs to this pass.

The decisive owner task is: “Build two Rat bursts with a pause, repeat that little pattern three times, then put a Weasel group after it and try the wave.” Success means the owner authors this by manipulating recognizable things, predicts the resulting arrivals, and trusts the played result. A more attractive numeric inspector cannot satisfy that gate by itself.
