# Simulated battle art loading benchmark

The QA fixture creates a real `Battlefield` for Lantern Pass and The Last Lantern.
It measures from battlefield construction until required encounter cutouts and
scenery are loaded, followed by the first rendered frame. The browser run uses a
960 × 540 battlefield, Chrome at 4× CPU slowdown, 100 ms network latency and
20 Mbps download throughput. Cold runs clear the browser cache; warm runs prime
each build's cache first. Each level and cache mode runs five times. The benchmark
records raw samples, median and p95 of the first post-ready frame, and distinct
WebP URLs requested.

Build the QA page and run a single-build baseline locally:

```sh
npm run build:qa
node tools/art-benchmark.mjs --candidate dist-qa --output art-benchmark.json
```

For a paired comparison, build main and the candidate separately, then run:

```sh
node tools/art-benchmark.mjs --baseline /path/to/main/dist-qa --candidate dist-qa --output art-benchmark.json
```

The PR job builds both revisions on the same runner and alternates their samples.
It fails if either build has missing art, failed image loads or a candidate p95
more than `max(300 ms, 25% of main p95)` above main for either level or cache
mode. This margin tolerates runner variation and some normal content growth while
catching a substantial loading regression. A new encounter or major art change
should also be reviewed against its own representative fixture.

This is a desktop browser simulation. It does not reproduce phone GPU, memory
bandwidth, storage or thermal limits. The first post-ready frame is a repeatable
proxy for battle art availability; it is not a claim about physical-device
performance. [Pre-change raw samples](../evidence/art-loading-before.json) are
kept for the architecture review; CI compares against main at the time of each PR.
