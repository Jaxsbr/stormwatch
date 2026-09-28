# Annotated defender animation diagnosis

Scope: diagnose the owner's marked areas before choosing corrections. The game
rigs and runtime assets have not been edited in this diagnosis. The review page
has been reduced to the owner's selected four-direction board plus tower choice
and play/pause.

Evidence images in this directory are the owner's annotated screenshots supplied
with this request. Frame samples are 30 fps, time measured after a shot.

## 1. Squirrel — rear and front bow (owner-squirrel.png, F05)

**Rear, confirmed:** the bow sprite draws over the squirrel's back. Body z is 1;
bow z is 2. Both are transparent sprites with depth testing disabled, so the
larger painter order wins. The rear arms are z 0, hidden behind the body, while
their weapon is painted in front. This disconnects the hands and bow visually.

**Front, confirmed:** `DefenderRig.update` rotates the bow by -π/2; rear uses
+π/2. Those are screen-plane rotations of an upright illustrated bow, turning it
sideways. The same angle also supplies arrow direction, conflating aim direction
with bow orientation. Grip/string targets are then taken from the rotated bow,
which crowds the front-facing hands around that sideways shape. Both front arm
targets are reachable at F05, so arm-length clamping is not the explanation for
this particular front pose.

**Correction needed:** author distinct front/rear bow and hand poses, with proper
foreshortening and view-dependent occlusion. Keep the bow plane separate from the
arrow's aim direction. Validate the string and projectile origin together with it.
Simply rotating all views or hiding every weapon would not address the front pose.

## 2. Turtle — sleeve holes and odd arms (owner-turtle-arms.png, F00)

**Rear empty sockets, confirmed:** the body texture itself has two dark sleeve
openings. The moving arm textures contain their own complete sleeve caps. Both
rear arms are z 0 and the body is z 1. At the authored shoulder anchors the body
pixels have alpha 253/255, so an arm behind them is almost completely obscured.
The apparent sleeve opening is painted dark; it is not a transparent opening
through which a rear-layer arm can be seen.

**Side arm, confirmed:** the generic throwing-hand target at F00 is 1.29 times
the actual arm's maximum reach. The solver shortens that request by 88.8 local
art units and straightens the elbow nearly completely. This deforms an illustrated
bent arm into a pose it was not authored to support. East and west are the same
side rig, mirrored, so the two marked side symptoms share a cause.

**Front marked holding arm:** its sleeve cap rotates with the limb over the
separate sleeve painted into the body. The join can expose the original socket
and look detached/doubled. Its requested reach is 95% of maximum at F00, not an
unreachable target. The other, throwing arm also has a separate 144%-reach defect.
Do not mistake that other arm's clamp for proof of the marked holding-arm defect.

**Correction needed:** define one consistent sleeve/shoulder seam, split body
occlusion where necessary, and author reachable poses for each view. The front
and rear views need projected/foreshortened limb poses rather than treating the
side arm as a freely rotating flat shape. Reversing every elbow sign is not a
supported fix: all 18 arm fixtures reconstruct their original rest pose correctly.

## 3. Turtle — net over the shell (owner-turtle-net.png, F11)

**Confirmed:** payload z is 4 versus body z 1, so the held net is always painted
over the shell when their screen areas overlap. Its position follows the throwing
hand, even when that hand is behind the body.

Visibility is a separate hard gate: `payload.visible = age > 0.3`. The net is
absent at F09 (0.300s), appears at F10 (0.333s), and disappears at the next shot
when age resets. The owner's F11 capture is immediately after that appearance.
The boolean gate explains the sudden appearance/disappearance; wrong layering
makes that handoff visibly happen on the shell. The isolated review board does
not render the outgoing projectile, so it cannot establish projectile continuity.

**Correction needed:** use correct rear occlusion and a deliberate reload/release
handoff. Show a replacement net entering the hand in an authored movement instead
of abruptly appearing over the shell. Verify the final release against the game
projectile as well as in this board.

## 4. Skunk — rear/front arms (owner-skunk-arms.png, F00)

**Rear raised arm, confirmed:** unlike the turtle, the skunk's rear throwing arm
has z 3, above body z 1. The generic rear throw target moves its hand upward and
inward; it is then drawn across the visible back/neck instead of being occluded
on the forward side of the character. The other arm is z 0 and disappears behind
the painted sleeve opening, explaining the asymmetric empty socket.

**Front marked arm:** the same body-sleeve/arm-sleeve overlap and unsuitable
projected pose as the turtle. Layering alone will not repair the shoulder seam.
The side throw additionally requests 189% of maximum reach; the front throwing
arm requests 121%. These are separate measured defects, not a claim that every
marked sleeve problem is caused by reach clamping.

**Correction needed:** correct the rear arm's occlusion, author the shoulder join
and per-view throw positions, then verify a full cycle in all directions.

## 5. Skunk — lower back/pelvis (owner-skunk-body.png)

**Confirmed source location:** the pale central tuft between the split green
coat tails, above the legs, is already painted into `skunk-rear-defender-v1/body.webp`.
It remains with all moving arms and props absent. No runtime leg or pelvis
animation exists in `DefenderRig`; the body stays a single planted sprite.

**Owner correction:** the annotation concerns where the tail connects to the
body, not the pale fur marking. The original visual interpretation was incorrect.
Tail-root anatomy needs a separate review; skunk is deferred while beta work
focuses on squirrel and turtle.

## Reproduction and confidence

`npx vitest run --config .scratch/tower-animation-review/diagnosis.config.ts`

This opt-in probe constructs the real `DefenderRig`/`DefenderArm` with the actual
JSON descriptors and empty textures (no browser needed for order/geometry). It
produces three expected failures for rear bow order, rear net order and front bow
orientation, plus two passing probes for rest-pose reconstruction and measured
hand reach. It is intentionally excluded from the normal test discovery pattern;
these are recorded, unfixed findings, not completed regression fixes.

Numeric results: `.scratch/tower-animation-review/diagnosis-probe.json`.
Rest-pose reconstruction differs by less than 0.001 local art units across all
three animals, three views and both arms. Body texture sampling confirms rear
sleeve opacity; direct image inspection confirms the duplicated sleeve artwork
and skunk's static pelvis marking. These numeric checks support the diagnosis but
cannot approve animation quality.

Recommended order: establish shoulder/sleeve construction, author reachable
per-view poses, correct depth ordering and weapon projection, then review
reload/release with projectiles. Handle the skunk body marking as a separate art
correction. Use matched F00/F05/F11 captures and full-cycle review after each change.
