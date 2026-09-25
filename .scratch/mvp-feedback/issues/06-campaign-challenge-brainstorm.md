# Design the replayable wave-learning loop

Status: needs-info

## Owner's reference

The owner played a Warcraft III tower-defense map themed around Warhammer 40K for years. Its pull came from learning an authored enemy sequence and getting better at anticipating it: each wave introduced a distinctive enemy or ability; every fifth wave was a flying wave that ignored player-built paths; every sixth wave was a boss; and some waves rewarded specialist defenses. Difficult rounds could force a live choice to sell a tower or accept a few leaks to afford a later defense. Players could save during combat, earn interest at the round boundary, then decide when to invest. Replays let the player learn the waves, tower order, and upgrade timing.

The appeal to preserve is **wave mastery**: each replay builds knowledge and enables a new strategy. Reproducing the reference's maze building, severe difficulty, and demanding optimization is not the goal for an audience that includes six-year-olds.

## Confirmed Stormwatch direction

Stormwatch should combine its fixed-route woodland expedition with a gradually taught, replayable sequence of enemy behaviors. An encounter can introduce a new enemy or ability in a low-risk appearance, give the player a chance to recognize it, then test it more clearly; later encounters can combine learned enemies. The same lesson can support retries with different tower and upgrade choices. The exact map and wave schedule remains open.

The owner also confirmed the tactical design rule: every enemy and tower should have a recognizable strength, but their roles should overlap. A tower can be better against an enemy without being the only tower that works; the alternatives should involve understandable trade-offs.

The current MVP has four enemy roles with attractive silhouettes, but their different health and speed values do not yet make repeated defenses feel meaningfully different. A player can place one of each tower and repeat that pattern. Future challenge should make players notice an enemy behavior, choose where and how to defend, and learn why a tower or upgrade helps.

## Candidate examples, not approved mechanics

- An early map could focus on the little mouse as the baseline enemy. It might briefly raise its shield and reduce direct damage; an iron-bar shield could stay raised longer. The animation should teach when protection starts and ends. Do not make only the mouse interesting: progressively give the other enemies distinct behaviors too. Exact duration, damage rules, and which existing attacks bypass protection are undecided.
- A fast weasel might evade some attacks, making a more accurate tower valuable. The tell, miss rate, and whether another tower can still answer it are undecided.
- A flying enemy might ignore the trail and create a new coverage problem. A net or another specialist defense could be a stronger answer while other towers remain useful; the size and cost of that advantage are undecided.
- A weasel or other new enemy might first appear in small numbers so the player can notice its behavior before a later wave or map asks for a deliberate response. Later encounters can combine previously learned enemies.
- A short, visual "new enemy spotted" recap could explain what the enemy does and which defense helps. Whether and when to show it remains undecided.
- More tower roles, upgrade choices, and upgrade levels could give later waves different answers. Add them only as the progression model is clarified; they are not implementation approval.
- Economy may need a more satisfying decision than the current donkey/trade-income presentation and supply interaction. Keep the existing save-versus-spend interest choice in view while clarifying what the owner dislikes and whether meaningful decisions belong between waves, during waves, or both.

## Comparison with the reference

| Design ingredient | Appeal in the reference | Stormwatch adaptation to explore | Boundary |
|---|---|---|---|
| Learnable authored waves | Knowledge of what is coming rewarded practice and strategy experiments | Introduce a behavior safely, revisit it, then combine it with known threats across encounters | Do not assume a large campaign or a punishing memory test |
| Signature enemy abilities | Waves could require different defense plans | Give each enemy a readable behavior that changes target priority, coverage, or tower value | Avoid piling several hidden stats or abilities onto a role |
| Specialist defenses | Tower choice depended on the incoming threat | Let enemy behavior change tower matchups and placement decisions | Keep alternatives viable; tune how much stronger a specialist should be |
| Live economy pressure | Saving, selling, or accepting leaks made each round tense | Make saving and spending feel consequential and understandable | Retain Stormwatch's fixed routes, wave-end interest rules, and no-required-grinding scope unless the owner revises them |
| Maze construction | Player-built paths multiplied strategy depth | Vary authored routes and terrain so useful placements change | Do not copy maze building; Stormwatch's paths are fixed |

## Decisions still open

The top-level direction and overlapping-matchup principle are agreed. The next design pass covers all four current enemy roles against the three combat towers on both current maps, rather than treating one enemy example as the entire design. Its first production-lineage gameplay slice can still be implemented and reviewed in a small increment.

1. **Threat pacing:** How many waves should introduce and then test one new behavior before remixing it? What belongs in the two current encounters, and what waits for later maps?
2. **Counter strength:** How much stronger should a specialist tower be than viable alternatives, and what cost or lost opportunity balances its advantage?
3. **Failure pressure:** How many leaks are acceptable during a first lesson, and how quickly can the player recover without an abrupt loss or required grind?
4. **Enemy complexity:** Should each enemy have one signature, visibly telegraphed ability whose strength can scale, or should abilities grow in other ways?
5. **Economy:** In a separate design thread, clarify whether the problem is the donkey fiction, its passive income role, the supply interaction, or all of these. Should the main risk-reward choice stay between waves, include occasional live selling/rebuilding, or move elsewhere?
6. **Learning feedback:** Which behavior needs a pre-wave visual preview, an in-combat tell, a post-wave recap, or some combination? Keep explanations visual-first and short.

## Next step

Use [issue 07](07-roster-matchup-and-map-scenarios.md) to design the complete role matrix and first-two-map scenario plan. Then implement and evaluate a small playable slice directly in the real simulation/content/rendering seams, keeping any validated rules in place rather than porting them from throwaway code. Address economy design on its own track so it does not obscure combat matchups. Do not reuse the retired numeric matchup worksheet, increase campaign scope, or spend on assets from this brainstorm alone.

## Acceptance

- The reference game's appeal and the parts Stormwatch will not copy are explicit.
- The playable-slice brief describes a visually readable teach → practice → combine progression for ages six through adult.
- A player can learn an enemy behavior and make a different tower, placement, upgrade, or economy decision because of it.
- The chosen challenge allows experimentation and retry without relying on maze building, text-heavy instruction, or required grinding.
- Combat visuals remain separate from strategy testing; only validated decisions are promoted to production scope.
