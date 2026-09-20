// Independent clock for the opt-in attribution diagnostic, never normal play.
let previous = performance.now();
let sequence = 0;
setInterval(() => {
  const now = performance.now();
  self.postMessage({
    sequence: ++sequence,
    timestamp: performance.timeOrigin + now,
    intervalMs: now - previous,
  });
  previous = now;
}, 50);
