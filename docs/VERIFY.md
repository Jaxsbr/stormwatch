# Verification procedure

Run `npm ci`, `npm run check`, `npm test`, `npm run build`, then `npm run preview`. Record commit, Node/npm versions, OS, browser/version, viewport and whether input/device is physical or emulated.

## Functional browser route

Use the [family-release candidate record](evidence/family-release.md) for the
current three-map contract, release blockers and automated journey evidence.
Use a fresh browser origin/profile for testing; preserve existing player saves.

1. Title → Play → choose Player 2. Only Lantern Pass is unlocked. Inspect its
   Rat shield lesson and start with base Squirrel and no advantages.
2. Place on valid ground; try path/occupied/outside positions and insufficient
   funds. Cancel, inspect range and sell. Squirrel upgrades are unavailable until
   the first victory. No passive income, lodge, Skunk or rescue ability.
3. Start a wave, observe movement, guard/evasion, impacts and leaks. Open Menu:
   combat and the inter-wave countdown must stop. Check Continue, Settings,
   mute/volumes, Quit → Stay and Quit → leave. Check 1×/2× speed; the ten-second
   preparation countdown uses real time. Check Start Early.
4. Win Lantern; inspect the Squirrel upgrade reward. Continue to Rainstone,
   win and inspect Turtle discovery. Reload and switch slots: Player 1 retains
   its own progress and settings; Player 2 retains both victories.
5. Enter The Last Lantern with earned Squirrel upgrades and base Turtle, without
   replay advantages. Play all six waves. Observe the net cue, Roadwarden health,
   rally and escort parties. Boss escape loses even with hearts remaining.
6. After defeat return to the map and reopen that encounter. Play retries freely;
   Easier retry adds hearts/gold without erasing progress. Win the boss encounter,
   inspect the board ending and Reach/Longer Nets rewards, then reload and replay
   with an earned advantage. Best stars persist. No unfinished fourth map appears.
7. Review essential controls at 1280×720, 844×390 and 1024×768. Rotate to portrait
   during battle: landscape guidance blocks play and pauses it. Background and
   return during both combat and preparation; verify safe pause/resume and audio.
   Emulation cannot establish physical-device performance or touch behavior.
8. Listen after gesture unlock, adjust both sliders and mute, pause/resume/replay,
   and listen across the music-loop boundary. Record actual listening separately.

Capture menus, battle, inspected defender, pause, victory/loss, reward, reload and
responsive layouts. Check console and missing assets. Use actual pointer/touch
coordinates on the canvas for interaction evidence; deterministic simulation
runs complement that evidence and do not replace a human browser chapter.

## Performance

`qa.html` is a separate artificial stress page. It uses the actual simulation/renderer with seed42, replenished 60 enemies, 12 defenses, 3 lodges and 150 combined shots/effects. It exercises slowing, splash, targeted rescue and actual payout/victory simulation transitions. It does not measure DOM gameplay overlays, music, or player experience; normal-game checks supplement it.

Open `/qa.html` using the development server or a separate `npm run build:qa` output in `dist-qa`. The production game excludes that entry. Keep the browser foreground. Click **Run three benchmarks**. Each run has 10s warmup then 180s raw `requestAnimationFrame` intervals. The page marks runs invalid if hidden. Download evidence after three runs. Record desktop hardware, browser version, viewport, DPR and throttling. p95 uses the sorted 95th-percentile interval; median FPS is 1000 divided by median interval. Worst frames are retained rather than clamped away. Simulation dt remains capped separately.

Budgets: desktop60fps/p95≤20ms/no gameplay-caused frame>100ms; physical mobile30fps/p95≤35ms. Target physical devices: iPhone 12-class Safari and Pixel 6-class Chrome. Report synthetic stress and normal gameplay separately. Do not label desktop viewport emulation as mobile performance. If a stall occurs, report it and investigate attribution; do not discard it silently.

Cold-load check: empty HTTP/browser cache, 10Mbps downlink and100ms latency, measure navigation to usable title, record transferred bytes and resource timing. Target≤5s and≤8MB initial transfer; full assets≤20MB. If network shaping is unavailable, record local unthrottled timing and mark the agreed profile unverified. Dividing bytes by bandwidth is an estimate, not a measured load result.

## Clean checkout

Clone the public repository into a new temporary directory. Run only the README commands (`npm ci`, check, test, build); serve and open the production output. No ignored sources, local environment files or generation access may be needed. Preserve command results in the acceptance report.

For the controlled local delivery profile, run `python3 tools/throttled-preview.py dist 4176` and open the printed `?measure=1` URL on a fresh origin. The server enforces aggregate10Mbps response-body delivery and100ms request delay with no-store responses, and logs body/header bytes for successful file responses. This is application-level shaping, not a simulation of a physical radio or all TCP latency effects. The opt-in diagnostic waits for title-image decode, fonts and two animation frames. If browser resource timing omits an image, retain server accounting rather than calling the incomplete timing sum total transfer.


## Local review recording

Build, then run `node tools/review-preview.mjs` and open `http://127.0.0.1:4176/?record`. Use the visible recorder during normal play. After20seconds, **Save clip to review folder** writes the actual captured WebM into `review/recordings/` and displays its path. This explicit loopback-only server is separate from the published game; no recording service is deployed. It accepts same-origin WebM writes capped at32MiB and chooses unique output names server-side. Standard browser download remains available.

Verify the saved file's timestamp, dimensions, duration and actual frames before describing it. Capture at1× for motion review; disclose any preparation/play segments run at2×. Canvas footage excludes HTML HUD and sound. Retain corresponding full-page screenshots for menus, selected controls and results. A successful save does not certify smoothness or sound quality.

The stress fixture now logs synchronous render/frame work and preceding-frame scene rebuilds for intervals over100ms. These timings help attribution but do not measure asynchronous GPU completion or excuse long frames.
