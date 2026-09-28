# Front/rear archery study — reset after rejected iteration 03

Status: concept 02 awaiting owner review. No new runtime parts or animation.
The level side-view action is accepted; the north/south animation from iteration
03 is rejected, not a foundation to promote.

## What failed, concretely

- `projectedReach` uniformly scaled arm meshes to 72%, including their thickness,
  hands and sleeve caps. This made small arms; it did not draw depth overlap.
- Narrowing a side-profile bow to 38% kept the wrong curvature, painted lighting
  and string geometry. It did not produce a bow seen from the target.
- The rear socket overlay rendered any arm-mesh fragment inside an ellipse in
  front of the body. That includes a hand passing through the region: exactly
  the hand-through-shoulder artifact reported by the owner.
- Fixed broad, symmetrical torso/shoulder drawings were combined with side-view
  arm poses. That prevents coherent shoulder-to-elbow-to-wrist alignment.
- Review relied too heavily on isolated render captures. Numeric tests and a
  successful build cannot approve anatomy, projection or motion.

## Sources actually inspected

1. [Online Archery Academy: draw and full draw](https://www.onlinearcheryacademy.com/archery-draw-technique/).
   Inspected its animated rear/overhead elbow-path reference and front anchor
   photograph. The draw elbow travels around the body into alignment, while the
   hand locates close to the neck/jaw. The overhead view makes the depth overlap
   explicit: the extended bow arm and folded drawing arm are different shapes.
2. [Online Archery Academy: stance and posture](https://www.onlinearcheryacademy.com/archery-stance-and-posture/).
   Shoulder, hip and foot orientation establish alignment; the head turns toward
   the target. Fixing detached arms cannot compensate for an unsuitable torso.
3. [World Archery: full-draw faces](https://www.worldarchery.sport/news/102121/full-draw-faces-how-six-different-international-archers-anchor).
   Anchor positions vary. Do not prescribe a universal exact contact point from
   one photograph; choose a coherent lower-jaw reference for our stylized animal.

Camera vocabulary matters: an archer's anatomical front/back is not necessarily
viewed from the target or from behind the shooting direction. For Stormwatch,
south is target-facing camera, north is camera behind the firing direction.
Reference photographs at oblique angles must not be copied as cardinal views.

## Pose decisions inferred for this character

### North — allow the silhouette to do less

Keep the body as the main occluder. Hands and string can be mostly invisible.
Animate a small shoulder loading/settling action and an exposed drawing-elbow
contour only if the pose places it beyond the silhouette. Bow tips are visible
only if they genuinely clear the head/body. Do not slide the bow sideways to
show it, or add a visible string triangle over the back. Release can read through
the exposed bow tip response and the actual arrow emerging beyond the silhouette.
An authored connected rear shoulder/elbow contour is preferable to a free hand
moving through a painted sleeve socket.

### South — depth needs new drawing

Use a coherent upper-body pose with naturally oriented shoulders, one bow arm
extending toward the camera, and the drawing forearm returning to a lower-jaw
anchor. Retain full limb/hand thickness. The near hand and forearm overlap farther
anatomy. Bow, nock and arrow share a shooting axis. A front-facing bow does not
show its full side crescent, and its string does not form a broad side-view V.
A departing arrow must be foreshortened along that same axis.

## Asset recommendation

Generate/review assembled upper-body key poses first: loaded/full draw, release,
and recovered. Keep shoulder, upper-arm and sleeve joins coherent in each pose.
Preserve the accepted identity and planted base. After approval, choose the fewest
separations needed: bow/string response and small connected shoulder/elbow motion.
Do not generate a large bag of disconnected limbs before proving the assembly.
North can use fewer replacement poses than south because much of its action is
hidden. Full articulated arms need not be visible or independently animated there.

## Generation experiment and verdict

Built-in ImageGen, existing front/rear body art as identity references. Exact
prompts are in `prompts.md`. No paid API fallback or external asset service used.

- `concept-01-rejected.png`: more coherent anatomy but south arrow points sideways
  across the face; string shows a side-profile triangle. Rejected as shooting
  geometry. This documents that generation is not automatic pose validation.
- `concept-02-review.png`: targeted correction brings front grip/nock/arrow into
  a substantially more end-on alignment. Rear hands are hidden by the torso,
  leaving shoulder contours. Useful assembled pose candidate; NOT approved art.

Remaining limitations: the concept has a different bow length, altered stance,
coat details and tail placement relative to the original cutouts. South's bow
obscures part of the face; the shoulder alignment and exact string/arrow clearance
still need owner review. Rear exposed bow placement must also be checked for the
chosen camera. Do not extract these directly as production parts or claim they
solve animation. A matched key-pose set must preserve approved scale, feet and
identity before integration.

## Repeatable gate added to the process

Before rigging any new view, approve one complete full-draw pose. Check: firing
axis; shoulder/elbow/wrist chain; grip and nock contact; limb thickness; what is
hidden; silhouette at game size. Then approve release/recovery in the same camera.
Only then split parts and animate. If a generation misses one of these, record
and correct it rather than conceal it with scale or layering adjustments.
