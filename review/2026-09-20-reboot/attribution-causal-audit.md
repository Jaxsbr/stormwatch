# Attribution diagnostic causal audit

Date: 2026-09-20

Evidence: [`docs/evidence/animal-performance-attribution.json`](../../docs/evidence/animal-performance-attribution.json). This was one attribution run in the existing Chrome tab at 1280×720, DPR 1. The page was visible and focused at both probe endpoints. The probe ran from `2026-09-20T05:21:27.460Z` to `2026-09-20T05:24:37.516Z`; the tab was not observed during the measurement window.

## Result

The raw diagnostic metrics were p95 17.5 ms, worst 83.7 ms, and zero raw RAF intervals over 100 ms. These numbers are diagnostic evidence only, not a replacement qualification run. The probe retained 17 frame records over its 50 ms threshold, 12 `longtask` entries, and 3,782 Worker heartbeat deliveries. It retained no Worker interval or delivery delay over 75 ms. Chrome exposed `longtask` but not `gc`, so this run cannot make a garbage-collection attribution.

## Synchronized patterns

The first probe callback is a setup boundary: at `05:21:27.467Z` it records 736.9 ms of callback wall time, and a 744 ms long task starts at `05:21:27.462Z`. The probe is created before the first fixture/render callback, so this is startup assembly and must not be read as steady-state gait cost. The next record has a 733.6 ms RAF interval but only 63.5 ms of callback work and a matching 65 ms long task. These records explain why startup must be separated from the gameplay window.

In the rest of the run, 10 of 12 long-task entries overlap a retained callback record by timestamp. Examples include 89.2 ms callback work with a 90 ms long task at `05:21:28.361Z`, 90.0 ms with a 92 ms task at `05:21:37.762Z`, 60.4 ms with a 63 ms task at `05:22:05.559Z`, and 64.6 ms with a 71 ms task at `05:24:15.103Z`. This proves that those samples contained a long main-thread task during the measured callback wall interval. It does not prove that animation code alone caused the task: the callback includes simulation, fixture replenishment, status text, renderer submission, and instrumentation, and the probe records wall time rather than CPU time. The two standalone tasks were 55 ms at `05:21:34.943Z` and 50 ms at `05:23:47.497Z`; neither overlapped a retained frame record, which is expected because the probe stores only records crossing its own thresholds.

The retained RAF intervals must be paired with the **preceding** callback, not only the callback recorded on the same row. For example, the 166.8 ms interval at 05:21:28.452Z follows the 89.2 ms callback at 05:21:28.361Z; the 83.7 ms interval at 05:21:37.855Z follows 90.0 ms of callback work. Likewise, the later 83.0 and 83.7 ms intervals follow 72.3 and 64.6 ms callbacks. These examples therefore do not independently establish an external scheduling gap. Their small entry gaps are consistent with the main thread returning from that preceding work shortly before the next callback. The earlier uninstrumented qualification's low-work Run 2 gaps remain unexplained by this separate run.

The worker had no retained interval or delivery delay over 75 ms. That does not contradict a 90 ms callback: a 50 ms heartbeat may land partway through it and incur less than 75 ms delivery delay. No GC entries were available. The first negative RAF interval is a setup bookkeeping artifact from mixing a `performance.now()` initial value with RAF timestamps; resetting the initial timestamp to zero removes it without changing measured steady-state samples.

## Limits and use

The Worker heartbeat is an independent scheduling signal, not a CPU profiler. An absence of gaps over 75 ms cannot rule out shorter preemption, and the final in-flight Worker messages may not have been delivered before stop. `longtask` attribution is `unknown`; there is no frame/task identifier, and asynchronous GPU completion remains outside the measurement. `callbackWorkMs` is elapsed wall time, so an OS pause while JavaScript is inside the callback would inflate it without proving that the game loop consumed that CPU time.

This diagnostic gives the intended split for future reports: retain raw RAF failures as observed cadence evidence; pair every RAF interval with the preceding callback before classifying any residual gap; and describe callback/long-task overlap as main-thread wall-time work without claiming a specific animation, GC, GPU, browser, or OS cause. The earlier three-run qualification remains the gate result and is not waived or reclassified by this single diagnostic.
