# Current reboot rubric audit — 20 September 2026

**Delivery verified against the fixed rubric.** The fixed rubric minimum is4/5 for every dimension. Scores below reflect the current animal build; historical mechanical scores are not transferred. A targeted visual pass does not establish whole-game completion. Latest code passes formatting, type checking, 112 tests and production build. Commit `45f0a98` passed an independent Git-archive build with 110 tests; the GPU leg deformation and QA instrumentation are committed in `4961b03`; a fresh archive of delivery commit `09aa194` passes all required checks.

| Dimension | Current supported assessment | Evidence / remaining scope |
|---|---|---|
| title_map_menus |4/5, medium confidence|Title/map/briefing reviews retained; current animal [Rainstone victory](after/animal-rainstone-victory.png), [phone defeat/retry and four-card review](animal-phone-ui-review.md) now cover current end states.|
| biome_path |4/5, medium|Approved fixed-scale woodland and Rainstone plates, rounded continuous paths and hidden gameplay grid. Current [phone review](animal-phone-ui-review.md) adds Rainstone framing.|
| framing_readability |4/5 for reviewed placements, medium|Animal silhouettes read clearly. The new dense-pair selection defect from [demo review](demo-review.md) is resolved sufficiently in [matched desktop/phone marker review](selection-chevron-review.md). [Camera edge correction](camera-edge-fix-review.md) also passes top/bottom legal placements at bothsizes. Residual overlap in dense groups remains a limitation, not a claim of universal clarity.|
| character_animation |4/5, medium|[Consecutive normal-combat review](lantern-consecutive-motion-review.md) verifies badger hit/recovery, rat walking and directional continuity alongside prior corrected weasel/boar roster. Removal is simple; no bespoke death-animation claim.|
| tower_animation / animal defenders |4/5 targeted, medium|[Fixed-length limb follow-up](animal-defender-review.md) verifies stable limbs, hand/bow/payload contact and four-view samples. Trader uses side view/purse gesture; no invented attack requirement.|
| ui_identity |4/5 for reviewed states, medium|Timber/brass identity, selection/upgrade tray and phone settings retained. Phone defeat action clipping fixed and retry verified in [phone review](animal-phone-ui-review.md). No physical-touch claim.|
| combat_feel |4/5, medium|[Consecutive normal-combat review](lantern-consecutive-motion-review.md) verifies distinct attacks, hit/recovery and sustained slow. Full normal runs in both encounters support economy/playability; broad balance and continuous perceptual cadence are not claimed.|
| content_pipeline |4/5, medium|Native sources/prompts/hashes, reusable animal recipe, all 12 defender specs and shared arm/gait adapters. Four animal roles and two biomes demonstrate reuse. [Final committed archive](delivery-export-report.md) passes installation, formatting, type checking, 112 tests, build and byte-for-byte verification of all 175 public files. Manual image generation, landmark measurement and visual review remain explicit steps.|
| demo_coherence |4/5, medium|[Revised50-second cut](demo/stormwatch-demo-review.mp4) contains real boss/mixed/final-wave footage and has [independent review](lantern-consecutive-motion-review.md). Shot provenance, crops, silence and still/live montage are disclosed.|

## Delivery verification

The original desktop performance profile passes on the final renderer candidate: all three in-app Chromium 152 runs achieved median 59.88 FPS, p95 17.6 ms, worst 17.8 ms and zero intervals over 100 ms. [Protocol and browser limitation](../../docs/evidence/animal-performance-summary.md). Chrome 153 retained isolated stress stalls; that result is not waived or labelled passing. Physical mobile performance is not assessed.

Final source checkpoint `4961b03` passes 112 tests in 17 files, type checking, formatting and production build. The rebuilt renderer/QA bundle names match the measured candidate. Documentation, curated evidence and runtime assets are committed locally. A fresh archive of `09aa194` passes all required checks and reproduces the measured bundle; see [delivery verification](delivery-export-report.md).

Actual busy-combat footage is saved, and independent consecutive-frame/edited-demo review is complete. These close the previous missing-content gates without claiming continuous perceptual playback or audio review.

## Explicit limits

Audio listening and physical-device performance remain unassessed. Screenshots and extracted consecutive frames do not establish continuous perceptual cadence. The current built directory is 17,298,067 bytes, below 20 MB. This is disk accounting, not cold transfer. Earlier controlled title load was1.600s/1,266,475 response-body bytes; no claim that it proves encounter streaming or mobile radio performance. Earlier public MVP acceptance/deployment describes the foundation, not this local reboot.

## Latest renderer verification

The 60 FPS pacer was rejected after actual rendered p95 reached 23.2 / 20.7 / 17.5 ms and every run retained long intervals. Its source and evidence are retained under `rejected-pacing/`; it is no longer active.

Current candidate keeps enemy leg geometry static and applies identical bone transforms in a vertex shader, avoiding repeated vertex-buffer uploads. Matrix equivalence/ownership tests pass, along with 112 tests and required checks. [GPU leg regression review](gpu-leg-regression-review.md) passed for all four roles in side/front/rear samples with no observed shader warnings. It supports retaining the prior character-animation assessment, without claiming a new full-combat or continuous-playback review. Chrome 153 qualification finished with raw/rendered p95 17.1 / 17.5 / 17.6 ms, worst 143.6 / 133.5 / 100.9 ms and 2 / 2 / 1 intervals over 100 ms. It fails the no-stall gate. The identical build subsequently passed one diagnostic in the original baseline in-app Chromium 152: p95 17.5 ms, worst 17.8 ms, zero intervals over 100 ms. Full three-run qualification in that baseline browser passed: all p95 17.6 ms, worst 17.8 ms, zero intervals over 100 ms. Both browser results are retained; the diagnostic does not substitute for qualification. The QA status text now updates only when changed, so the next timing result includes both changes and cannot isolate their individual effects.
