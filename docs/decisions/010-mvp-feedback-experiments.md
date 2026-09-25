# 010 — MVP feedback experiments

## Status

Owner-approved prototype feedback and campaign-learning direction, 25 September 2026; updated after review of the first experiments and brainstorm. Production gameplay and asset changes remain unapproved pending further review.

## Context

The owner wants Stormwatch's art and animation to teach play for ages 6 through adult, with little text. Current feedback says the visual style is stronger than the moment-to-moment game feel; tower/enemy motion needs individual critique; the encounters need a clearer reason to continue; and selection currently feels hard to discover. Current code already deselects on open-ground tap and Escape, but does not support right-click. Existing encounters use the same four enemy roles and similar tower matchups. A long-played Warcraft III tower-defense map inspired the owner through authored enemy waves, signature abilities, specialist responses, economy timing and the chance to improve through replay.

The project has prior targeted reviews of defenders and directional gait. Those reviews record improvements to the skunk/turtle arm rig and badger leg orientation, but they do not certify every role, direction, action, or current normal-speed play. Existing hit, splash, and slow cues are present in the simulation and renderer, so their clarity should be evaluated separately from gameplay rules.

## Decision

- Make visual role and outcome readability the audience-facing criterion; use concise labels where they help.
- Treat tile-first placement (prototype B) as the mobile lead. Check whether a short hint that only open ground beside the trail is buildable makes the action discoverable.
- Use prototype A as a reference for physical-hit feedback and C for effect/status feedback. Match the cue to the event and keep map information visible.
- Use the prior game's wave-mastery appeal as inspiration alongside the multiple-map expedition. The first numeric matchup worksheet was too complex to reason about and does not choose mechanics or balance.
- The owner confirmed the campaign-learning direction: combine Stormwatch's fixed-route expedition with learnable, replayable enemy waves. Introduce a behavior in a low-risk way, let the player recognize and practice it, and combine learned enemies later. The inspiration is wave mastery, not maze construction, severe difficulty, or demanding optimization.
- Every enemy and tower should have a distinct role with useful overlap: some towers may be better against an enemy, but other choices should still work through different trade-offs. Do not design hard exclusive counters.
- Treat shields, flying enemies, specialist towers, new upgrade depth, enemy recaps, and new economy patterns as candidate mechanics. Counter strength, pacing, acceptable leaks, economy changes, and implementation order remain open; no production mechanics are approved by the brainstorm.
- Work through all four existing enemies against the three combat towers across both current maps before expanding the roster. Establish current-build challenge evidence first, then implement chosen abilities in small slices that stay in the real game; do not build and port four throwaway gameplay prototypes.
- Keep combat-feedback and wave-learning strategy work separate. Keep existing wave-end saving/investment choices and no-required-grinding progression in view while clarifying the economy role.
- Review every current tower and enemy role individually at normal speed. Record observed defects separately from hypotheses and earlier targeted fixes.
- Keep the dark, child-friendly, non-occult and gore-free woodland direction, deterministic simulation, fixed paths, and content-as-data boundary. Do not add production mechanics or spend on assets until the owner reviews the experiment results.

## Consequences

The input and combat pages remain throwaway visual prototypes: B leads mobile placement; A and C serve different feedback events. The numeric matchup calculator was retired as a discovery format. Campaign direction now combines the fixed-route multi-map expedition with gradually taught, learnable waves and overlapping enemy/tower roles. First audit all current role pairings and challenge levels in the existing build. Then carry selected gameplay rules into the real simulation/content/rendering seams a small slice at a time; no later port is expected. Keep economy redesign separate from the initial combat matchup audit and do not treat example enemy abilities as approved rules. Physical mobile performance, continuous motion cadence, sound, and playability with children require their own evidence; browser emulation or static frames cannot certify them.

## Verification

Visual-prototype captures and individual role notes will be kept under `review/2026-09-25-mvp-feedback/`. Evaluate control variants at 1280×720 desktop and in an 844×390 touch-layout frame. Check hint discoverability. Apply A and C to representative physical and effect/status events at normal speed. For gameplay, complete the four-enemy/three-tower matrix, run current-build scenarios on both maps, then implement selected enemy lessons directly in the game with focused deterministic rule tests and normal-speed visual evidence. Any failed or unavailable evidence stays marked as such.
