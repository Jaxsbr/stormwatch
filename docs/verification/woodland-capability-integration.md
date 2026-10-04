# Current canonical activation

Owner accepted the complete assembled expansion playthrough on 4 October 2026.
The exact accepted eight-map data is now canonical. Owner artwork, motion, effects
and play-feel gates for this version are closed; physical-device performance is
unverified and painted mouth/route registration and trail spill remain deferred.
See [current activation evidence](../evidence/mosswater-activation.md).

## Historical capability and feedback-stage verification

The held-stage records and then-open gates below are historical provenance.

# Woodland expansion feedback integration

## Scope and merge status

The held integration branch assembles poison/immunity, multiple routes and twin bosses, boards/profiles/discoveries, the approved Twin switchbacks geometry, Skunk runtime presentation, the selected Mossy Poolbanks painting and five authored Mosswater encounters. The approved specification is `.scratch/woodland-expedition-expansion/spec.md`.

Poison PR15 and multiple-route PR18 have independently merged into main with passing CI and deployment checks. Board/profile PR17 merged at `200402c` after exact-head CI and independent Standards/Spec verification of its final authoring fixes. The assembled expansion remains a draft for owner feedback; it does not activate new canonical encounters or imply final visual or balance approval.

## Playable feedback build

Run `npm run feedback:mosswater`. The guide offers Rat crossing, mixed matchups, an earned twin-boss preparation, complete finale and full profile journey. These use the real Game and Battlefield with resolved authored content. Focused entries replay preceding normal-mode wins and public legal purchases; they do not inject currency, health, towers or discoveries.

The candidate contains eight encounters, including the unchanged original three and nineteen new waves. Maps 01/02/05 share the approved crossing layout. Maps 03/04 preserve Rainstone geometry with explicit single-route assignments. The selected wet-mottling painting and Skunk neon flask/soft puffs are included; Boar now uses its approved side resistance torso and motion with the original neutral/legs; directional and battlefield appearance acceptance remain open.

The feedback adapter isolates its candidate content and profile/draft storage. Promotion changes `review/mosswater-encounters/game-content.json`, while normal production and workbench builds retain the accepted three-map canonical campaign. Existing attempts retain their immutable content.

## Verification

The reviewed facing repair `ba5799b` and approved Boar motion `d0e847d` are integrated. The combined build passed type checking, formatting, all 448 tests across 73 files, production build and workbench build. The production boundary check passed across 250 files. Both builds retain the existing large-chunk advisory; no physical-device performance claim is made.

Each new encounter passed edit → draft reload → Playtest → scoped Promote → uncached game reload. Temporary payout edits were restored through promotion, without a JavaScript rebuild. The encounter report records legal campaign traces, all-wave art demand and balance qualifications. The baseline legal strategy wins all eight encounters; this establishes reachability rather than owner-approved difficulty.

Independent review exposed two real-game defects, now corrected: implicit single-route maps accidentally used legacy distance priority, and Skunk presentation could face away from its simulation-selected target. Explicit route authoring and focused replay regressions correct the first. The renderer now queries the same target selection as simulation and uses the actual shot target before locking release; the recorded 504-shot legal replay changes from 80 opposite-facing shots to zero. Both independent review axes report no new findings. Eighteen focused checks and the earned twin-boss browser smoke clear these corrections for bounded owner feedback.

The owner reported side-view enemies moving left while facing right. Four actual Game/Battlefield replays reproduced the shared renderer defect. Route-tangent facing now reflects actor-owned sprite textures/pivots and limb meshes, converts gait displacement into the reflected local space and includes facing in the pool key. Eleven focused rendering regressions cover all enemy roles, turns, pause, reduced motion, source texture isolation, pooling and disposal. A retained combined regression exercises a real Skunk hit against a left-moving Boar, the reflected immunity torso, paused cue, return to neutral after 600 ms and reuse without a stale brace. Independent Standards and Spec review reported no blocking findings on either contribution. The facing repair merged independently as PR20 at `9e0b65a` after both exact-head CI checks passed; main workflow `37162460066` verifies successful build and deployment. The combined expansion remains held.

Board authoring retains unrelated live edits and pending board intent through scoped promotion, JSON reload and repeated rebase. The final `0846765` fix preserves marker coordinates with their authored illustration rather than silently transferring or dropping them, and retains valid dependency snapshots when a pending travel-order edit conflicts with live board removal. Stale promotion guards remain in place. Independent review reproduced the original marker and ordered-board cases, repeated serialized rebase, concurrent encounter deletion and API refusal without writes; all pass. The reviewed capability merged independently into main.

Thirty-nine generated-art catalogue ideas verify, including rejected variants; runtime assets and provenance are committed. Diagnostic captures are classified separately. Browser verification of the initial combined fixture covered the earned twin-boss formation, combat feedback, pause, retry, inspection and candidate-only promotion. Server logs included ResizeObserver notifications during workbench transitions and an existing public-art path notice without visible malfunction; this is not a claim of silent logs.

## Owner and release gates

Owner feedback remains required for board markers/navigation, painting clearance with the full HUD and crowds, Skunk battlefield effects, Boar directional variants/battlefield appearance and final encounter balance. Full-profile progression, all-map briefings/crowds and phone/tablet touch review remain release checks.

The parent coordinates canonical activation only after the standalone capability review and owner gates close. Feedback readiness does not authorize merging the held art/campaign assembly into main.

## Prepared board-review entries

The feedback guide provides completed-first-board and all-maps review launchers. Each earns its entry through normal won Game attempts and the existing victory/profile interfaces, writes only the feedback profile namespace and retains existing players. Repeat launch resumes its review profile and last-viewed board. Browser verification confirms the real title → Play → first-board forward arrow → Mosswater → previous-board arrow, current board persistence after reload, every new map selectable in the all-maps profile and normal Boar briefing entry. Two focused tests protect ordinary player/settings preservation, earned gates, persistent board selection and ordinary replay resources. Check, formatting, all 435 tests, production build/boundary and workbench build pass. Production gameplay and canonical content are unchanged.

Owner feedback requested a longer Boar brace. The feedback candidate now holds it for 600 ms, twice the initial study duration. Focused boundaries retain the pose at 300/599 ms and return to neutral at 600 ms; the combined real leftward Game/Battlefield replay verifies continued brace after 300 ms, paused cue and neutral pooled reuse. The owner approved the longer 600 ms hold in the Boar motion chat. Directional and overall battlefield appearance gates remain open; no new art or simulation changes are included.

The owner also reported viewport-dependent battlefield distortion. The shared renderer now fits one fixed 16:9 canvas inside its host; the authored painting, routes, actors, effects, projection and picking retain one coordinate system. The full painting and upper actor headroom remain visible, with gutters where needed. Picking rejects gutters before defender silhouette selection. The feedback fixture now pauses waves and shows rotation guidance in portrait, matching the real game. Thirteen real-renderer regressions cover registration, visible painting corners, projection/picking and non-interactive gutters. Independent Standards and Spec review found no blockers. The full 448-test suite, checks, formatting and both builds pass. Browser viewport checks cover phone 844×390, tablet 1024×768, desktop 1280×720, portrait 390×844/768×1024 and a narrow 420×720 panel. Parent verification on the running feedback build confirms settled tablet and phone canvases remain 16:9, the page does not scroll, portrait guidance appears, and waves start normally after returning to landscape. These checks use viewport emulation. Standalone PR21 merged at `1df4c97` after 425 main tests, both independent reviews and exact-head CI passed. The first art check had a warm-render outlier; one unchanged rerun passed, with no gate changes. Main workflow `37172754555` completed build and deployment successfully; the deployed title loads without browser errors and serves the corrected canvas layout.

## Deferred scenery registration

The owner’s marked playtest capture shows that the painted entrance/exit openings remain offset from the trail, and trail continuations extend beyond the painting. The fixed-frame tests establish transform consistency and viewport behavior; they do not measure landmarks in the delivered bitmap. On 4 October 2026 the owner allowed this reported mismatch to remain while the current expansion proceeds, provided it is captured. The orchestrator selected that deferral. The [registration follow-up spec](../../.scratch/battlefield-art-registration/spec.md) and its three implementation/design issues require generation guides, independently measured image landmarks, asset/layout pairing validation and matching visual edge handling. This narrow exception removes that item as a current expansion blocker; it does not close other artwork, motion, effects, balance, profile or touch gates. No routes, balance, assets or runtime behavior changed in this documentation update.
