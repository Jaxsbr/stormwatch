// Local, repeatable cold-load profile: aggregate 10 Mbps response bodies and
// 100 ms delay before each response. This is server shaping, not device emulation.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const pending = [];
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
};
setInterval(() => {
  const transfer = pending.shift();
  if (!transfer || transfer.response.destroyed) return;
  const end = Math.min(transfer.offset + 12_500, transfer.body.length);
  transfer.response.write(transfer.body.subarray(transfer.offset, end));
  transfer.offset = end;
  if (end === transfer.body.length)
    transfer.response.end(() =>
      console.log(
        JSON.stringify({ file: transfer.file, bytes: transfer.body.length }),
      ),
    );
  else pending.push(transfer);
}, 10);

http
  .createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const filename = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!filename.startsWith(root + path.sep))
        throw new Error("Invalid path");
      const body = await fs.readFile(filename);
      setTimeout(() => {
        if (response.destroyed) return;
        response.writeHead(200, {
          "Content-Type":
            types[path.extname(filename)] ?? "application/octet-stream",
          "Content-Length": body.length,
          "Cache-Control": "no-store",
        });
        pending.push({ response, body, offset: 0, file: pathname });
      }, 100);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  })
  .listen(4175, "127.0.0.1", () =>
    console.log(
      "Cold-load profile at http://127.0.0.1:4175/?measure: 10 Mbps aggregate bodies, 100 ms response delay, no cache.",
    ),
  );
