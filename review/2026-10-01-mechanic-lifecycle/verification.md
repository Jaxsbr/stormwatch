# Mechanic lifecycle verification

## Baseline and seam

Baseline: `59c88e9`. Candidate: the branch containing ADR 037. This is a
structural improvement, so the primary measure is the number of production
modules that independently evaluate each ability window.

| Ability | Before | After |
| --- | ---: | ---: |
| Rat shield | 3 modules: helper, `Game`, battlefield | 1 module: shield lifecycle |
| Weasel evade | 3 modules: helper, `Game`, battlefield | 1 module: evasion lifecycle |

Before, evasion had two direct window evaluations in `Game` (movement and
impact) and one in the battlefield; shield had one in each. Afterward the
renderer has no direct timing-helper imports. `Game` advances each lifecycle
before movement and impacts; the renderer reads the resulting actor state.

## Correctness

- Baseline focused shield, evasion and shared-ability suite: 25/25 passed.
- Candidate: `npm run check`, `npm test` (311/311), `npm run build`, and
  `npm run build:workbench` passed. The production artifact boundary check
  passed with the build.
- The new real-`Game` lifecycle test checks warning and active windows,
  guard state, pause and fresh replay. Existing impact and authoring tests
  cover projectile damage, miss cues, shared timing and scoped promotion.
- A 1× local browser playthrough showed the overhead shield cue on Rat raiders
  in Lantern Pass. The Rainstone wave-2 workbench Playtest showed Rat shield
  and Weasel evade cues during an active battle. These were visual inspections,
  not physical mobile performance measurements.
- Canonical content and workbench controls were not changed by this refactor;
  existing authoring and promotion tests passed. The new-behavior trial below
  exercises the full authoring path.

## Timing control check

The same three focused suites were run 30 times before and after on the same
arm64 macOS host (Darwin 25.6.0, Node 24.3.0). The
measurement is whole test-command wall time, including startup and transforms;
it is a coarse regression signal, not player-facing frame timing. Other local
work can affect the tail.

| State | Raw runs (ms) | Median | p95 |
| --- | --- | ---: | ---: |
| Before | 532.4, 472.5, 480.3, 480.3, 476.4, 474.6, 480.2, 480.8, 482.9, 486.3, 458.4, 478.2, 481.1, 480.5, 486.1, 458.3, 490.6, 465.0, 498.2, 493.8, 472.8, 469.3, 477.3, 462.5, 485.1, 471.4, 461.9, 479.3, 481.2, 472.8 | 479.75 ms | 498.2 ms |
| After | 547.6, 482.6, 498.1, 472.8, 456.7, 493.0, 478.2, 478.9, 487.2, 489.1, 473.0, 482.2, 468.8, 462.8, 475.1, 458.5, 485.3, 490.1, 501.4, 487.3, 490.6, 493.0, 491.2, 487.9, 495.2, 535.3, 477.6, 481.1, 485.0, 478.4 | 485.15 ms | 535.3 ms |

The candidate's median was 1.1% higher and p95 7.4% higher. This check does
not isolate simulation time, and the architecture change does not claim a speed
gain. The focused behavior tests and production build are the stable CI gates.

## Disposable agent trial

One independent agent session implemented an opt-in Armored brace behavior in a
separate disposable checkout. The prompt specified outcomes, authoring and
verification, but did not prescribe the module structure. The agent found the
mechanic lifecycle and content authoring contracts, ADR 026, and the two
existing behavior modules. It then used a focused `src/sim` lifecycle module,
called its advance function from `Game` before movement, called its impact
decision at damage resolution, and had the battlefield read actor state for
warning and active tells. It also added a wave switch, shared timing, validation,
workbench controls, draft migration, briefing, scoped promotion and tests.

**Score: pass.** The agent needed no corrective architecture guidance. Its
normal-speed browser Playtest showed the brace marker; draft save/reload,
Playtest and scoped Promote worked, and a runtime-content test covered uncached
game reload. It reported passing `npm run check`, `npm test` (319 tests),
`npm run build`, `npm run build:workbench`, `npm run format:check`, and
`git diff --check`. Independent review found the rule timing and impact decision
only in its simulation module and reran its focused brace and runtime reload
tests (10/10 passed). The trial's behavior and content edits are not included in
the product branch.
