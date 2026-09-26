import { defineConfig, type Plugin } from "vite";

const utilityModule =
  /\/(?:src\/(?:workbench|qa)\/|src\/render\/recording\.|tools\/)/;

/** Inspect the emitted graph, including dynamically imported chunks. */
function productionBoundary(): Plugin {
  return {
    name: "stormwatch-production-boundary",
    generateBundle(_, bundle) {
      for (const [name, output] of Object.entries(bundle)) {
        if (output.type !== "chunk") continue;
        for (const moduleId of Object.keys(output.modules)) {
          if (utilityModule.test(moduleId.replaceAll("\\", "/"))) {
            this.error(
              `Production reaches utility module: ${moduleId} (${name})`,
            );
          }
        }
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const target =
    mode === "workbench" ? "workbench" : mode === "qa" ? "qa" : "game";
  return {
    base: "./",
    define: {
      __STORMWATCH_QA__: JSON.stringify(command === "serve" || target === "qa"),
    },
    plugins:
      target === "game" && command === "build" ? [productionBoundary()] : [],
    build: {
      target: "es2022",
      outDir: target === "game" ? "dist" : `dist-${target}`,
      rolldownOptions: {
        input: target === "game" ? "index.html" : `${target}.html`,
      },
    },
    server: { port: 4173 },
  };
});
