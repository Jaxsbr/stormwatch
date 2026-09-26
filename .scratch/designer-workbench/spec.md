# Stormwatch designer workbench

Status: ready-for-human

The owner approved the approach on 27 September 2026 and requested synthesis through the to-spec skill. This specification is the implementation contract for that approach. Implementation has not started. The proposed verification seams were carried forward from the approved plan and explicitly checked with the owner during synthesis; an additional response is not yet recorded.

## Problem Statement

The designer cannot readily see the complete configuration of an encounter or wave, understand its spawn rhythm, adjust a few values, and play the result without editing implementation code. Counts, batch spacing, stagger, recovery periods, movement and abilities interact in ways that become harder to reason about as encounters and the roster grow. Some values are authored content, some inherit catalog defaults, and some are currently embedded in gameplay rules.

The designer wants to retain personal control over feel. An instruction to make a map easier or harder, or a fully automated balancing process, obscures the actual choices. Automated play should expose pressure, discover candidate defenses and compare changes while allowing the designer to play and decide whether those changes work.

Two children have different ages and abilities. The designer needs to explore separately authored difficulty recipes and distinguish difficulty from discovery unlocks. A first arrival and a replay with later towers, upgrades and advantages can legitimately produce different outcomes on the same encounter.

Experiments need safe persistence and deliberate promotion into the game's actual content. The production game and the utility must use the same rules and resolved configuration, while the utility's editor, automated policies, test fixtures and writing support remain outside the GitHub Pages artifact. Agents also need straightforward access to configuration and evidence, with a clear distinction between gameplay rules, encounter content and instrumentation.

## Solution

Provide a local designer workbench with an expandable encounter/wave register, an effective-configuration inspector, a spawn timeline and a map preview. The designer selects an encounter and wave, forks a draft, changes supported values, and plays a fresh attempt using the actual battlefield, controls and deterministic simulation.

Progression presets show the tools legitimately available on first arrival or replay. Explicit scenario overrides allow alternative tools, advantages, resources and starting formations without changing family progress. Full-encounter attempts establish reachable campaign outcomes; isolated-wave scenarios are clearly labeled when their resources or formation are synthetic.

Named automated policies and recorded commands run through the same legal commands as manual play. A subsequent bounded search can seek a specified wave-clear or encounter-win goal, optionally requiring no lives lost, and return a replayable defense. Reports describe the policy assumptions and observed consequences, leaving feel and child suitability to actual play observations.

Drafts, revisions, scenarios and results are saved independently of released content. A validated export and local promotion command turn a selected revision into a scoped, reviewable canonical-content change. Stable identities and structured inspection/run/comparison operations make the same workflow available to agents. Separate production and utility builds enforce deployment separation.

## User Stories

1. As a designer, I want to see all registered encounters in campaign order, so that I can understand the expedition without searching implementation code.
2. As a designer, I want to expand an encounter into its waves, so that I can select the exact lesson or finale I want to examine.
3. As a designer, I want each wave to show its title, stable identity and displayed number, so that saved experiments continue to refer to the intended wave when content is reordered.
4. As a designer, I want to see the intended lesson and target outcome separately from observed results, so that authored intent is not mistaken for proven balance.
5. As a designer, I want to inspect enemy totals and composition, so that I can understand the scale and mix of a wave immediately.
6. As a designer, I want a timeline of packets and individual spawn times, so that I can see alternating threats, density and quiet periods.
7. As a designer, I want the timeline to use the game's scheduling interpretation, so that its preview corresponds to the attempt I play.
8. As a designer, I want nominal spawn times and fixed-tick appearances to be distinguishable, so that small timing differences are understandable.
9. As a designer, I want a map and trail preview alongside wave details, so that I can consider coverage and route pressure while editing.
10. As a designer, I want a readable repeated-packet recipe, so that I can change repetition counts and recovery periods without editing a long expanded spawn list.
11. As a designer, I want to adjust enemy counts, cadence, batch size, stagger and preceding silence, so that I can author the wave's rhythm directly.
12. As a designer, I want to adjust movement and supported shield, evasion and rally parameters, so that I can test how abilities interact with packet timing and coverage.
13. As a designer, I want to inspect and adjust supported health, reward, starting-crown and defender parameters, so that resource pressure and combat tuning are visible together.
14. As a designer, I want every setting to show its effective value, default and edit scope, so that a local experiment does not accidentally become a global retune.
15. As a designer, I want invalid or unsupported edits to explain the problem, so that I can repair a draft before launching or promoting it.
16. As a designer, I want to fork the current accepted configuration into a named draft, so that I can experiment while retaining a known baseline.
17. As a designer, I want to compare the draft's changed values with its baseline, so that I can review exactly what I am testing.
18. As a designer, I want an attempt to retain its configuration throughout play, so that its outcome has an unambiguous cause.
19. As a designer, I want to restart deliberately after editing, so that the next attempt uses the new revision consistently.
20. As a designer, I want to play a complete encounter using the normal battlefield and legal controls, so that the utility preserves my feel for the actual game.
21. As a designer, I want normal-speed play, pause, restart and accelerated playback, so that I can inspect important moments and skip uneventful time.
22. As a designer, I want accelerated playback to retain the fixed timestep and explicit preparation-window behavior, so that speed controls do not change combat rules.
23. As a designer, I want an isolated-wave scenario with a declared starting wallet and formation, so that I can examine a late wave without repeatedly playing the whole encounter.
24. As a designer, I want synthetic setups to be labeled, so that I do not confuse an artificial defense with a campaign-affordable strategy.
25. As a designer, I want to record and replay legal commands through preceding waves, so that I can reach an authentic later-wave setup reproducibly.
26. As a designer, I want to take manual control at a preparation point after replay, so that I can test a different response from a reproducible opening.
27. As a designer, I want a first-arrival preset to show the discoveries earned before that encounter, so that I test its intended teaching roster accurately.
28. As a designer, I want a replay preset to include earned tools that legitimately apply to completed encounters, so that I can evaluate star improvement and later rewards.
29. As a designer, I want explicit tower, upgrade, advantage and resource overrides, so that I can examine alternative or future scenarios without granting discoveries to real players.
30. As a parent, I want utility attempts to leave both children's profiles unchanged, so that experimentation cannot overwrite their progress or settings.
31. As a designer, I want difficulty variants to be selectable separately from progression, so that I can compare pacing for different players using the same available tools.
32. As a parent, I want difficulty candidates to support differences in packets, rests and ability timing, so that tuning can accommodate both children beyond a health multiplier.
33. As a designer, I want current normal and assist behavior preserved as baselines, so that introducing the workbench does not silently change the game.
34. As a designer, I want automated policies to place and improve defenders through legal commands, so that their successes represent possible game actions.
35. As a designer, I want to see a policy's decision cadence, action limits, tool restrictions and live-spending assumptions, so that I can judge how its performance relates to a human player.
36. As a designer, I want to specify clear-wave, win-encounter or no-lives-lost goals, so that an automated run answers the balance question I am investigating.
37. As a designer, I want bounded search to return a successful plan and replay, so that I can inspect and play the strategy rather than trust a single score.
38. As a designer, I want failed searches to disclose their limits, so that I do not mistake an unsuccessful policy or search for proof of impossibility.
39. As a designer, I want reports of wave checkpoints, leaks, hearts, crowns, purchases, upgrades and boss outcome, so that I can locate the consequences of a change.
40. As a designer, I want baseline and candidate runs to use matched scenarios and command or policy settings, so that the comparison isolates the configuration change.
41. As a designer, I want adaptive-search comparisons labeled separately from fixed-plan comparisons, so that I understand when the defense also changed.
42. As a designer, I want each result tied to its configuration, engine revision, seed, setup and command or policy version, so that an agent or I can reproduce it later.
43. As a designer, I want to save named draft revisions, scenarios and results, so that promising experiments and rejected alternatives remain understandable.
44. As a designer, I want to export and import experiments, so that I can move a candidate between design and playtest environments.
45. As a designer, I want saving a draft to be separate from applying it to the game, so that unfinished tuning stays outside released content.
46. As a designer, I want promotion to validate a draft and show a scoped diff, so that I can review the exact canonical change before applying it.
47. As a designer, I want stale-baseline promotion rejected, so that another accepted change is not silently overwritten.
48. As a designer, I want the promoted game to use exactly the configuration I tested, so that deployment does not introduce editor-to-game drift.
49. As a designer, I want the prior accepted recipe retained through source control, so that I can revert an unsuccessful balance change.
50. As a player, I want the deployed game to contain ordinary gameplay without utility controls or automated players, so that its presentation and challenge remain the intended experience.
51. As a maintainer, I want the production artifact checked for utility code and fixtures, so that hiding a link is not confused with excluding tooling.
52. As an agent, I want a request such as map 3 wave 6 to resolve to stable content identities and effective settings, so that I can find the relevant configuration immediately.
53. As an agent, I want structured listing, inspection, validation, simulation and comparison operations, so that I can assist without navigating the editor manually.
54. As an agent, I want promotion to use the same validated interface as the designer workflow, so that automated assistance cannot bypass its content checks.
55. As a maintainer, I want guidance to distinguish gameplay rules, authored recipes and utility implementation, so that a change is made in the correct module.
56. As a maintainer, I want a new implemented ability to expose typed authoring settings and appropriate tells, so that future roster growth extends the workbench without an arbitrary scripting engine.
57. As a parent, I want existing play observations collected alongside new evidence, so that ticket 06 respects what has already been demonstrated.
58. As a parent, I want physical-device behavior and child comprehension reported as actual observations, so that numerical balance reports do not claim to establish them.

## Implementation Decisions

- Reuse the browser-independent deterministic `Game` and the existing battlefield, audio and ordinary battle controls. Extract reusable attempt/presentation adapters where necessary without importing the campaign entry's profile-writing lifecycle into the workbench. There is one gameplay implementation.
- Establish one schema-versioned, serializable canonical authoring source for encounter and wave recipes. Preserve readable repeated packets, explicit ordering and stable encounter/wave/group identities. Compiled runtime definitions are derived output, not an independently edited second source.
- Resolve approved content, a named difficulty candidate, progression capabilities and explicit scenario overrides into one immutable attempt configuration. Define precedence centrally and display the origin and scope of effective values. Production and utility consume the same validation and resolution interfaces.
- Extract a shared spawn schedule compiler consumed by both the simulation and inspector. Preserve the currently authored initial delay, trailing cadence, additional silence, batches, stagger, group ordering and spawn-relative guard/evasion behavior. Expanded schedules must be nondecreasing across every spawn, batch and group boundary, retaining authored order for equal timestamps. Reject offending edits with their packet/field identified rather than silently sorting them; introducing a different overlap interpretation is outside the parity refactor.
- Expose current supported group, map, catalog and rule controls with readable units and labels. Include count, cadence, batch size/stagger, silence, repetition, movement, Rat guard cycles, Weasel evasion cycles, starting crowns, rewards, health scaling, supported defender stats and existing boss parameters. Currently embedded constants become explicit typed parameters when exposed; they retain their existing defaults. Arbitrary new ability names or scripts are not accepted as implemented mechanics.
- Inject per-attempt catalog and rule snapshots where the game currently reads global constants. Displayed cost/range, targeting, damage and ability behavior use the same values. A draft cannot modify global exports or contaminate another attempt.
- Derive expected first-arrival and replay tools from the same progression rules as the game. First arrival means the discoveries earned before that encounter, not an empty profile applied to every map. Completed earlier encounters gain earned Turtle discovery; Squirrel upgrades and earned applicable advantages retain current restrictions. Custom overrides are explicit scenario settings.
- Build a campaign-ordered expandable register, effective-setting inspector, recipe editor, shared-schedule timeline and existing-map preview. Display nominal spawn time separately from tick-quantized appearance where relevant. Last scheduled spawn and wave-clear time are different quantities. Show ability windows relative to individual enemy appearance.
- Record intended lesson/goal as authored metadata and observed outcomes as separate evidence. Missing metadata is shown as unspecified rather than invented by automation.
- Draft edits produce named revisions. An active attempt retains its original resolved revision; restarting applies new edits. Maintain independent utility storage and no writes to game player profiles, discovery unlocks, stars or settings.
- Support full-encounter attempts and isolated-wave scenarios with declared resources and formation. Synthetic scenarios do not claim preceding-wave affordability or campaign reachability. Starting formations must satisfy the scenario's declared placement, roster and upgrade rules rather than mutate live combat state informally.
- Record accepted legal commands at simulation ticks. Replay the initial setup and commands in a fresh attempt; support branching to manual control at a preparation point. Authentic later-wave scenarios are obtained by replaying prior waves. Public display state alone is not a complete engine checkpoint; a general snapshot/restore interface is deferred until replay cost justifies it.
- Preserve fixed combat steps during acceleration. Normal manual play retains the existing preparation countdown behavior; accelerated manual combat does not silently shorten its decision window. Headless policies declare preparation/start behavior and time limits so results are reproducible.
- Start automated assistance with named policies extracted from current strategy scenarios and recorded play. Policies use the legal placement, upgrade, sell and wave-start commands, with declared decision cadence, allowed actions and capability/resource restrictions. The obsolete broad challenge scenarios are not accepted as current campaign evidence.
- Add bounded search after the manual workflow and baseline policies are usable. Search varies legal defense plans against a fixed candidate recipe; it does not rewrite difficulty automatically. Goals define clear-wave or win-encounter outcomes, including any required boss defeat. No lives lost is an optional constraint on that target: success requires actual target completion and zero hearts lost from the declared initial scenario. Merely stopping with full or positive hearts, timing out or stalling does not satisfy a goal. Report search budget and unsuccessful discovery honestly.
- Results include wave checkpoints, lives/leaks, crowns and transactions, tower mix/upgrades, boss outcome and simulated time. Add sufficient observable event context for leak attribution where it is missing. Preserve configuration identity/hash, engine revision, fixed timestep, seed, starting setup, difficulty, progression, overrides and policy version/cadence or command trace.
- Compare fixed scenarios with identical command traces or policy parameters. When a trace command becomes invalid under a candidate, report the rejection rather than silently substitute another action. Label independently searched/adapted strategies separately.
- Persist and export named drafts, scenarios, command traces and results. Browser storage failure must be visible, with in-memory continuation and export available; do not imply a draft was durably saved when it was not. Import validates versions, identifiers and complete effective content.
- Initial repository persistence uses validated export/import and a local promotion command. Promotion previews a scoped diff, validates the complete candidate, checks its base revision, and applies only selected canonical content. Utility-only formations, artificial resources, tool overrides, policies and results do not implicitly become production defaults; promoting a resource or tool change requires an explicit authored-content edit. Errors leave the accepted baseline intact. One-click local writing can be added through this same interface later; it is not required for the first milestone.
- Verify that promoted runtime content resolves to the tested configuration identity under the same declared difficulty, progression and scenario setup. Compare recipe identity independently of synthetic scenario state; this does not promise that a fresh campaign attempt has the same setup as an overridden experiment. Retain accepted history through source control and run required project checks before accepting a promoted candidate. The utility does not automatically commit, publish or deploy changes.
- Support design-only named difficulty recipes independently of discoveries and replay capabilities. Variants may change per-wave packets, quiet periods, movement, ability cycles and resources. Preserve existing normal/assist behavior during extraction; current assist grants additional starting crowns and hearts. New player-facing difficulty selection, labels, star/unlock rules and permanent player-slot assignments are separate release decisions.
- Build the ordinary game and local workbench as separate entry graphs and outputs. Production excludes editor routes, automation/search, fixture injection, diagnostic query controls, QA workers and writing support. Inspect existing diagnostics as part of separation; separating a new page alone does not satisfy this contract. Shared gameplay simulation and approved runtime content remain deployed.
- Keep draft/scenario/research assets outside automatically copied production asset locations. Production dependencies must not reach utility modules. Utility and rule checks may run in continuous integration while their output remains outside the uploaded game artifact.
- Target the local desktop browser workbench first, preserving landscape and pointer/touch usability. Export/import supports transfer of candidate scenarios. Immediate network access from tablets and a network-accessible writer are not acceptance requirements for the first milestone. Later device sharing does not change repository-writing authority.
- Expose shared structured interfaces for list, inspect, validate, run, compare and promote. Human campaign-number references resolve through the register to stable identities. Browser and headless operations resolve the same content and scenarios; agents need not operate the browser to reproduce a balance run.
- Update architecture, domain vocabulary and agent navigation when the modules are implemented. Route tuning to authored data, new abilities to gameplay plus presentation, and editor changes to utility modules. Record consequential accepted architectural choices in the existing decision-record convention. Public guidance contains generic capabilities and no machine/account/access information.
- Deliver in stages: shared configuration/scheduling parity and production separation; register/editor/draft/manual-play/save/promotion; policies, goals, command replay and comparisons; bounded goal search and difficulty-candidate comparisons. Use the current Last Lantern finale as a demonstration recipe without retuning it during infrastructure work. Return to ticket 06 evidence collection as the utility becomes useful.

## Testing Decisions

- A good test crosses a public behavior interface and asserts something the designer or player can observe. Prefer existing real `Game` scenarios and legal commands at fixed ticks over tests of internal resolvers, private queues or helper structure. The main verification seam is a resolved scenario run through the actual game; browser, promotion and artifact checks cover responsibilities that this seam cannot observe.
- Through real attempts, verify extraction parity for current recipes: observable spawn order/timing, movement, guard/evasion consequences, legal tool restrictions, payouts, wave progression and required boss outcomes. Preserve current authored values and observed outcomes, including the current finale's recorded strategy losses. The parity refactor does not aim to make those strategies win.
- Use focused scenarios to verify meaningful edges: invalid counts/cycles/cadence/identities, unsupported overrides, partial batches, supported ordering and effective inter-packet rest. Validation failure must prevent launching or promotion and leave baseline content intact. Avoid one assertion for every copied content field.
- Verify first-arrival capabilities for each actual encounter, earned-tool replay behavior, explicit upgrade permissions, advantage applicability and declared override behavior through accepted/rejected game commands and observable combat. Preserve existing save/progression regression coverage.
- Verify draft isolation by running different candidate configurations independently and checking that restarting or editing one does not change the other's outcome, canonical content or either family's profile. Check simulation and displayed costs/ranges against the same effective draft values.
- Verify deterministic command replay at the fixed timestep, accepted/rejected action logs, preparation-point branching and equivalent outcomes under manual versus headless adapters for the same setup and commands. Accelerated playback must preserve combat outcomes. Preparation-clock handling is tested according to the declared adapter mode.
- Verify goal predicates through actual outcomes: wave clear, encounter victory, required boss defeat, loss and time-limit exhaustion, with optional zero-lives-lost constraints measured from the scenario's declared start. A no-lives-lost goal still requires completion of its selected wave or encounter. Verify search returns a reproducible legal plan when found and reports bounded failure without asserting impossibility. A goal checker or successful policy is not evidence of child suitability.
- Compare a matched baseline/candidate pair that produces a meaningful observable difference, recording configuration identity, setup and actions. Verify invalidated trace actions are reported and adaptive-search comparisons are labeled. Do not turn every balance metric into an exact brittle regression assertion.
- Through the browser, verify the complete designer journey: expand the register; inspect effective settings and timeline; fork a draft; alter packet timing or an ability cycle; launch and play; restart with the revision; save/export; reload/import; review promotion output. Exercise pointer and representative landscape-touch layouts. Cosmetic changes require visual verification, including readable packet/ability timelines and normal-speed tells.
- Verify browser storage namespace isolation and honest unavailable-storage behavior. Utility launches, retries and result screens cannot award discoveries or stars to game profiles. Representative browser dimensions do not establish physical-device performance.
- At the promotion interface, verify valid round-trip, stale-base rejection, unsupported-version/invalid-payload rejection, scoped authored changes, baseline preservation on error, and equivalence of the tested effective configuration with production resolution under the same declared setup after promotion. Verify synthetic loadouts and scenario overrides are not implicitly persisted as production defaults. Use a disposable content workspace for writes rather than real accepted recipes.
- Inspect emitted production files and the reachable import graph. Assert absence of utility/QA pages, automation/search, scenario fixtures, diagnostic workers/controls and local writing support. Boot the ordinary built game under the Pages project subpath and separately launch the workbench against the same canonical scenario. Do not infer exclusion from a hidden link or folder name.
- Existing prior art includes Lantern Pass, Rainstone and Last Lantern deterministic strategy scenarios; Rat guard and Weasel evasion outcome tests; boss rally/escape and required-defeat tests; progression-gate, save/profile and earned-replay coverage; battle-clock and battle-UI tests; and current normal-speed browser review practices. Reuse those styles and scenarios rather than the obsolete broad challenge plans or synthetic performance benchmark as balance evidence.
- Run the project's type/static check, test suite, production build and applicable formatting checks for implemented changes. Add targeted checks at the stated interfaces; broaden verification when a new change, failure or unresolved concern warrants it.
- First-milestone acceptance is behavioral: the designer can understand a registered wave visually, fork it, change a supported timing or ability setting, play with legitimate or overridden capabilities, preserve/export the revision, and promote it through a reviewable validated change. Before promotion, the released recipe and family saves remain unchanged; after promotion, the game consumes the selected authored recipe, which reproduces the tested configuration when resolved under the same declared setup. Production exclusion and extraction parity must also pass.
- Collect existing owner play observations during ticket 06 before repeating work unnecessarily. Human enjoyment, comprehension and physical tablet/laptop behavior require actual observations and remain distinct from deterministic scenarios, browser emulation and bot results.

## Out of Scope

- A second combat simulation, replacement renderer or change to the fixed-route deterministic game architecture.
- Automatic retuning of the current campaign, a claim of globally optimal defense, exhaustive strategy proof or a bot deciding whether a wave feels enjoyable.
- New encounters, enemies, defenders, arbitrary ability scripts, progression systems or paid assets as part of workbench implementation.
- Restoring superseded interest, economy buildings, supply rescue or unearned starting advantages.
- A full visual terrain/path painter in the first milestone.
- Live mutation of a running attempt's configuration or informal restoration from display state alone.
- New player-facing difficulty selection, difficulty-dependent reward/star rules or automatic difficulty assignment to either child.
- Mandatory one-click browser repository writes, cloud collaboration, accounts, remote authoring services or immediate tablet-network setup in the first milestone.
- Upstream configuration, public deployment authorization or a new hosting destination.
- Concealing all client-side gameplay rules, server-authoritative anti-cheat or a guarantee that local browser state cannot be altered.
- Completing family-release acceptance through simulations alone, discarding prior owner observations, or modifying Cute Defense.

## Further Notes

The [approved approach and delivery plan](../../docs/research/2026-09-27-designer-utility-plan.md) explains the reasoning. Supporting research covers [content and progression](../../docs/research/2026-09-27-designer-utility-content.md), [manual/automated play and Cute Defense](../../docs/research/2026-09-27-designer-utility-playtest.md), and [build/persistence separation](../../docs/research/2026-09-27-designer-utility-build.md).

This spec uses the approved plan's defaults to avoid another interview: local desktop first, export plus local promotion command first, manual workflow before expanded automation, and difficulty candidates confined to the utility until their release behavior is specified. Automated goal-driven search remains part of the planned work after baseline policies; it is not satisfied merely by displaying a goal label.

Existing [family-release ticket 06](../holiday-expedition/issues/06-family-release.md) retains responsibility for corrective feedback, integrated chapter/reward replay, candidate handoff and actual family-device evidence. The workbench supports that ticket and future encounter design without asserting that previous owner playtests are invalid or that current failed automated lines prove the chapter impossible.

The current first board remains Lantern Pass → Rainstone Crossing → The Last Lantern. Superseding decisions govern simple crowns/rewards, discovery, earned tools on replay and the Roadwarden finish. New abstractions must preserve these capabilities and the current owner-approved finale values until a separate tuning change is chosen.

No game implementation, tuning, promotion, upstream setup or deployment occurs as part of this specification-only task.

## Comments

- 27 September 2026: The owner approved the proposed approach and requested to-spec if it adds value. Published ready-for-agent with extensive user stories, staged implementation and behavior-based verification. The skill's verification-seam check was sent during drafting; no additional response is recorded at publication time.

- Implementation subsequently authorized through implement-spec. Local designer workflow and review are complete; verification is recorded in `docs/evidence/designer-workbench.md`. Remote PR handoff is pending. The original specification-only drafting note above records the earlier task boundary.
