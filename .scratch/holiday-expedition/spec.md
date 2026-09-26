# Holiday expedition — Day 2 boss chapter and Day 3 release

Status: ready-for-agent — tickets 01–03 complete; continue at 04

## Owner amendment — 26 September 2026

Ticket 03 is complete after owner playtesting. Rainstone has four mixed waves, deterministic projectile evasion, a gentler opening and twelve final-wave mini cycles. The finale repeats 1 Rat/6 Weasels → 2 Rats/5 Weasels → 4 Rats/4 Weasels four times. See decision 017 for timing and movement. Weasel warning/evasion remains spawn-relative; missed nets do not apply slow and existing slow remains active. Turtle is earned on Rainstone victory and first used in the later final encounter.

## Problem Statement

The owner wants Stormwatch ready for two children aged six and nine during their ten-day school holiday. Work on the Rat Raider showed that a readable enemy action, clear combat feedback, and meaningful tower placement can make a small encounter enjoyable. The game now needs a short, complete journey with a boss-map finish line and useful rewards, rather than a wider unfinished roster.

The owner wants to start from Day 2 of the discussed plan. The remaining work must turn the tools taught in the first two encounters into a satisfying Turtle lesson and Roadwarden finale, then leave time for broad playtesting and corrections on tablets and a laptop. The owner should be able to give ordinary observations about difficulty or clarity while the agent handles implementation, reproduction, tuning, and verification. This chapter is the first three-map board in a longer expedition: sequential lessons lead to a boss map that must be won before advancing to a later board.

## Solution

Deliver The Last Lantern as the third and final map of the first board. Its opening waves teach Turtle slow alongside earned Squirrel upgrades. Later waves combine familiar Rat guard and Weasel evasion behavior. Waves one through five steadily build difficulty, with wave five serving as a hard combined rehearsal. The sixth wave is the board's distinct and hardest boss wave: one powerful Roadwarden with escorts, a readable rally, and an explicit requirement to defeat the boss. A chapter-ending celebration unlocks Reach and Longer Nets advantages for replay. Iron Boars are reserved for the next board.

Day 2 delivers the complete chapter and reward-enabled replay. Day 3 addresses owner feedback, tunes difficulty, verifies progress and controls, and produces a candidate the children can actually open and play. The calendar is a delivery target; acceptance depends on observed behavior and evidence.

The assumed campaign arrival state is:

| Encounter          | First-arrival tools and lesson                                                | Victory unlock                         |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------- |
| Lantern Pass       | Base Squirrel; Rat shields and pairs                                          | Squirrel upgrade and Rainstone         |
| Rainstone Crossing | Squirrel and its upgrade; Weasel evasion and extended coverage                 | Turtle and The Last Lantern            |
| The Last Lantern   | Upgraded Squirrels and base Turtles; slow practice followed by the Roadwarden | Chapter ending, Reach, and Longer Nets |

Day 1 was initially treated as an explicit dependency, not part of this implementation scope. At planning time, the checkout lacked player slots and some assumed progression work. Update — 26 September 2026: the owner accepted Tickets 01–03 as complete at their current scope. Ticket 01 does not require plotting a third placeholder node; The Last Lantern and its Turtle reward/use arrive in later encounter tickets. Historical planning observations below remain snapshots, not current status. Full campaign completion is still open.

The supporting wave plan supplies complete initial recipes. Its figures are tunable hypotheses, not verified balance. The optional five-map expansion draft is future design material and is excluded from this release.

## User Stories

1. As a six-year-old player, I want to recognize what an enemy is doing from its movement and effects, so that I can play without reading long explanations.
2. As a nine-year-old player, I want placement and spending choices to change the outcome, so that improving my strategy feels worthwhile.
3. As a player, I want a short chapter with a clear boss-map destination, so that I have an achievable goal during the holiday.
4. As a returning player, I want the third encounter to use abilities I discovered earlier, so that my progress feels connected.
5. As a player who won Rainstone, I want Turtle to be available when I enter The Last Lantern, so that I can use the capability I just earned.
6. As a player, I want a generous first chance to try Turtle, so that a new tool does not immediately punish experimentation.
7. As a player, I want to see the net travel from Turtle and attach to its target, so that I understand what caused the slow.
8. As a player, I want a net to remain visible while its slow applies, so that I can tell which enemy is affected.
9. As a player, I want the net to disappear when slow expires, so that the visual matches the enemy's restored movement.
10. As a player, I want refreshed nets to keep a continuous, accurate status cue, so that repeated attacks do not create confusing flicker or obsolete effects.
11. As a player, I want a netted sprinting Weasel to visibly slow down, so that I can see how two familiar mechanics interact.
12. As a player, I want Turtle to work especially well beside damage towers, so that choosing its location matters.
13. As a player, I want multiple useful firing areas along the final route, so that one accidental placement does not decide the entire attempt.
14. As a player, I want a downstream recovery position, so that I can respond when an enemy escapes my first defense.
15. As a player, I want to practise slow before meeting the boss, so that the finale tests a tool I have already used.
16. As a player, I want Rat guard and Weasel evasion to remain recognizable in mixed waves, so that increasing difficulty builds on what I learned.
17. As a player, I want gold income to support useful purchases throughout the encounter, so that I keep participating in the battle.
18. As a player, I want upgrades and additional Squirrels to remain understandable spending choices, so that there is more than one reasonable defense.
19. As a player, I want early mistakes to cause recoverable pressure, so that I have time to learn before losing the attempt.
20. As a player, I want the next-wave countdown and Start Early control to be clear, so that I know when combat will resume.
21. As a player, I want pause to freeze enemies, ability timing, visual effects, and preparation, so that I can take a break safely.
22. As a player, I want the final-wave objective to state that I must defeat the Roadwarden, so that a boss escape has an understandable consequence.
23. As a player, I want a distinct boss entrance and readable health indicator, so that I recognize the finale and can see my progress.
24. As a player, I want the Roadwarden to visibly prepare its rally, so that the escorts' speed change has an understandable cause.
25. As a player, I want affected escorts to display a consistent rally cue, so that I can distinguish them from unaffected enemies.
26. As a player, I want nets to remain useful during a rally, so that my newly learned tool has value in the boss fight.
27. As a player, I want sprint and rally to combine predictably, so that a Weasel does not gain an unexplained compounded burst of speed.
28. As a player, I want the boss encounter to be beatable with the towers and upgrades I actually earned, so that no unavailable tool is secretly required.
29. As a player, I want the boss to be a moving combat challenge with escorts, so that the final encounter feels different from another ordinary wave.
30. As a player, I want the chapter to end only after the boss is defeated and remaining enemies are resolved, so that victory reflects what happened in the battle.
31. As a player, I want a boss escape to produce a clear defeat and free retry, so that I understand why I lost and can try another defense.
32. As a player, I want an easier retry to preserve and advance discovery progress, so that assistance lets me continue the adventure.
33. As a player, I want a satisfying chapter-ending celebration, so that beating the boss feels like finishing something substantial.
34. As a player, I want the reward screen to explain my new advantages briefly, so that I know why I might replay an encounter.
35. As a player, I want Reach to visibly extend tower coverage, so that selecting it has an understandable benefit.
36. As a player, I want Longer Nets to visibly prolong slow, so that its name matches its effect.
37. As a player, I want to see only advantages useful for the chosen encounter, so that I am not offered a net bonus where Turtle is unavailable.
38. As a player, I want to choose no advantage, so that I can replay the original challenge.
39. As a player, I want advantages to stay hidden until I defeat the boss, so that new decisions arrive after I understand the basic tools.
40. As a player, I want ordinary and assisted victories to earn the chapter rewards without perfect stars, so that discovery does not require flawless play.
41. As a returning player, I want my best stars and earned capabilities to survive replay and reload, so that experimentation does not erase progress. Completed maps allow earned Squirrel upgrades and Turtle, so I can return with new tools to improve my star rating.
42. As a sibling sharing a device, I want my rewards to remain separate from the other player's rewards, so that we each discover the campaign ourselves.
43. As a player with an existing save, I want new encounter and reward support to preserve my earlier progress, so that updating the game does not force me to restart.
44. As a tablet player, I want placement, selection, cancel, upgrade, pause, and replay to work through clear touch controls, so that I do not need hover or a keyboard.
45. As a laptop player, I want the same actions to work reliably with a mouse, so that the campaign behaves consistently on my device.
46. As a player, I want readable status and combat effects without covering the trail, so that I can enjoy the animation while following the battle.
47. As a player, I want audio, orientation changes, and background/resume behavior to be reliable, so that ordinary interruptions do not spoil my attempt.
48. As the owner, I want to test a complete playable chapter and give short corrective feedback, so that I can guide enjoyment without specifying implementation details or balance numbers.
49. As the owner, I want a build identifier, accessible game location, and a few concrete things to try at each checkpoint, so that my feedback refers to the correct candidate.
50. As the owner, I want the agent to distinguish simulated correctness, browser observations, and actual child/device feedback, so that I can judge what is really ready.
51. As the owner, I want a resumable implementation record and bounded tasks, so that work can continue semi-autonomously without repeated planning interviews.
52. As the owner, I want the final day devoted to corrections and release reliability, so that new scope does not consume the remaining holiday preparation time.

## Implementation Decisions

- **Starting scope:** begin with Day 2. Verify Day 1 prerequisites against the actual integration checkout without marking assumed work complete. Keep any missing dependency explicit. Tickets 01–03 are complete at the owner-approved scope. The remaining sequence is Turtle and final route (04), boss and ending/rewards (05), then release hardening (06).
- **Board progression:** the first board is Lantern Pass → Rainstone Crossing → The Last Lantern. Its first two maps teach sequentially; winning the final Roadwarden map is required to advance to a future board. Future boards and their map nodes are not part of this release. Iron Boars belong to the next board.
- **Architecture:** preserve the browser-independent deterministic attempt simulation, authored encounter data, rendering/input/audio adapters, and pure persistence adapter. Prefer the existing public game commands and observable state/events over new private test hooks or a parallel gameplay implementation.
- **Existing decisions:** preserve the approved landscape woodland presentation, articulated 2D asset pipeline, Rat guard lesson, and progressive discovery/simple economy decisions. Enemy kills and fixed wave rewards are the only ordinary attempt income. The first encounter remains Squirrel-only; savings interest, Donkey income, supply drops, and immediate unearned advantages do not return.
- **Encounter content:** register The Last Lantern as the third encounter and support its saved completion. Use a distinct fixed route with two useful firing areas, adjacent room for Turtle and damage support, and a downstream recovery opportunity. Route geometry must preserve readable buildable space on a landscape tablet.
- **Arrival capabilities:** the finale permits Squirrels with the earned Squirrel upgrade and base Turtles. Skunk, Boar, Turtle upgrades, and pre-earned replay advantages are unavailable on a normal first arrival. The initial budget is 120 gold. Existing catalog boss stats and local encounter tuning may change to keep this tool set viable.
- **Six-wave arc and difficulty:** wave 1 is the forgiving Turtle introduction; wave 2 practises slow on runners; wave 3 applies slow to guarded Rats; wave 4 mixes Rats and runners across firing areas; wave 5 is the hardest non-boss combined rehearsal and supplies final investment; wave 6 is more demanding than wave 5 and contains one powerful Roadwarden with a deliberate escort procession. Its readable rally and required-defeat objective distinguish the boss wave. Initial quantities and intervals are in the supporting wave plan; they are starting hypotheses and must be tuned against actual earned tools.
- **Economy:** initially use two gold per defeated Rat/Weasel and fixed clear rewards of 25, 28, 30, 32, 35, and zero for the final encounter's six waves. The final reward is persistent discovery rather than an unusable wave-clear wallet payment. Tune income alongside bank, placement opportunities and actual buying behavior; avoid solving every issue through global health inflation.
- **Wave scheduling:** authored groups use the existing sequential scheduling semantics. Confirm that the intended escorts actually overlap the boss on the route. A batch count is the total enemy count, not the number of batches.
- **Turtle feedback:** preserve the current slow rule and render a recognizable attached net while that enemy is slowed. Refresh, expiry, enemy death, pause, and reused actor cleanup must all preserve agreement between visible status and simulation. Projectile origin/release should match the current Turtle rig. Do not add a new tower action or upgrade tree.
- **Boss rally contract:** first windup starts at boss age six seconds. A one-second visible anticipation precedes a rally pulse; further windups begin every ten seconds. At pulse time, ordinary living enemies within three units of path distance from the boss receive a 25% movement bonus lasting three seconds. Use distance along the route, not straight-line world distance across adjacent bends. Recipients are selected at the pulse; their short effect then expires by simulation time. The boss does not buff itself, summon, heal, or become invulnerable. Its death prevents new pulses; already granted short effects expire normally.
- **Movement composition:** use the greater of active evasive-run and rally movement multipliers, then apply the existing net-slow multiplier. Neither speed effect removes slow, and the speed bonuses do not compound. Preserve the completed spawn-relative Weasel evasion and warning; rally must not change projectile evasion timing.
- **Threat tells:** show the boss's command through existing body motion and a horn cue, then mark affected escorts consistently. Use shape and movement as well as color. The visible tell must precede or accompany the actual effect, use simulation time, and avoid obscuring other actors. Status data remains authoritative in the simulation; rendering and sound interpret it.
- **Required boss objective:** declare required boss defeat for the finale rather than changing the success rules of unrelated encounters. Preview the objective before its wave. A Roadwarden leak ends the attempt in defeat even if hearts would remain. Boss death alone does not end a wave with queued or living escorts. Victory requires required-boss defeat, completion of all authored waves, and remaining hearts. Defeat takes precedence if the village is lost during the same update as the final kill. Retry resets objective tracking and transient combat state.
- **Boss presentation:** give the single boss an entrance and health indicator while it is present. A brief objective label and clear escape explanation are sufficient; no live tutorial modal is needed. Do not introduce a second boss merely to lengthen the finale.
- **Chapter rewards:** first victory awards Reach (+18% range) and Longer Nets (+50% slow duration), including assisted victory. Store these as persistent discovery unlocks and preserve best stars. Replays do not repeat first-discovery celebrations or remove progress. Defeat or boss escape never earns the rewards.
- **Advantage eligibility:** Reach is applicable on every chapter encounter; Longer Nets is offered only where Turtle is available. Before discovery, hide the advantage interface. With one applicable advantage, show an equipped summary and an option to use None; with multiple, allow exactly one or None. Validate eligibility when starting an attempt as well as in the visible picker; a previous map's choice must not leak into an ineligible map.
- **Result flow:** show a chapter-complete celebration, short reward explanations, and replay/map actions. The final victory must not offer a nonexistent fourth encounter. Preserve the Day 1 Continue flow between existing encounters and the final destination.
- **Persistence:** extend the existing recognized encounter/reward data and use the established migration approach. Do not discard legacy progress because the new encounter or unlocks were previously unrecognized. Keep profiles isolated, preserve settings and best stars, and round-trip actual stored data. Profile creation and general profile migration are assumed Day 1 work; changes here are limited to integrating and verifying the final encounter/rewards. Saves remain local to each browser/device.
- **Controls and pacing:** retain manual preparation before wave 1, the owner-approved ten-second real-time inter-wave countdown, Start Early, and pause. The ten-second duration is independent of combat speed. Portrait changes/backgrounding must not leave combat advancing behind an unusable interface.
- **Autonomous tuning:** choose routine route coordinates, counts, gaps, local budgets and permitted stat tuning based on evidence. Preserve the lesson/reward order. Keep a runnable candidate after each complete slice and maintain a concise progress record with build identity, evidence, next step and blockers. Owner observations should produce bounded corrections; they need not include numbers, logs or screenshots.
- **Schedule cut:** reserve Day 3 for fixes. Optional cosmetic flourishes may be cut first. If necessary, omit the rally rule and all its associated cues while retaining the escorted boss, readable entrance/health/impacts, required defeat, rewards and ending. Disclose this explicitly at the checkpoint. The third encounter, taught Turtle use, actual boss victory, and preserved progress cannot be cut while claiming the chapter is complete.
- **Delivery:** use the actual authorized candidate destination established during Day 1. A local preview is not a public deployment. Record access requirements and whether a hosting laptop must stay running. The currently inaccessible Git remote does not authorize changing the repository or publishing somewhere new.

## Testing Decisions

- **Good tests observe the game:** assert outcomes a player can experience—movement changes, time under fire, slow expiry, damage/leaks, affordable purchases, win/loss, unlock availability, and retained progress. Avoid tests that merely repeat content constants, private method names, internal helper structure or the renderer's implementation.
- **Primary seam:** drive the real attempt through its existing public commands and fixed-step advancement, with real authored encounter data and actual arrival unlocks. Exercise the final map's full six-wave sequence and focused encounter variations through this same seam. Do not add a second simulator or a special combat-only API.
- **Existing persistence seam:** use current save creation/parsing and victory-recording behavior for final-encounter progress and reward tests. This small second boundary is necessary because saved discovery lies outside a single attempt. Test real serialization/reload, profile isolation, legacy preservation, first versus repeated victory, assisted victory, and rejection of rewards after defeat.
- **Visible integration seam:** use the browser flow for campaign navigation, reward explanations, advantage eligibility/None, retry, pause, selection, and the final ending. Inspect normal-speed motion and listen to sound. Existing presentation tests may cover focused semantic output; do not claim screenshots prove animation timing or audio quality.
- **Prior art:** existing Lantern and Rainstone strategy scenarios already drive the real game through an encounter; Rat guard tests cover spawn-relative timing, paused state, impact behavior and slow interaction; wave countdown tests cover preparation; persistence tests cover defaults, malformed saves, best stars and derived unlocks; result/briefing tests cover discovery presentation. Extend these patterns for the chapter rather than building a new test framework.
- **Slow and rally cases:** cover no nearby recipients, an eligible recipient, an enemy outside the path-distance bound despite visual proximity on a bend, expiry, death cleanup, paused timing, and sprint/rally/slow overlap. Verify the visible net duration through actual play as well as the underlying movement consequence. Test distinctions that could make a real rule wrong, not every possible field independently.
- **Boss objective cases:** cover boss defeat while escorts remain, boss escape with hearts still available, village loss with the final kill, ordinary encounter success without a boss objective, complete chapter victory, and clean objective state on retry. The existing behavior of winning after a boss leak must not persist in the finale.
- **Balance evidence:** demonstrate at least two viable defenses for the final encounter with its actual earned tools. Compare a well-positioned Turtle/Squirrel line with more Squirrel spending; observe a weak placement and delayed spending. Record per-wave income, bank, purchases, upgrades, lives/leaks, and completion time. Do not require every tower to win alone or equate a scripted optimal player with a child.
- **Broad regression:** complete the chapter from a fresh player slot, then replay using earned advantages. Preserve Lantern's opening lesson and Rainstone's unlock boundary. Unavailable Day 1 work must be reported as an integration dependency; fixture setup cannot stand in for missing campaign functionality.
- **Device evidence:** check landscape touch controls in the browser, then verify on the family's actual tablet and laptop. Include orientation changes, background/resume, audio start, reload, saved progress, readability and accessible build/upgrade controls. Emulation does not establish physical mobile performance. Actual enjoyment and comprehension require human play observation.
- **Required checks:** run the repository's type check, meaningful focused/full tests as appropriate, and production build after relevant implementation. Repeat broader checks only when changes or failures justify them. This specification task itself does not implement or run gameplay tests.
- **Owner seam check:** the owner has been asked whether the existing simulation, persistence and visible-play boundaries match expectations, as required by the to-spec skill. Pending that response, these are the proposed boundaries; no new test seam is required to publish the agent-ready specification.

## Out of Scope

- Reimplementing Day 1's player-slot foundation, Weasel evasion lesson, or first-two-map progression under this Day 2 task. Verify/integrate those dependencies and identify gaps explicitly.
- Implementing the next map board, Iron Boar lessons, Skunk lessons, Turtle upgrades, new enemies/towers, additional bosses or new biomes during this release pass. Iron Boar is reserved for the next board.
- Random evasion, breakable armor, boss summons/healing/invulnerability, deep upgrade trees, flying enemies, player-controlled heroes or player-shaped paths.
- New directional character-art production, engine replacement, a content editor, or a generic status framework beyond what the selected behaviors require.
- Returning savings interest, passive income buildings, supply drops, upfront advantage selection, or mandatory manual coin collection.
- Accounts, cloud saves, cross-device progress synchronization, multiplayer, monetization, grinding or stars that gate ordinary progress.
- Modifying CuteDefense. It is a read-only reference for familiar controls, short sessions and satisfying feedback.
- Purchasing assets, creating an unapproved public hosting destination, or treating remote access failure as permission to publish elsewhere.
- Declaring physical tablet performance, child comprehension, universal balance or enjoyment from automated checks alone.

## Further Notes

The delivery target remains the complete first three-map board for the holiday. Day 2 should produce The Last Lantern, its Roadwarden boss wave, ending and replay rewards; Day 3 should incorporate feedback and establish release readiness. Winning the boss advances the expedition to the next board when that board is delivered; this release does not show an empty or unfinished next board. These labels describe milestones, not evidence that earlier work has already shipped or a promise of uninterrupted agent execution.

Use the [three-map wave plan](wave-plan.md) for initial recipes. The [optional expansion draft](expanded-wave-plan.md) is future material. The remaining implementation sequence is [04 — Turtle and final route](issues/04-turtle-and-final-route.md), [05 — Boss and chapter ending](issues/05-boss-and-chapter-ending.md), then [06 — Family release](issues/06-family-release.md). Tickets 01–03 are complete at the owner-approved scope.

At the Day 2 checkpoint, provide the build location/version, what to try, and at most three uncertainties. At the Day 3 checkpoint, provide the actual release evidence and any outstanding physical-device work. Basic feedback such as “the net was invisible,” “the boss escaped without a clear explanation,” or “I had 180 gold and stopped building” is sufficient for the agent to reproduce and correct the issue.

Maintain the [progress record](progress.md) as work proceeds. Publishing this local spec marks it ready for an agent; it does not start a background task, schedule execution, claim Day 1 completion, or approve a new deployment destination.
