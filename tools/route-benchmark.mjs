/** Synthetic simulation-only comparison; never measures rendering or physical devices. */
import { createServer } from "vite";
import { performance } from "node:perf_hooks";
const server = await createServer({
  logLevel: "silent",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
try {
  const { CANONICAL_CONTENT, resolveConfiguration } =
    await server.ssrLoadModule("/src/config/configuration.ts");
  const { Game } = await server.ssrLoadModule("/src/sim/game.ts");
  const two = process.argv.includes("--two-routes");
  const content = structuredClone(CANONICAL_CONTENT),
    map = content.levels[0];
  map.availableTowers = ["bolt", "stone", "net"];
  map.startCoins = 10000;
  map.healthScale = 1000;
  if (two) {
    map.routeLayoutId = "twin-switchbacks";
    map.path = [];
    map.blocked = [];
    map.width = 12;
    map.depth = 8;
  }
  for (const enemy of Object.values(content.enemies)) enemy.speed = 0.02;
  const kinds = ["raider", "runner", "armored", "boss"];
  map.waves = [
    {
      id: "synthetic",
      title: "Synthetic route stress",
      reward: 0,
      abilities: { ratShield: true, weaselEvade: true },
      packets: [
        {
          id: "population",
          groups: kinds.map((kind, i) => ({
            id: kind,
            kind,
            count: i === 3 ? 1 : i === 2 ? 19 : 20,
            gap: 0.1,
            ...(two ? { routeId: i % 2 ? "route-b" : "route-a" } : {}),
          })),
        },
      ],
    },
  ];
  const config = resolveConfiguration(content);
  function run() {
    const g = new Game(config.level, "none", false, 42, {
      configuration: config,
    });
    let placed = 0;
    for (let z = 0; z < g.level.depth && placed < 12; z++)
      for (let x = 0; x < g.level.width && placed < 12; x++)
        if (g.place(["bolt", "stone", "net"][placed % 3], { x, z })) placed++;
    g.startWave();
    const start = performance.now();
    let peak = 0;
    for (let i = 0; i < 5400; i++) {
      g.tick(1 / 30);
      peak = Math.max(peak, g.state.enemies.length);
    }
    return {
      ms: performance.now() - start,
      peak,
      towers: placed,
      phase: g.state.phase,
      clock: g.state.clock,
    };
  }
  for (let i = 0; i < 5; i++) run();
  const samples = Array.from({ length: 25 }, run),
    raw = samples.map((s) => s.ms),
    ordered = [...raw].sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        scenario: two ? "two routes" : "legacy single route",
        steps: 5400,
        simulatedSeconds: 180,
        runs: 25,
        rawMs: raw.map((n) => +n.toFixed(3)),
        medianMs: +ordered[12].toFixed(3),
        p95Ms: +ordered[23].toFixed(3),
        peakEnemies: samples[0].peak,
        towers: samples[0].towers,
        phase: samples[0].phase,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
