# Woodland expedition expansion: Skunk, Iron Boar and a second map board

Status: ready-for-agent
Owner decisions confirmed: 2 October 2026

## Problem Statement

Stormwatch's expedition currently ends after three encounters. The existing Skunk defender and Iron Boar enemy have approved character resources but do not participate in the campaign. Skunk has only instant splash damage, Boar has ordinary armor, and every encounter assumes one route and one exit. Players cannot explore another illustrated board or face the challenge of defending two distant exits.

The expansion also needs the owner's taste throughout production. A finished implementation cannot be accepted solely because its mechanics and builds pass: board illustrations, scenery cohesion, character poses, motion and combat effects require alternatives, iterative refinement and explicit owner approval.

## Solution

Add a second named woodland map board containing five sequential encounters. Completing all three encounters on the existing board discovers Skunk and reveals a forward navigation arrow. Players can travel back, replay encounters with earned defenders, and resume the last viewed board independently for each local profile.

Skunk throws poison bombs with a green gas burst, immediate area damage and poison that sticks to affected enemies. Iron Boar is a durable armored enemy whose tough skin grants permanent poison immunity. Three encounters share one battlefield layout with two fixed crossing routes and widely separated entrances and exits. The final encounter culminates in two Roadwardens, one per exit.

The work is delivered in six bounded phases. Interactive visual sessions precede asset and motion acceptance; the workbench, canonical recipes, simulation, runtime loading and progression remain aligned throughout. This spec authorizes the agreed direction, not unreviewed visual selections or additional asset spending.

## User Stories

1. As a player, I want another board after the current three encounters, so that my expedition continues with new content.
2. As a player, I want every encounter on a board to require victory before onward travel unlocks, so that advancement reflects completing that region.
3. As a player, I want stars to remain optional for advancement, so that mastery goals do not prevent exploration.
4. As a player, I want a forward arrow to appear when the next board unlocks, so that the new destination is discoverable.
5. As a player, I want to choose when to explore the next board, so that a final victory does not unexpectedly move me away.
6. As a player, I want a back arrow on the second board, so that I can return to earlier encounters.
7. As a player, I want my profile to remember my viewed board, so that returning to the game restores my place.
8. As a family member, I want board selection and discoveries to remain separate for each profile, so that another player's progress does not change mine.
9. As an existing player, I want my victories, stars, settings and unlocks preserved, so that the expansion does not erase progress.
10. As an existing player who completed board one, I want Skunk to become available when my profile loads, so that I do not have to repeat the finale to receive the new discovery.
11. As a player, I want boards to have readable place names, so that the expedition has memorable regions.
12. As a player, I want board two to feel like a distinct continuation of the woodland journey, so that its art communicates progress coherently.
13. As a player, I want spatial encounter markers on both illustrated boards, so that I can understand my route through the region.
14. As a touch player, I want markers and navigation arrows to remain easy to tap, so that the new board works on landscape phones and tablets.
15. As a keyboard player, I want accessible names and focus states for board controls, so that I can select destinations reliably.
16. As a player, I want completing board two to celebrate the available expedition and offer replay, so that the current ending feels complete.
17. As a player, I want Skunk discovered after board one, so that I can use the new defender immediately on board two.
18. As a player, I want earned defenders available throughout board two and on earlier replays, so that discoveries expand my choices.
19. As a player, I want the first new encounter to teach Skunk against Rats, so that I understand its crowd-damage role.
20. As a player, I want Skunk bombs to damage enemies near the impact, so that clusters create an opportunity for splash damage.
21. As a player, I want affected enemies to carry visible poison, so that I can track which enemies will keep taking damage.
22. As a player, I want the ground gas burst to dissipate without harming later arrivals, so that the effect accurately describes the rule.
23. As a player, I want repeated poison hits to refresh duration without stacking damage, so that multiple attacks have a predictable outcome.
24. As a player, I want armor and Rat shields to protect against the initial blast without preventing poison, so that defender matchups have meaningful differences.
25. As a player, I want a Weasel that evades at bomb impact to avoid both blast and poison, so that its evasion behaves consistently.
26. As a player, I want attached poison to keep damaging a Weasel during later evasion, so that evasion does not remove an existing effect.
27. As a player, I want Skunk's upgrade discovered after the second new encounter, so that practicing its matchup earns a useful capability.
28. As a player, I want the Skunk upgrade to strengthen blast and poison damage without changing the attack's identity, so that upgrading remains understandable.
29. As a player, I want Skunk's attack to show believable preparation, release and recovery, so that the bomb has visible weight and intent.
30. As a player, I want poison effects to remain legible in crowds, so that gas does not hide enemy states or exits.
31. As a player, I want Iron Boar to resist poison permanently, so that I must invest in direct damage rather than rely entirely on Skunk.
32. As a player, I want Turtle nets to slow Iron Boar, so that slowing creates more time for direct attacks.
33. As a player, I want tough skin explained in briefing and inspection, so that I can plan before discovering immunity in combat.
34. As a player, I want an Immune message when poison fails on Boar, so that the result is clear.
35. As a player, I want Evade and Shield messages for the corresponding enemy outcomes, so that combat feedback uses understandable words.
36. As a player, I want Boar animation and expression variants to preserve its approved identity, so that it feels as polished as the Roadwarden.
37. As a player, I want two fixed routes crossing within one battlefield, so that shared coverage and divided defense compete.
38. As a player, I want widely separated entrances and exits, so that guarding only the intersection is not an automatic solution.
39. As a player, I want enemies to stay on their assigned route, so that crossing traffic is predictable.
40. As a player, I want both exits to use one village-heart pool, so that the encounter has a clear loss condition.
41. As a player, I want defenders to prioritize the enemy closest in travel time to an exit, so that threats on different routes are comparable.
42. As a player, I want route previews to show both entrances and exits, so that I can prepare for divided defense.
43. As a player, I want the first three-wave Rat encounter to build from staggered lane activity to simultaneous pressure, so that I learn the layout gradually.
44. As a player, I want the three-wave Weasel encounter to use both lanes from the outset, so that I practice the learned challenge with evasion.
45. As a player, I want a three-wave single-route Boar encounter, so that I can learn poison immunity without a new layout challenge.
46. As a player, I want a five-wave single-route mixed encounter, so that I rehearse Rat, Weasel and Boar matchups together.
47. As a player, I want the final five-wave encounter to reuse the crossing layout with all enemy types, so that familiar geometry supports the hardest combined challenge.
48. As a player, I want two Roadwardens to arrive together on separate routes in the finale, so that both exits face boss pressure.
49. As a player, I want each boss to rage independently and rally only its own route's escorts, so that the twin-boss rules are readable.
50. As a player, I want victory to require defeating both bosses and clearing the wave, so that the finale cannot be bypassed by letting a boss escape.
51. As the owner, I want three meaningful visual alternatives before selecting a direction, so that taste decisions are informed by comparison.
52. As the owner, I want iterative refinement and explicit approvals for poses, motion and battlefield appearance, so that attractive still images do not substitute for accepted animation.
53. As the owner, I want mirrored playback, slow motion and scrubbing in animation studies, so that I can inspect transitions and give precise feedback.
54. As the owner, I want both boards and all encounter scenery reviewed together, so that selective art improvements produce a coherent expedition.
55. As a designer, I want boards, layouts, route assignments, waves and supported gameplay settings editable where appropriate in the workbench, so that authoring does not depend on hidden runtime constants.
56. As a designer, I want old drafts to migrate without losing edits, so that the expansion preserves existing authoring work.
57. As a designer, I want Playtest and promotion to use the same resolved content, so that what I test is what the game loads.
58. As a designer, I want promoted content to appear after game reload without recompilation, so that tuning remains a direct workflow.
59. As a designer, I want scoped promotion to preserve unrelated edits and reject conflicts, so that adding boards and routes does not corrupt other content.
60. As a maintainer, I want deterministic rule tests, committed runtime assets and provenance, so that the expansion remains reproducible from a clean checkout.

## Implementation Decisions

### Approved content and progression

- Preserve the existing three-encounter first board and its rewards. Add a second board containing exactly five encounters in sequential order.
- Encounter 1: three Rat waves on the shared crossing layout; stagger early lane activity, then apply simultaneous pressure.
- Encounter 2: three Weasel waves on the same crossing layout; both lanes active from the outset.
- Encounter 3: three Iron Boar waves on a single route, without the dual-lane challenge.
- Encounter 4: five mixed Rat, Weasel and Iron Boar waves on a single route.
- Encounter 5: five waves incorporating Rats, Weasels, Iron Boars and Roadwardens on the shared crossing layout; the fifth wave culminates in two simultaneous bosses.
- Completion requires victory on every encounter in a board, not a star threshold. The next encounter remains sequentially unlocked.
- Discover Skunk on first-board completion and derive that entitlement for existing completed profiles. Discover Skunk upgrades after encounter 2 of board two. Preserve the existing progression module as the owner of discovery, victory meaning and replay roster decisions.
- All earned defenders are available throughout board two and on earlier replays. First-board first-attempt teaching rosters remain intact.
- First-board final victory reveals the forward arrow and offers Explore next board. Navigation occurs only when selected. Board two always permits backward travel.
- Persist the last viewed board independently in each profile. Legacy profiles default to board one while retaining all other progress. Validate board identity and safely recover missing, invalid or unavailable destinations.
- Board two ends with a completion celebration and replay options. Do not expose a forward arrow to nonexistent content.

### Skunk combat

- Replace Skunk's current rock presentation with an approved thrown poison bomb. Its impact performs immediate splash damage and applies poison individually to eligible enemies within the area.
- Poison is attached to the affected enemy, not to terrain. The green ground burst is a transient visual and cannot damage later arrivals.
- Reapplication refreshes duration without accumulating poison damage sources. Simultaneous applications must have deterministic outcomes. Different upgraded/unupgraded poison strengths need a documented resolution rule during numerical tuning; the outcome must preserve nonstacking damage and avoid unintended weakening from a weaker hit.
- Armor and Rat shields retain their protection against the blast. Poison application bypasses the shield, and poison ticks bypass armor and shield protection.
- Evaluate Weasel evasion separately for each enemy at area-impact time. Successful evasion avoids both blast damage and poison application. Evasion after application cannot avoid poison ticks.
- Skunk upgrades increase blast and poison damage, preserving radius and duration. Damage, price, attack cadence, poison duration and tick cadence are delegated numerical tuning, subject to play-experience approval.
- Simulation owns application, refresh, ticks, expiry, deaths and observable outcomes. Rendering reads state/events for green bursts and attached effects. Pause freezes both rules and animation; replay starts fresh.

### Iron Boar and feedback

- Iron Boar is tanky, retains ordinary armor, and has permanent poison immunity explained as tough skin. It has no charge, timed vulnerability or armor-breaking mechanic in this scope.
- Poison immunity does not grant splash-damage immunity. Normal blast damage still follows armor rules; direct attacks remain effective. Turtle slow applies normally.
- Rejected poison produces Immune feedback and no attached gas effect. Weasel evasion produces Evade; Rat shield outcomes produce Shield. Feedback follows actual simulation outcomes, with bounded cue cadence to keep simultaneous attacks readable.
- Briefing and inspection explain tough skin. Refine Boar hide appearance, expression/torso variants, movement and immunity effects in an owner session. Exact palette, symbols, variant count and poses remain approval choices rather than predetermined assets.

### Crossing routes and twin bosses

- Encounters 1, 2 and 5 reuse one exact authored battlefield layout. It has two fixed routes with crossover section(s), widely separated entrances and exits, and no route switching. Exact geometry and number of crossings are selected during layout review.
- Content assigns stable route identities to spawn groups. Enemies carry their assigned route for movement, target ordering, leak handling and rally eligibility. Preserve existing single-route content through explicit compatibility/migration.
- Both routes share village hearts and existing enemy leak penalties. Every route tile, including crossings, is unbuildable. Range and splash operate in shared battlefield space, so enemies on either route can be hit when in range.
- Target priority compares remaining travel time to each enemy's assigned exit. Document the deterministic movement-speed estimate and tie handling before implementation; avoid browser-derived or renderer-derived threat decisions.
- Both Roadwardens arrive together, one on each route. Their health and rage lifecycles are independent. Existing rage and net interactions remain intact. Rally affects eligible escorts on the casting boss's route only, preserving the existing nearby-escort rule within that route.
- Both bosses must die and the final wave must clear before victory. Either boss leaking causes defeat even if village hearts remain. Resolve simultaneous deaths/leaks deterministically.
- Tune escort counts and starting resources to make the combined challenge demanding and playable. Existing boss behavior is reused rather than introducing a new boss type.

### Boundaries, authoring and assets

- Retain browser-independent deterministic simulation, plain-data content, immutable attempt snapshots and adapters for rendering, audio, input and persistence.
- Deepen existing configuration, progression, simulation and encounter-visual interfaces rather than creating parallel campaign/workbench interpretations. New board metadata, reusable layout identity, route assignments, poison settings and immunity capabilities require typed validation and compilation.
- Workbench controls cover new board membership/order/navigation metadata where authored, reusable route geometry and group route assignment, defender roster, waves, supported poison parameters, immunity explanation and approved scenery. Keep campaign/profile save behavior out of synthetic Playtest lifecycle.
- Preserve shared ability settings, explicit draft migration, scoped atomic promotion, stale-scope rejection and uncached runtime reload. If boards/layouts add promotion scopes, make their selection and conflicts visible without overwriting unrelated drafts or canonical content.
- Derive every encounter's art demand across all waves and its resolved defender roster. Reuse catalog descriptions for Skunk and Boar; register approved new scenery only with reviewed runtime assets and provenance.
- Board two remains woodland but distinct from board one. Future dramatic biome changes are a design horizon, not an asset or enemy commitment for this release.
- Preserve dark, child-friendly, non-occult, gore-free painterly woodland art, touch-first landscape presentation, meaningful wave-end choices, accepted marker accessibility and reduced-motion behavior.
- Architecture changes follow the established evidence → baseline → seam → decision record → measured verification → deployment procedure. Record consequential rules and save/content seams in decision records. Use generically described public evidence, without private machine paths or infrastructure details.

### Implementation phases and owner gates

1. **Board and scenery direction.** Review current boards/maps together. Show three meaningful alternatives for a distinct woodland continuation, board compositions, place names, five encounter positions and navigation. Refine the chosen direction. Approve both board names, layout/navigation concept and scenery direction before final production. Update existing art selectively where cohesion fails; do not assume a full repaint.
2. **Skunk.** Research its unique physical throwing action, preserve accepted character identity, and show coherent ready/preparation/release/follow-through poses with bomb alternatives. Obtain pose approval before motion development. Build a side-only mirrored motion study with play/pause, slow playback and scrubbing. Refine green burst, attached gas, opacity and crowded readability with the owner. Implement poison, feedback, upgrades and matching workbench support. Motion-study approval and actual battlefield approval are separate gates.
3. **Iron Boar.** Show alternatives for tough-skin treatment, expression variants, motion and Immune feedback. Preserve accepted character proportions, costume, lighting and directional travel. Approve visual direction, then motion and real battlefield appearance. Implement poison immunity and corresponding authoring/inspection support without adding an active ability.
4. **Boards and routes.** Implement board registration/navigation, per-profile persistence/migration, discovery/replays, reusable crossing geometry and route-aware simulation. Complete workbench route/board controls and promotion compatibility. Review the shared layout's widely separated starts/ends and crossing coverage with the owner before final encounter tuning. Capture architecture evidence and preserve existing single-route behavior.
5. **Authoring and balance.** Author the five encounters and twin-boss finale. Inspect briefing, art demand and battlefield cohesion for each. Demonstrate legal campaign-reachable play, varied investment choices and intended lesson pacing; submit resulting balance feel for owner approval. Verify each content edit through the full workbench round trip.
6. **Release verification.** Exercise profiles, saves, navigation, replay, poison/defense interactions, dual exits and twin-boss outcomes. Run required checks, visual/touch review and production-boundary checks. After an authorized release, verify the deployment. Record accepted assets, decisions, evidence and remaining physical-device gaps.

Phases are bounded reviewable units, not permission to bypass their owner gates. Dependent content may be used in isolated fixtures before its campaign introduction, but those fixtures cannot establish campaign affordability. Substantial departures from an approved visual or mechanic return to the owner.

## Testing Decisions

- Test externally observable behavior at the highest existing seam that can establish it. Prefer real Game attempts constructed from resolved authored content over mocked behavior modules or tests that reproduce implementation arithmetic. Use focused lower-level coverage only for a boundary not observable reliably through that seam.
- Primary combat seam: the real Game and its public commands/state/events with deterministic fixed ticks. Existing shield, evasion, mechanic-lifecycle, rally/rage and simulation tests provide prior art.
- Cover area impact eligibility per enemy; shield-protected blast with successful poison; evasion avoiding application; later evasion not avoiding ticks; armor bypass for ticks; immunity without attached poison; blast damage against Boar; duration refresh; mixed poison strengths; expiry boundaries; simultaneous impacts; poison death; pause; and fresh replay.
- Through the same Game seam, cover both route identities, crossing movement without switching, shared hearts, route-specific leaks, range/splash across routes, target ordering, independent boss phases, route-local rally, both required defeats, either boss escaping, simultaneous outcome boundaries and unchanged single-route behavior.
- Progression/save seam: existing victory/discovery, roster resolution and profile serialization interfaces. Discovery-outcome, progression-gate, persistence and player-profile tests provide prior art. Verify first/repeated victories, earned Skunk and upgrade, old-save derivation, independent profiles, viewed-board restoration, invalid destination recovery, optional stars, earlier replays and result/save agreement.
- Authoring seam: validated configuration through the complete edit → automatic draft save → draft reload → Playtest → Promote → game reload flow in a disposable copy. Existing configuration, wave-ability, working-draft, workbench API/promotion and runtime-content tests provide prior art. Cover board/layout/route validation, draft migration, scoped conflicts, preservation of unrelated changes and immutable running attempts. Content-only promotion must require no JavaScript rebuild.
- Campaign evidence uses legal builds and resources from actual progression. Authored-campaign and existing encounter-strategy tests are prior art. Clearly distinguish synthetic setup evidence from attainable campaign strategies; preserve meaningful losing-policy and pressure assertions when tuning.
- Visual acceptance is separate from automated tests. Review variants, accepted poses, mirrored motion transitions, projectile origin, feet/hands, directional Boar travel, gas readability, feedback text and actual battlefield crowds. Verify both boards and all affected briefing/battle art at desktop, landscape phone and tablet sizes. Check targets at least 44 CSS pixels, keyboard focus, reduced motion and touch paths.
- Inspect complete derived art demand, approved catalog membership, committed runtime files and provenance using existing encounter-visual and asset tests. Preserve production exclusion of workbench/QA modules with existing artifact checks.
- Run npm run check, npm test, npm run build and npm run build:workbench. Tests are requirements for implementation; this spec alone makes no claim that new mechanics or assets have passed them.
- Architecture verification captures reproducible before/after evidence and the intended measurable benefit, then checks deployment after release. Browser emulation cannot establish physical mobile performance. Record unperformed listening, device or deployment checks as unverified.

## Out of Scope

- Additional boards beyond this five-encounter woodland continuation; desert production; spiders, snakes, scorpions or other new enemy species.
- New map challenge mechanics beyond fixed crossing routes with two exits.
- Enemy route switching, player-shaped routing, movable heroes or separate exit-health pools.
- Boar charge, timed armor vulnerability, breakable armor or poison immunity for other enemies.
- Stackable poison damage, damaging persistent ground clouds or new Skunk upgrade mechanics.
- A new boss species or redesign of the existing Roadwarden rage cycle.
- A mandatory full repaint, unapproved visual selections or asset spending beyond existing access.
- Accounts, cloud saves, monetization, multiplayer, permanent progression penalties or changes to the previous game.
- Unrelated engine rewrites, workbench redesigns, infrastructure configuration or publishing actions as part of writing this spec.

## Further Notes

The owner confirmed the design after three interview rounds and the final summary. Later corrections supersede the early proposals: Boar has permanent tough-skin poison immunity rather than a charge; the finale contains two Roadwardens rather than one; encounters 1, 2 and 5 use one shared layout rather than distinct crossing geometries; feedback words are Evade, Immune and Shield.

Map-board names, exact illustration direction, bomb design, green gas palette/opacity, Boar expression count, effect symbols, motion and exact crossing geometry are deliberately reserved for the required interactive sessions. Agents must not silently choose these and call them approved. Start visual exploration with three meaningful alternatives, refine iteratively, and record exactly what the owner accepts. Reuse accepted resources and continuous rig motion where possible; whole-character frame replacement requires explicit review under the existing animation process.

Numerical tuning is delegated, with owner approval of resulting play experience. Choose and record consistent poison-strength refresh semantics and travel-time targeting estimation during implementation; these are technical details under the confirmed nonstacking and exit-threat rules, not authorization to change the player-facing mechanics.

The project issue tracker is local Markdown. This is the parent spec; any later implementation tickets must be separate numbered issue files and inherit the phase gates. No implementation, generation, promotion, commit or deployment is performed by publication of this spec.
