import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { artRegressions } from "./art-benchmark-gate.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const candidate = resolve(option("--candidate", "dist-qa"));
const baselineArg = option("--baseline", "");
const baseline = baselineArg ? resolve(baselineArg) : null;
const runs = Number(option("--runs", "5"));
const levels = option("--levels", "lantern-pass,the-last-lantern").split(",");
const output = option("--output", "");
if (!Number.isInteger(runs) || runs < 2)
  throw new Error("--runs must be at least 2");

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
async function serve(root) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const file = resolve(
        root,
        `.${pathname === "/" ? "/qa.html" : pathname}`,
      );
      if (!file.startsWith(root + sep)) throw new Error("Invalid path");
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": mime[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));
async function chrome() {
  const binary =
    process.env.CHROME_BIN ??
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome");
  const profile = await mkdtemp(join(tmpdir(), "stormwatch-art-bench-"));
  const child = spawn(
    binary,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-webgl",
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--window-size=960,650",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let port;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null)
      throw new Error(`Chrome exited ${child.exitCode}`);
    try {
      port = Number(
        (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split(
          "\n",
        )[0],
      );
      break;
    } catch {
      await wait(100);
    }
  }
  if (!port) throw new Error("Chrome debugging port unavailable");
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Chrome page unavailable");
  return { child, profile, wsUrl: page.webSocketDebuggerUrl };
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.pending = new Map();
    this.nextId = 1;
    this.listeners = new Set();
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending?.reject(new Error(message.error.message));
        else pending?.resolve(message.result);
      } else for (const listener of this.listeners) listener(message);
    });
  }
  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    this.socket.close();
  }
}

async function sample(cdp, origin, level, cold) {
  const requests = new Set();
  const pending = new Set();
  const failures = [];
  const listener = ({ method, params }) => {
    if (
      method === "Network.requestWillBeSent" &&
      /\.(?:webp|json)(?:\?|$)/.test(params.request.url)
    ) {
      pending.add(params.requestId);
      if (params.request.url.includes(".webp"))
        requests.add(params.request.url);
    }
    if (method === "Network.loadingFinished") pending.delete(params.requestId);
    if (method === "Network.loadingFailed") {
      if (pending.has(params.requestId)) failures.push(params.errorText);
      pending.delete(params.requestId);
    }
  };
  cdp.listeners.add(listener);
  try {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: cold });
    if (cold) await cdp.send("Network.clearBrowserCache");
    await cdp.send("Page.navigate", {
      url: `${origin}/qa.html?art-load&level=${level}`,
    });
    let result;
    for (let i = 0; i < 600; i++) {
      const value = await cdp.send("Runtime.evaluate", {
        expression: "window.__stormwatchArtLoad",
        returnByValue: true,
      });
      if (value.result?.value?.level === level) {
        result = value.result.value;
        break;
      }
      await wait(50);
    }
    if (!result) throw new Error(`Timed out waiting for art: ${level}`);
    for (let i = 0; i < 150 && pending.size; i++) await wait(100);
    if (result.error || result.missingArt || failures.length)
      throw new Error(JSON.stringify({ level, result, failures }));
    return { ...result, imageRequests: requests.size, cold };
  } finally {
    cdp.listeners.delete(listener);
  }
}

function summarize(samples) {
  const ordered = [...samples].sort(
    (a, b) => a.firstRenderedMs - b.firstRenderedMs,
  );
  const percentile = (p) =>
    ordered[Math.ceil(p * ordered.length) - 1].firstRenderedMs;
  return {
    medianMs: percentile(0.5),
    p95Ms: percentile(0.95),
    imageRequestsMedian: [...samples].sort(
      (a, b) => a.imageRequests - b.imageRequests,
    )[Math.floor(samples.length / 2)].imageRequests,
    samples,
  };
}

const servers = [];
let browser;
let cdp;
try {
  const candidateServer = await serve(candidate);
  servers.push(candidateServer.server);
  const baselineServer = baseline ? await serve(baseline) : null;
  if (baselineServer) servers.push(baselineServer.server);
  browser = await chrome();
  cdp = new Cdp(browser.wsUrl);
  await cdp.open();
  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
  ]);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 100,
    downloadThroughput: 2_500_000,
    uploadThroughput: 2_500_000,
  });
  const report = {
    simulation: {
      cpuSlowdown: 4,
      latencyMs: 100,
      downloadBytesPerSecond: 2_500_000,
      runs,
    },
    levels: {},
  };
  for (const level of levels) {
    report.levels[level] = {};
    for (const cold of [true, false]) {
      const name = cold ? "cold" : "warm";
      const series = { candidate: [], baseline: [] };
      if (!cold) {
        if (baselineServer)
          await sample(cdp, baselineServer.origin, level, false);
        await sample(cdp, candidateServer.origin, level, false);
      }
      for (let i = 0; i < runs; i++) {
        for (const side of baselineServer && i % 2
          ? ["candidate", "baseline"]
          : baselineServer
            ? ["baseline", "candidate"]
            : ["candidate"]) {
          const origin =
            side === "baseline"
              ? baselineServer.origin
              : candidateServer.origin;
          series[side].push(await sample(cdp, origin, level, cold));
        }
      }
      report.levels[level][name] = { candidate: summarize(series.candidate) };
      if (baselineServer)
        report.levels[level][name].baseline = summarize(series.baseline);
    }
  }
  if (output)
    await import("node:fs/promises").then(({ writeFile }) =>
      writeFile(output, JSON.stringify(report, null, 2) + "\n"),
    );
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (baseline) {
    const regressions = artRegressions(report);
    if (regressions.length)
      throw new Error(`Art readiness regression:\n${regressions.join("\n")}`);
  }
} finally {
  cdp?.close();
  if (browser) {
    if (browser.child.exitCode === null) {
      browser.child.kill();
      await Promise.race([
        new Promise((done) => browser.child.once("exit", done)),
        wait(5_000),
      ]);
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await rm(browser.profile, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 4) throw error;
        await wait(200);
      }
    }
  }
  for (const server of servers) await new Promise((done) => server.close(done));
}
