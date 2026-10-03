import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const directory = path.dirname(fileURLToPath(import.meta.url));
const prefix = "// prettier-ignore\nwindow.STORMWATCH_IDEAS = ";
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error(
    "Usage: node ideas-catalogue/import.mjs /path/to/import-batch.json",
  );
  process.exit(1);
}
const batchFile = path.resolve(args[0]);
const batch = JSON.parse(await fs.readFile(batchFile, "utf8"));
if (!Array.isArray(batch) || !batch.length)
  throw new Error("Supply a nonempty array of ideas.");
const catalogueFile = path.join(directory, "catalogue.js");
const raw = await fs.readFile(catalogueFile, "utf8");
const ideas = JSON.parse(raw.slice(prefix.length).trim().replace(/;$/, ""));
const staged = [];
for (const entry of batch) {
  for (const key of ["id", "title", "description", "image"])
    if (typeof entry[key] !== "string" || !entry[key].trim())
      throw new Error(`Missing ${key}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id))
    throw new Error("Use a stable lowercase slug for id.");
  if (!entry.source?.label || !entry.source?.file)
    throw new Error("Supply source.label and source.file.");
  // Provenance is portable: local input paths belong only in the temporary batch.
  if (
    path.isAbsolute(entry.source.file) ||
    entry.source.file.includes("..") ||
    entry.source.file.includes("\\")
  )
    throw new Error(
      "source.file must be a portable original filename or repository-relative path.",
    );
  if (entry.source.session && !/^[a-f0-9-]{36}$/i.test(entry.source.session))
    throw new Error("Invalid chat id.");
  if (!["existing", "concept"].includes(entry.kind))
    throw new Error("kind must be existing or concept.");
  if (
    !Array.isArray(entry.categories) ||
    !entry.categories.length ||
    new Set(entry.categories).size !== entry.categories.length ||
    entry.categories.some(
      (category) =>
        !["background", "map", "interface", "character"].includes(category),
    )
  )
    throw new Error(
      "Supply unique categories: background, map, interface or character.",
    );
  const input = path.resolve(path.dirname(batchFile), entry.image);
  const extension = path.extname(input).toLowerCase();
  if (![".png", ".webp", ".jpg", ".jpeg", ".gif"].includes(extension))
    throw new Error("Unsupported image format.");
  const bytes = await fs.readFile(input);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (
    [...ideas, ...staged.map((item) => item.idea)].some(
      (idea) => idea.sha256 === sha256,
    )
  ) {
    console.log(`Already captured: ${entry.title}`);
    continue;
  }
  if (
    [...ideas, ...staged.map((item) => item.idea)].some(
      (idea) => idea.id === entry.id,
    )
  )
    throw new Error(`Duplicate id: ${entry.id}`);
  const asset = `assets/${entry.id}${extension}`;
  try {
    await fs.access(path.join(directory, asset));
    throw new Error(`Asset already exists: ${asset}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const { width, height } = await sharp(bytes).metadata();
  staged.push({
    bytes,
    idea: {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      kind: entry.kind,
      categories: entry.categories,
      asset,
      source: {
        label: entry.source.label,
        file: entry.source.file,
        ...(entry.source.session ? { session: entry.source.session } : {}),
      },
      width,
      height,
      sha256,
    },
  });
}
await fs.mkdir(path.join(directory, "assets"), { recursive: true });
for (const { bytes, idea } of staged)
  await fs.writeFile(path.join(directory, idea.asset), bytes, { flag: "wx" });
ideas.push(...staged.map((item) => item.idea));
await fs.writeFile(
  `${catalogueFile}.tmp`,
  `${prefix}${JSON.stringify(ideas, null, 2)};\n`,
);
await fs.rename(`${catalogueFile}.tmp`, catalogueFile);
console.log(
  `Imported ${staged.length} ideas; catalogue contains ${ideas.length}.`,
);
