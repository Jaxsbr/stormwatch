# Recovery and deployed-site checks

20 September 2026. Codex in-app Chromium 152, actual M4 Pro/macOS 26.6.2,1280×720, mouse input. Source-state injection was not used.

## Clean-checkout defeat and assistance

Served the clean clone at revision `ed66cb5` with the README preview command. Opened title→map→Lantern Pass with Far-sight scouts. Started with175crowns and12hearts. Ran wave1 without building at2×:9 enemies leaked, leaving3hearts; wave payout added42crowns. Started wave2 without building and reached **defeat,0/12hearts**. The result offered map, retry and assistance.

Clicked **Retry with assistance**: a new empty attempt appeared with245crowns,20/20 hearts,wave0/8. This verifies the extra70crowns/eight hearts and fresh board through actual UI. [Defeat capture](../../captures/accept-defeat.png), [assistance capture](../../captures/accept-assistance.png). The old disabled post-result wave label in that clean-build capture was subsequently changed to Watch ended/Watch complete.

## Public deployment smoke test

Opened the GitHub Pages URL after its successful workflow. Title illustration/fonts, map, cards and WebGL terrain/forest loaded. Entered Lantern Pass and placed a Bolt watch by clicking visible ground:175→135crowns,14damage/3.2range inspector and26-crown sell value. Cancel and leave confirmation returned to map/title. No warnings/errors were captured in the sampled browser console check. The first instant of battlefield rendering precedes texture download completion; assets then appeared correctly. There is no dedicated battlefield-asset loading overlay yet.

[Public title](../../captures/public-title.png), [public placement](../../captures/public-battle.png). Public smoke testing establishes correct subdirectory asset paths and interaction after deployment, not a second full campaign playthrough. The browser was left at the title ready to play.
