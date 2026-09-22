# Battle amendments — review candidate

Builds on the owner's positively reviewed, uncommitted battle pass (`../2026-09-22-battle-ui/`). No new commit was made. Prior captures are structural baselines, not synchronized pixel-diff frames.

## Acceptance

Owner supplied the direction: consistent scalable rank markers, less HUD copy, automatic range, row-based attributes, rising right-side notices, fixed battlefield dimensions, and one animated pause/settings menu. Fixed geometry and correct pause state are hard gates, not aesthetic scores.

## Evidence

- `desktop-selected.png` and `phone-selected.png`: upgraded rank 2 agrees on portrait and scene marker. Current attributes sit under the name; no Range button. Rank 1 checked before upgrading. Shared formatting tests include multi-digit and invalid ranks.
- Canvas DOM measurements before selection, after selection and after deselection: **1280×502** at desktop 1280×720, **844×226** at phone 844×390. Drawing-buffer width/height equal those CSS dimensions and remain unchanged. Footer is consistently 156px / 112px respectively. Purchase and selected modes were checked independently by the HUD agent and integrating agent.
- `desktop-menu.png` and `phone-settings.png`: shared button artwork frames the single pause dialog. Desktop menu and settings both measure 480×440. Settings enters after menu leaves; Menu and Escape reverse the sequence. Preparation resumes as preparation, and an active wave resumes as a wave. Shift-Tab from Continue wraps to Quit; background is inert.
- `desktop-notice.png`: real insufficient-gold feedback appears on the right. Browser computed styles confirm two four-second animations: movement cubic-bezier(.16,1,.3,1), opacity cubic-bezier(.7,0,.9,.35). An early sample was 41.6px above origin with opacity .9987: movement leads opacity loss. The curves are continuous; reduced motion removes translation. This is timing/configuration evidence, not a full-frame-rate motion recording or physical-device smoothness assessment.
- Menu unit tests exercise sequential outgoing/incoming completion, reverse navigation, reentry guards, focus, reduced motion, and destruction during both stages. No browser errors observed during the exercised flow.
- Quit confirmation and cancellation were checked. The final destructive Quit click was blocked by the safety reviewer to preserve the active attempt; that end-to-end action remains unverified. The browser was left paused, with the attempt intact.

## Reference and decision

[Blizzard's Warcraft III guide](https://news.blizzard.com/en-us/article/23229495/finding-the-fun-real-time-strategy-games-for-beginners) describes selection-specific commands and stats in the bottom command panel. We reserve that space and swap its content; we did not inspect or benchmark Warcraft III's renderer. See ADR 009.

## Verification and limits

`npm run check`, `npm test` (**135 tests / 21 files**) and `npm run build` pass. Existing large battlefield-bundle warning remains. Gameplay rules, economy rates and maximum upgrade level are unchanged. The rank presentation scales; this is not a new progression system. Screenshots validate layout, not subjective enjoyment. New work remains uncommitted for owner review.
