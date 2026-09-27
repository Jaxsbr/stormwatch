import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { build, createServer } from "vite";

/** Fixed local destination; never reachable from the production game server. */
export function workbenchApi(file, loadModel, refreshPreview = async () => {}) {
  const token = randomUUID();
  let pending = Promise.resolve();
  return async (req, res, next) => {
    if (!req.url?.startsWith("/__workbench/")) return next();
    const reply = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(value));
    };
    const host = req.headers.host ?? "";
    const remote = req.socket.remoteAddress ?? "";
    if (
      !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ||
      !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote) ||
      (req.headers.origin && req.headers.origin !== `http://${host}`)
    ) {
      return reply(403, {
        error: "Workbench writes are available only on this local computer.",
      });
    }
    try {
      const { validateContent, validateWorkingDraft, promoteWorkingWave } =
        await loadModel();
      const read = async () => {
        const text = await readFile(file, "utf8");
        const content = JSON.parse(text);
        validateContent(content);
        return { text, content };
      };
      if (req.method === "GET" && req.url === "/__workbench/config") {
        return reply(200, { content: (await read()).content, token });
      }
      if (req.method !== "POST" || req.url !== "/__workbench/promote")
        return reply(404, { error: "Unknown workbench operation." });
      if (
        req.headers.origin !== `http://${host}` ||
        req.headers["x-workbench-token"] !== token ||
        !req.headers["content-type"]?.startsWith("application/json")
      )
        return reply(403, {
          error: "Reload the local workbench before promoting.",
        });
      let body = "";
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 2_000_000)
          return reply(413, { error: "Draft is too large." });
      }
      const draft = validateWorkingDraft(JSON.parse(body));
      const apply = async () => {
        const original = await read();
        const content = promoteWorkingWave(original.content, draft);
        const temporary = `${file}.workbench-${randomUUID()}.tmp`;
        try {
          await writeFile(temporary, `${JSON.stringify(content, null, 2)}\n`, {
            flag: "wx",
          });
          if ((await readFile(file, "utf8")) !== original.text)
            throw new Error("Game config changed during promotion. Try again.");
          await rename(temporary, file);
        } finally {
          await unlink(temporary).catch(() => {});
        }
        let previewError;
        try {
          await refreshPreview();
        } catch (cause) {
          previewError = `Game config was saved, but the local game could not refresh: ${cause instanceof Error ? cause.message : String(cause)}`;
        }
        reply(200, { content, ...(previewError ? { previewError } : {}) });
      };
      const operation = pending.then(apply);
      pending = operation.catch(() => {});
      await operation;
    } catch (cause) {
      reply(409, {
        error:
          cause instanceof Error ? cause.message : "Unable to promote draft.",
      });
    }
  };
}

const modelLoader = (server) => async () => {
  const [config, draft] = await Promise.all([
    server.ssrLoadModule("/src/config/configuration.ts"),
    server.ssrLoadModule("/src/workbench/working-draft.ts"),
  ]);
  return { ...draft, validateContent: config.validateContent };
};
export function workbenchApiPlugin() {
  let root = "";
  return {
    name: "stormwatch-local-workbench-api",
    configResolved(config) {
      root = config.root;
    },
    handleHotUpdate(context) {
      // Promotion updates the client deliberately after the write response.
      if (context.file === resolve(root, "src/content/recipes.json")) return [];
    },
    configureServer(server) {
      server.middlewares.use(
        workbenchApi(
          resolve(root, "src/content/recipes.json"),
          modelLoader(server),
          () => refreshGamePreview(root),
        ),
      );
    },
    async configurePreviewServer(server) {
      const loader = await createServer({
        root,
        configFile: false,
        appType: "custom",
        logLevel: "error",
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { middlewareMode: true, hmr: false, ws: false },
      });
      server.httpServer.on("close", () => {
        void loader.close();
      });
      server.middlewares.use(
        workbenchApi(
          resolve(root, "src/content/recipes.json"),
          modelLoader(loader),
          () => refreshGamePreview(root),
        ),
      );
    },
  };
}

export async function refreshGamePreview(root) {
  await build({ root, mode: "production", logLevel: "error" });
}
