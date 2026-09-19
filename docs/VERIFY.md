# Verification procedure

Run `npm ci`, `npm run check`, `npm test`, `npm run build`, then `npm run preview`. Record commit, Node/npm versions, OS, browser/version, viewport and whether input/device is physical or emulated.

## Functional browser route

1. Fresh site data → title → map → Lantern Pass → choose each available card and inspect descriptions → enter preparation.
2. Place bolt/stone/net and lodge on valid ground. Try path/occupied/outside positions and insufficient funds. Cancel placement, select a tower by its visible image, inspect range, upgrade, sell and check wallet/refund.
3. Start a wave. Observe movement, all attack roles, leaks, cooldown and targeted supply drop. Pause and wait: wave and income must stop. Open/close settings and leave/stay prompts both while live and already paused.
4. Clear a wave. Compare actual payout with pre-payout savings, fixed reward and lodge income. Preparation itself earns nothing. Play to victory; inspect stars/unlock, return to map and reload. Rainstone Crossing and the alternative card should remain available.
5. Retry: towers, money and cooldown reset. Lose deliberately and retry with assistance. Confirm increased hearts/crowns without erasing earned progress. Complete second encounter.
6. Repeat essential interactions at 844×390 and 1024×768. Use touch input where tooling supports it. Check 44px targets, absence of overlaps and no hover requirement. Emulation is not physical-device evidence.
7. Listen after gesture unlock, adjust both sliders and mute, pause/resume/replay, and listen over the loop boundary. Record whether actual listening was possible.

Capture title, map, cards, battle, selected/upgraded tower, pause, victory, loss, progression reload and responsive layouts. Record console errors. The battlefield is a canvas: use actual pointer/touch coordinates and visible feedback, not hidden-state manipulation, for interaction evidence.

## Performance

`qa.html` is a separate artificial stress page. It uses the actual simulation/renderer with seed42, replenished 60 enemies, 12 defenses, 3 lodges and 150 combined shots/effects. It exercises slowing, splash, targeted rescue and actual payout/victory simulation transitions. It does not measure DOM gameplay overlays, music, or player experience; normal-game checks supplement it.

Open `/qa.html` using the development server or the production build; both include that entry. Keep the browser foreground. Click **Run three benchmarks**. Each run has 10s warmup then 180s raw `requestAnimationFrame` intervals. The page marks runs invalid if hidden. Download evidence after three runs. Record desktop hardware, browser version, viewport, DPR and throttling. p95 uses the sorted 95th-percentile interval; median FPS is 1000 divided by median interval. Worst frames are retained rather than clamped away. Simulation dt remains capped separately.

Budgets: desktop60fps/p95≤20ms/no gameplay-caused frame>100ms; physical mobile30fps/p95≤35ms. Target physical devices: iPhone 12-class Safari and Pixel 6-class Chrome. Report synthetic stress and normal gameplay separately. Do not label desktop viewport emulation as mobile performance. If a stall occurs, report it and investigate attribution; do not discard it silently.

Cold-load check: empty HTTP/browser cache, 10Mbps downlink and100ms latency, measure navigation to usable title, record transferred bytes and resource timing. Target≤5s and≤8MB initial transfer; full assets≤20MB. If network shaping is unavailable, record local unthrottled timing and mark the agreed profile unverified. Dividing bytes by bandwidth is an estimate, not a measured load result.

## Clean checkout

Clone the public repository into a new temporary directory. Run only the README commands (`npm ci`, check, test, build); serve and open the production output. No ignored sources, local environment files or generation access may be needed. Preserve command results in the acceptance report.

For the controlled local delivery profile, run `python3 tools/throttled-preview.py dist 4176` and open the printed `?measure=1` URL on a fresh origin. The server enforces aggregate10Mbps response-body delivery and100ms request delay with no-store responses, and logs body/header bytes for successful file responses. This is application-level shaping, not a simulation of a physical radio or all TCP latency effects. The opt-in diagnostic waits for title-image decode, fonts and two animation frames. If browser resource timing omits an image, retain server accounting rather than calling the incomplete timing sum total transfer.
