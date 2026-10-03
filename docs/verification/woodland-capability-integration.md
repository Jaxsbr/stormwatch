# Woodland expansion feedback integration

## Scope and merge status

The held integration branch assembles poison/immunity, multiple routes and twin bosses, boards/profiles/discoveries, the approved Twin switchbacks geometry, Skunk runtime presentation, the selected Mossy Poolbanks painting and five authored Mosswater encounters. The approved specification is `.scratch/woodland-expedition-expansion/spec.md`.

Poison PR15 and multiple-route PR18 have independently merged into main with passing CI and deployment checks. Board/profile PR17 remains subject to independent review of its final authoring fixes. The assembled expansion remains a draft for owner feedback; it does not activate new canonical encounters or imply final visual or balance approval.

## Playable feedback build

Run `npm run feedback:mosswater`. The guide offers Rat crossing, mixed matchups, an earned twin-boss preparation, complete finale and full profile journey. These use the real Game and Battlefield with resolved authored content. Focused entries replay preceding normal-mode wins and public legal purchases; they do not inject currency, health, towers or discoveries.

The candidate contains eight encounters, including the unchanged original three and nineteen new waves. Maps 01/02/05 share the approved crossing layout. Maps 03/04 preserve Rainstone geometry with explicit single-route assignments. The selected wet-mottling painting and Skunk neon flask/soft puffs are included; original Boar art supports functional feedback while its motion study awaits owner approval.

The feedback adapter isolates its candidate content and profile/draft storage. Promotion changes `review/mosswater-encounters/game-content.json`, while normal production and workbench builds retain the accepted three-map canonical campaign. Existing attempts retain their immutable content.

## Verification

The assembled functional head `442b793` passed type checking, formatting, all 418 tests across 69 files, production build and workbench build. The production boundary check passed across 247 files. Both builds retain the existing large-chunk advisory; no physical-device performance claim is made.

Each new encounter passed edit → draft reload → Playtest → scoped Promote → uncached game reload. Temporary payout edits were restored through promotion, without a JavaScript rebuild. The encounter report records legal campaign traces, all-wave art demand and balance qualifications. The baseline legal strategy wins all eight encounters; this establishes reachability rather than owner-approved difficulty.

Independent review exposed two real-game defects, now corrected: implicit single-route maps accidentally used legacy distance priority, and Skunk presentation could face away from its simulation-selected target. Explicit route authoring and focused replay regressions correct the first. The renderer now queries the same target selection as simulation and uses the actual shot target before locking release; the recorded 504-shot legal replay changes from 80 opposite-facing shots to zero. Independent feedback verification reviews these corrections before the owner handoff.

Board authoring retains unrelated live edits and pending board intent through scoped promotion, JSON reload and repeated rebase. The final `0846765` fix preserves marker coordinates with their authored illustration rather than silently transferring or dropping them, and retains valid dependency snapshots when a pending travel-order edit conflicts with live board removal. Stale promotion guards remain in place. These exact review repros require independent confirmation before standalone PR17 merges.

Thirty generated-art catalogue ideas verify, including rejected variants; runtime assets and provenance are committed. Diagnostic captures are classified separately. Browser verification of the initial combined fixture covered the earned twin-boss formation, combat feedback, pause, retry, inspection and candidate-only promotion. Server logs included ResizeObserver notifications during workbench transitions and an existing public-art path notice without visible malfunction; this is not a claim of silent logs.

## Owner and release gates

Owner feedback remains required for board markers/navigation, painting clearance with the full HUD and crowds, Skunk battlefield effects, Boar motion/directional variants/battlefield appearance and final encounter balance. Full-profile progression, all-map briefings/crowds and phone/tablet touch review remain release checks.

The parent coordinates canonical activation only after the standalone capability review and owner gates close. Feedback readiness does not authorize merging the held art/campaign assembly into main.
