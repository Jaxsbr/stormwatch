# 029 — Tile-first placement and defender popups

## Status

Accepted by the owner. Supersedes decision 009's fixed command-band placement and inspection layout; its pause-menu behavior remains in force.

## Context

Persistent build mode spent gold immediately on a map tap, made correction costly,
and competed with selecting existing defenders. The bottom command band also
reserved scarce landscape height. The owner reviewed alternatives and selected
A2 (portrait carousel) for placement and S1 (action card) for inspection, then
authorized production integration and a per-player grid visibility setting.

## Decision

Tap clear ground to preview a cell and defender. Previous/next portrait buttons
cycle only the current attempt's available roster. Confirm shows the full price
once and is disabled when unavailable; it never displays a calculated shortfall.
Successful placement closes the popup and remembers the defender for the next
cell. A one-defender roster omits cycling controls.

Tap a defender to inspect its real level, attributes and upgrade preview. Upgrade
uses canonical costs, progression locks and rules. Sell opens a separate review
with Keep defender; its refund includes actual investment. Close, Escape, a repeat
tap, invalid ground, pause and wave start clear selection. Popups remain nonmodal
so another map tap can correct placement or inspect a different defender.

The persistent command footer is removed. Popups flip and clamp at viewport edges,
retain at least 44 CSS-pixel action targets and scroll internally when necessary.
The optional thin grid marks buildable terrain and is saved per player, default off.
The simulation, maps, economy and asset set are unchanged.

## Consequences

The map keeps its expanded size while menus open and close. A popup temporarily
occludes nearby ground, but correction remains possible without spending. The
campaign and workbench share interaction state and markup; the workbench retains
its command recorder and replay lock. The renderer owns the grid and range, while
persistence owns only the visibility preference. No prototype routes, controls,
mock stats or prototype assets are included in the production change.

## Verification

Focused tests cover preview/correction without spending, repeated confirmation,
remembered choice, roster restriction, one-defender controls, selection while
previewing, cancellation, upgrade locks, affordability, pause, invested refunds,
sale confirmation and popup edge bounds. Existing tests plus new grid tests cover
per-player serialization, malformed/missing settings and victory preservation.

Browser checks cover real campaign placement and locked inspection, and an isolated
runtime-component fixture covers the complete roster, real upgrades, max level,
sale review and compact layout. The fixture uses production components and is not
committed. Type checking, the test suite, production artifact validation and both
game/workbench builds pass. Physical mobile ergonomics and performance remain
unverified.
