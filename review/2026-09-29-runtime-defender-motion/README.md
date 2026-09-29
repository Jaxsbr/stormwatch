# Accepted side motions in the runtime — 29 September 2026

The owner authorized integration of the accepted Squirrel side push/pull and Turtle
two-handed casting studies, alongside their promoted map/wave tuning. This record
verifies the implementation; it does not claim a new owner art approval.

## Provenance and implementation

No new bitmap art was generated. Body and arm textures remain the committed
`public/art/v2/squirrel-side-defender-v1` and `turtle-side-defender-v1` assets,
with their existing rig manifests, source hashes and prompts. Pose parameters come
from the accepted [Squirrel study](../2026-09-28-animation-prototype/squirrel-study/README.md)
and [Turtle study](../2026-09-29-turtle-study/README.md).
`src/render/accepted-defender-motion.ts` and `defender-rig.ts` apply them in gameplay.
The procedural held and flying rope net comes from the Turtle study's hanging U,
weighted rim and opening disk, implemented in `src/render/cast-net.ts`.

## Matched rendered captures

Captures use headless desktop Chromium, 1280px width and device pixel ratio 1.
The rig panel renders at 230px body height in both directions. Same resources,
camera and pose input are used for the original main rig and integrated rig:
age 1.16s, cooldown .19s, interval 1.35s. Turtle consequently samples its backward
load; Squirrel samples its full draw. Release uses age 0/cooldown 1.35s;
follow-through uses age .2s/cooldown 1.15s. No demonstration projectile is rendered
in the isolated panel; the real battlefield owns projectile flight.

- [Before load](before-load.png): original main animation.
- [Integrated load](after-load.png): accepted effort and two-hand net support.
- [Release](release.png) and [follow-through](follow-through.png): east/west.
- [Net in flight](net-flight.png): real projectile after the two-hand release.
- [Workbench](workbench-promotion.png): both promotion actions and the status
  identifying pending edits outside the selected wave after draft reload.
- [Battlefield](battlefield.png): actual Last Lantern game and shared Battlefield
  at 11 simulation seconds. Increased starting funds isolate visual verification;
  this capture is synthetic evidence, not proof of campaign affordability.

The headless harness observed one Turtle and three Squirrels using the new body
meshes, east/west Squirrel facings, eight real Turtle shots and nine Squirrel shots,
with no page errors. The net-flight capture advances to 11.7s, with nine Turtle
shots and eleven Squirrel shots. Repeated real updates while paused preserve
simulation time.
Manual inspection of captures checks body proportions, feet, arm joins, mirroring,
held net and gameplay scale. Original closed hands/sleeve overlap remain the known
accepted-study limitations; no replacement art is claimed.

## Reproducible regression seams

Run `npx vitest run tests/defender-motion.test.ts tests/workbench-api.test.mjs`.
The rig tests construct real resources from the committed descriptors and test
load, shot, pause, idle, upgrade cadence, reuse, reflection and net handoff.
Workbench tests run the real local promotion adapter against disposable files and
reload through the real runtime content middleware. All-scope promotion also
round-trips saved draft data and compares the Playtest and reloaded configuration.

Run `npm run check`, `npm run format:check`, `npm test`, `npm run build` and
`npm run build:workbench` for the repository checks. The production artifact check
keeps authoring and QA modules outside the game. Built `game-content.json` must
match the canonical recipe, including all owner-promoted waves.

Physical mobile performance and a new owner battlefield review remain unverified.

Final local verification: type checking, formatting, all 288 tests across 51 files,
game build, workbench build and production boundary check pass. The built runtime
JSON is byte-identical to the canonical promoted recipes. Existing bundle-size
warnings remain.
