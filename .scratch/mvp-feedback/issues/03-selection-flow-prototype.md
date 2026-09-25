# Prototype selection and cancellation flows

Status: ready-for-agent

## Question

Which select/place/cancel model can a new player discover on both desktop and landscape touch layouts without hunting for a Close button?

## Existing behavior

- Open-ground tap/click clears the selected tower.
- Escape clears selection and cancels build mode.
- The selection panel also has Close/Cancel controls.
- Right-click is ignored by the current battlefield input adapter.

## Prototype

Working capture: [three input variants](../../../review/2026-09-25-mvp-feedback/README.md).


Compare three structurally different flows on the same representative battle surface. Keep common map, economy and tower choices. Exercise tower selection, valid and invalid placement, inspection, open-ground deselection, explicit cancel, and desktop shortcuts. Show discoverable touch targets and the current mode at all times.

## Acceptance

- Compare at 1280×720 and 844×390 landscape layouts.
- Variant B is the mobile lead. Check whether a one-line hint makes valid placement areas clear, including that the trail itself is not buildable (for example, “Tap clear ground beside the trail”).
- An observer can predict the next map action and recover from an accidental selection without coaching; verify whether the hint is enough or a first-use prompt is needed.
- Open-ground tap and Escape remain available as low-cost routes; test right-click as an optional shortcut only.
- No hover-only action. Essential touch targets meet the existing 44 CSS px contract.
- The prototype reports action count and rejected placements so clunkiness is observable, not just visual.
