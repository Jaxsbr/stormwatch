# MVP feedback: visual clarity, campaign variety and game feel

## Confirmed direction

- Audience: ages 6 through adult. Visuals and animation should teach defender/enemy roles and show action outcomes; keep text short and concrete.
- Placement: the tile-first flow (variant B) feels most intuitive for mobile. Test a brief hint that makes clear only open ground beside the path is buildable; do not assume the exact wording yet.
- Combat feedback: retain the crisp contact treatment (A) for physical hits and the warm effect treatment (C) for effect/status impacts. A single treatment does not need to cover every event.
- Campaign lure: combine the multiple-map fixed-route expedition with a replayable, learnable wave sequence. Introduce enemy behaviors clearly, practice them, then combine them across encounters. The owner’s Warcraft III / Warhammer 40K tower-defense reference supplies the wave-mastery inspiration; Stormwatch will not copy its maze building or punishing optimization. Exact pacing, counter strength, leak consequences, economy role, and content sequence remain open in [issue 06](issues/06-campaign-challenge-brainstorm.md).
- Tactical identity: every enemy and tower should have a distinctive job, with overlap between answers. Towers can be more or less effective through readable trade-offs; avoid exclusive counter towers.
- Strategy discovery: the numeric matchup calculator was too complex to reason about and is retired. The broad direction is agreed; complete the roster and two-map audit in issue 07 before implementing production-lineage gameplay slices.
- Experiments: keep throwaway visual feedback separate from gameplay-rule work. Test selection and cancellation in both desktop and landscape-touch layouts; implement validated gameplay in production-lineage slices.
- Animation feedback: critique every current tower and enemy individually, using current normal-speed evidence where available. Older targeted reviews are evidence, not a substitute for a current full-roster review.

## Existing product and technical constraints

- Preserve the dark, child-friendly, non-occult, gore-free woodland presentation and landscape-first play.
- Preserve meaningful wave-end saving/investment, deterministic simulation, browser-independent rules, fixed paths, and data-driven content.
- Keep experimental rules and art out of production until the owner reviews their results. No additional asset spending is authorized by this brief.
- Do not modify the previous game.

## Research

See [primary-source research](../../docs/research/2026-09-25-mvp-feedback.md). It supports role clarity, readable action sequences, accessible targets, and simple onboarding. It does not establish current Stormwatch animation defects or prove which prototype will be fun.

## Prototype sequence

1. Lead mobile selection and placement with variant B. Check that “Tap clear ground beside the trail” (or another brief hint) explains where towers can go. Compare cancellation and recovery on touch and desktop.
2. Keep treatment A as the physical-hit reference and treatment C as the effect/status reference; check that each cue shows the outcome without obscuring the map.
3. Complete the four-enemy/three-tower matrix and current-build challenge audit across both maps in [issue 07](issues/07-roster-matchup-and-map-scenarios.md). After owner review, add selected abilities in small slices directly in the real game so there is no later port. Do not use the numeric matchup worksheet to choose mechanics.
4. Capture an individual role-by-role animation audit at normal speed. Note source, viewport, direction, action, and confidence for each observation.

## Action map

- [Individual animation review](issues/01-individual-animation-review.md)
- [Distinct encounters](issues/02-distinct-encounters.md) — apply after the role matrix and map-scenario pass
- [Selection flow prototype](issues/03-selection-flow-prototype.md)
- [Combat feedback prototype](issues/04-combat-feedback-prototype.md)
- [Retired numeric matchup worksheet](issues/05-tower-enemy-matchup-prototype.md)
- [Wave-learning loop brainstorm](issues/06-campaign-challenge-brainstorm.md) — direction agreed; design decisions remain open
- [Roster matchup and map scenarios](issues/07-roster-matchup-and-map-scenarios.md) — four enemies × three combat towers across both maps

## Exit criteria

- The owner can identify a preferred control flow and explain how to cancel or deselect on desktop and touch.
- The mobile placement flow makes buildable ground discoverable, including path-versus-open-ground guidance.
- Physical-hit and effect/status cues communicate their different outcomes without gore or excessive text.
- The full role matrix describes unique identities and overlapping trade-offs; both maps teach and combine readable behaviors.
- Current-build challenge scenarios establish when the repeated one-of-each plan wins, when players leak, and whether an understandable weak plan can eventually lose.
- Validated mechanics go into the actual deterministic simulation and data-driven content in small slices; no throwaway gameplay implementation needs to be ported later.
- Every current tower and enemy has an individual verdict or an explicit evidence gap.
- Only validated decisions are promoted to production scope; the remaining variants stay on a throwaway branch.
