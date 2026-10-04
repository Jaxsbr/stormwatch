import { createServer } from "vite";
import { resolve } from "node:path";
import { runtimeContentMiddleware } from "./runtime-content.mjs";
import { workbenchApi } from "./workbench-api.mjs";

// This explicitly selected local adapter never edits the accepted campaign.
const candidate = resolve("review/mosswater-encounters/game-content.json");
const server = await createServer({
  configFile: false,
  base: "/",
  define: {
    __STORMWATCH_QA__: "true",
    __STORMWATCH_ENGINE_REVISION__: JSON.stringify(
      "mosswater-functional-feedback",
    ),
  },
  server: { host: "127.0.0.1", port: 4177, strictPort: true },
  plugins: [
    {
      name: "mosswater-functional-feedback",
      transform(code, id) {
        if (
          !/\/src\/(?:workbench\/(?:working-draft|drafts)|persistence\/(?:save|profiles))\.ts$/.test(
            id,
          )
        )
          return;
        // Keep previous local authoring/profile data intact on a reused development port.
        return code
          .replaceAll(
            "stormwatch.working-draft.v1",
            "stormwatch.mosswater-feedback.working-draft.v1",
          )
          .replaceAll(
            "stormwatch.designer-workbench.v1",
            "stormwatch.mosswater-feedback.designer-workbench.v1",
          )
          .replaceAll(
            "stormwatch.profiles.v1",
            "stormwatch.mosswater-feedback.profiles.v1",
          )
          .replaceAll(
            "stormwatch.save.v1",
            "stormwatch.mosswater-feedback.save.v1",
          );
      },
      configureServer(server) {
        server.middlewares.use(runtimeContentMiddleware(candidate));
        server.middlewares.use(
          workbenchApi(candidate, async () => {
            const [config, draft] = await Promise.all([
              server.ssrLoadModule("/src/config/configuration.ts"),
              server.ssrLoadModule("/src/workbench/working-draft.ts"),
            ]);
            return { ...draft, validateContent: config.validateContent };
          }),
        );
      },
    },
  ],
});
await server.listen();
console.log(
  "Mosswater functional feedback — accepted campaign, isolated review helpers",
);
console.log(
  "Feedback guide: http://127.0.0.1:4177/review/mosswater-encounters/",
);
console.log("Game (candidate content): http://127.0.0.1:4177/");
console.log(
  "Workbench (promotes candidate only): http://127.0.0.1:4177/workbench.html",
);
