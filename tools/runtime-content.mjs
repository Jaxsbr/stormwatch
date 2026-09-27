import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Read-only local content adapter. Published games use the emitted JSON asset. */
export function runtimeContentMiddleware(file) {
  return async (req, res, next) => {
    if (req.url?.split("?")[0] !== "/game-content.json") return next();
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    try {
      const content = await readFile(file, "utf8");
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch {
      res.writeHead(503, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      });
      res.end("Game configuration is unavailable.");
    }
  };
}
export function runtimeContentPlugin() {
  let file;
  return {
    name: "stormwatch-runtime-content",
    configResolved(config) {
      file = resolve(config.root, "src/content/recipes.json");
    },
    configureServer(server) {
      server.middlewares.use(runtimeContentMiddleware(file));
    },
    configurePreviewServer(server) {
      server.middlewares.use(runtimeContentMiddleware(file));
    },
    async generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "game-content.json",
        source: await readFile(file, "utf8"),
      });
    },
  };
}
