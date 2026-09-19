// Opt-in measurement UI. Normal player screens never show diagnostics.
export async function showLoadReport() {
  if (!new URLSearchParams(location.search).has("measure")) return;
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}art/title-background.webp`;
  await Promise.all([document.fonts.ready, image.decode()]);
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  const resources = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  const report = {
    titleReadyMs: performance.now(),
    titleImageDecoded: image.complete && image.naturalWidth > 0,
    titleImageWidth: image.naturalWidth,
    titleImageTimingIncluded: resources.some((r) =>
      r.name.includes("title-background.webp"),
    ),
    transferBytes:
      resources.reduce((sum, r) => sum + r.transferSize, 0) +
      (navigation?.transferSize ?? 0),
    resources: resources.map((r) => ({
      file: new URL(r.name).pathname,
      durationMs: r.duration,
      transferBytes: r.transferSize,
    })),
    userAgent: navigator.userAgent,
    viewport: [innerWidth, innerHeight],
  };
  const details = document.createElement("details");
  details.id = "load-evidence";
  details.style.cssText =
    "position:fixed;bottom:8px;right:8px;z-index:100;background:#142825;color:#fff;padding:8px;max-width:90vw;max-height:80vh;overflow:auto;font:12px monospace";
  const summary = document.createElement("summary");
  summary.textContent = `Load evidence: title ready ${Math.round(report.titleReadyMs)} ms · ${report.transferBytes} bytes`;
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(report, null, 2);
  details.append(summary, pre);
  document.body.append(details);
}
