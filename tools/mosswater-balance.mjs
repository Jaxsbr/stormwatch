import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";
const server = await createServer({
  configFile: false,
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
try {
  const content = JSON.parse(
    await readFile("review/mosswater-encounters/game-content.json", "utf8"),
  );
  const { validateContent, configurationIdentity } = await server.ssrLoadModule(
    "/src/config/configuration.ts",
  );
  validateContent(content);
  const { campaign, play, createAttempt } = await server.ssrLoadModule(
    "/review/mosswater-encounters/strategies.ts",
  );
  const { progressionContext } = await server.ssrLoadModule(
    "/src/content/progression.ts",
  );
  const { recordVictoryOutcome, freshSave } = await server.ssrLoadModule(
    "/src/persistence/save.ts",
  );
  const result = campaign(content);
  const context = progressionContext(content);
  let save = freshSave(context);
  const losses = [];
  const demand = [];
  const { describeEncounter } = await server.ssrLoadModule(
    "/src/content/encounter-visuals.ts",
  );
  for (const report of result.reports) {
    if (report.id.startsWith("mosswater-")) {
      const level = createAttempt(content, report.id, save).level;
      demand.push({
        id: level.id,
        art: describeEncounter(level),
        waves: level.waves.map((w) => ({
          id: w.id,
          enemies: [
            ...new Set(w.groups.filter((g) => g.count > 0).map((g) => g.kind)),
          ],
        })),
      });
      for (const policy of [
        "upgrades",
        "direct",
        "poison-only",
        "one-lane",
        "hoard",
      ])
        losses.push(play(content, report.id, save, policy));
    }
    if (report.phase !== "won") break;
    save = recordVictoryOutcome(save, report.id, 1, context).save;
  }
  const out = {
    qualification:
      "Real resolved Game, normal mode, seed42, public legal commands, no resources/health/roster injected; prior victories earned by the campaign run. All five new maps use explicit routes and remaining-travel-time targeting, including Rainstone single routes on 03/04. Only the original first-board maps retain legacy distance targeting.",
    contentIdentity: configurationIdentity(content),
    ...result,
    alternatives: losses,
  };
  if (process.argv.includes("--write")) {
    await writeFile(
      "review/mosswater-encounters/art-demand.json",
      JSON.stringify(demand, null, 2) + "\n",
    );
    await writeFile(
      "review/mosswater-encounters/balance-evidence.json",
      JSON.stringify(out, null, 2) + "\n",
    );
  }
  console.log(
    JSON.stringify(
      {
        reports: result.reports.map(({ trace, ...r }) => r),
        alternatives: losses.map(({ trace, ...r }) => r),
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
