# Skunk underhand motion study 01

Status: **owner accepted motion study 01**: “animation is sufficient, proceed.”
This accepts the isolated motion study. Gas and real battlefield integration
still require their own approval; the known study limits below remain recorded.

Run the normal Vite development server and open
`/review/2026-10-03-skunk-study/motion/index.html`.

## Scope and construction

Reuses the original Skunk side body, feet, face, tail and arm textures; no generated
whole-character frames. The body is a continuously deformed mesh, with effort
fading to zero near the feet. East and west are reflected views of the same pose.
This is an isolated review page; production code, content and cadence are unchanged.

The old closed throwing paw had insufficient reach and put the enlarged flask
over the face. The study instead reuses the original open support-arm texture for
the near throwing arm, at scale .88 versus its original .65, anchored to the near
shoulder. Both bone lengths scale together. This adaptation and the larger sleeve
remain visible owner-review choices; it is not an approved runtime rig change.

Canonical `towers.stone.interval` drives the cycle (2 seconds in this checkout).
Ready occupies 0–.12; the low backswing .12–.48; a brief hold .48–.52; the forward
swing .52–.66; release is .66; follow-through extends to .76; recovery ends at .94.
Body effort is at most 9 source pixels backward / 7 forward, 7 down / 3 up.
Reduced motion disables this body effort and flask rotation; system preference
also starts the study paused. UI offers normal, 35% and 10% speed, pose buttons,
scrubbing, 30 Hz frame steps and a 112 CSS-pixel body reference.

The held flask follows the actual solved grip; the flying flask starts at the
same solved release position, even after arbitrary scrubbing. Its flight is a
demonstration only. Future integration must use real shot/status state, including
first shots, target loss, pause, sold towers and vertically offset targets.

## Known study limits

- Reload fades a replacement flask in near the belt from .88–.96; final retrieval
  choreography remains to be designed if the owner wants a physical pickup.
- Existing sleeve overlap and painted open palm remain; no new opening fingers.
- Flask flight fades at the panel edge. No impact, gas or poison outcome is shown.
- Separate mirrored close-up and small-scale inspection do not establish
  battlefield acceptance, touch-device acceptance or physical mobile performance.

## Asset provenance

`flask.png` is an unmodified built-in ImageGen output derived from the approved
revision-2 sheet, using [flask-prompt.txt](../flask-prompt.txt). It retains actual
alpha (verified minimum 0, maximum 255; not opaque). No API/CLI fallback. Source
body/arm provenance stays in `public/art/v2/skunk-side-defender-v1/rig.json`.
Only the new prop is generated; all other new visuals are continuous transforms.

## Verification

Browser inspection exercised preparation, release and follow-through in both
facings, slow playback, pause, scrub, next-frame stepping, small scale and reduced
motion. The next-frame control advances 1/30 second at canonical cadence. No
console errors or warnings were reported in the inspected session. Captures:
[preparation](preparation.jpg), [follow-through](follow-through.jpg),
[small scale](small-scale.jpg).

`npm run check`, `npm test` (321 tests, 58 files) and `npm run build` passed;
production boundary checked 241 files. Existing bundle-size warning remains.
The isolated study JS also passed `node --check`; manual browser review supplies
its visual/control verification. No new simulation rules were added.
