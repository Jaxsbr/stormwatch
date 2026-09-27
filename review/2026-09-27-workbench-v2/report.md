# Designer workbench V2 — first-use improvement

The owner rejected V1 after opening it: excessive text and boxes, weak visual
hierarchy, unfamiliar terminology and no clear first task. This round implements
a task-first edit/play loop and fixes the associated pending-edit problems.
Owner acceptance of V2 remains unverified.

## Independent review and synthesis

- [Astra review](astra-review.md), using the requested `gpt-6-astra` reviewer.
- [Claude Opus 5.5 review](opus-review.md), using the installed Claude Code
  reviewer with the explicitly selected `claude-opus-5-5` model.
- [Astra follow-up and final addendum](astra-v2-review.md).

Both initial reviewers identified the same highest-impact problems: version
management displaced the first edit/play task, and typed edits could be ignored
by Play or discarded by rendering. Their critique covered screenshots and source;
it was not a novice usability study. The implemented synthesis is Tune / Test /
Experiments, a first-wave default, four common numeric inputs, automatic local
saving before Play, live validated preview, explicit save/discard navigation,
retained invalid inputs, and readable results before technical evidence.

This follows the principles of [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
and [visible system status and recognition over recall](https://www.nngroup.com/articles/ten-usability-heuristics/).
Advanced capabilities remain available through deliberate disclosures. A warm
neutral editing surface, forest navigation/header, teal primary action, amber
save state and distinct result treatment replace the similarly weighted dark cards.

The follow-up reviewer found that custom test setups could still shadow visible
Tune values and that short landscape screens hid the action. The final version
shows test scope, difficulty, discovery preset and any custom wallet/hearts/formation
beside Play. Short landscape screens have a persistent Save & play action. The
final addendum identifies no remaining visual blocker in the supplied captures;
that is expert judgment, not the owner's acceptance.

## Evidence and reproducibility

Baseline source: `8c8d029`; working tree was clean before the round. The existing
browser session had saved experiments; a reload established the fresh opening
state without deleting those experiments. Capture tool: Codex in-app browser;
static editor views, fixed viewport overrides. No running simulation or animation
appears in the matched opening pair. Screenshots are verification evidence, not
new game artwork; existing runtime artwork and fonts were reused.

| View | Before | After |
| --- | --- | --- |
| Desktop opening, 1280 × 720 | [V1](before-fresh-desktop.png) | [V2](after-fresh-desktop.png) |
| Narrow opening | [V1 raw capture](before-fresh-narrow.png) | [V2, 844 × 390](after-fresh-narrow.png) |

The desktop pair has identical raster dimensions. The raw earlier narrow capture
is 693 × 390 despite the requested viewport override, so it is not a matched
narrow comparison. The final narrow capture is verified at 844 × 390 and its
persistent action was actually used to enter an attempt. No physical-device or
mobile performance claim follows from viewport emulation.

Additional evidence: [invalid input](after-invalid.png),
[navigation guard](after-navigation-guard.png),
[edited real attempt](after-edited-attempt.png), and
[readable comparison](after-comparison.png). These captures record intermediate
verified states; the final opening captures include the subsequent setup summary
and short-landscape action refinements.

## Fixed criteria outcomes

Criteria were recorded in [rubric.json](rubric.json) before evaluating the edit.

| Criterion | Outcome and evidence | Confidence |
| --- | --- | --- |
| First task | Desktop shows selected first wave, short introduction, four common inputs and one primary Save & play without scrolling. | High, screenshot and clicks |
| Progressive disclosure | No default JSON; timing, catalogs, custom setup, automated tests and experiment history are deliberately expandable. Existing actions and control identities remain reachable. | High, source and browser |
| Hierarchy | Navigation, editable surface, preview and primary action are distinct. Timeline fits and shows only present enemy kinds. Independent final critique finds no opening-view blocker. | Medium, expert judgment |
| Edit integrity | Actual attempt launched with 140 edited starting crowns; count 24 updated preview to 69.70s. Invalid count -1 retained inputs and focused the invalid field. Panel switching retained values; wave switching offered save/discard/keep editing. | High, actual interaction |
| Feedback | Summaries show target outcome, hearts, crowns, time and current/earlier settings. One-second unsuccessful search reports its bounded failure; comparison reports outcomes and rejected commands before raw evidence. | High, actual interaction |
| Responsive | Final desktop and 844 × 390 view checked; no horizontal page scrolling required. Persistent narrow action launched a real attempt. Essential buttons retain 44 CSS px minimums. | High for emulation; physical use unassessed |
| Regression | Check, formatting, 223 tests, production build/artifact boundary and workbench build pass. Canonical content and simulation rules are unchanged. | High, automated checks |

Further interaction checks confirmed that comparison/search retain the selected
one-second limit and one-plan budget across renders, and retain opened test
sections. A custom 300-crown isolated-wave setup is visibly disclosed in Tune
while the authored starting value remains 140; Play then launches with 300 crowns
and one wave. Old results are labeled as earlier settings after edits. Keyboard
Tab/Enter work through native controls; workspace tabs also support arrow keys,
Home and End. Validation feedback includes field descriptions and visible focus.

## Checks and boundaries

- `npm run check`: pass.
- `npm test`: 223 tests / 40 files pass, including existing draft/scenario/run tests.
- `npm run format:check`: pass.
- `npm run build`: pass; production boundary verified across 220 files.
- `npm run build:workbench`: pass.

The existing large-bundle advisory remains. These are existing rule/adapter tests;
no new simulation rule was introduced. The redesigned DOM interactions were
verified in the browser rather than claimed to be covered by the unit suite.
No campaign tuning, new artwork, asset spending, service, deployment or remote
publication occurred. Drafts remain separate from game profiles, and attempts
retain immutable configurations. Invalid advanced JSON blocks atomic saving with
an explicit editor error and preserves all input; partial saves are not implicit.

Keep this iteration for owner review. Its remaining limits are actual ease of
learning, complex-wave comfort, audible quality and physical-device behavior.
The final-wave editor still has several groups, so detailed tuning requires
scrolling; that is disclosed complexity rather than a claim that all waves have
four fields. The next owner task is deliberately small: reduce the first wave's
count, choose Save & play, and return. **Does that loop now feel inviting and
trustworthy enough to use for your own tuning?**
