# Visible-UI playtest — 20 September 2026

## Method and limits

Played the stable production preview with the CUA Chrome extension browser using visible accessibility/DOM controls and screenshot-derived canvas coordinates. No simulation state was injected, no hidden state was read, and no automation fixtures were used for the gameplay result. Chrome's exact version was not collected in this pass; use the separate benchmark environment record rather than inventing one here.

Initial menu captures used the browser's existing approximately 1480×1328 viewport. Most gameplay used a browser viewport override of **1280×720**. A paused battlefield was also inspected at **844×390** using the browser viewport capability. This was layout emulation with mouse input, not a physical phone or touch test. The override was reset afterward. This pass does not establish FPS, network cold-load performance, audio quality, audible playback, iOS/Safari behavior, or physical mobile performance.

## Completed path

1. Title → Settings → mute on → close → Begin expedition → map. Lantern Pass available; Rainstone Crossing visibly locked.
2. Lantern Pass briefing showed eight waves, 12 village hearts, three ordinary enemy roles, three support cards, and separate interest explanation. Chose **Well-stocked wagons**; preparation started with **220 crowns**.
3. Placed a Bolt watch beside the first bend: funds 220→180 and projected interest 20→18. Upgraded for55: funds125, tower level2,24damage/3.1range. Sold for61: funds186. This exercised purchase, selection, range display, upgrade and sale through the UI.
4. Placed two fresh bolt towers and a trading lodge; funds51, projected payout42=25reward+12trade+5interest. Cancel cleared placement mode. Started wave1 and selected2× speed.
5. Paused mid-wave: overlay stated time/income paused, construction/rescue controls disabled. Resumed; raiders continued. Targeted Supply drop on the trail: ready→42-second cooldown and delivery/slow/healing notice appeared. This verifies the visible targeting/cooldown flow; full-health village means healing amount was not independently demonstrated here.
6. Upgraded lodge for40: visible income became22. Added and upgraded Stone lobber, placed and upgraded Bramble net, and upgraded both bolts. One attempted net placement on the road was rejected with “Choose clear ground beside the trail.” Successful placement then used nearby open ground. Building during live waves worked.
7. Opened Settings during combat: gameplay paused behind dialog. Earlier mute remained enabled; unchecked it to restore default audible preference. Closing Settings resumed the live wave. Actual audible output was not assessed.
8. Manually launched all eight waves. No further construction after the preparation for wave4; savings accumulated. Commander and all three ordinary enemy silhouettes appeared. Wave5 payout visibly totaled80=20interest+22trade+38reward, demonstrating the interest cap in the HUD.
9. **Victory: three stars,12/12 village hearts,1512 remaining crowns,178 raiders stopped,125 total interest,166 trading income.** Unlock message named Rainstone Crossing and Careful carpenters. Final defensive layout: two level2 bolts, one level2 lobber, one level2 net, one level2 trading lodge. This is evidence of one viable savings/investment-led playthrough, not broad balance proof.
10. Try again produced fresh preparation:220crowns,12/12hearts,wave0/8 and no structures. Return-to-map action showed a confirmation dialog explaining attempt reset; page was then deliberately reloaded, rather than confirming departure. Title showed Continue; expedition map retained three stars and enabled Rainstone Crossing. Rainstone briefing displayed the fourth, newly unlocked Careful carpenters card.

No browser console warnings/errors were captured at the mid-run check. This is a sampled check, not a guarantee about all later log output.

## Screenshots

All paths are relative to the repository root:

| Capture | Evidence |
|---|---|
| `captures/accept-title.png` | Title art, heading and entry action |
| `captures/accept-map.png` | Initial locked progression map |
| `captures/accept-cards.png` | Three starting support choices |
| `captures/accept-preparation.png` | Empty battlefield and initial economy |
| `captures/accept-paused.png` | Desktop paused live wave |
| `captures/accept-phone-paused.png` | 844×390 layout, before inspector fix |
| `captures/accept-combat.png` | Three tower types, lodge and raiders |
| `captures/accept-wave5.png` | Later wave with savings reserve |
| `captures/accept-bosswave.png` | Commander silhouette |
| `captures/accept-victory.png` | Full eight-wave three-star victory |
| `captures/accept-unlocked-map.png` | Saved stars/unlocked second mission after reload |
| `captures/accept-unlocked-card.png` | Rainstone briefing and fourth support card |

## Findings and changes

- Confirmed desktop presentation issue: with a tower selected, the sidebar scrolled as one long block, causing either payout summary or wave-start action to leave the viewport at1280×720.
- Confirmed phone-layout issue: at844×390 selected tower Upgrade/Sell controls overlapped the Supply drop row. Screenshot retained as before evidence.
- CSS patch changes the sidebar to three grid rows: economy, independently scrolling selection details, and fixed wave controls. Compact-height spacing keeps essential actions separate. Cancel now has a44px minimum target; volume sliders retain a44px minimum height. **This patch was not rebuilt or visually rechecked during this pass**, preserving the stable production playthrough. A subsequent rebuild/reload must supply after screenshots and verify no overlap.
- While paused in wave1 the disabled launch button misleadingly read Start wave2; victory showed disabled Start wave9. Reported for logic correction separately. Screenshots capture the pre-fix behavior.
- Illustrated sprites and ground matched well enough for readable play; no obvious ground tiling seam was noticed at the tested camera scale. Simplified road tiles, rocks and lantern geometry remain visibly less painterly than the entity art.

## Remaining checks

Defeat and assistance were not exercised in this pass. Rainstone was unlocked and its briefing checked, but its encounter was not played here. Physical touch targets and touch gestures, audible music/mix/loop transition, keyboard-only accessibility, malformed saves, physical mobile performance, and exhaustive occlusion/picking edge cases remain unverified by this report. The full win involved mouse clicks, including canvas placement and rescue targeting; viewport resizing alone does not verify touch.
