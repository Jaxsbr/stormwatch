import { createServer } from "vite";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

// Run the same public save/profile boundary against either checkout.
const root = resolve(process.argv[2] ?? ".");
const server = await createServer({
  root,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { freshSave, recordVictoryOutcome } = await server.ssrLoadModule(
    "/src/persistence/save.ts",
  );
  const { loadProfiles } = await server.ssrLoadModule(
    "/src/persistence/profiles.ts",
  );
  const { CANONICAL_CONTENT } = await server.ssrLoadModule(
    "/src/config/configuration.ts",
  );
  const finaleOnly = recordVictoryOutcome(
    freshSave(),
    CANONICAL_CONTENT.levels[2].id,
    1,
  );
  let completed = freshSave();
  for (const level of CANONICAL_CONTENT.levels)
    completed = recordVictoryOutcome(completed, level.id, 1).save;
  const raw = JSON.stringify({
    version: 2,
    active: "a",
    users: [
      { id: "a", nickname: "Alice", avatar: "fox", progress: completed },
      { id: "b", nickname: "Bob", avatar: "rabbit", progress: freshSave() },
    ],
  });
  for (let i = 0; i < 50; i++) loadProfiles(raw, null);
  const samplesMs = [];
  for (let i = 0; i < 300; i++) {
    const start = performance.now();
    loadProfiles(raw, null);
    samplesMs.push(Number((performance.now() - start).toFixed(6)));
  }
  const sorted = [...samplesMs].sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        node: process.version,
        samples: samplesMs.length,
        medianMs: sorted[Math.floor(sorted.length / 2)],
        p95Ms: sorted[Math.floor(sorted.length * 0.95)],
        finaleOnlyFirstBoardComplete: finaleOnly.firstBoardComplete,
        profileIndependence: loadProfiles(raw, null).users[1].progress.stars,
        samplesMs,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
