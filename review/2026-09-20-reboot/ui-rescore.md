# Independent UI review — 20 September 2026

Reviewed current dev port 4173 through normal Chrome navigation at 1280×720 and 844×390. No state injection or source edits. Temporary viewport restored. This is viewport emulation, not physical touch or performance testing. Audio unassessed.

| Dimension | Score /5 | Assessment |
| --- | --- | --- |
| title_map_menus | 4 | Title, framed map, and three-card briefing are cohesive and readable. The prior clipped briefing CTA is resolved at both sizes. |
| ui_identity | 3 | Timber/brass cards, illustrated advantages, and compact pause panel substantially improve identity. Selected-tower obstruction and phone settings clipping remain distracting weaknesses. |
| framing_readability | 4 | Whole trail and tower/enemy silhouettes remain readable in normal combat at both sizes. Small phone mechanisms lose fine detail, but navigation and tactical layout remain legible. Selection obstruction is counted in UI above. |

These are bounded observations, not full demo acceptance. Four-card briefing was unavailable on this origin's normal save (Rainstone locked); prior 4174 four-card evidence was not silently treated as a current check. Results were not reached in this bounded run.

## Material remaining issues

1. **Selected tower can disappear under its own panel.** Placing/selecting a bolt near the lower-left open ground puts the fixed selection panel directly over the entire tower at both sizes. The range circle remains, but the inspected structure is hidden. Move the panel away from the selected object's screen bounds or use a dedicated dock area. Evidence: `after/ui-rescore-desktop-selected.png`, `after/ui-rescore-phone-selected.png`.
2. **Phone settings frame extends below the viewport.** At 844×390 the lower timber border is cut off. All controls including Back remain accessible, so this is a finish/fit defect rather than a blocked action. Apply the compact height/padding treatment already working for pause. Evidence: `after/ui-rescore-phone-settings.png`.

## Improvements verified

- Three-card briefing: all choices, benefit text, selection indicator, and CTA fit without scrolling at both sizes.
- Pause: entire illustrated frame and Resume fit at 844×390; build controls are visibly and semantically disabled.
- Build dock: all four structures and prices fit; selected and unaffordable price coloring is visible. Normal placement, cancellation, tower selection, and wave start worked.
- Title and map: coherent imagery and hierarchy, readable locked second encounter, navigation fits.

Evidence prefix `after/ui-rescore-`: desktop/phone title, map, briefing, selected, pause, combat; phone settings and preparation. All desktop captures are 1280×720 and phone captures 844×390. Combat images show a real first wave after normal builds, not the staged tower lab.

## Focused follow-up — both reported defects resolved

Current dev4173 rechecked through normal controls at1280×720 and844×390. **UI identity revised to4/5** for the reviewed states. No material remaining defect found in this focused recheck; this does not extend coverage to four-card/results or constitute full demo acceptance.

- Inspection now uses the existing bottom tray, leaving the selected lower-left tower completely visible at both sizes. Gold corner brackets clearly identify it inside the range circle.
- During repeated placement the original four structure buttons remain available. Cancel enters inspection; Structures closes inspection and restores the build dock.
- Upgrade worked at phone size: crowns135→80, level1→2, damage14→24, range3.2→3.7, button became disabled Fully upgraded.
- Reselect and sell worked at desktop size: crowns80→141, tower removed, structure dock restored.
- Phone settings now fits its whole timber border and all controls, including Back, within844×390. Desktop settings also fits.

Fresh evidence: `after/ui-fixed-phone-settings.png`, `ui-fixed-desktop-settings.png`, `ui-fixed-phone-building.png`, `ui-fixed-phone-selected.png`, `ui-fixed-phone-upgraded.png`, `ui-fixed-desktop-selected.png`, `ui-fixed-desktop-structures.png`, `ui-fixed-desktop-sold.png`. Browser viewport restored; no source edits.
