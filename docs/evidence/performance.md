# Desktop performance

20 September 2026. Actual Apple M4 Pro (12 CPU cores,48GB RAM), macOS 26.6.2, Codex in-app Chromium 152, WebGL2,1280×720 CSS pixels,DPR1,no CPU throttling. Local production preview. The user-agent string reports an Intel/macOS10.15 compatibility token; hardware/OS above came from the host, not inference from that string.

Three runs, each10-second warmup plus180-second measurement. Seed42,60 enemies,12 defenses,3 lodges,150 combined shots/effects at peak. Raw `requestAnimationFrame` intervals, with no simulation-delta clamp applied to the metrics. All three runs remained document-visible. Light command-line/document work occurred concurrently; no second browser gameplay was run during measurement.

| Run | Samples | Median FPS | p95 interval | Worst interval | Frames over100ms |
|---|---:|---:|---:|---:|---:|
| 1 |10794|59.88|18.4ms|33.4ms|0|
| 2 |10793|59.88|18.3ms|33.3ms|0|
| 3 |10793|59.88|18.4ms|33.4ms|0|

**Desktop stress budget passed:** display cadence is approximately60fps,p95≤20ms,and no>100ms frames. Exact60.000fps is not claimed. Each run recorded13 supply drops and actual payout/victory simulation transitions around58.5,118.5 and178.5seconds. All three enemy/attack roles plus boss imagery were represented.

This is an artificial stress fixture with replenished populations, amplified enemy health and periodic empty-wave resolution. It is not a normal strategy playthrough, and it excludes the normal HUD/result overlay and audio workload. Normal UI flow is covered by separate browser playtests. The measured renderer bundle `battlefield-BM9usv2S.js` is byte-identical to the final build's renderer/simulation module. After measurement, QA placement assertions and actual-count reporting replaced hardcoded nominal-count report fields; reviewer independently confirmed all15 fixture placements were valid.

[Machine-readable results](desktop-performance.json) and [capture](../../captures/accept-performance.png). The repeatable fixture lives at `/qa.html`; see [procedure](../VERIFY.md).

Physical iPhone 12-class Safari and Pixel 6-class Chrome performance remain **unverified**. Viewport emulation, this desktop GPU result and an in-app browser are not substitutes for those devices. No claim is made for arbitrary low-end hardware or higher display pixel ratios.
