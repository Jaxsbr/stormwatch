> Current expansion acceptance: the owner completed the assembled eight-encounter
> playthrough and accepted merge on 4 October 2026. See [canonical activation evidence](evidence/mosswater-activation.md).
> Physical-device performance remains unverified. Painted mouth/route registration
> and trail-edge spill remain explicitly deferred; the foundation report below is historical.

> Historical foundation report: the renderer/art/UI reboot supersedes the build assessed below. Current reboot acceptance is tracked in [the rubric audit](../review/2026-09-20-reboot/current-rubric-audit.md). The published site and older performance/byte results below do not certify the current animal build.

# Acceptance report — Stormwatch MVP candidate

Recorded20 September 2026. **Playable desktop-verified candidate, publicly deployed.** Both encounters were completed through normal browser UI. The approved scope permits delivery with unavailable physical-mobile checks clearly reported. Physical touch/device performance and actual listening remain **unverified**; this is not a claim of full device/audio sign-off.

[Play](https://jaxsbr.github.io/stormwatch/) · [Repository](https://github.com/Jaxsbr/stormwatch) · [Roadmap/handoff](ROADMAP.md)

## Capability mapping

| Criterion | Working example and evidence | Result |
|---|---|---|
| Complete game flow | Title→map→cards→preparation→8waves→victory→replay/map; both missions completed, both3stars survive reload. [Browser evidence](evidence/browser.md) | Passed |
| Defeat/recovery | Undefended loss, free retry choice, fresh assisted attempt245crowns/20hearts. [Recovery](evidence/recovery-and-public.md) | Passed |
| Combat | Three defenses, three ordinary enemies, commander, upgrade/sell, slowing/splash/rescue. Rule tests and visible play | Passed |
| Economy | Atomic pre-payout interest10%cap20, lodge12/22, refund65%, no waiting/paused income. [Balance](evidence/balance.json), economy/simulation tests and HUD observations | Passed for tested scenarios |
| Choices/progress/save | Three initial cards, thrift unlock with actual44-crown bolt upgrade, stars/settings, reload and malformed-save tests | Passed |
| Hybrid visual foundation | 3D terrain, cropped illustrated billboards, shadows/rain/effects; visible selection/placement and screenshots | Passed at tested layouts |
| Desktop input | Place/select/cancel/upgrade/sell, supply targeting, wave/pause/settings, result/retry/map | Passed via mouse |
| Responsive layout |1280×720,844×390,1024×768; fixed payout/wave actions, independently scrolling inspector,44px essential controls. [After-fix captures](evidence/browser.md) | Passed layout/pointer checks; physical touch unverified |
| Audio | Licensed orchestral loop, cue family, volume/mute/pause code and UI; full MP3 decode. [License/evidence](ASSET-LICENSES.md) | Technical/source checks passed; audible playback/mix/loop listening unverified |
| Content extension |`48c9a4a`→`3fbd136`: second level file+registry only; no unrelated runtime restructuring. [Authoring guide](ARCHITECTURE.md) | Passed |
| Static/build/tests | TypeScript, pinned formatter, production build,28tests/6files | Passed |
| Clean checkout | Public-files-only local clone and fresh Linux CI install/check/format/test/build. [Evidence](evidence/clean-checkout.md) | Passed |
| Desktop performance | Three180s measurements after10s warmup each;60enemies/12defenses/3lodges/150shots+effects. [Results](evidence/performance.md) | Passed artificial stress budget |
| Physical mobile performance | iPhone 12-class Safari and Pixel 6-class Chrome,p95≤35ms/30fps | Unverified: devices unavailable |
| Loading/bytes |1.552s title under controlled10Mbps/100ms request-delay profile;≈1.22MB initial;≈6.8MB full build. [Method/evidence](evidence/loading.md) | Passed documented local profile and byte budgets |
| Publication | New personal public repo, reviewed files/history, successful Pages workflow, deployed browser placement. [Review](evidence/publication.md) | Passed |
| Maintainability/handoff | Code-aligned architecture, extensions, ADR process, assets/provenance, glossary, roadmap and agent guidance | Delivered |

## Numeric results

| Measurement | Result | Budget |
|---|---:|---:|
| Desktop median FPS,3runs |59.88 /59.88 /59.88 |Approximately60 |
| Desktop p95 interval |18.4 /18.3 /18.4ms |≤20ms |
| Worst measured interval |33.4ms |No gameplay frame>100ms |
| Frames over100ms |0 across all3runs |0 |
| Title ready,controlled profile |1552ms |≤5000ms |
| Initial successful HTTP responses |1,219,429bytes including headers |≤8MB |
| Full production directory |≈6.8MB |≤20MB |

Actual desktop: Apple M4 Pro 12-core,48GB,macOS 26.6.2. Timed runs used Codex in-app Chromium 152,1280×720,DPR1,no CPU throttle. Normal campaign play used Chrome extension control with exact Chrome version uncollected. Do not substitute one browser's version for the other. All resized phone/tablet checks used desktop hardware and mouse input.

## Interpretation and remaining sign-off

Artificial stress includes actual simulation payout/victory transitions but excludes normal DOM result overlays and music; normal UI flow was verified separately. The measured renderer/simulation bundle is unchanged in the final build. The profile enforces server bandwidth and request delay over loopback; it does not simulate every mobile radio/TCP behavior. Browser resource timing omitted the title image, so initial transfer uses the server's byte accounting. The tiny favicon404 adds less than1KB and does not affect the budget result.

Deterministic strategies take about257–278combat simulation seconds, excluding planning. Browser play proved one investment-led first encounter and one spending-led second encounter. These establish viability, not broad balance or observed children's enjoyment; the friendly campaign can leave a large late reserve. The5–8minute target includes preparation, while2×speed shortens wall time.

Remaining required external sign-off: run actual taps and performance on the target phones, and listen to music/cues over the loop boundary in the game. Record results using [VERIFY](VERIFY.md). Fully keyboard-only gameplay and portrait-first design are beyond this MVP. Battlefield art downloads after entering the scene, briefly showing terrain before textures; a dedicated loading state is a polish item. No unavailable check is counted as passed.
