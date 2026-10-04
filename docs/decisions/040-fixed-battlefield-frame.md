# 040 — One fixed landscape battlefield frame

**Status:** accepted renderer correction; deployment verification pending integration.

## Context

The owner observed viewport-dependent disagreement between painted paths and world
paths, and a tall battlefield in portrait. The backdrop used its own cover scale,
while the camera and canvas followed arbitrary host aspect ratios. At the
1280×720 baseline the sampled landmark aligned, masking the fault.

The real `Battlefield` regression, with only browser/WebGL boundaries mocked,
failed 10 of 12 initial checks. Landmark drift in CSS pixels across the six host
sizes was 0.00, 5.48, 17.01, 55.33, 52.44 and 42.85. The matrix median was 29.93
pixels; nearest-rank p95 was 55.33 pixels. These are geometry measurements across
viewports, not frame timings or physical-device performance.

## Decision

`Battlefield` owns one fixed 16:9 orthographic frame and fits the complete canvas
inside the host. CSS centers that canvas with letterbox gutters. The painting
stays at its authored 1280×720 world dimensions; paths, actors, effects, projection
and picking use the same frame. No scene layer resizes independently.

The frame covers world y=0 through y=770, centered at y=385. The extra 50 world
units retain the existing upper actor/selection headroom while also showing the
whole painting. Keeping the old center at y=410 with a 720-unit span would still
crop the bottom 50 units. The horizontal span follows the same 16:9 ratio.

Picking rejects coordinates outside the canvas before defender silhouette checks.
Placement overlays continue to receive canvas-relative projected coordinates.
The game retains its existing portrait rotation guide and pause behavior.

This supersedes the arbitrary host-aspect framing in decision 027; its resize
settling, resource lifetime and disposal guarantees remain applicable.

## Consequences

Wide or tall hosts show gutters, and the complete painting is slightly smaller
than the previous cropped view. HUD and touch controls remain attached to the
host. Simulation, authored content, assets, enemy facing and profile controls do not
change. Held expansion fixtures and mechanics are outside this standalone patch.

## Verification

- The 13 new real-renderer checks and four existing lifecycle checks pass. Three
  painted landmarks stay registered at each size (error below 1e-8 CSS pixels;
  matrix median and p95 below 1e-8). All four painting corners remain visible.
  Ground projection/picking round trips pass at three cells, and out-of-canvas
  coordinates cannot select a protruding defender silhouette.
- Browser verification covers the game at 844×390,
  1024×768, 1280×720, 390×844, 768×1024 and a 420×720 narrow panel. All canvases
  retain 16:9 within CSS subpixel rounding. The three portrait views show the
  rotation guide; landscape controls fit and are at least 44 CSS pixels tall.
- Phone and tablet ground clicks open the correct placement preview in the game. Ghost centers match the picked anchor within one CSS pixel, and
  popup panels remain inside the viewport. A game gutter click opens no popup.
- `npm run check`, all 425 tests, production build (including the production
  boundary check), workbench build and formatting check pass. Browser evidence
  uses viewport emulation; it makes no physical mobile performance claim.
- Main workflow and deployed game verification remain integration responsibilities.
