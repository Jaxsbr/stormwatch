# Progress map waypoints

## Context
The owner requested an Astra subagent redesign because timber control frames
obscured the map points. The board is a spatial progress map and must retain its
artwork and marker anchors across supported screen layouts.

## Decision
Use brass waypoint discs with warm gold for the next crossing, woodland green
for completed crossings, and muted dashed outlines with padlocks for locked
crossings. Keep names above discs on larger layouts; compact layouts retain
number and stars. Targets are 58px normally, 46px on compact layouts, and 44px
at narrow phone widths. Remove the timber skin entirely from map markers.

Provide hover lift, a visible keyboard focus ring, press compression and a
160ms selection pulse/ripple before briefing navigation. Ignore duplicate
selection while the pulse runs, and cancel navigation if the originating map
has been replaced. Reduced-motion preferences skip motion and the delay.
Accessible names retain crossing names, earned stars and unlock requirements.

## Consequences
The map remains visible around its points and available for future artwork
animation. Marker state is communicated through colour, outline, stars and lock
symbols. Compact layouts sacrifice visible names to preserve the spatial board;
accessible names remain intact. Simulation and progression rules are unchanged.
No new generated assets or paid services are involved.

## Verification
An Astra subagent designed and independently reviewed the CSS. The parent
reviewed integrated browser captures at 320×568, 390×844, 844×390, 768×1024 and
1280×720. Names were moved above discs after the tablet review; narrow markers
were tightened to avoid the board's bottom edge. Actual marker targets were
measured at 44px and 46px. Map selection reached the correct briefing.

`npm run check`, all 265 tests and `npm run build` passed. See
[the review evidence](../../review/2026-09-28-map-markers/report.md).
