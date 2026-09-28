# Tower animation process

Approved 29 September 2026; see [ADR 031](decisions/031-side-only-tower-animation.md).

## Direction and visual identity

All towers use a single side view, mirrored left/right toward their target. Do not
produce north/south tower art or animate those views. Enemies retain their own
travel directions. Projectiles still travel to the actual target in any direction.

Keep the accepted character's body proportions, face, costume, palette, lighting,
weapon scale and foot baseline. The body can remain planted; expressive effort
comes from coordinated shoulders, elbows, hands, equipment and restrained weight
shift. A large action must not turn the character into a different illustration.

## Repeatable sequence

1. **Research the tower's unique action.** Study real practitioners or equipment
   makers. Save primary references and distinguish observed mechanics from game
   exaggeration. Name the character: squirrel has a firm brace, straight draw and
   snap; turtle should gather, hoist and sweep a net with weight.
2. **Specify coherent poses.** Show ready, maximum preparation, release and
   follow-through using the approved side illustration as the reference. Mark
   hand contact, elbow bend, equipment shape and intended projectile origin.
   Review the whole character before disconnecting any parts.
3. **Review and rework until accepted.** Compare with the original at equal body
   height, close up and at game size, facing both ways. Record specific feedback
   and revisions. Attractive poses alone do not establish a style match. Stop for
   owner pose review before developing the motion from new drawings.
4. **Choose the minimum necessary parts.** Prefer continuous movement of the
   existing side rig. Reuse the body, feet, face and costume wherever possible.
   Generate replacement parts only when the accepted pose cannot be represented
   without stretching, backwards elbows or exposed sockets. Whole-character frame
   replacement is an explicit reviewed exception, not the default recipe.
5. **Animate the approved action.** Give preparation time, a readable effort
   moment, a distinct release and recovery. Keep feet grounded, hands attached,
   elbows anatomically consistent and payloads continuously supported until release.
   Use simulation time so pause freezes the pose. Do not change fire rate to make
   an animation fit; match the existing attack interval and shot event.
6. **Review the motion.** Provide east/west, play/pause, slow playback and frame
   scrubbing for screenshots. Check each transition as well as the key poses.
   Correct clipping, duplicate sleeves, pop-in and disappearing objects. A new
   net should open into a recognizable net, rather than become a small cloth.
7. **Playtest before promotion.** Inspect real battlefield scale, crowds, both
   facings and vertically offset targets. Verify projectile origin, target
   readability and no rapid facing flips. Owner acceptance of the study and the
   game are separate gates; record what was actually approved.
8. **Keep a reproducible record.** Save exact prompts, source references, asset
   provenance, pose/animation parameters, reviewed captures and decisions. Commit
   runtime assets. Run `npm run check`, `npm test`, `npm run build` and perform
   visual verification. Record limitations rather than claiming unperformed tests.

## Current status

- Side-only presentation: accepted after battlefield playtest.
- Squirrel side push/pull study: accepted improvement, still awaiting runtime
  integration. North/south generated poses and atlas are retired experiments.
- Turtle: v3 two-handed load poses accepted; owner requested subtle body movement.
  Continuous side rig motion study accepted as a keeper. Open-hand artwork and
  finished net appearance remain follow-up work; runtime integration and
  battlefield acceptance are still pending.
- Beta art work focuses on squirrel and turtle. The process also applies to later
  towers; other characters are not being redesigned in this pass.

## Starting a new agent session

No dedicated tower skill is required. Start in this repository and use:

> Work on the [NAME] tower using docs/TOWER-ANIMATION-PROCESS.md and ADR 031.
> Study the accepted squirrel side motion and turtle two-handed casting study.
> Research an action unique to this tower. Preserve its approved appearance and
> use side views only, mirrored left/right. Show coherent poses for my review
> before animating. After pose approval, make a continuous motion study with
> subtle body effort, planted feet, play/pause, slow playback and scrubbing.
> Review the motion with me before integrating it into the game. Keep provenance,
> record acceptance and remaining work, and verify at actual battlefield scale.

Accepted study references:

- Squirrel: `review/2026-09-28-animation-prototype/squirrel-study/` (side only;
  cardinal experiments in that directory are retired).
- Turtle: `review/2026-09-29-turtle-study/poses-v3.png` and `motion/`.

The research and imagegen skills can support those steps when available; this
document owns the tower-specific workflow and approval status.
