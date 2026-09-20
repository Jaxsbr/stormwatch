# Visual reboot — working status

This branch is in progress. It is not a new release or a completed acceptance report.

## Explicit owner decisions

- Approved consistent-scale woodland v3 background in the actual game.
- Rejected the first perspective valley plates.
- Rejected 45-degree diagonal/isometric tower rigs.
- Approved the top-down bolt proof and instructed that every tower use that view.
- Animation approval is separate and still requires actual assembled motion evidence.

## Implemented during this round

- Horizontal orthographic renderer and continuous textured path over native biome art.
- Compact edge controls and expandable economy forecast; less decorative copy.
- Descriptor-driven illustrated sheets/plates/material import and cutout import.
- Native character leg parts, two-bone solver and first deterministic walking rig.
- Approved-view bolt parts with a separately drawn string, loaded projectile, recoil
  and operator reload gesture. Base architecture is immutable.
- All four tower roles now use the approved overhead parts in gameplay and portraits.
- Bolt and net mechanisms aim independently of their fixed platforms. Bolts use
  directional arrow geometry; projectile origins are retained from release.
- Cutout descriptors are validated before loading textures. All four enemy roles
  now use the shared character rig; new roles still need motion acceptance.

## Current gates

- Background projection: owner approved for woodland; riverbank reviewed as matching,
  gameplay contrast still to verify.
- Tower projection: owner approved bolt proof applied to all four assembled roles; bases remain screen-aligned.
- Character movement: distance-driven path stance anchors and hip reach corrected;
  all four roles load and traverse the staged path. Full motion acceptance remains open.
- Tower motion: fixed draw order made string, arrow and arm movement visible;
  active-wave pause verified identical. Aim/flight mismatch corrected after review;
  independent release-frame review passed aim alignment and stable projectile origins.
  Remaining: operator hands do not follow the swiveling controls convincingly at
  every angle; net reload is recoil rather than an articulated crank.
- Whole-game menus, complete mouse/touch loop, performance, clean checkout and final
  demo: must be repeated after the visual changes settle. Earlier MVP results do
  not establish these new visual gates.

Rejected candidates remain versioned review evidence. Do not mistake a successful
import, still image or test result for a passed motion/feel gate.

Latest verification: type check, 78 tests and production build pass. All eight runtime
rig descriptors validate. `after/all-towers-approved-view.png` records the full lineup;
`tower-aim-fixed-review.md` records the independent firing follow-up.

## Landscape usability follow-up

At an emulated 844×390 viewport, normal mission navigation, bolt placement
(175→135 crowns), and wave start succeeded. Rotating to390×844 showed only the
orientation dialog in the accessibility tree. Rotating back preserved135 crowns,
12 hearts, wave1 and the built tower, with the watch paused for explicit resume.
Hidden game controls are inert while portrait is blocked. This is browser size
emulation, not physical touch or hardware performance evidence.

The native pause frame initially clipped below the short battlefield; compact
border/padding rules were applied and visually verified in
`after/phone-landscape-pause.png`. Entrance/exit path rendering now extends into
both horizontal scenery edges at that phone size without changing simulation
waypoints. Operator parts now follow bow/net orientation around their mount;
normal-size live still review shows the crew following the mechanism, but a new
independent motion pass is still needed.

Rejected sheets/rigs/plates moved to `rejected-assets/` with provenance preserved.
Production output is19,257,397 bytes, down from23,383,498 before cleanup. Latest
78 tests and build pass. Initial transferred bytes and live performance remain
separate outstanding checks.

## Desktop menu scoring and correction

Independent desktop review scored menus3/5, UI identity3/5, and framing4/5
(desktop only). See `desktop-menu-rubric-review.md`. Its briefing overflow issue
was then fixed with a bounded viewport grid, a separately scrollable decision
area, and always-visible footer. The three-card state was visually verified at
1280×720 (`after/desktop-briefing-fit.png`) and844×390. Cards now share the authored
timber frame. Four-card unlocked state still requires follow-up review; scores
remain provisional and have not been upgraded from the independent assessment.
Short-screen wave, rescue, selection and cancel controls now have44px minimum
height. Full touch-target audit remains pending.

## Normal play and directional follow-up

Normal production UI play completed all eight Lantern Pass waves:12/12 hearts,
178 raiders stopped,117 interest,1167 final crowns and3 stars. Rainstone and the
fourth card unlocked. Retry reset to175 crowns,12 hearts,wave0/8,no towers and1×.
See `after/normal-lantern-victory.png`. Waves1–3 used1×; waves4–8 used2×. The
associated screenshot-cadence MP4s are review evidence, not a smooth final demo.
That run predates the new directional roster integration.

The four-card briefing subsequently passed desktop fit review in
`after/desktop-four-card-fit-review.png`. Map plaques were compacted to uncover
landmarks. No whole-menu rescore has yet replaced the provisional score.

Front/rear rigs now exist for all four characters and are selected by path travel
direction. Static assemblies match the side roster; normal-speed runtime review
is pending. Delivery encoding derives quality92 WebPs directly from native sources
with byte-exact alpha. `after/rat-delivery-comparison.png` shows native left and
delivery right at144px body height; no material detail or silhouette loss was seen.

An opt-in `?record` control records20 seconds of the actual battlefield canvas at
30fps without altering the game. These clips exclude the HTML HUD and must be
labelled canvas-only. Recording verification and final demo assembly remain open.

## Spacing and frontal gait corrections

The first spacing candidate reduced root heights to74/72/74/56 and was rejected
in independent visual review: it lost the close, detailed game presentation.
The current compromise uses X96/Y74,origin112/126,minspan660, with fixed root
heights96/90/96/66. Compare `after/tower-spacing-before.png`,
`after/tower-spacing-candidate.png` and `after/tower-spacing-balanced.png`.
`after/tower-adjacent-balanced.png` includes the previously problematic stacked
placement. The mechanisms are individually readable and the path clear. Platform
edges still overlap, making a continuous wooden strip; this is a remaining visual
weakness, not a claim of zero overlap. Selection delineation needs strengthening.
Simulation positions, valid placements and economy have not changed.

Directional review caught front/rear legs applying side-view knee bending, which
tilted both badger boots diagonally. Frontal views now project the leg cloth in
depth while keeping boots upright and rigid. Independent follow-up found upright
alternating badger-front and boar-rear steps with stable hips and visible ground
contact. See `directional-roster-review.md` and `frontal-corrected-10s.webm`.
Walking passes this targeted review; action/impact evidence is still needed for
the full character-animation score.

Net frame/drum/crank now have independent native parts and flat root attachments.
The whole launcher follows aim/recoil while the crank completes a smooth full turn
per simulation reload. The drum remains seated. Static assembly review passed;
live mechanical review is in progress. Typecheck,78 tests and build pass.

## UI and delivery verification

Inspection now occupies the bottom control tray instead of covering the selected
tower. `Structures` restores construction choices. Independent desktop/phone
recheck verified upgrade, sell, selection brackets and the whole settings frame;
UI identity now supports4/5 for those reviewed states (`ui-rescore.md`).

Normal Rainstone wave1 completed at1× with12 hearts. Payout was54 crowns:
14 interest +12 trade +28 wave reward. The actual canvas capture is
`after/rainstone-normal-wave-one-20s.webm`,1280×556,19.96s,29.97fps. It excludes
HTML HUD/audio and does not by itself establish the full demo gate.

Cold title readiness repeated at1.600s under a local server-shaped10Mbps aggregate
body/100ms response-delay/no-store profile. Complete server response bodies total
1,266,475 bytes. Browser ResourceTiming omitted the decoded title image, so its
smaller reported total is explicitly incomplete. See `cold-load-server-accounting.json`.
The measured build was19.7MB; retained exact prompts add a small amount afterward.

The first updated stress session at1480×1273 failed frame-time targets despite
near60 median FPS: p95 was25.4–33.1ms, with a1.18s worst outlier. Evidence is
`docs/evidence/desktop-performance-cua-2026-09-20.json`. A new1280×720 session is
pending after reducing leg mesh columns12→2 and removing per-frame bound scans.
This optimization preserves20 vertical knee-deformation strips. No performance
pass is claimed from median FPS alone.

The prior margin note was inverted: row7 was near the bottom, not top. OriginY106
(formerly126) centers the full rig bounds with about8–9px phone margins. Net
reload now also draws the rope payload forward on its rails and hides it when
the simulation projectile takes over. These latest changes await full follow-up.

Targeted rope-payload reload review now passes4/5 provisional, superseding the crank-only3/5; see `net-and-spacing-review.md`. Current built distribution is19,746,110 bytes including exact public rig prompts, below the20,000,000-byte budget. Whole tower and demo coverage remains open.

## Stone release and recovered stress result

Stone arm now aims at its target and foreshortens around the axle for its lift/release, then extends during recovery. A loaded stone sits in the cup until release; muzzle calculation follows the current scale. Targeted independent review passes4/5 (`stone-lift-review.md`). Typecheck,78 tests/build and diff whitespace checks pass.

Recovered optimized stress evidence is `docs/evidence/optimized-performance.json`: first two p95 intervals17.6/17.5ms pass, third25.1ms fails, and worst intervals216.6–867.2ms still fail. This is improvement, not acceptance. Root requested wall-clock overlap clarification because a later build/dev review began after reporting stalled.

## Owner-directed animal defenders

Owner praised enemies/map/background but found mechanical towers difficult to read. Squirrel archer, skunk rock thrower, turtle net thrower and donkey trader replace their presentation (ADR005). Native side/front/rear parts exist for all four; mirrored side supplies the fourth view. DefenderRig animates separate arms/weapon and freezes the view during shot release. Low placement tiles, portraits and names are integrated without simulation-rule changes. Mechanical assets are retained outside runtime under superseded-mechanical-assets. Build/typecheck/78tests pass; distribution17,281,328bytes.

Source-stable staged5xHP combat recording at normal speed: after/animal-defender-combat-10s.webm, wave16.4–26.4,1280x660 canvas. This is not normal encounter balance/demo evidence. Independent motion review pending. The earlier normal Rainstone attempt reached preparation for wave7 with12hearts/563crowns on the mechanical build; its wave6 download did not persist and no clip is claimed. Final whole-game scores must be refreshed for the new defenders.


Animal defender follow-up: fixed-length two-bone arm deformation and all12 elbow landmarks verified. Follow-up independent targeted animation review4/5, medium confidence; prior swelling resolved, hand/bow/payload contact coherent in observed views. Typecheck and build pass;90tests pass. Normal new-renderer Rainstone wave1 held12hearts;47payout included7interest12trade28reward; turtle upgrade verified. New actual1× gameplay clip: after/animal-normal-wave-one-20s.webm. Full demo/performance acceptance still open.
