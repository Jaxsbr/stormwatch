# Mosswater encounters: held functional candidate

Status: implementation ready for review; owner play feel and visual acceptance pending.

## Run

`npm ci`, then `npm run feedback:mosswater`.

- Guide: `http://127.0.0.1:4177/review/mosswater-encounters/`
- Rat teaching: `/review/mosswater-encounters/playtest.html?map=mosswater-01`
- Mixed matchups: `/review/mosswater-encounters/playtest.html?map=mosswater-04`
- Earned twin-boss preparation: `/review/mosswater-encounters/playtest.html?map=mosswater-05&finale=1`
- Complete five-wave finale: `/review/mosswater-encounters/playtest.html?map=mosswater-05`
- Full game/profile journey: `/`
- Candidate authoring and promotion: `/workbench.html`

The dedicated local adapter serves `game-content.json` for both the actual game and workbench. Promotion atomically replaces this review folder's candidate file, never `src/content/recipes.json`. Feedback profile/draft storage has its own namespace, preserving previous development data. Stop the server with Ctrl-C. Normal production and workbench builds retain the accepted three-map canonical campaign.

Focused entry replays preceding normal-mode **won Game attempts** at fixed ticks before constructing the chosen encounter. The finale entry also replays public legal purchases through its first four waves, including preparation purchases, and stops before launching wave five. This is accelerated legal entry evidence, not injected health, currency, towers or discoveries. Its preparation holds until Start wave; the full game retains its usual countdown. Manual controls use the same Game/Battlefield and defender selection adapters. Retry reconstructs the immutable candidate and earned entry.

## Candidate and lessons

| ID | Waves | Layout | Opening wallet | Boundary rewards | Lesson |
| --- | --- | --- | ---: | --- | --- |
| mosswater-01 | 3 Rat | twin-switchbacks | 180 | 40 / 45 / 0 | Staged routes become simultaneous; poison passes shields |
| mosswater-02 | 3 Weasel | identical twin-switchbacks | 200 | 45 / 45 / 0 | Both routes from outset; connect splash; evasion avoids application |
| mosswater-03 | 3 Boar | single Rainstone path | 220 | 50 / 50 / 0 | Tough skin permanently prevents poison; direct upgrades and slow |
| mosswater-04 | 5 mixed | single Rainstone path | 240 | 55 / 60 / 65 / 70 / 0 | Rehearse complementary roles with earned upgrades |
| mosswater-05 | 5 all enemies | identical twin-switchbacks | 400 | 100 / 105 / 110 / 115 / 0 | Invest in split-exit nets and upgraded damage; simultaneous twin bosses |

No first-board map, shared enemy HP, boss rage, tower cost or combat constant changed. Enemy rewards remain scaled to 0.4 on new maps. New recipes have stable map/wave/packet/group IDs and authored lessons. The second board is `mosswater-reach`, with the scenery chat's candidate illustration and percentage marker proposal.

Maps 03/04 share the explicit `rainstone-single` layout and stable `rainstone-route` assignment. Path, dimensions and blocked cells are exactly the original Rainstone geometry. Every new map therefore uses remaining-travel-time targeting, including effective net slow; only the original three maps retain legacy distance priority.

The larger final wallet/payouts pay for coverage across distant exits and upgrades before the bosses. A smaller 350-coin opening and 80–95 payouts did not support the recorded mixed line: one boss escaped. Preserving the 2200-HP Roadwardens and boss rules makes spending/coverage the tuning levers. The final policy also needs late coverage near the right exit; resources alone did not fix the first formation. These are reproducible candidate values, not owner-approved final balance.

Discovery definitions activate only with the complete five-ID Mosswater destination: all first-board victories earn Skunk, including legacy completed profiles; victory on 02 earns its upgrade. The existing progression/save interfaces own result rewards, replay roster, board travel and profile validation. Base rosters carry Squirrel/Turtle; earned Skunk is resolved for every new encounter and earlier completed replays. Fresh first-board teaching stays intact.

Boar's briefing explicitly states permanent immunity. In the full game, Menu → Inspect enemies pauses play and explains tough skin, blast damage and net counterplay from the attempt's enemy definitions. The focused fixture exposes the same inspection directly.

## Deterministic evidence

Run `npm run balance:mosswater -- --write` to reproduce `balance-evidence.json` and the complete nineteen-wave `art-demand.json`. Public commands are recorded at fixed ticks; no rejected purchases or state mutations are permitted. All entry entitlements are earned by the preceding recorded wins. The campaign uses no advantage and normal mode, seed 42. The baseline legal policy makes purchases once a second and completes all eight maps.

| Candidate | Lives | Combat seconds | Relevant contrasting result |
| --- | ---: | ---: | --- |
| 01 | 12 | 114.2 | One-lane line loses; direct-only wins with 1 heart |
| 02 | 6 | 95.3 | Direct-only loses; base Skunk-heavy line wins |
| 03 | 12 | 169.9 | Direct upgrades win; Skunk-only loses |
| 04 | 6 | 271.5 | Upgrades-first wins with 12; direct-only wins with 4 |
| 05 | 12 | 182.1 | Mixed/upgrades-first kill both; direct-only and Skunk-only lose |

Combat seconds exclude preparation time and feedback discussion. These few policies demonstrate legal reachability and pressure, not universal difficulty or optimal play. Maps 02/04's six-heart margins and the short final combat duration deserve owner feedback. Skunk-only can currently win map 04 through upgraded blast damage despite immune Boars; immunity is not blast immunity and this remains a deliberate alternative to test with the owner. Its two-placement policy also wins with eight hearts and a large unused wallet, so the mixed rehearsal's pressure remains an owner balance question.

Acceptance review found that omitting explicit routes on 03/04 accidentally selected legacy distance priority. The corrected authored layout changes no geometry, resources, waves or mechanics. Regenerated evidence retains all eight baseline wins; map 04 changes from seven hearts/269.8 seconds to six hearts/271.5 seconds, and its direct-only alternative changes from a loss to a four-heart win. These are observed targeting consequences, not accepted tuning. The regression replays actual legal campaign commands and asserts earliest arrival selection with real Turtle slow on both maps; it reproduces the former 37.3-second versus 20.1-second Boar targeting error before the correction.

## Verification

- Check, 399 tests, format check, production build and workbench build passed. Production boundary excludes utility modules; candidate data is not activated in the normal production build.
- Browser checked the complete edit → draft auto-save → reload → Playtest → scoped Promote → uncached game reload for **each of five maps**. First-wave payouts were temporarily raised by one: 41 / 46 / 51 / 56 / 101 appeared in the reloaded real Game. All were restored through scoped Promote. No JavaScript build occurred during promotion, unrelated first-board recipes remained identical, and unit coverage checks immutable existing attempts.
- After the targeting correction, both 03/04 repeated the complete browser round trip. Their shared layout and enabled remaining-travel-time targeting survived draft reload; promoted Game payouts were 51/56 and restored to 50/55. `route-promoted-game.jpg` captures the corrected mixed-map reload. Exact semantic comparison verifies that only the intended route references/assignments and shared layout differ from the previous candidate; all resources, waves and unrelated maps remain unchanged.
- Every authored wave compiles through the shared spawn schedule. Maps 01/02/05 resolve exactly the same route library entry. Rat wave one stages route B after A; every Weasel wave starts both together. Fifth-wave Roadwardens share one spawn tick and distinct routes; no bosses appear in the first four waves.
- Tests inspect complete all-wave art demand and resolved earned defender rosters, discovery migration, earlier replays, saved board travel, legal winning/losing policies, and Boar briefing/inspection.
- Browser verified the live mixed inspection and held twin-boss formation with both runtime candidates. `promoted-game.jpg` shows the temporary 56 payout after reload; `workbench-promotion.jpg` shows restoration. Diagnostic screenshots are existing renderer output, not generated art ideas.

## Remaining gates

Mosswater complete battlefield clearance/HUD/crowds, board marker/navigation appearance, Skunk real-battlefield effects and Boar motion/directional variants/battlefield appearance await owner approval. All-map briefing/crowd review, full profile journey, phone/tablet touch review and final balance feel remain release acceptance work. Original Boar art is a functional fixture resource. No deployment/main merge occurred; physical mobile performance is unverified.

Parent integrates this contribution with remaining capability/art fixes and owns canonical activation. Copy the accepted candidate into canonical recipes only after its art, progression and owner gates agree; rerun the complete checks and release journey then.

Finale feedback formation: before launching wave five, the legal replay has twelve defenders and 21 coins. Continue buying during combat: the baseline winning policy adds and upgrades a Skunk beside the right exit at cell (10, 4) when earned coins allow. No extra purchases happen automatically in manual feedback playback.

Latest scenery: owner approved wet-mottling painting (art contribution `5574d1c`) replaces the earlier right-edge stripe. The complete HUD/crowd/layout review remains open. Earlier promotion/inspection screenshots establish functional behavior, not approval of this newer painting.
