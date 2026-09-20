# Animal renderer performance qualification

The current animal renderer passes the original desktop baseline profile: Apple M4 Pro, 48 GB, macOS 26.6.2, in-app Chromium 152, WebGL2, 1280×720 CSS pixels, DPR1. This is a scoped desktop result, not an all-browser or physical-phone guarantee.

Three runs started at 06:17:27 UTC on 20 September 2026. Each included 10 seconds warmup and 180 seconds measurement, seed 42, 60 enemies, 12 defenses, 3 traders and 150 combined shots/effects. Each recorded 13 rescues and three payout/win transitions. All remained visible. The page was inspected only during initial warmup and after the full quiet interval, at 06:27 UTC. Light documentation work continued; no build, video processing or other browser gameplay ran during measurement.

| Run | Samples | Median FPS | Raw/rendered p95 | Worst | Intervals >100 ms |
|---|---:|---:|---:|---:|---:|
| 1 | 10,796 | 59.88 | 17.6 ms | 17.8 ms | 0 |
| 2 | 10,796 | 59.88 | 17.6 ms | 17.8 ms | 0 |
| 3 | 10,796 | 59.88 | 17.6 ms | 17.8 ms | 0 |

No console warnings/errors were observed. Build: `battlefield-C9dHZNg9.js`, `qa-COphKdFl.js`, `game-B-wzWxuP.js`. Every RAF draws; the rejected render pacer is absent. Enemy legs use static geometry with pose uniforms; effects and overlays are batched and rigs are pooled. [Raw results](animal-performance-iab-qualification.json).

## Retained limitation: Chrome 153

The identical build in Chrome 153 met the p95 budget (17.1 / 17.5 / 17.6 ms) but retained 2 / 2 / 1 intervals over 100 ms, with worst intervals 143.6 / 133.5 / 100.9 ms. That browser run fails the no-stall check. [Raw Chrome results](animal-performance-gpu-qualification.json). The comparison establishes a measured environment difference, not a proven driver, browser or JavaScript cause. No failure was discarded or relabelled as passing.

The original baseline environment is documented in [foundation performance](performance.md). Both results remain relevant: the baseline profile passes, while broader Chrome stress stability remains a known limitation. This artificial fixture excludes normal HUD and audio; separate normal-play reviews cover interaction and encounter completion. Elapsed callback measurements are not direct CPU execution or asynchronous GPU timing. Physical mobile performance and audio listening remain unverified.
