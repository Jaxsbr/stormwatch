# Tablet retry investigation — 27 September 2026

## Owner observation

Samsung S7 FE; the exact candidate URL was not confirmed. Lantern Pass → Rainstone Crossing →
The Last Lantern → loss to the boss → retry. Map layout looked acceptable; new spawns
hitched, the navigation strip appeared/disappeared, game dimensions changed, then
Chrome became unresponsive and the tab crashed. Exact browser/Android versions,
RAM variant and the identity of the changing UI strip remain unconfirmed.
This is actual owner device feedback, not an agent physical performance measurement.

## Reproduction and findings

The local QA entry `/qa.html?lifecycle` creates and retires real `Battlefield`
instances in the same map/retry order. Its quick audit includes canonical openings
and synthetic height oscillation. The full audit uses recorded legal policies for
complete Lantern/Rainstone encounters and Last Lantern boss-wave losses/retries.
It advances 30 simulation ticks per rendered frame; its frame times are diagnostic
workload measurements, not normal-speed gameplay or mobile performance.

The quick baseline produced:

| Signal | Before | After |
| --- | --- | --- |
| Explicitly retired WebGL contexts | 0 / 8 | 8 / 8 |
| Drawing-buffer resize calls for 160 unchanged-size requests | 160 | 0 |
| Corresponding-map texture/geometry counts across repeats | Matching | Matching |
| JavaScript heap samples | Approximately 23–27 MB | Approximately 21–26 MB |

The unchanged-size test was also reproduced with `npx vitest run
 tests/visible-viewport.test.ts`: twenty equal notifications wrote forty CSS values
instead of two. The new test fails before the fix and passes after it. Renderer
lifecycle tests likewise fail on the old source: contexts remain live and toolbar
bursts reach setSize repeatedly. They execute the actual Battlefield lifecycle,
mocking browser/WebGL infrastructure only; the browser audit supplies real GPU evidence.

Heap samples are optional Chromium `performance.memory` readings. They exclude
GPU/process/decoded-image memory and do not prove leak absence. Explicit context
release and resource counts are stronger signals for the measured lifecycle issue.
No profiler or crash trace from the Samsung tablet has been collected. First-use
actor/shader work remains a possible explanation for residual spawn hitching.

## Repeatable checks

1. `npm run dev` → `/qa.html?lifecycle`, keep the tab foreground.
2. Run lifecycle audit: require contexts 8/8, redundant resizing 0, stable resources.
3. Run full chapter and boss retry audit: require Lantern/Rainstone victories,
   Last Lantern wave-six losses/retries, released contexts and no resource-count
   growth between corresponding cycles. Download its JSON for comparisons.
4. `npx vitest run tests/battlefield-lifecycle.test.ts tests/visible-viewport.test.ts`.
5. Build production and inspect map frame, 844×390/1024×768 layouts, viewport changes
   and fullscreen entry/exit. The QA entry must remain absent from `dist`.
6. On the actual tablet, repeat the original route and retry at least twice. Check
   ordinary/fullscreen modes, navigation gestures and whether spawn hitches or
   resizing stalls recur. Report map/wave and browser/device details if they do.

Fullscreen requires a player gesture; supported browsers expose it in settings.
Navigation UI hiding is a hint and Android may expose system controls again.
Progress remains local to the same origin/browser, and this pass preserves saves.

## Completion evidence

Type checking, all 263 tests in 49 files, formatting, production build and separate
QA build passed. Production boundary verification passed across 222 files.
Standards and spec reviews have no remaining findings; the spec review strengthened
the full audit to require the exact victory/loss sequence.
The production map frame was visually checked at 844×390 and 1024×768. Settings
fullscreen entry/exit succeeded in the desktop browser and updated its caption.
The tablet crash itself remains unverified as fixed until the owner retests.


### Full rendered audit

Two complete fixed-tick policy cycles passed in the in-app browser (Chrome 153,
1280×720, DPR 1). Each cycle won Lantern wave 5 and Rainstone wave 4, then lost
Last Lantern wave 6 and repeated that boss-map loss. All eight contexts were
retired; redundant unchanged-size resize calls were zero. Peak geometry/texture
counts matched exactly across corresponding attempts: Lantern 142/27, Rainstone
207/36, Last Lantern and retry 254/54. Final Last Lantern counts were 210/54.

The accelerated workload's p95 RAF interval was 17.8 ms and worst 93.4 ms.
These include simulation/trace work and first-use rendering; they are not a
normal-speed or physical-device performance qualification. Heap samples ranged
approximately 25–49 MB and were not forced-GC measurements; recorded policy
traces/diagnostic objects also contribute. No full browser process/GPU byte profile
or tablet crash reproduction is claimed.

The long-lived development server still reported its startup revision `7045287`;
this run actually used the working patch on `a3ba09e` through Vite reloads. Treat
the report's build revision as stale metadata, not the deployed version. A fresh
build is required for candidate handoff. The short matched before/after context
and resize audit already establishes the regression signal independently.

A fresh `build:qa` on the working patch based on `a3ba09e` repeated the full audit
with the explicit outcome assertions: passed, foreground-valid, contexts 8/8,
redundant resizes 0, and identical resource peaks above. p95 was 18.4 ms and worst
97.6 ms; heap samples were approximately 27–55 MB. No console warnings/errors were
captured. The build revision identifies the parent of the uncommitted tested patch;
the release commit records that patch. Battle settings also exposed fullscreen
while retaining its paused state.
