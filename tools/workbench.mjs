/** Local structured operations. No production entry imports this module. */
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
const server = await createServer({
  logLevel: "silent",
  cacheDir: "node_modules/.vite/workbench-cli",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
try {
  const config = await server.ssrLoadModule("/src/config/configuration.ts");
  const runs = await server.ssrLoadModule("/src/workbench/runs.ts");
  const scenarios = await server.ssrLoadModule("/src/workbench/scenarios.ts");
  const [operation = "list", filename] = process.argv.slice(2);
  const request = filename ? JSON.parse(await readFile(filename, "utf8")) : {};
  const content = request.content ?? config.CANONICAL_CONTENT;
  let result;
  switch (operation) {
    case "list":
      result = content.levels.map((l, i) => ({
        id: l.id,
        number: i + 1,
        name: l.name,
        waves: l.waves.map((w, j) => ({
          id: w.id,
          number: j + 1,
          title: w.title,
        })),
      }));
      break;
    case "inspect": {
      const map = request.map ?? 1;
      if (
        !request.levelId &&
        (!Number.isInteger(map) || map < 1 || map > content.levels.length)
      )
        throw new Error("Unknown campaign map number");
      const ref = request.levelId ?? content.levels[map - 1].id;
      if (
        !request.waveId &&
        (!Number.isInteger(request.wave ?? 1) || (request.wave ?? 1) < 1)
      )
        throw new Error("Unknown wave number");
      const c = config.resolveConfiguration(content, ref);
      const wave = request.waveId
        ? c.level.waves.find((w) => w.id === request.waveId)
        : c.level.waves[(request.wave ?? 1) - 1];
      if (!wave) throw new Error("Unknown wave");
      const schedule = await server.ssrLoadModule("/src/sim/spawn-schedule.ts");
      result = {
        configuration: c,
        wave,
        schedule: schedule.compileSpawnSchedule(
          wave,
          c.rules.initialSpawnDelay,
        ),
      };
      break;
    }
    case "validate":
      config.validateContent(content);
      if (request.scenario)
        scenarios.resolveScenario(content, request.scenario);
      result = { valid: true, identity: config.configurationIdentity(content) };
      break;
    case "run":
      result = runs.runScenario(content, request.scenario, request.options);
      break;
    case "compare":
      result = runs.compareScenarios(
        content,
        request.candidate,
        request.scenario,
        request.options,
      );
      break;
    case "search":
      result = runs.searchScenario(
        content,
        request.scenario,
        request.goal,
        request.budget,
        request.maxTicks,
      );
      break;
    default:
      throw new Error(
        "Operation must be list, inspect, validate, run, compare or search",
      );
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} catch (error) {
  process.stderr.write(JSON.stringify({ error: error.message }) + "\n");
  process.exitCode = 1;
} finally {
  await server.close();
}
