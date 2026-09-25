# Prototype combat feedback separately from game rules

Status: ready-for-agent

## Question

Which restrained visual treatment best communicates the projectile impact and splash reach for a young player while keeping the battlefield readable?

## Existing behavior

The game already animates shots and emits hit, splash, slow, supply, and coin effects. Hit effects last 0.2 seconds; splash has a larger ring. The renderer draws effect rings in a shared gold palette. The underlying rules and visual treatment therefore need separate evaluation.

## Prototype

Working capture: [three combat-feedback variants](../../../review/2026-09-25-mvp-feedback/README.md).


Replay the same representative attack sequence with three treatments. Keep roles, timing, damage, wave state, camera, and screen size fixed. Avoid gore, text-heavy counters, and effects that hide route or tower figures. Include normal-speed review; slowed review may help locate timing but is not quality evidence.

## Acceptance

- Keep variant A as the reference for physical contact and hit response.
- Keep variant C as the reference for effect/status events such as splash and slow; its warm cue must not imply a crown reward or extra damage.
- Map feedback treatments to what happened; do not force one visual treatment onto physical hits and non-contact effects alike.
- Check that each event remains distinguishable without a paragraph and does not obscure the trail or character roles.
- Slow and defeat still need evidence in the full-roster review; prototype them separately only if observers cannot read those existing cues.
- The map remains legible during the busiest sampled moment.
- The review records what is visually hypothesized separately from any gameplay rule change.
