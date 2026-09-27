# Workbench V2: independent post-edit critique

Reviewed `after-fresh-desktop.png`, `after-fresh-narrow.png`, and the current workbench controller and stylesheet. This is expert inspection of the revised first-use experience, not owner acceptance, a usability study, or verification of every browser interaction. I contributed controller changes earlier in this iteration; this review is a separate critical pass, not an independent author claim.

## Verdict

The desktop redesign substantially addresses the original rejection. The first screen now explains the task, exposes four understandable controls, and shows one prominent Save & play action. White editing space, a quiet navigation column, a dark graphical preview, and different heading/body typography create a hierarchy that V1 lacked. Version machinery and JSON no longer demand attention before the first edit. The default wave is appropriately simple. The remaining interface is recognizable as a tuning tool rather than a configuration dump.

I would put this desktop version in front of the owner for an observed first task. I would not yet claim that the owner finds it intuitive, or that the narrow layout achieves the same ease.

## Highest-impact remaining issues

### 1. Active test setup can still be hidden while tuning

**Observation:** Tune's primary action uses the current scenario. Returning from Test clears an alternate difficulty recipe, but retains selected-wave/full-encounter mode, assist difficulty, progression, explicit resources, and formation. These controls and the effective attempt summary live in the hidden Test panel. For example, a custom coins override can take precedence over the starting-crowns value visible in Tune. The normal default also launches a full encounter even if the user has selected a later wave to edit.

**Consequence:** The everyday edit-and-play path can become surprising after advanced setup has been used. The user may think they are testing the visible starting value or immediately playing the selected wave when they are doing something else. This risks reintroducing the trust problem despite correct snapshot saving.

**Recommendation:** Keep a compact test-context line beside Tune's action: “Full encounter · Normal · First arrival,” with an explicit “Custom resources/formation” indicator whenever relevant and a direct Test setup action. Indicate that a full-encounter test starts at wave 1. Show the effective starting crowns if an override shadows the authored input. Do not silently remove a user's intentional setup to make the display simpler.

**Acceptance:** Configure an overridden wallet and isolated-wave test, return to Tune, and ask the user to explain what Save & play will launch. They should be able to answer without opening a hidden panel. Repeat with a later selected wave under the normal full-encounter default.

### 2. Narrow first use still postpones the first meaningful action

**Observation:** The supplied narrow capture shows header, tabs, navigation, introduction, and only the beginning of the crowns fields. Save & play and enemy controls require vertical scrolling. The captured application region also occupies only part of the supplied raster with dark unused space around it, so it should not be used to assert precise text or target sizes at the reported viewport. Source breakpoints stack the preview below editing, which is sensible, but the landscape navigation still consumes width.

**Consequence:** The stronger desktop hierarchy survives, but the narrow first view still does not reveal the complete small task. A new user must discover how far down the action is. The original concern is reduced, not fully resolved for short landscape screens.

**Recommendation:** Treat this as a follow-up layout check rather than compressing every control further. Consider a compact encounter/wave picker and a persistent editing action when the normal action is below the viewport. Capture the actual viewport at native scale, then check the input keyboard state and scroll-to-error behavior.

**Acceptance:** At 844 × 390, the user sees either Save & play or an obvious persistent action while editing, without horizontal scrolling or overlapping content. A native-size capture and an actual interaction check establish target readability. Emulation does not establish physical-device usability or performance.

## Smaller observations

- The timeline now serves as an immediate visual explanation: present species only, legible endpoint, no horizontal scrollbar. Keep detailed spawn/ability tables collapsed.
- “Encounter starting crowns” versus “Wave-end crowns” makes scope more intelligible than a generic money setting. A short explanation on demand would help a novice distinguish starting budget from the reward earned after clearing.
- “More timing options” and “Repeat this sequence” are useful disclosures, although the two summaries still intervene between the four inputs and Save & play. They do not block the current desktop task; avoid adding more default-open content there.
- The first-wave screenshot cannot prove the interface remains manageable on a complex wave. The source displays all enemy groups' common controls. Check the final wave and keep the primary action reachable before judging the whole campaign simple.
- The revised dirty badge, local feedback, retained invalid inputs, explicit form/JSON conflict, and human-readable outcome metrics are the right changes for trust. These need the ongoing functional browser checks; screenshots alone cannot verify them.

## Owner review task

Give one instruction without coaching: “Make the first wave a little less busy, then try your change.” Observe where the owner first clicks, whether they understand count versus spacing, whether they find Save & play, and whether they can tell that their edit was used after returning. Ask about effort and confidence before introducing Test or Experiments. That observation is the next acceptance signal; expert preference for the redesign is not a substitute.

## Final capture addendum

Re-inspected the updated final desktop and narrow captures. The two follow-up presentation issues are addressed:

- Desktop Tune now places “Starts at wave 1 · Normal · First-arrival tools” and a Test setup link immediately above Save & play. The action remains fully visible at 1280 × 720. This makes the default launch scope explicit without expanding specialist controls.
- The final narrow capture is a native-size 844 × 390 view, replacing the earlier scaled artifact. A persistent Save & play action is visible at the bottom. Editing still requires vertical scrolling at this short height, but the primary action no longer has to be discovered farther down the document. The capture does not show horizontal overflow.

The implementation owner additionally reports browser verification that a custom 300-crown wallet is visibly distinguished from a 140-crown authored value and launches with 300 crowns, and that the narrow persistent action launches an attempt. Those interaction results are reported evidence; this final pass inspected captures only. The default captures cannot independently demonstrate the custom-wallet state or behavior while scrolling and typing.

Final expert verdict: the revised first-use presentation is ready for owner review, with no remaining blocker identified in these final captures. Owner acceptance and physical-device usability remain unestablished until observed directly.
