// Explicit local-only review server. Never bundled into the published game.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
const root = path.resolve("dist");
const output = path.resolve("review/recordings");
const port = 4176;
const origin = `http://127.0.0.1:${port}`;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, origin).pathname;
      if (pathname === "/__review/capture" && req.method === "POST") {
        if (
          req.headers.origin !== origin ||
          !req.headers["content-type"]?.startsWith("video/webm")
        ) {
          res.writeHead(403).end();
          return;
        }
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024) {
            res.writeHead(413).end();
            return;
          }
          chunks.push(chunk);
        }
        if (!bytes) {
          res.writeHead(400).end();
          return;
        }
        await fs.mkdir(output, { recursive: true });
        const name = `gameplay-${Date.now()}-${randomUUID().slice(0, 8)}.webm`;
        await fs.writeFile(path.join(output, name), Buffer.concat(chunks), {
          flag: "wx",
        });
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ path: `review/recordings/${name}`, bytes }));
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405).end();
        return;
      }
      const filename = path.resolve(
        root,
        `.${decodeURIComponent(pathname === "/" ? "/index.html" : pathname)}`,
      );
      if (!filename.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const body = await fs.readFile(filename);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404).end();
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(
      `Review preview: ${origin}/?record; clips save to review/recordings/`,
    ),
  );
