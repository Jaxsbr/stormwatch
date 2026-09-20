# Directional roster asset review — 20 September 2026

Six native ImageGen calls produced front/rear cutout sheets for weasel, boar and badger, referencing their approved side bodies. Exact prompts and original PNGs are retained in `assets/source/reboot/`; specifications are `assets/pipeline/specs/<role>-<view>-cutout-rig.json`. Each imported rig contains body, nearLeg and farLeg, anatomical hip attachments, hip/knee/ankle/sole landmarks, a fixed part scale and explicit hipHeight. No runtime files were edited for asset production.

Static browser assembly comparisons use one fixed display scale and the original side rig alongside front and rear. Captures: `weasel-directional-assembly.png`, `boar-directional-assembly.png`, `badger-directional-assembly.png`. All six show separate native-alpha legs, clean hip overlap, correct shield-side reversal and front toes/rear heels. Apparent heights remain close to their side reference (boar front helmet slightly higher). Badger rear retains rounded armor at the back of its knees; this is an anatomical art limitation. These stills verify assembly and identity, not gait or smoothness.

Public descriptors: `public/art/v2/{weasel,boar,badger}-{front,rear}-rig-v1/rig.json`. hipHeight: weasel 145, boar 130, badger 155 source units. Delivery compression is owned by root; initial extraction was lossless. No extra generation is planned.

## Live integration review

Chrome extension browser, viewport1280×720, dev4173, current Y55 projection. Used visible Start wave, Record10seconds, Download recording and Pause buttons; no hidden game state. Source changes were frozen during capture. Recordings are actual canvas MediaRecorder WebMs at normal simulation speed:

- `roster-direction-opening-10s.webm`: wave0.4–10.4s, all roles entering and first upward corner; runner begins front view at far corner.
- `roster-direction-vertical-10s.webm`: wave18.1–28.1s, boar/front, rat/rear, badger side→front.
- `roster-direction-return-10s.webm`: wave32.5–42.5s, boar/rear→side and badger/front→side.
- `roster-direction-live-c.png`: wave47s, badger rear on final upward segment.

The matching `*-frames.png` contact sheets extract actual consecutive one-second samples from those recordings. `badger-front-gait-frames.png` extracts eight successive125ms poses at native pixel size, beginning7s into the vertical recording. Extraction changes presentation only; recording is unchanged.

Findings: all four roles select the correct front/rear direction along vertical path segments and return to side at horizontal corners. Each keeps its own identity, armor and approximate apparent height; no visible hip gaps or detached boots in inspected poses. Discrete sprite-view changes are visible and accepted for this initial implementation. Badger front legs still lean diagonally screen-left together during straight downward travel; alternating movement exists but grounded alternating contact is not visually convincing. Rear badger sampled pose has a similar diagonal sweep. This is a runtime directional leg-orientation/IK review issue; the static assembly has straight, distinct legs. Heavy body silhouettes remain relatively rigid.

`character_animation`: **3/5 provisional, medium confidence**. Direction support is a clear improvement; retained directional gait weakness and absent action/impact evidence prevent4. The no-tower staged fixture does not test hit/death/action transitions. CUA exposes sampled screenshots rather than continuous perceptual playback: real-time recording and consecutive-pose review establish changed poses/view selection, but do not certify full cadence, smoothness or exact footplant. Audio unassessed. No runtime edits in this review.


## Tower spacing comparison

Matched1280×720 captures `after/tower-spacing-before.png` and `after/tower-spacing-candidate.png`: candidate adds useful vertical separation but reduces displayed tower footprints from roughly110–125px to about65px. Operators, stone cup and net drum lose meaningful detail; lodge becomes a tiny roof. Recommendation: keep extra world/cell separation while restoring tower display footprint to approximately100–115px, then test legal placement clearance. The candidate feels too distant for the intended art-forward demo. This is a visual comparison, not a measured collision test.

## Upright frontal gait correction follow-up

At Y74 projection, Chrome1280×720, captured `frontal-corrected-10s.webm` through visible controls at wave27.6–37.6s. `frontal-corrected-live.png` records wave33.7s. Native-pixel consecutive125ms crops: `frontal-corrected-badger-frames.png` and `frontal-corrected-boar-frames.png`. These show badger front and boar rear respectively; this targeted pass does not independently recapture boar front or badger rear.

The identified both-boot diagonal slant is resolved for the sampled views. Boots remain upright, each leg alternates extension, body identity stays fixed, and hips stay covered. A planted boot retains approximately the same ground-screen position across several adjacent frames while the body advances, supporting improved stance contact. Badger now reads as a forward march rather than sideways legs under a front torso. Boar rear alternates its own heel-facing boots, although its short legs remain partly obscured by the heavy body.

Targeted directional walk gate: **passes, approximately4/5 at normal playing size, medium confidence**. Full `character_animation` dimension remains **3/5 provisional due to missing action/impact evidence**, not because the prior diagonal gait defect persists. Continuous cadence/audio remain unassessed through this sampled tool view. No source edits or generation.
