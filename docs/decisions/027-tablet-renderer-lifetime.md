# 027 — Retire attempt contexts and settle viewport changes

## Context

The owner played Lantern Pass and Rainstone on a Samsung S7 FE tablet, lost to
The Last Lantern boss, then retried. Spawn hitches, navigation-bar visibility
changes, repeated resizing and a Chrome tab crash followed. The map layout itself
looked acceptable. Android/Chrome versions and a device memory trace are unavailable.

A desktop browser lifecycle fixture showed eight retired battlefields retaining
their WebGL contexts and 160 unchanged-size calls reaching renderer resizing.
JavaScript heap readings did not show a monotonic leak in that short run.
Existing character/defender pools already bound reuse within each battlefield;
the ordinary screen lifecycle creates and disposes a battlefield per attempt.

## Decision

Dispose each attempt's renderer resources, then explicitly lose its WebGL context.
That canvas is permanently retired. Make disposal idempotent, disconnect observation
and cancel any scheduled resize. Do not change simulation or campaign progression.
[MDN's WebGL guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
recommends eager context release when the canvas is no longer needed;
[Three.js](https://threejs.org/docs/pages/WebGLRenderer.html) exposes separate
resource disposal and context-loss methods.

Round drawing-buffer dimensions to CSS pixels, ignore unchanged sizes and wait
100 ms for ResizeObserver changes to settle before reallocating. Skip unchanged
visible-viewport CSS variables too. During toolbar animation, the existing canvas
can briefly scale with its container; its camera/buffer catches up after settling.

Provide an opt-in fullscreen control in supported-browser settings. Request
`navigationUI: "hide"` from a player gesture, preserve pause/settings, and provide
an exit action. This is a browser request, not control over Android system bars.
See [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen).

The map illustration frame uses the existing timber-button-v2 nine-slice border
without its center fill, preserving the illustration and matching selection cards.

## Consequences

Attempt transitions release contexts promptly; animated viewport changes allocate
less frequently. The diagnostic laboratory gains a repeatable lifecycle audit and
accelerated full chapter/boss-loss/retry replay, with resource counts, heap readings
when available, frame intervals and explicit pass/fail checks. It stays outside the
production build. No assets, rules, tuning or saving behavior change.

These fixes address measured resource-lifetime and resizing defects. They do not
prove why this specific tablet tab crashed. Desktop emulation is not physical
memory/performance qualification. The owner must repeat the reported sequence on
the tablet after deployment; remaining spawn hitching warrants a device trace.

## Verification

See [tablet retry evidence](../evidence/tablet-retry.md). Regression tests fail on
the old renderer/viewport implementation and pass with these changes. Browser
lifecycle verification checks actual WebGL context release and stable GPU resource
counts across repeats. Cosmetic/fullscreen changes require separate browser review.
