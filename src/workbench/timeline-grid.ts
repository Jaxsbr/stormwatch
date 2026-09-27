export const TIME_SNAP = 0.05;

/** Snap positions as well as deltas so imported off-grid values align on drag. */
export function snapTime(seconds: number, minimum = 0): number {
  const nearest = Math.round(seconds / TIME_SNAP);
  const lower = Math.ceil(minimum / TIME_SNAP - 1e-9);
  return Number((Math.max(lower, nearest) * TIME_SNAP).toFixed(10));
}

/** Keep subdivisions legible; zoom changes grid density, never snap precision. */
export function timelineGrid(pixelsPerSecond: number) {
  const step = (pixels: number) => {
    for (let exponent = -2; exponent < 12; exponent++) {
      for (const multiplier of [1, 2, 5]) {
        const seconds = Number((multiplier * 10 ** exponent).toPrecision(12));
        if (seconds >= TIME_SNAP && seconds * pixelsPerSecond >= pixels)
          return seconds;
      }
    }
    return 1e12;
  };
  return { minor: step(8), major: step(60) };
}
