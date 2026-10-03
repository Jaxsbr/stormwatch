import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const directory = path.dirname(fileURLToPath(import.meta.url));
const raw = await fs.readFile(path.join(directory, "catalogue.js"), "utf8");
const prefix = "// prettier-ignore\nwindow.STORMWATCH_IDEAS = ";
if (!raw.startsWith(prefix)) throw new Error("Unexpected catalogue format.");
const ideas = JSON.parse(raw.slice(prefix.length).trim().replace(/;$/, ""));
if (!ideas.length) throw new Error("Empty catalogue.");
const ids = new Set(),
  hashes = new Set(),
  assets = new Set();
for (const idea of ideas) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(idea.id) || ids.has(idea.id))
    throw new Error(`Invalid or duplicate id: ${idea.id}`);
  ids.add(idea.id);
  if (!/^assets\/[a-z0-9-]+\.(png|webp|jpe?g|gif)$/.test(idea.asset))
    throw new Error(`Invalid asset: ${idea.asset}`);
  if (
    !idea.title ||
    !idea.description ||
    !idea.source?.label ||
    !idea.source?.file
  )
    throw new Error(`Missing metadata: ${idea.id}`);
  if (!["existing", "concept"].includes(idea.kind))
    throw new Error(`Invalid kind: ${idea.id}`);
  if (
    !Array.isArray(idea.categories) ||
    !idea.categories.length ||
    new Set(idea.categories).size !== idea.categories.length ||
    idea.categories.some(
      (category) =>
        !["background", "map", "interface", "character"].includes(category),
    )
  )
    throw new Error(`Invalid categories: ${idea.id}`);
  if (
    path.isAbsolute(idea.source.file) ||
    /\/Users\/|\/home\/|\.codex\//.test(JSON.stringify(idea))
  )
    throw new Error(`Private path in ${idea.id}`);
  const bytes = await fs.readFile(path.join(directory, idea.asset));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== idea.sha256 || hashes.has(hash))
    throw new Error(`Changed or duplicate asset: ${idea.id}`);
  hashes.add(hash);
  assets.add(path.basename(idea.asset));
  const { width, height } = await sharp(bytes).metadata();
  if (width !== idea.width || height !== idea.height)
    throw new Error(`Wrong dimensions: ${idea.id}`);
}
for (const file of await fs.readdir(path.join(directory, "assets")))
  if (!assets.has(file)) throw new Error(`Uncatalogued asset: ${file}`);
console.log(
  `Verified ${ideas.length} ideas: metadata, local assets, dimensions, hashes and provenance.`,
);
