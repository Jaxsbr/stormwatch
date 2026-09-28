# Animation desk — throwaway review prototype

Question: which review workflow makes tower animation feedback precise enough to act on?

Run `npm run prototype:animations`. The local page is
`/review/2026-09-28-animation-prototype/index.html`.
Use Chrome for file downloads. The Share feedback dialog also exposes selectable
text, and Open notes accepts pasted file contents as well as a file picker.

## Three layouts

- **A — Close-up:** a large single direction, with notes alongside it.
- **B — Direction board:** north, east, west and south at the same instant.
- **C — Frame storyboard:** six sampled moments through one attack, with notes below.

Use the floating arrows to switch layouts, or `?variant=A`, `B` or `C`.
Keyboard left/right also switch layouts when a form control isn't focused.

Choose a tower, direction and base/upgraded attack cadence. Play at 0.1–1×,
scrub, step a frame, or zoom. Clicking an image freezes the pose and marks a
spot. Typing a note also pauses. Save the observed problem and the desired
change separately. The initial three reports come from the owner; their starting
frame is explicitly **not** evidence of the reported defect.

Each captured note holds the tower, direction, frame sampled at 30 fps, time
after a shot, tower level, asset view, diagnostic view, zoom, revision, cadence,
marked point and PNG. Share feedback prepares readable Markdown for a chat.
Save notes file downloads a JSON containing all notes and their original images;
Open notes restores it. Different notes with colliding IDs are kept with new IDs.
Notes live in memory until exported. Save before closing or changing source files.
The PNG preserves original evidence when the renderer later changes.

## Fidelity and limits

The page imports the real `DefenderRig` and its original `CutoutResource` assets.
Catalog attack intervals and the upgrade interval factor come from the same
runtime content endpoint as the game. West reflects the side rig; north uses
rear artwork; south uses front artwork. No alternate animation implementation is
used. Diagnostic controls only change visibility/opacity of this page's instances.

This is a repeating isolated attack fixture, not a simulation replay. No target
switching, first-shot idle, projectiles, impacts or battlefield effects are shown.
The 30 fps frame numbers are review samples of a continuous pose function, not
frames in an authored spritesheet. A nonintegral frame duration rounds the loop
up to the next sample. Captured coordinates are also stored in scene space so
new notes keep their marker on the same point when the panel aspect changes.

Source and runtime art are unchanged. The page is outside the production entry
graph; no new generated artwork, service, database or account is involved.

## Verification

- `npm run check`: passed.
- `npm test`: 50 files, 276 tests passed.
- `npm run build`: passed, production boundary verified across 233 files.
- Browser: all three layouts, squirrel/turtle/skunk assets, base/upgraded cadence,
  frame selection, annotation, translucent body diagnostic and feedback text.
- Exported a four-note file from Chrome, decoded and visually inspected its PNG,
  then reopened its contents through Open notes and restored Turtle/North/F16.
- Narrow viewport layout inspected at 390 CSS pixels; auto-framing was adjusted
  after the skunk tail clipped. This is layout emulation, not mobile performance.
- Native file-picker automation was unavailable; the pasted-file import route
  exercised the same parser and restoration. File downloading was verified in Chrome.

Verdict pending owner feedback. The prototype is captured on
`codex/tower-animation-review-prototype`; no permanent layout has been selected.
