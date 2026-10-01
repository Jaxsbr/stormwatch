# Enemy mechanic lifecycle contract

Use this path when adding or changing an enemy behavior. Rat shield and Weasel
evasion in `src/sim/rat-shield.ts` and `src/sim/weasel-evasion.ts` are the working
examples. Keep each behavior in a focused simulation module with a small interface;
`Game` owns command order, damage, events and attempt state.

1. **Trace the whole behavior.** Find its authored switch and shared settings,
   compiled group fields, spawn state, tick timing, movement or hit result, visual
   tell and briefing. Record which modules independently decide timing or outcome.
   The seam is ready when each decision has one owner.
2. **Advance before effects.** Copy the resolved settings into the spawned actor.
   Have `Game.tick` call the behavior's advance function before movement and
   projectile impacts. The function updates semantic state on `Enemy` and returns
   any movement multiplier. Paused ticks leave state unchanged; a new `Game` starts
   fresh. The behavior's impact function decides its projectile response and cue
   cadence. `Game` applies damage, effects and events from that decision.
3. **Present the outcome.** Renderers and UI read `GameState` and `GameEvent` for
   live tells. They may animate those outcomes, but the simulation decides when a
   behavior is active, warning or effective. Briefing text describes the same
   authored behavior. Keep browser APIs outside `src/sim`.
4. **Align authoring when settings change.** Follow the [content authoring
   contract](content-authoring.md): update canonical data, validation,
   compilation, workbench controls, draft migration where needed, Playtest,
   promotion and uncached game reload together. Keep shared timing in
   `abilityDefaults` and wave switches on the wave, as in ADR 026. An already
   running attempt keeps its immutable snapshot.
5. **Verify through `Game`.** Test enabled and disabled behavior, timing edges,
   movement or projectile outcome, simultaneous impacts, pause and fresh replay.
   Confirm the normal-speed battlefield cue follows the same state and events.
   For authored changes, verify edit → draft reload → Playtest → Promote → game
   reload. Run the project checks in `AGENTS.md`.

Completion means one simulation decision controls the rule and tell, the authoring
round trip agrees with runtime when applicable, and a focused real-`Game` test
would fail if the behavior regressed. Add a decision record for a consequential
rule or seam change.
