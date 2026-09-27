I've finished reading the files. Here is the review.

# Stormwatch Workbench V3: adversarial design review of visual-first wave authoring

**Reviewer model:** Claude Opus 5.5 (`claude-opus-5-5`), running in Claude Code
**Date:** 2026-09-27 · **Baseline:** `codex/designer-workbench` @ `ed7f1fc`, clean
**Read:** the V2 `report.md`, `astra-review.md`, `opus-review.md`, `astra-v2-review.md`, `rubric.json` and `after-fresh-desktop.png`; `src/workbench/main.ts`, `src/workbench/style.css`, `src/config/configuration.ts`, `src/sim/spawn-schedule.ts`, `src/sim/types.ts` and `src/content/recipes.json`.
**Method:** I read the source and one screenshot. I didn't run the app, edit any files or observe a user. Findings marked *(code reading)* are unconfirmed.

---

## 1. Verdict on the direction

The owner's direction is right, and it fits what they said. After V2, the only part they called useful was the preview. In the V2 capture, the preview gets about 400px on the right while forms fill the centre. V3 should swap them: **the preview becomes the editor**, and the forms shrink to a small inspector for whatever is selected.

The direction carries three risks. Each one repeats an earlier failure in a new form:

| Earlier failure | How it could come back in V3 |
|---|---|
| V1: no visible first task; every capability shown at once | Gestures you can't see. Handles and drag behaviour are invisible until someone finds them, so a canvas can end up with *less* guidance than a form. |
| V2: the edit you see isn't the edit you test (DOM state, silent loss, form/JSON conflict) | A third editor (canvas, inspector, JSON) and a third source of truth. V2 still reads edits back from the DOM (`collectEdits`, `main.ts:743`) and redraws everything with `root.innerHTML` (`main.ts:385`). A drag in progress can't survive that. |
| V2 still "needs geek-level focus" | Precise dragging is also geek work. If the canvas asks people to place things to 0.05s, it has only moved the number fields. |

There is also a risk that is new to V3. **Direct manipulation implies a model the data doesn't have.** "Nodes whose size and placement represent cycles" suggests free placement on a timeline. The data doesn't work that way. The schedule is a single cursor that only moves forward (`spawn-schedule.ts:17–41`). A group's start depends on everything before it. The comment at `spawn-schedule.ts:8` rules out overlap: *"Overlapping batch/group tails are invalid, never sorted."* An honest canvas has to show that model. It must not pretend otherwise.

---

## 2. The two friction points to fix first

### Friction 1: the canvas has to draw the sequential model exactly and limit gestures to it

**What the code does:**
- A group starts at `cursor + delayBefore`. After **every** batch, including the last, the cursor moves on by `gap` (`spawn-schedule.ts:40`). So each group has a **trailing gap** that silently adds to the silence before the next group. On screen, the space between two groups is the previous group's trailing gap plus the next group's wait. It can never be smaller than the trailing gap.
- Within a batch, enemy *i* spawns at `at + i·batchStagger`. Spawn times must never decrease (`spawn-schedule.ts:24`), which gives two limits:
  - Within a group: `(batchSize−1)·stagger ≤ gap`.
  - At a group boundary: `(k−1)·stagger ≤ gap + next.delayBefore`, where *k* is the size of the last batch (it can be a partial batch). This means **changing the next group's wait can make the previous group's stagger invalid.** A single-batch group can stagger past its own `gap` if the next group's wait makes room.
- Packet repeats are expanded at compile time. Each group's id becomes `${packet}/${r+1}/${group}`. For every repeat after the first, `repeatDelayBefore` is added to the first group's wait (`configuration.ts:81–89`). Repeats are therefore **linked copies** of one pattern. No field describes a single repeat on its own.
- Most shipped waves are **unrolled by hand**. Rainstone waves 1–4 are single packets with 10 to 36 groups (wave 2 is 36 groups of `count: 1` alternating rat and weasel). The Last Lantern waves 1–5 use `repeat`. A canvas will show Rainstone as 36 separate nodes, not "a pattern ×18", unless it does something about it.

**What goes wrong if this is ignored:** Suppose someone drags a node left and it springs back to the previous group's trailing gap with no explanation. Or they drag one node and six others move. Or they edit the third repeat and all three change. The canvas then feels broken in the same way V2's stale Play felt broken. Trust goes first, and it takes the tool with it.

**Required principle:** **Draw the layout from the output of `compileSpawnSchedule`, and never recompute timing on its own.** Every drawn enemy is a `ScheduledSpawn`. The parts of its compiled `groupId` (`packet/instance/group`) map it back to the pattern group and the repeat instance. What's drawn is what spawns.

### Friction 2: one working model, one undo stack, and exact save/play

**What the code does:**
- The working edits live in DOM inputs. `updatePreview` rebuilds the content from the DOM on every keystroke (`main.ts:419–428`, `850–883`).
- Packet fields are addressed by array position (`packets.${p}.groups.${g}`, `main.ts:246`). That breaks as soon as groups can be reordered or inserted.
- The JSON editor and the form fields compete, and the result is an error state (`main.ts:786–793`).
- **Existing defect that can hang the tab *(code reading)*:** `validateContent` never range-checks `count`, `gap`, `batchSize`, `batchStagger` or `movementScale` (`configuration.ts:191–220`). The V2 form only rejects values below 0 (`main.ts:773`). If someone types `0` into "Enemies per batch", `compileSpawnSchedule` loops forever on `n += 0` (`spawn-schedule.ts:21`), and this runs from the preview on every keystroke. A fractional `batchSize` compiles, but spawns the wrong number of enemies. An imported experiments file may reach the same path. A batch-size drag handle makes this easier to hit. **This must be fixed in the validator before V3, whatever the UI does.**

**What goes wrong if this is ignored:** Gestures need state that lasts between pointer events, previews that aren't yet committed, and undo. None of these can live in a DOM that gets rebuilt. If V3 is built on top of V2's architecture, it will bring back silent loss and a mismatch between what's shown and what's played.

---

## 3. Proposed V3 layout and interaction grammar (bounded)

### 3.1 Vocabulary: each visual property means exactly one thing

| Owner's term | Data | Visual encoding |
|---|---|---|
| Cycle | packet with `repeat > 1` | A **Sequence bracket** above its groups, with a `×N` badge |
| Mini-cycle | one repeat instance | **Echo**: repeats 2..N drawn lighter, linked to the pattern |
| Group | a `WaveGroupDef` | A **node** on one track, with the enemy sprite on its head |
| Batch | `batchSize` | A **column**: enemies stacked vertically |
| Stagger | `batchStagger` | The column's **slant**, shown at true scale in the detail strip |
| Spacing | `gap` | The distance between columns, plus a hatched **trailing tail** |
| Wait | `delayBefore` | An open **spacer** before the node, labelled "wait 4s" |

- **Width is always time. Height is always batch size. Icon and colour are always enemy kind.** Nothing encodes "difficulty".
- Use **one track, not one row per kind.** Groups never overlap, so a single track reads as the sequence it is. This replaces V2's rows by kind (`main.ts:208–231`).
- For hand-unrolled waves, detect repeats of *(kind, count, gap, batch, stagger, wait)* **for display only** and draw a dashed "repeats ×18 (not linked)" hint. Don't change the content.

### 3.2 Desktop layout (1280×720)

```
┌ Stormwatch workbench · Lantern Pass › The first guard ▾ · [Saved locally] · ↶ Undo: count 8→10 · ↷ · [Save & play] ┐
│ Wave: start 100 crowns · wave-end 25 crowns ✎        Starts at wave 1 · Normal · First-arrival tools · Test setup  │
├ WAVE STRIP (full width, ~240px) ───────────────────────────────────────── [Fit] [−] [+] ┤
│ 0s ┊──────────────────────────────────────────────────────────────────────────── 57.7s │
│    ┌ Sequence ×3 ───────────────┐┊rest 3s┊┌ echo 2 ┐┊┌ echo 3 ┐                        │
│    [🐀 🐀 🐀 🐀 🐀 🐀]▨▨·wait 4s·[🦡🦡🦡🦡]▨  ...                                           │
├ DETAIL STRIP (only when a node is selected; one batch ≥120px wide) ─────────────────┤
│   🐀        🐀        🐀        handles: ◀wait▶  ↔spacing  ↕per batch  ⤢stagger  ▶|enemies│
│  🐀        🐀        🐀                                                             │
├ INSPECTOR (selected group, ≤5 fields) ──────────┬ LAST PLAYTEST ─────────────────────┤
│ 🐀 Rat raider · 6 enemies, pairs, every 2.0s    │ Target reached · 2 hearts lost …   │
│ Enemies [6] Spacing [2.0] Per batch [2]         │ CURRENT SETTINGS / EARLIER SETTINGS│
│ Stagger [0.3] Wait before [0]  ▸ Speed & guard  │                                    │
│ In "Sequence ×3": edits apply to all 3 repeats  │                                    │
└─────────────────────────────────────────────────┴────────────────────────────────────┘
```

- **Move the wave register into the header dropdown.** Horizontal space is time resolution, and the 218px left column (`style.css:50`) takes it away.
- Starting crowns and wave-end crowns become one row of chips that open a small popover.
- Health and reward multipliers, lesson notes, JSON editors, the catalog/rules and the effective-settings table stay under the existing disclosures. Test and Experiments don't change.
- **No numeric inputs are visible until something is selected.**

**844×390:** The strip fills the width at about 150px tall. The detail strip and inspector open as a bottom sheet on selection. Keep V2's persistent Save & play bar (`style.css:724–746`). When zoomed in, the strip scrolls horizontally *inside its own container*. That is the only place horizontal scrolling is intended.

### 3.3 Gesture grammar

**The rule is "select, then shape."** A tap or click selects. Handles appear only on the selected node. A drag starts only on a node that's already selected, after 4px of movement (6px for touch). This keeps casual scrolling from editing anything. Every handle is also a focusable ARIA `slider` with the same label as its inspector field.

| # | Gesture (selected node) | Field | Clamp (visual floor/ceiling, never an error) | Keyboard (handle focused) |
|---|---|---|---|---|
| G1 | Drag node body ←→ | `delayBefore` | `≥ max(0, (k_prev−1)·s_prev − gap_prev)`; everything after moves too, with ghosts at the old positions and a "later groups +2.0s" label | ←/→ ±0.05s; PgUp/PgDn ±0.5s; Home = floor |
| G2 | Drag the right-end handle | `count` | Whole number ≥1; one enemy per snap step; a partial last batch is drawn partial | ←/→ ±1 |
| G3 | Drag the spacing handle (between columns 1 and 2, or on the tail for a single batch) | `gap` | `≥ (batchSize−1)·stagger`; snaps to 0.05s | ←/→ ±0.05s |
| G4 | Drag the stack handle ↕ (top of the first column) | `batchSize` | Whole number 1..count, and `(size−1)·stagger ≤ gap` | ↑/↓ ±1 |
| G5 | Drag the top enemy of batch 1 sideways (detail strip) | `batchStagger` | `0 ≤ s ≤ gap/(size−1)`, plus the boundary limit | ←/→ ±0.05s |
| G6 | Drag the right edge of the `×N` badge | `packet.repeat` | Whole number ≥1 | ←/→ ±1 |
| G7 | Drag the rest spacer between echoes | `repeatDelayBefore` | ≥0, plus the boundary stagger limit | ←/→ ±0.05s |

- Snap stored values to a 0.05s grid (`Math.round(x*20)/20`) so the JSON doesn't fill up with float noise. Every shipped value (0.15, 0.45, 2.55, 9.25 …) is on that grid.
- Spawns actually happen on 1/30s ticks. The tooltip shows the tick; the stored value stays nominal.
- When a clamp is hit, the handle stops at a visible limit line and shows why, for example "Can't be earlier: the previous rats are still arriving." A gesture can never produce an invalid model.
- Guard and evade cycles and movement speed stay inspector-only for V3, as a small up/down bar under "Speed & guard". They aren't placement concepts.

### 3.4 Selection, and editing a group vs a repeated instance

- Selection is `{packetId, groupId, instance?}`, keyed by **id, not position**. It survives redraws, Play-and-return, and undo (undo also restores selection).
- **Clicking an echo selects the pattern group** and highlights that group in every echo. The inspector heading says: *"Group in Sequence ×3: edits apply to all 3 repeats."* Echo bodies can't be dragged. Only the rest spacer (G7) and the badge (G6) can.
- **Changing one repeat on its own isn't supported in V3.** The inspector says so plainly. The only way to do it is an explicit **Unroll sequence** command (V3b, §3.7). I'm not adding new semantics for it.
- ←/→ on the strip moves selection between groups in schedule order (with Home/End). Esc cancels an active drag, or clears the selection if there isn't one. There's no multi-select in V3.

### 3.5 Pointer, touch and keyboard

- Use Pointer Events with `setPointerCapture`, and track only one pointer per gesture.
  - `pointercancel` puts the model back and creates no undo entry.
  - The strip uses `touch-action: pan-y` so vertical page scroll still works. Only the ↕ handle uses `touch-action: none`.
- Hit areas are at least 44×44 CSS px, even when the visible handle is smaller. Zoom uses the Fit/−/+ buttons, **not a custom pinch**, so browser zoom stays available.
- The strip is a composite widget with a roving tabindex:
  - Tab enters on the selected node, Enter opens the inspector, and Tab from the node reaches its sliders.
  - Each node's accessible name is its sentence, for example "Group 3 of 7, Fleet weasel, 7 enemies, one every 0.2s, starts at 12.4s".
  - Committed edits are announced through an `aria-live="polite"` toast.
- Draw sprites from the existing runtime atlas (`EnemyDef.sprite` 4–7, `recipes.json:1841–1868`). This introduces no new artwork.
  - Level of detail: use full sprites when spawns are at least 20px apart; otherwise use kind-coloured pips, with one sprite on the node head.
  - Keep the kind colours from `main.ts:202–207` on the node outline so kinds can still be told apart at small sizes.

### 3.6 Undo, save and play integrity

1. **One model:** `working: AuthoringContent`. The canvas, inspector, change list and JSON are all *views* of it.
   - Edits are pure commands, `applyEdit(content, edit) → content`, run through `validateContent` plus `compileSpawnSchedule` before they're committed.
   - A drag previews a *candidate* model and commits once, on pointerup.
2. **Undo/redo** (⌘/Ctrl+Z, ⇧⌘Z, plus header buttons that name the next step):
   - One entry per gesture. Typing in a field merges into one entry until the field loses focus.
   - Keep up to 100 entries, spanning all waves. Undoing an edit on another wave switches to that wave with a toast.
   - Save doesn't clear the stack.
   - **Applying JSON is one atomic, undoable command.** That makes the form/JSON conflict (`main.ts:790`) impossible rather than an error.
3. **No more save/discard prompt when switching waves.** Because the draft covers every wave, switching waves loses nothing. Keep the prompt only for loading a revision, returning to the baseline, or opening saved evidence (the existing `navigate`).
4. **Save & play** does four things, in order:
   - Finish any active gesture.
   - Commit the focused field, or stop and focus it if it's invalid.
   - `saveRevision(working)`.
   - Launch *that* clone.

   The attempt label shows the change count and a short `configurationIdentity`. The existing identity comparison in `resultSummary` (`main.ts:349–354`) then labels results correctly even after an undo, and undoing back to the tested state correctly shows "current" again.
5. **No full redraw while a gesture is active.** The strip is its own component and redraws from the model. It must never be destroyed by `root.innerHTML`.
6. **Harden the validator** (independent of V3): `count` must be a whole number ≥1; `batchSize` a whole number ≥1 when present; `gap` and `batchStagger` finite and ≥0; `movementScale` > 0; shield cycles > 0.

### 3.7 Scope: in, deferred, and refused

- **V3 (bounded):** strip, detail strip, inspector, G1–G7, undo/redo, keyboard sliders, atlas icons, fit/zoom, echoes, display-only repeat hints, compact wave picker, the model and command refactor, and the validator fix.
- **V3b (only after the owner accepts V3):**
  - Insert a group from a palette of the four kinds, duplicate, delete and reorder. None of these may delete the only boss in a wave with `requiresBossDefeat`.
  - **Fold** hand-unrolled groups into a `repeat`, and **Unroll** a repeat. Both are committed only if the compiled `(at, kind, ordinal)` lists are identical before and after.
  - Warning: both change group ids and therefore the configuration identity.
- **Refused (new semantics):** groups that overlap or run in parallel, placement that ignores ripple, pinning a group while dragging an earlier one, repeats that differ without unrolling, any "difficulty" encoded as size, and automatic difficulty sliders.

---

## 4. Acceptance checks

**Model and integrity (automated, no DOM needed):**
1. The layout is derived only from `compileSpawnSchedule`. For every shipped wave, the drawn enemy count equals the schedule length, and every node's x-position equals its first `at`.
2. Property test: for random G1–G7 sequences, the model always passes `validateContent`, and every stored time is on the 0.05s grid.
3. Doing a gesture and typing the same value into the inspector produce identical `configurationIdentity`.
4. Undo ×N then redo ×N returns the identical identity. `pointercancel` leaves the identity unchanged and adds no undo entry.
5. `batchSize: 0`, fractional `batchSize` and fractional `count` are rejected by `validateContent`, including on import. Nothing hangs.
6. Unrolling and folding keep the compiled `(at, kind, ordinal)` identical (V3b).

**Interaction (in a browser, recorded as interaction evidence rather than screenshots):**
7. Drag a node, then press Save & play. The attempt's identity matches the draft identity shown, and the spawn times match.
8. Drag G1 left past the floor: it stops at the limit line with an explanation. Drag G5 past `gap/(size−1)`: same.
9. In "A Net in the Lanternlight", clicking echo 3 selects the pattern group, highlights all echoes, and the inspector states that edits apply to all 3.
10. Keyboard only: select the 2nd group, add 2s of wait, set pairs with 0.3s stagger, undo once, Save & play, with no pointer used.
11. Touch emulation at 844×390: vertical scroll over the strip never edits anything. Handles are at least 44px. The persistent Save & play still works.
12. At 1280 in Fit view, "The Roadwarden's Column" (41 enemies, including the boss) and Rainstone wave 2 (36 groups) show their first and last spawn without scrolling the page. "The slow pairs" (stagger 0.3) is visibly slanted in the detail strip and distinguishable from stagger 0.
13. With nothing selected, the default view has **no numeric inputs**. With a selection, it has at most 5 fields visible without opening a disclosure. There is exactly one primary action.
14. All V2 rubric criteria still pass, and every existing `data-action` and control `id` is still reachable.

**Owner tasks (observed, not coached):**
- "Make the weasels in 'A Net in the Lanternlight' arrive later."
- "Turn the rats in 'The first guard' into pairs."
- "Make that whole pattern repeat 4 times with a longer rest."
- "Undo the last two changes, play, and tell me what you tested."

Record where they first click, whether they find the handles without the `?` legend, and how confident they feel. **Only this observation settles the "geek-level focus" complaint.**

---

## 5. Discoverability

- **First time a node is selected:** show a one-time coach mark, "Click a group, then drag its handles to shape it".
- **First three selections:** handles show short labels ("wait", "spacing", "per batch", "stagger", "enemies"). After that, labels appear only on hover or focus.
- Handles get cursor feedback (`ew-resize` / `ns-resize`). A `?` legend shows the vocabulary table from §3.1.
- Every committed gesture shows a toast, for example "Fleet weasel wait 4.0 → 6.0s · Undo". It confirms the edit and teaches that undo exists.
- The node's sentence and the inspector field labels use the same words as the handles, so the gesture and its number reinforce each other.

## 6. Honest limits

- **The strip shows release rhythm at the arrival gate, not pressure.** Travel speed, `movementScale`, guard/evade and boss rally decide when enemies reach the defenders. Label the axis that way, and don't imply that a bigger block means harder.
- Tick quantisation (1/30s) means differences smaller than a tick don't show up in play.
- Hand-unrolled waves stay unlinked until someone explicitly folds them (V3b). The repeat hint is only a hint.
- Repeats can't differ from each other without unrolling. Groups can't run in parallel. Either would need new gameplay rules.
- Precise values still need the inspector. Gestures give rough shape; numbers give exact values.
- A screen reader gets an approximate version of the spatial editor. The node sentences and sliders are the equivalent path, not a like-for-like one.
- I haven't checked whether the atlas sprites are recognisable at 24–32px, how the strip performs with about 100 nodes on a physical device, or whether the owner likes any of this.
- This is an expert review by the same model family as one of the V2 reviewers. It isn't a usability study, and none of the proposals have been built or run.

**Recommended order:**
1. Fix the validator hang.
2. Refactor to the model, commands and undo (§3.6).
3. Build the strip and inspector with G1–G7, rendered from `compileSpawnSchedule`.
4. Add icons, coach marks and the narrow layout.
5. Run the owner tasks.
6. Only then consider V3b.

This review is inline only: plan mode was on and there's no file-write tool here, so nothing was saved to `review/`.