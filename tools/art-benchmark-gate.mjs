/** Return each representative encounter/cache mode whose p95 exceeds the CI allowance. */
export function artRegressions(report) {
  const regressions = [];
  for (const [level, modes] of Object.entries(report.levels))
    for (const [mode, { candidate, baseline }] of Object.entries(modes)) {
      const allowance = Math.max(300, baseline.p95Ms * 0.25);
      if (candidate.p95Ms > baseline.p95Ms + allowance)
        regressions.push(
          `${level} ${mode}: p95 ${candidate.p95Ms.toFixed(0)}ms > ${(baseline.p95Ms + allowance).toFixed(0)}ms`,
        );
    }
  return regressions;
}
