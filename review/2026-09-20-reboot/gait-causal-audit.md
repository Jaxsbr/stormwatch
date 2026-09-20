# Gait qualification causal audit

Date: 2026-09-20

This audit covers the raw result at [`docs/evidence/animal-performance-gait-qualification.json`](../../docs/evidence/animal-performance-gait-qualification.json), collected at 1280×720, DPR 1, in a foreground Chrome tab. It checks the QA bookkeeping in [`src/qa/benchmark.ts`](../../src/qa/benchmark.ts) and the renderer timing in [`src/render/battlefield.ts`](../../src/render/battlefield.ts). It does not waive any recorded frame-time failure.

## What the fixture actually measures

In `frame()`, `raw = now - last` is the difference between consecutive `requestAnimationFrame` timestamps. It is an interval between callback timestamps, so it includes time when the page was not executing the QA callback. The fixture attaches `previousWork` to a long interval; that object is the synchronous work measured at the end of the preceding callback. The field update receives `Math.min(raw / 1000, 0.1)`, so simulation and rendering advance by at most 100 ms even when the reported RAF interval is 150–267 ms. This keeps the raw cadence metric and the simulation clock separate.

`previousWork.totalMs` includes the fixture's simulation, replenishment, status update, and `Battlefield.update()` call. `frameProfile` splits only the synchronous renderer call into figures, effects, and submission. It does not measure asynchronous GPU completion. `phase: "wave"`, `rebuiltScene: false`, `createdRigs`, and draw calls describe the preceding game/render state; they do not establish why the following RAF callback was late. `invalidatedByHiddenTab: false` only says that the page did not observe `document.hidden` during the run. It cannot rule out compositor throttling, OS scheduling, process suspension, or a collection pause between callbacks.

## Classification of the recorded spikes

Run 2 is the clearest counterexample to calling every long frame game-caused. Its three intervals cluster at elapsed 29.0918–29.5501 s and are 149.9, 250.0, and 158.3 ms. The preceding callback work is only 3.5, 3.8, and 3.2 ms; renderer work is 3.4, 3.8, and 3.2 ms; figures are 0.9–1.3 ms; submission is 2.1–2.2 ms; `createdRigs` is zero and draw calls stay at 277. The gap therefore occurred almost entirely after the previous callback returned and before the next callback was delivered. `phase: "wave"` is context, not attribution. These are valid raw RAF failures, but this evidence cannot attribute them to the game's animation loop.

Run 3 contains long wall-clock intervals inside callbacks as well as a gap outside them. The 266.8 ms interval at 80.1577 s follows 251.5 ms of measured work, including 248.7 ms in the figures phase. The 149.9 ms interval at 21.6249 s follows 144.4 ms of measured work, dominated by 139.8 ms of renderer submission. Those records support investigating the corresponding synchronous paths. They do not establish CPU execution time: process descheduling or suspension during a callback also increases these measurements. They also do not measure asynchronous GPU completion. Run 1 is mixed: its 133.4 ms interval follows only 3.0 ms of work, while its 100.6 ms interval follows 43.9 ms, dominated by 39.9 ms of submission.

The qualification is therefore a real raw-frame result with mixed causes. The current evidence supports retaining the raw p95/worst and `>100 ms` counts, but causal wording should distinguish callback work from scheduling gaps. It does not support the stronger statement that all “ordinary” long frames were produced by gameplay, and it does not prove that the low-work gaps came from a particular host or browser subsystem.

## One bounded attribution diagnostic

Add temporary QA-only instrumentation for one 30–60 second run in the same foreground tab. Do not change the playable loop. Keep the existing raw RAF metric and, on every callback, record:

* `rafGapMs`: RAF timestamp minus the previous RAF timestamp;
* `entryGapMs`: `performance.now()` at callback entry minus the previous callback exit;
* `callbackWorkMs`: callback exit minus callback entry;
* `longtask` entries from a `PerformanceObserver`, with start and duration; record `gc` entries only when the browser exposes them.

Alongside it, start a 20 Hz dedicated Worker heartbeat. Each worker message must contain a sequence number and the worker's monotonic timestamp. At delivery, record the main-thread timestamp. Keep both the worker-to-worker interval and delivery delay, rather than relying only on message arrival cadence. Capture `visibilityState` and `hasFocus` at start and end, then collect the JSON after the run without observing the page during measurement.

Interpretation for each raw gap is then bounded and testable:

* High `callbackWorkMs`, a matching renderer/simulation phase, or an overlapping long-task entry localizes elapsed time to a main-thread task, but does not by itself distinguish CPU work from descheduling during that task. A `gc` entry, when available, identifies a collection pause; otherwise call it a main-thread long task rather than claiming GC.
* Low callback work with normal Worker self intervals but a large delivery delay points to main-thread/RAF dispatch or compositor scheduling outside the game callback.
* A large Worker self interval as well as a RAF gap indicates a pause affecting the process or its scheduling. It distinguishes this from the game's loop, but cannot by itself name the OS cause.
* If neither callback work nor a long-task entry overlaps the gap, do not label it game-caused; retain it as an unattributed raw scheduling gap.

This single paired-clock run would make the Run 2 pattern falsifiable without another full three-run qualification. It also preserves the raw gate, avoids relying on a screenshot or DOM poll during measurement, and makes clear what remains unproven about GPU completion and host-level scheduling.
