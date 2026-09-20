# Renderer lifecycle smoke — 20 September 2026

Production build: `battlefield-B5ctVspR.js`, with pooled rigs, batched effects/shadows/health bars and cached path/gait workspaces. Tested through visible game controls in the in-app browser at 1280×720; no simulation state injection.

- Opened Rainstone with Supply wagons: 230 crowns, 12 hearts, wave 0/8.
- Placed squirrel: crowns fell to 190. Cancelled construction and selected the character. Screenshot showed coherent animal, tile corners, overhead chevron and range ring; tray named Squirrel archer.
- Upgraded: crowns fell to 135, level 2/2, damage 14 → 24, range 2.7 → 3.1, upgrade disabled as fully upgraded.
- Started wave one, paused via HUD, and resumed through the pause overlay. Paused state showed supply/sell disabled and the resume action available.
- Wave one completed with 12/12 hearts and 231 crowns. Payout displayed 18 interest + 0 trade + 28 reward = 46 crowns. Selection remained correct after combat.
- Returned to expedition through the leave confirmation, reopened Rainstone with default reach advantage, and entered a fresh attempt. Wave 0/8, 185 crowns, 12 hearts. Screenshot showed intact scenery/path with no old squirrel, selection ring, marker, shadows or health bars.
- A transient viewport resize exposed the portrait orientation guard before the fixed viewport was applied. No physical-device claim.

This verifies selection, upgrade controls, pause/resume and same-map encounter re-entry after renderer resource changes. It does not replace the previous full eight-wave runs or independently retest the defeat-screen Retry button. No continuous perceptual frame-rate claim. Temporary tab closed and viewport override reset.
