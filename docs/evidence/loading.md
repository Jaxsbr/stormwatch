# Loading and asset budgets

20 September 2026. Actual M4 Pro/macOS 26.6.2, Codex in-app Chromium 152,1280×720,DPR1. Fresh local origin with no-store responses. `tools/throttled-preview.py` enforced aggregate10Mbps response-body delivery plus100ms per-request delay. This is a documented application-level HTTP profile over loopback, not a physical mobile-radio simulation or a claim about arbitrary internet routes.

**Title ready:1552ms**, including successfully decoded1672px-wide title image, loaded fonts and two animation frames. Target≤5000ms passed. The previous1523ms observation was repeated with explicit image-decode success reporting.

Successful initial HTTP responses totaled **1,219,429 bytes including headers**, covering HTML,CSS,JS,fonts and title image. Including the small favicon404 response keeps total below1.23MB, comfortably inside the8MB initial-transfer target. The browser's Resource Timing sum was only1,007,384bytes because it omitted the coalesced title-image request; that incomplete sum is **not** reported as full transfer. Server accounting supplies the missing image bytes.

The full production directory is approximately**6.8MB**, including optional QA assets, below20MB. These are disk bytes; served compression can reduce transfer. Music is not preloaded before user gesture. Battle art loads on entering battle, so the title milestone does not claim every gameplay texture is already decoded.

Evidence: [browser timing](cold-load.json), [server byte accounting](cold-load-server.json), [asset inventory](asset-bytes.json), [capture](../../captures/accept-cold-load.png). Reproduce using [VERIFY](../VERIFY.md). No CPU throttle was applied. Real-device loading and wireless conditions remain unverified.
