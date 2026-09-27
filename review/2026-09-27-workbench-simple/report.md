# Single-draft workbench verification

The workspace keeps the visual wave editor and replaces Test/Experiments with Playtest and Promote. One browser draft auto-saves accepted edits. New named maps copy an existing layout; new waves start empty and accept enemy groups. Promotion writes selected map settings and wave to local game content and preserves unrelated content. Agent CLI automation remains available.

## Verification

- Typecheck, 250 tests across 45 files, production build, workbench build and formatting pass. Production boundary verified across 220 files. Existing bundle-size advisory remains.
- Browser: edited a wave, reloaded and restored the auto-saved draft; promoted through both development and built-preview servers using disposable content files.
- Browser: created Willow Hollow from Rainstone Crossing, reloaded its empty wave, added enemies, played it, promoted it, added Second rush, changed its layout and promoted again. The campaign displayed the fourth map with sequential unlocking.
- Browser: invalid negative starting crowns remained visible and disabled Playtest and Promote until corrected.
- Browser: existing user draft migrated with rat groups of 3, 4, 5 and 6, starting at 0.7, 5.7, 12.7 and 22.2 seconds. The actual game content was not changed during these checks.
- Automated coverage includes scoped writes, validation, same-origin/token rejection, external-edit conflict detection, pending-conflict preservation, authored map registration and save compatibility.
- Review fixes: block actions for invalid visible fields; play the exact scoped promotion candidate; retain other pending conflicts after promotion; offer explicit stale-baseline recovery; migrate latest valid legacy revision.

Desktop workspace and appended campaign map screenshots accompany this report. Responsive CSS retains fixed actions for narrow or short viewports; the viewport override did not produce a reliable narrow screenshot, so no narrow-layout or physical-device performance claim is made. Owner usability acceptance is still open.
