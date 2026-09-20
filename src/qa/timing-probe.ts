/** Diagnostic observations only: never filters or reclassifies raw frame results. */
export class TimingProbe {
  private worker = new Worker(new URL("./heartbeat.ts", import.meta.url), {
    type: "module",
  });
  private observer?: PerformanceObserver;
  private previousExit = 0;
  private started = {
    timestamp: performance.timeOrigin + performance.now(),
    visibility: document.visibilityState,
    focused: document.hasFocus(),
  };
  private workerSamples = 0;
  private workerGaps: {
    sequence: number;
    timestamp: number;
    intervalMs: number;
    deliveryDelayMs: number;
  }[] = [];
  private frames: {
    timestamp: number;
    rafGapMs: number;
    entryGapMs: number;
    callbackWorkMs: number;
  }[] = [];
  private tasks: object[] = [];
  private observedTypes = ["longtask", "gc"].filter((type) =>
    PerformanceObserver.supportedEntryTypes.includes(type),
  );
  constructor() {
    this.worker.onmessage = ({ data }) => {
      this.workerSamples++;
      const deliveryDelayMs =
        performance.timeOrigin + performance.now() - data.timestamp;
      if (data.intervalMs > 75 || deliveryDelayMs > 75)
        this.workerGaps.push({ ...data, deliveryDelayMs });
    };
    if (this.observedTypes.length) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          this.tasks.push({
            ...entry.toJSON(),
            timestamp: performance.timeOrigin + entry.startTime,
          });
      });
      this.observer.observe({ entryTypes: this.observedTypes });
    }
  }
  frame(rafGapMs: number, entry: number, exit: number) {
    const entryGapMs = this.previousExit ? entry - this.previousExit : 0;
    const callbackWorkMs = exit - entry;
    if (rafGapMs > 50 || entryGapMs > 50 || callbackWorkMs > 50)
      this.frames.push({
        timestamp: performance.timeOrigin + entry,
        rafGapMs,
        entryGapMs,
        callbackWorkMs,
      });
    this.previousExit = exit;
  }
  stop() {
    for (const entry of this.observer?.takeRecords() ?? [])
      this.tasks.push({
        ...entry.toJSON(),
        timestamp: performance.timeOrigin + entry.startTime,
      });
    this.worker.terminate();
    this.observer?.disconnect();
    return {
      started: this.started,
      ended: {
        timestamp: performance.timeOrigin + performance.now(),
        visibility: document.visibilityState,
        focused: document.hasFocus(),
      },
      note: "Diagnostic only. Frame records retain gaps/work over 50 ms; worker records retain self intervals or delivery delays over 75 ms. All raw RAF samples remain in the usual metrics. Wall elapsed time is not CPU execution time. Worker pauses suggest shared scheduling pressure but do not identify its cause. GC is observed only if supported. Final in-flight worker messages may not be delivered before stop.",
      observedTypes: this.observedTypes,
      workerSamples: this.workerSamples,
      workerGaps: this.workerGaps,
      frames: this.frames,
      tasks: this.tasks,
    };
  }
}
