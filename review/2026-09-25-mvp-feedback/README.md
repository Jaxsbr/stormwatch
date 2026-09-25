# MVP feedback prototypes

Status: throwaway prototypes on `codex/stormwatch-mvp-feedback-prototypes`.

## Review focus

Which control flow and event-matched combat cues make Stormwatch clearer and more satisfying for ages 6 through adult?

The two active, disposable pages explore input and combat visuals separately. The numeric strategy sketch was too complex to reason about and is retired. Gameplay design now covers the full enemy/tower roster and both maps; validated rules should enter the real game in small production-lineage slices, not be ported from a throwaway game.

## Run

From the repository root, run `npm run prototype:mvp-feedback`, then open each experiment from the hub. The touch mode shows an 844×390 landscape frame inside the normal browser window, so its layout can be reviewed at that size. It does not emulate the browser viewport, a physical device, or performance.

- `battle-input.html?variant=A|B|C`: fixed build dock, tile-first contextual choice, and drag-or-tap. B is the mobile lead; the next check is whether clear-ground guidance is enough.
- `combat-feedback.html?variant=A|B|C`: snap/recoil for physical hits, area read, and warm hit confirmation for effects. The owner preferred A for physical hits and C for effect-based impacts.
- `matchups.html`: retired numeric worksheet, kept in a collapsed archive after review found it too complex to reason about. The agreed direction combines the fixed-route expedition with replayable, learnable waves. The roster matrix and current-build scenario plan are in [issue 07](../../.scratch/mvp-feedback/issues/07-roster-matchup-and-map-scenarios.md).

## Limits and review

- The interaction page models placement and inspection; it does not run the production simulation.
- The combat page reuses committed character art but draws effects with CSS. It has no sound and does not claim motion-cadence quality.
- The archived matchup page used a simplified six-second estimate, not pathing, target selection, a full-wave simulation, or balanced numbers. Its borrowed-armor rule is not a production rule or a campaign recommendation.
- Existing research and early role-by-role animation leads are in [the research note](../../docs/research/2026-09-25-mvp-feedback.md) and [the local feature spec](../../.scratch/mvp-feedback/spec.md). Current full-roster normal-speed animation evidence is still required.
- Keep this review branch's input/combat pages as disposable visual experiments. Build gameplay rules in the real game after the full roster/map plan is reviewed; record owner decisions before expanding the rules.
