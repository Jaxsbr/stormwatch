# Learnable enemy matchups across two encounters

**Status:** active — baseline and matchup proposal delivered; Rat Raider guard shipped ahead of the planned wave arc

## Problem Statement

Stormwatch already has expressive woodland art, three combat towers, four enemy roles, and two fixed-route encounters. In play, though, the enemies mostly differ through health, speed, and armor. A broad defense can be repeated on both maps without much thought, so the player has little reason to learn a wave, change a tower mix, or replay with a new plan. Attractive characters and towers are not yet carrying enough of the moment-to-moment strategy.

The game is for players from age six through adulthood. A richer defense challenge must be readable through silhouettes, motion, and clear action outcomes, with little required text. It should reward noticing and learning without turning into a demanding memory test, a hard-counter puzzle, or a punishing optimization game. The owner wants the four current enemies and three current combat towers considered together across both existing maps, a measurable challenge baseline, and an incremental route from approved design to the actual game.

## Solution

Establish how the current game performs on both encounters, then describe the full four-enemy by three-combat-tower matchup before adding new combat rules. The matchup should give each enemy and tower a recognizable identity while preserving overlapping, understandable alternatives. It should identify one proposed signature behavior and visual tell per enemy, and explain how route and terrain make placement choices differ between Lantern Pass and Rainstone Crossing.

Author a wave-learning arc that introduces each selected behavior safely, gives the player a chance to recognize and practice it, then combines learned threats later. The owner approved the Rat Raider guard directly, and its mechanic, reviewed art, and sound are now in the real game. Complete its wave teaching and two-map verification before calling it a finished lesson. Review that result before adding the other lessons one at a time. Each slice includes the simulation rule, content, visual tell, and focused verification together, so accepted work stays in the game instead of being rebuilt from a throwaway gameplay prototype.

The challenge should make tower choice, placement, upgrades, and spending timing matter. A thoughtful alternative plan should have a reason to work; an intentionally weak or greedy plan should eventually risk leaks or defeat in a way the player can understand and learn from. Keep first sightings forgiving and retries free of a permanent-progress penalty or required grind. Preserve fixed paths and the current wave-end saving/investment rules while measuring how they interact with the challenge.

## User Stories

1. As a young or new strategy player, I want each enemy's important behavior to be visible, so that I can learn what it does without reading a long explanation.
2. As a player seeing a behavior for the first time, I want the first encounter to be low-risk, so that I can notice and experiment before the game asks me to respond well.
3. As a returning player, I want a later wave to revisit a learned behavior, so that recognizing it helps me choose a defense rather than merely remember a number.
4. As a player who has learned several enemies, I want later waves to combine them, so that I must adapt a plan instead of repeating one tower pattern.
5. As a player, I want every current enemy to have a distinctive play role, so that the four attractive silhouettes also represent different tactical problems.
6. As a player, I want each combat tower to have a clear strength and cost, so that choosing it means making a useful trade-off in damage, coverage, timing, or crowns.
7. As a player, I want more than one tower type to remain useful against each enemy, so that learning a matchup opens choices instead of revealing a single mandatory counter.
8. As a player facing a shielded enemy, I want its protection state to be apparent in its animation and impact response, so that I can tell when my attacks are being reduced and why.
9. As a player facing a fast or otherwise distinctive enemy, I want its behavior to have a clear visual tell, so that a miss, delay, or change in tower value makes sense on screen.
10. As a player, I want the Roadwarden to present a distinct lesson from simply having more health and armor, so that a boss encounter gives me a new tactical question.
11. As a player on Lantern Pass, I want its route and terrain to make some placements more useful than others, so that map knowledge changes my defense.
12. As a player on Rainstone Crossing, I want its different route and terrain to ask for a different placement decision, so that the second encounter feels like a new leg of the expedition.
13. As a player, I want enemy lessons to be introduced and revisited across the two maps, so that the expedition gives me a reason to continue and replay.
14. As a player, I want an unsuccessful defense to show where pressure came from and how an enemy behavior affected the result, so that a leak or defeat feels understandable.
15. As a player, I want retries to let me try a different tower mix, placement, or upgrade timing without losing permanent progress, so that failure supports learning.
16. As a player, I want a weak or greedy strategy to become risky while a considered plan has useful options, so that success is earned without demanding perfect play.
17. As a player, I want the existing wave-end saving and investment decision to remain meaningful, so that combat challenge and economy timing continue to connect.
18. As a player from age six through adulthood, I want short labels and visual cues to support the action, so that I can follow the challenge without needing dense text or hidden stat thresholds.
19. As a player, I want each map to offer a learnable wave sequence rather than only larger groups or higher statistics, so that replaying can improve my decisions.
20. As a game designer, I want evidence for the current broad one-of-each plan, a deliberate matchup plan, and a weak or greedy plan on both maps, so that challenge changes respond to observed play rather than guesses.
21. As a game designer, I want the full current roster compared before expanding it, so that new behaviors and any future tower gaps are deliberate.
22. As a developer, I want each approved behavior implemented and reviewed as a complete slice in the real game, so that successful rules do not require a later port from a toy prototype.

## Implementation Decisions

- The initial design pass covers the four current enemy roles—Rat Raider (the little mouse), Fleet Weasel, Iron Boar, and Roadwarden—against the three combat roles: focused archer, splash slinger, and slowing trapper. The Donkey Trader is an economy role and stays outside the initial combat matrix.
- The matchup matrix describes what each pairing does, the benefit and opportunity cost, when another tower remains a reasonable choice, and how placement changes the interaction. Each enemy receives one proposed signature behavior and one legible threat tell. Rat guard is now approved and shipped; the other three signatures remain proposals for owner review.
- The brief Rat Raider guard is an approved, shipped rule. A longer Iron Boar shield or Weasel evasion remain candidate ideas, not fixed requirements. Exact behaviors, durations, damage interactions, visual timing, and wave positions are to be chosen after the matrix and challenge baseline are reviewed. Do not add a flying enemy as part of this four-enemy pass.
- The wave plan uses a teach → practice → combine progression across the two current encounters. A new lesson first appears in a forgiving context, is revisited with a clearer defense decision, and is combined only after the player has had a chance to recognize it. The plan should use the existing route and terrain differences to create different useful placements. It does not copy a particular numbered-wave cadence from the inspiration game.
- The current broad one-of-each defense is measured, not assumed to be dominant or automatically invalid. Compare it with a considered matchup line and an intentionally weak or greedy line on each map. Record wave progress, completion state, leaks/hearts, tower mix and upgrades, placement coverage, and relevant crown/interest decisions. Treat a small set of scenarios as challenge evidence, not proof of global balance.
- Rat guard already moved into the browser-independent deterministic simulation. Later approved gameplay rules also belong there, with data-driven encounter content. Each lesson includes its rule, wave use, visual tell, and verification as a cohesive production-lineage increment. Keep each accepted increment; review it before applying the pattern to another enemy. Do not create a separate throwaway gameplay implementation to port later.
- Use the highest existing behavioral test seam: drive the real game through deterministic scenarios on the actual encounter definitions, and assert player-visible consequences such as damage or protection, slow or movement outcomes, leaks, wave progress, and win/loss state. Add or adapt lower-level seams only if the real game cannot expose an essential behavior.
- The renderer remains an adapter over simulation state and events. Ability tells and combat cues should expose the state change and its outcome without making the simulation depend on browser or rendering code. Use current art and animation resources where possible; any required new art is a separate owner-approved decision.
- Preserve fixed enemy paths, data-driven content, deterministic simulation, touch-first play, child-friendly woodland tone, current wave-end saving/investment behavior, and free retry without a permanent-progress penalty.
- Add a new tower, tower upgrade path, or deeper permanent progression only if the reviewed matrix demonstrates that current roles cannot express a worthwhile trade-off. Such an expansion requires a separate owner decision before implementation.

## Testing Decisions

- A good rule test drives the public game behavior and checks outcomes the player can observe. It should not couple to private helper names or a chosen internal representation for an ability.
- Before changing rules, run reproducible challenge scenarios through both current encounters: the broad one-of-each line, a deliberate matchup-driven line, and a deliberately weak or greedy line. Record the setup and outcomes, including waves started and completed, hearts lost, remaining crowns, placement coverage, and purchases/upgrades. This is a gameplay audit, not a substitute for balance evidence across many players.
- After a rule is selected, exercise it through the real deterministic game on the relevant encounter definitions. Verify the enemy's behavior and tell timing through external consequences, tower interactions and overlap, leaks, and wave/outcome transitions. Preserve seed and fixed-tick reproducibility for scenarios that rely on simulation outcomes.
- Review each lesson in normal-speed browser play on both maps where it appears. Confirm that the visual tell precedes or accompanies the changed outcome, that a player can distinguish its role with little text, and that the cue does not hide the path or other actors. A static frame or browser emulation does not certify physical mobile performance.
- Existing prior art is the scenario-style strategy coverage for Lantern Pass and Rainstone Crossing, plus combat-effect tests that drive the real `Game` and inspect damage, slow, rescue, and phase outcomes. Extend those styles around player-visible behavior rather than mirroring a test for every content field.
- Do not claim that a scenario set proves complete balance. Report where the repeated plan succeeds, where an alternate plan earns an advantage, and whether a weak plan leaks or loses for a visible and learnable reason. Leave a result explicitly unverified if it could not be observed.

## Out of Scope

- Recreating the Warcraft III / Warhammer 40K map, maze construction, player-built pathing, severe optimization pressure, or a memorization test.
- Adding maps beyond Lantern Pass and Rainstone Crossing, adding a new enemy to the roster, or changing the fixed-route architecture.
- Implementing four new enemy abilities, extra towers, or expanded upgrade trees as one large batch before reviewing the first complete lesson.
- A redesign of the Donkey Trader, supply interaction, interest rules, or the wider economy. This pass preserves and observes the existing wave-end saving/investment choice; a different economy direction is separate work.
- Requiring one exclusive tower counter, hidden stat math, long text tutorials, harsh first exposure, permanent loss, or a grind to recover.
- Purchasing new assets or committing unreviewed generated assets.
- Replacing the separate selection-flow, impact-feedback, or full character-animation review work already tracked for the MVP feedback.

## Further Notes

The owner’s Warcraft III / Warhammer 40K reference is about the pleasure of learning authored waves and discovering better strategies through replay. Stormwatch should retain that sense of anticipation and mastery while remaining approachable for younger players and compatible with its fixed-route expedition. Its maps and characters should do more teaching, and enemy/tower differences should create trade-offs rather than a single correct answer.

The first implementation decision is deliberately not “which of the brainstormed mechanics is final.” The baseline and complete roster plan should reveal which lesson best exercises the game's existing tower roles. The first selected lesson then proves its full production shape in the actual game. If review shows that it is confusing or does not create a decision, revise or drop it before applying the pattern to the rest of the roster.

## Reconciliation, 25 September 2026

See the [eight-ticket status and post-guard scenario check](../../review/2026-09-25-learnable-wave-strategy/reconciliation-2026-09-25.md). Tickets 01 and 02 are historical baseline/design deliverables. Ticket 03 is next; ticket 04 contains a shipped rat mechanic but an unfinished authored lesson. Tickets 05–08 remain future work. The old baseline and roster documents describe a pre-guard build unless explicitly amended.
