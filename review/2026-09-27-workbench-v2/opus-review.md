# Stormwatch Designer Workbench: Adversarial First-Use UX Review (V2 input)

**Reviewer model:** Opus 5.5 (`claude-opus-5-5`)
**Date:** 2026-09-27
**Scope:** `src/workbench/main.ts`, `src/workbench/style.css`, `docs/WORKBENCH.md`, `review/2026-09-27-workbench-v2/before-desktop.png`
**Method:** I read the code and the one desktop screenshot (1280×720). I did not run the app, and I edited no files. If a finding comes from reading the code rather than the screenshot, I say so.
**Persona:** Someone who has just opened the workbench. They want to tweak game settings, like making a wave a bit harder or giving more crowns. They won't read documentation or learn a vocabulary first.

---

## 1. Verdict

The workbench is thorough, but it reads as a list of everything it can do rather than a tool for a job. All six sections render at once with equal weight (`main.ts:262`). Nothing tells the user what to do first. The one line of guidance ("Choose a wave, inspect its rhythm, then fork a named draft to edit.") is in the status box at the very bottom of a very long page.

The edit-then-test loop has traps that a first-time user will fall into without noticing:

- Fields are disabled with no explanation.
- The preview doesn't change while you type.
- Several actions silently throw away unsaved edits.
- Results come back as raw JSON.

The visual design makes all of this worse. There is one accent color, 12px muted labels everywhere, and boxes nested inside boxes, so nothing stands out as most important.

None of the capabilities need to go. Most of them should be one layer deeper.

---

## 2. Top two issues

### Issue 1: No introduction, no path, and every option shown at once

**What I observed**
- On first open, the page shows the draft/fork card, the timeline and map, the whole recipe editor, scenario setup, policy tools, and preserve/promote, all at the same visual weight (`main.ts:262`).
- The rough count is about 9 selects, 6 JSON textareas (packets, towers, enemies, rules, overrides, formation), about 15 buttons, and 6–8 number inputs for every enemy group. A late wave with several packets has dozens of fields.
- Every packet `<details>` is rendered `open` (`main.ts:169`), so every group's fields are expanded by default.
- The same help paragraph ("Scope: this wave group. Blank optional fields inherit defaults…") is repeated under every group (`main.ts:172`).
- The header offers a slogan ("Author rhythm. Play the consequence. Keep the choice.") instead of instructions. The status box says "family profiles untouched", which means nothing to a newcomer.
- The only guidance, `.wb-message`, is rendered after every card (`main.ts:262`), below the fold.
- The UI assumes internal vocabulary: *effective attempt, preview origin, named design-only difficulty recipe, discovery capabilities, synthetic setup, reproducible assistance, matched policy, bounded goal search, promotion, packet, preceding silence, batch stagger*.
- The game's own words and the data's words disagree: crowns vs `coins`, hearts vs `lives`, defenders vs `towers`, advantage vs `card`, Guard vs `shieldCycle`. The overrides textarea expects the data words, while the labels use the game words.
- The screenshot shows two contradictory state signals at the top of the page:
  - The badge says **"Draft · Released baseline experiment"**, which claims both draft and released at once. It shows 0 changed paths.
  - The preview says **"named difficulty recipe browser-import-check"**, while the editor says it is editing "Released baseline experiment". So the preview and the editor are showing two different configurations.
- The register shows a stable ID under every wave title (`lantern-pass-wave-1`…). That doubles the text and helps nobody on first use.

**What happens as a result**
The user can't tell which 5% of the page matters for "make this wave harder". They either give up or change the wrong thing. The badge and preview-origin contradictions teach them that the page's own status can't be trusted. That doubt then spreads to every result they see.

**Practical improvements**
1. **First-run welcome panel** (dismissible, and reopenable from a `?` button). It gives three steps (*Pick a wave → Tweak → Try it*) and offers a few starting tasks:
   - "Make a wave harder or easier"
   - "Change starting crowns or hearts"
   - "Play a wave to feel it"
   - "Just look around"
   Each task opens the right view with the relevant control focused.
2. **Task-first layout** (see §4): three views, **Tweak**, **Try** and **Keep**, with Expert sections collapsed inside each one.
3. **Collapse packets by default.** Show each group as one plain sentence, for example "8 × Rat raider, one every 2.0s". Show one **Details** disclosure per group. Show the inheritance help text once, as a tooltip or legend.
4. **One source of truth at the top.** Show a single "Working on" line, for example "Lantern Pass › The first guard · *Your copy* · 2 unsaved changes". If a difficulty candidate is changing the preview, show an explicit chip ("Preview uses: browser-import-check ✕") with a one-click way to clear it.
5. **Use the game's words everywhere.** Show data keys only in Expert and JSON views, with a small glossary (crowns = `coins`, hearts = `lives`, …).
6. **Hide stable IDs by default.** Show them in a tooltip or in Expert.

**Acceptance checks**
- On first open at 1280×720, the visible area has **no more than 12 interactive controls**, **exactly one primary button**, and **no JSON textareas**.
- A new user can start from the welcome panel and change one enemy group's count in **3 clicks or fewer**, without reading `WORKBENCH.md`.
- The badge never shows "Draft" and "Released" at the same time. If the preview configuration differs from the edited one, a visible chip says so.
- No label on the default views uses the words *effective attempt, preview origin, synthetic, promotion, packet* or *policy*. They may appear in Expert.
- Every group help sentence appears at most once per view.

---

### Issue 2: The tweak-and-try loop can't be trusted and gives little feedback

**What I observed**
- **You must fork before editing, and nothing says so.** On the released baseline, every editor input has a bare `disabled` attribute (`main.ts:80`, `165`) with no explanation. The way out is a button called "Fork named draft".
- **The preview doesn't change while you type.** The timeline and map read the saved `content`. Nothing updates until "Validate and save new revision", and every save creates another revision (`main.ts:419–430`). The revision dropdown fills up with labels like "name · revision-muj1cxff-…".
- **Unsaved edits are thrown away silently** (from reading the code). `render()` replaces the whole `innerHTML` (`main.ts:262`). That happens on:
  - wave selection (`main.ts:553`)
  - choosing a saved revision (`main.ts:273`)
  - "Released baseline"
  - **Run policy, Compare and Search**, which call `render()` to show "Running…" *before* reading the editor (`main.ts:678–679`)
  - returning from Play (`main.ts:495`)
  In every case, typed values that weren't saved are lost, and any `<details>` the user opened snaps shut.
- **Play runs the last saved revision, not what's on screen.** `launch()` uses `content` (`main.ts:480–482`). A user who types 12, presses **Play fresh attempt**, and plays gets the old value. Nothing tells them.
- **One bad JSON field blocks everything.** Apply parses the packet, tower, enemy and rule textareas every time (`main.ts:585–624`). A stray comma in the enemy catalog stops a simple crowns change.
- **Edits can conflict silently.** The packet JSON and the packet form fields are both applied, JSON first, then any changed form fields on top (`main.ts:585–608`). If both were edited, the form wins without any notice.
- **Feedback appears in the wrong place and in the wrong form:**
  - Success and error messages go to the bottom of the page, far from the button that was pressed.
  - Compare, Search and Inspect resolved scenario put raw `JSON.stringify` output into the status box (`main.ts:640`, `690`, `703`).
  - The last report is a raw JSON `<pre>`.
  - The list of changed values is a JSON array of paths (`main.ts:262`, "Review changed authored values").
  - There is no plain summary like "Cleared, lost 2 hearts, 1m42s".
- **Saving can create a draft you didn't ask for.** `preserveScenario()` quietly creates a revision named "Released baseline experiment" when none is selected (`main.ts:432`). Exiting Play or running a policy triggers it. This is almost certainly how the screenshot's contradictory badge came about.
- **The timeline, the one visual showing a wave's rhythm, is cut off on desktop.** `.wb-timeline { min-width: 900px }` (`style.css:339`) sits in half of a two-column grid. In the screenshot only 8 of 20 dots are visible, the end-time label is off screen, and there is a horizontal scrollbar.

**What happens as a result**
The user can't tell whether the change they made is the change they're testing. That's the core of what a tuning tool should get right. Once they've lost edits or tested a stale value one time, they stop trusting every result. Raw JSON results mean they can't answer "did it get harder?" without doing the diff in their head.

**Practical improvements**
1. **Automatic working copy.** On the first edit to the released baseline, create an unsaved working copy automatically and show a banner: "You're editing a copy. The real game is unchanged." Keep **Save snapshot…** as an optional, named action instead of a required ritual. Keep Fork as "Save as new snapshot".
2. **Live preview.** Recompute the timeline, map and summary from the edited draft on every `input` event (debounced). Validate each field inline next to it, for example "Count must be ≥ 1". Show changed fields in a "changed" color with the previous value ("was 8").
3. **Edits are never lost silently.**
   - Hold edits in a draft model, not in the DOM.
   - Stop resetting the page wholesale, and remember which `<details>` are open.
   - If an action would discard edits, keep the draft across it or ask "Keep / Discard / Save".
4. **Play and Quick check use what's on screen.** Either play the current draft directly, or save it automatically as a snapshot and say so: "Playing your copy (2 changes)". The in-game label already includes the revision name (`main.ts:498`). Add the change count to it.
5. **Validate each editor separately.** Only parse a JSON editor if its contents actually changed. Show errors next to that editor. If the packet JSON and the form were both edited, block the save and say which one to keep.
6. **Readable results card** after Play, Run, Compare or Search:
   - Outcome (✓/✗)
   - Hearts lost out of the total
   - Crowns left
   - Time
   - How it compares with the released game ("Harder: +2 hearts lost")
   - Caveats in one line ("Bot result, not a human feel test")
   Put the raw JSON under **Details**. Place the card next to the button that produced it, plus a sticky status bar or toast.
7. **Plain change list**, for example "The first guard · Rat raiders: 8 → 12" and "Lantern Pass · Starting crowns: 120 → 150". Each item gets a ↺ revert button.
8. **Fix the timeline sizing.** Give it the full width, or make the SVG fill its container without the 900px minimum. Put the end-time label inside the visible area.

**Acceptance checks**
- On the released baseline, typing in any Tweak field works right away. The banner appears, and the released content (`CANONICAL_CONTENT`) is unchanged.
- Changing a group's count updates the timeline dot count and the "N enemies" summary within about 150ms, with no save.
- Regression test: type a value, then select another wave, run a policy, choose a snapshot, or return from Play. The value is still there, or a confirmation appeared. It is never silently lost.
- Type a value, then press Play. The attempt uses the typed value, which can be checked from the spawn count, and the attempt label shows the change count.
- Put invalid JSON in the enemy editor, then change starting crowns. The crowns change saves, and the enemy editor shows its own inline error.
- After Run, Compare or Search, the visible area shows a results card with outcome, hearts, crowns and time. Raw JSON is visible only after expanding it.
- At 1280px wide, all 20 spawns of "The first guard" and the end-time label are visible without horizontal scrolling.
- No revision is created unless the user saves or explicitly accepts an automatic save, and any automatic save is announced.

---

## 3. Other issues (lower priority)

| # | What I observed | What happens as a result | Improvement | Acceptance check |
|---|---|---|---|---|
| 3 | One accent color (`--wb-accent`) is used for the badge, `h3`, packet summaries, changed cells and primary buttons (`style.css`). Body text is system-ui while headings use the game's serif chrome (screenshot). Labels and help text are 12px muted (`style.css:153`, `292`). | Accent means nothing in particular. Hierarchy is flat. The page looks like one dense block. | Give colors meanings: neutral (released), amber (changed), green (success), red-orange (error), plus per-enemy colors. Use a type scale: display font only for the page title; 15px body; 13px labels in full ink color, not muted. | Changed values, errors and successes can each be told apart by color *and* an icon or text. Labels are at least 13px. |
| 4 | Boxes inside boxes: card, then packet box, then group divider, then 44px inputs in a 4-column grid (`style.css:342–355`). | "Little boxes." Your eye has nowhere to rest. | Show groups as rows in a table, not boxes. Use spacing and section headings instead of borders. Keep 44px touch targets only on primary actions. | At most 2 levels of bordered containers in any view. |
| 5 | Three primary buttons (Fork, Validate & save, Play) compete, and none is the obvious next step. | Unclear what to do next. | Exactly one primary button per view: Tweak → "Try it", Try → "Play" / "Quick check", Keep → "Save snapshot". | One `.primary` button visible per view. |
| 6 | Two separate selectors decide which configuration you see: Saved revision (top) and Named design-only difficulty recipe (scenario section). | You edit A while the preview shows B, as the screenshot shows. | Move the difficulty candidate to Try › Setup (Expert) and show it as a chip wherever it's active. | When a candidate is active, the chip appears next to the preview and on the results card. |
| 7 | Saved trace, saved result and saved scenario are selects labelled with IDs, and choosing one changes the whole workbench at once (`main.ts:304–366`). | You pick something and your context is replaced with no warning. | Add a **History** list in Keep: date, snapshot name, wave, outcome, with *Open* and *Replay* buttons. Warn before replacing unsaved edits. | Each history entry shows a readable label, and opening one with unsaved edits asks first. |
| 8 | Inspect resolved scenario puts a full configuration dump into the status box (`main.ts:640`). | The status box turns into a wall of text. | Show a formatted panel in Expert, reusing `effectiveInspector()`. | The status box never shows more than about 3 lines. |
| 9 | Disabled buttons (Replay, Promotion) give no reason. | Looks broken. | Add inline hint text, for example "Play once to enable replay". | Every disabled control shows why it's disabled. |

---

## 4. Proposed V2 information architecture

```
┌ Top bar ──────────────────────────────────────────────────────────────┐
│ Stormwatch Workbench   Lantern Pass › The first guard ▾               │
│ [Your copy · 2 unsaved changes ●]   [Preview uses: … ✕]   [?] [Try it]│
└───────────────────────────────────────────────────────────────────────┘
┌ Waves ─────┐ ┌ [ Tweak ]  [ Try ]  [ Keep ] ─────────────────────────┐
│ 1 Lantern  │ │                                                        │
│  1 First…  │ │   (active view)                                        │
│  2 Busier… │ │                                                        │
│ 2 Rainst…  │ │                                                        │
│ 3 Last L…  │ └────────────────────────────────────────────────────────┘
└────────────┘  Sticky status/toast strip (feedback next to the action)
```

### Tweak (default view)
- **Wave at a glance:** a full-width timeline using the enemy colors, the map with legend (Arrival, Home, blocked), a one-line summary ("20 Rat raiders over 58s"), and the lesson and intended outcome. Hints below each are editable in place.
- **Quick settings**, always visible, in plain language, each with a "was X" marker:
  - Starting crowns (encounter)
  - Enemy toughness (health multiplier)
  - Reward per kill (reward multiplier)
  - End-of-wave crowns
- **Enemy groups**: one row per group, e.g. `● Rat raider  [8] every [2.0]s  after [0]s pause  ▸ More`
  - *More* opens batch size and stagger, movement speed, and guard or evade cycle, each with its default shown as placeholder text.
  - Packets appear as light group headings ("Repeats 2×, 3s pause before repeat").
- **Expert ▸** (collapsed): packet JSON, catalog and rules JSON (clearly marked as affecting every level), and the effective-settings table (`effectiveInspector()`).

### Try
- **Play this wave** (primary). Defaults: selected wave in isolation, first-arrival tools, Normal. A one-line setup summary (reusing `attemptSummary()`) has an **Edit setup** link.
- **Quick check**: runs the default bot policy on the current draft and the released game with matched settings (`compareScenarios`), then shows the results card.
- **Setup ▸ (Expert)**: attempt scope, progression, difficulty, difficulty candidate, seed, overrides JSON, formation JSON, Save scenario, Inspect resolved scenario.
- **Bot testing ▸ (Expert)**: policy, goal, no-lives-lost, cadence, time limit, budget, Run, Compare, Search. Keep the "a failed search is not proof it's impossible" caveat here.
- **Replay**: Replay last run, with a hint while it's disabled.

### Keep
- **Changes**: plain-sentence list with per-item revert (built on `difference()`).
- **Snapshots**: name, date and change count. Actions: open, save as, go back to the released game.
- **History**: saved scenarios, traces and results as readable rows with Open and Replay.
- **Share and promote ▸**: Export, Import, promotion instructions and the CLI command, with the existing "never commits or publishes" note.

### Levels of disclosure
| Level | Who it's for | What's shown |
|---|---|---|
| L0 | First open | Welcome panel with starting tasks and the three-step loop |
| L1 | Casual tweak | Wave at a glance, quick settings, group rows, Play, Quick check |
| L2 | Tuning | Per-group *More*, setup summary editor, snapshots, changes list |
| L3 | Expert | JSON editors, catalog and rules, overrides and formation, policy parameters, effective table, raw reports, promotion |

The Expert open/closed state is remembered for each browser (in the same namespace as `DraftStore`).

---

## 5. V2 editing and testing loop

1. **Pick** a wave from the register (titles only).
2. **Tweak** a quick setting or group row. A working copy is created automatically, and the timeline and summary update live. Changed fields turn amber with "was X".
3. **Try it.** Either:
   - **Play**: runs the on-screen draft and shows the change count in the attempt label. Exiting returns you to the same spot with a results card, or
   - **Quick check**: a matched bot comparison against the released game, with results inline.
4. **Read** the results card: outcome, hearts, crowns, time, and the difference from the released game. Raw JSON is under Details.
5. **Adjust or revert.** The edits are still there, and each change can be reverted on its own.
6. **Keep.** Save a named snapshot, which the history links to its evidence. Export or promote from Keep.

Rules the loop has to follow:
- What you test is what's on screen, and the page says so.
- No action throws away edits without asking.
- Every action's feedback appears within view of the button pressed.
- The released game stays read-only, and the page makes that clear.

---

## 6. Where every existing capability goes (nothing removed)

| Current control / action (`main.ts`) | V2 location |
|---|---|
| Encounter/wave register (`data-select-level/wave`) | Left register (titles; IDs in tooltip) |
| Draft name + Fork (`fork`) | Keep › Snapshots "Save as…"; working copy is automatic |
| Saved revision select (`#saved-revision`) | Keep › Snapshots |
| Released baseline (`baseline`) | Top bar status menu + Keep › "Back to released game" |
| Timeline, spawn table, map (`timeline()`, `mapPreview()`) | Tweak › Wave at a glance (table under *All spawns ▸*) |
| startCoins / healthScale / enemyRewardScale / reward | Tweak › Quick settings |
| Packet form fields (`data-packet-field`) | Tweak › Group rows + *More* |
| Packet JSON (`#packet-editor`) | Tweak › Expert |
| Lesson / target outcome | Tweak › Wave at a glance (edit in place) |
| Validate and save (`apply`) | Live validation + Keep "Save snapshot" (automatic save before Play announced) |
| Tower / enemy / rule JSON | Tweak › Expert › "Affects every level" |
| Effective settings table (`effectiveInspector()`) | Tweak › Expert and Try › Setup |
| Changed values (`difference()`) | Keep › Changes (plain sentences, JSON under Details) |
| Mode / progression / difficulty / candidate / seed | Try › Setup summary + Setup ▸ |
| Overrides and formation JSON | Try › Setup ▸ |
| Play fresh attempt (`play`) | Try › **Play** (primary) + top bar "Try it" |
| Save scenario / Inspect resolved scenario | Try › Setup ▸ |
| Saved trace / result / scenario selects | Keep › History |
| Replay last commands (`replay`) | Try › Replay + History row action |
| Policy / goal / no-loss / cadence / limit / budget | Try › Bot testing ▸ |
| Run / Compare / Search | Try › Quick check (Compare with defaults) + Bot testing ▸ |
| Last report JSON | Results card › Details |
| Export / Import / Promotion instructions | Keep › Share and promote ▸ |
| Storage status | Top bar status tooltip; a warning only when storage isn't available |

**Acceptance check for this mapping:** a test lists every current `data-action` and control `id` and checks that each one can still be reached in V2. Headless `runs.ts` and `tools/workbench.mjs` behavior is unchanged.

---

## 7. Suggested order of work

1. **Loop fixes first** (Issue 2): draft model held outside the DOM, live preview, Play uses the draft, per-editor validation, feedback next to the action, timeline sizing, no hidden automatic fork. Each of these is small and removes a trust-breaking bug.
2. **Restructure the layout** (Issue 1): Tweak/Try/Keep tabs, Expert sections, collapsed groups, welcome panel, consistent game vocabulary.
3. **Visual pass** (Issues 3–5): colors with meanings, type scale, fewer borders, one primary button per view.
4. **Update `docs/WORKBENCH.md`** to follow the three-step loop, with a Quick start ahead of the reference material.

---

*Limits of this review:* it covers one desktop screenshot and a reading of the code. I didn't check mobile or narrow widths, keyboard or screen-reader flows, or real attempts in play. The findings marked "from reading the code" (silently discarded edits, Play using the stale draft, the hidden automatic fork) should be confirmed by hand before fixing, although the hidden automatic fork matches the badge in the screenshot.
