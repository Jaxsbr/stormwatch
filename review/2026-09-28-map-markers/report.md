# Map marker redesign review

The owner requested removal of the forced timber style from progress-map points,
and an Astra subagent redesign of their visuals and selection animations.
GPT-6 Astra with low reasoning was used because the exact requested model name
was unavailable. The parent reviewed and integrated the implementation.

Brass discs remain at the existing artwork coordinates. Current/completed/locked
states use gold, green/brass, and dashed outlines/padlocks respectively. Larger
layouts show names above markers; compact layouts show number and stars.

Hover lifts the disc and reveals a ring; keyboard focus has an explicit outline;
press compresses the disc. Selection pulses and ripples for 160ms before opening
the briefing. Reduced motion skips the animation and delay. The deferred action
checks that its original map remains connected, and duplicate selections are
ignored. No gameplay rules changed.

## Evidence

- [Desktop 1280×720](desktop-1280.png)
- [Tablet portrait 768×1024](tablet-768.png)
- [Phone portrait 390×844](portrait-390.png)
- [Phone landscape 844×390](landscape-844.png)
- [Narrow portrait 320×568](narrow-320.png)
- [Completed/selecting/locked visual fixture](states-1280.png)

The fixture in `states.html` uses the runtime CSS and slows/repeats the selection
animation for inspection. It is synthetic presentation evidence, not campaign
completion. Runtime map selection was verified to open Lantern Pass briefing.
Actual targets measured 46×46 in short landscape and 44×44 on narrow phones.
The timber pseudo-element was measured as absent. The subagent independently
reviewed all five layout captures and refined label placement and narrow spacing.

`npm run check`, 49 test files / 265 tests, `npm run build`, and `git diff --check`
pass. Production artifact inspection passed across 233 files. Existing bundle-size
warning remains. Browser viewport checks do not establish physical mobile
performance. Reduced-motion handling was verified in source; no device setting
was changed during review.
