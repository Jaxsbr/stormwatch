import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function validateSpec(spec) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id ?? ""))
    throw new Error("id must be a lowercase slug");
  if (!["character", "tower", "biome", "ui", "texture"].includes(spec.kind))
    throw new Error("Unsupported asset kind");
  if (typeof spec.subject !== "string" || !spec.subject.trim())
    throw new Error("Describe the subject");
  if (spec.kind === "character" || spec.kind === "tower") {
    const { columns, rows } = spec.sheet ?? {};
    if (
      !Number.isInteger(columns) ||
      !Number.isInteger(rows) ||
      columns < 1 ||
      rows < 1 ||
      columns * rows > 32
    )
      throw new Error("Sheet needs1–32 cells");
    if (
      spec.frameInstructions?.length !== columns * rows ||
      spec.frameInstructions.some(
        (pose) => typeof pose !== "string" || !pose.trim(),
      )
    )
      throw new Error("Every cell needs an explicit pose");
    if (
      !Array.isArray(spec.pivot) ||
      spec.pivot.length !== 2 ||
      spec.pivot.some((n) => !Number.isFinite(n) || n < 0 || n > 1)
    )
      throw new Error("Normalized pivot required");
    if (!Number.isFinite(spec.worldHeight) || spec.worldHeight <= 0)
      throw new Error("Positive worldHeight required");
    if (!spec.clips || !Object.keys(spec.clips).length)
      throw new Error("At least one clip required");
    for (const [name, clip] of Object.entries(spec.clips)) {
      if (
        !clip.frames?.length ||
        clip.frames.some(
          (n) => !Number.isInteger(n) || n < 0 || n >= columns * rows,
        ) ||
        !Number.isFinite(clip.fps) ||
        clip.fps <= 0 ||
        typeof clip.loop !== "boolean"
      )
        throw new Error(`Invalid clip ${name}`);
    }
  }
  if (
    (spec.kind === "biome" || spec.kind === "ui" || spec.kind === "texture") &&
    (typeof spec.composition !== "string" || !spec.composition.trim())
  )
    throw new Error("Describe the composition");
  return spec;
}
export function promptFor(spec, style) {
  validateSpec(spec);
  const common = `Use case: stylized-concept. Production asset for Stormwatch.\nSubject: ${spec.subject}\nStyle: ${style.style}\nLighting: ${style.light}\nAvoid: ${style.avoid}`;
  if (spec.kind === "biome")
    return `${common}\nCamera: ${style.biomeCamera ?? "Elevated near-orthographic, consistent scale, no horizon or vanishing point"}\nComposition: ${spec.composition}\nOpaque full-bleed landscape image, prefer2048x1152. No frames or border.\n`;
  if (spec.kind === "texture")
    return `${common}\nComposition: ${spec.composition}\nOrthographic overhead material swatch, opaque full bleed square, seamless edges, no perspective recession or objects.\n`;
  if (spec.kind === "ui")
    return `${common}\nComposition: ${spec.composition}\nGenuine transparent background; preserve clean alpha.\n`;
  const { columns, rows } = spec.sheet;
  return `${common}\nCamera: ${spec.kind === "tower" ? style.towerCamera : style.characterCamera}\nCreate one genuine-transparent RGBA animation sheet: exactly ${columns} columns and ${rows} rows, equal cells, prefer2048x1024. Reading order left to right then next row. Every cell shows the SAME subject at the SAME scale/camera/light. Keep ground baseline at92percent of each cell height, horizontal center at50percent. Entire silhouette stays inside its cell with at least8percent clear margins. No backdrop or terrain; no contact shadow baked in.\n${spec.kind === "character" ? "A complete seamless walk cycle with clearly alternating leg contacts, weight shifts and counter-swinging arms. The body translates nowhere within the cell. This is genuine pose animation, not a row of translated duplicates." : "The base remains perfectly stationary and identical. Animate the mechanism and operator only. Clearly distinct anticipation, release and recovery; no changing architecture."}\nPoses:\n${spec.frameInstructions.map((pose, i) => `Cell${i + 1}: ${pose}`).join("\n")}\n`;
}
export async function inspectSheet(spec, input) {
  validateSpec(spec);
  const meta = await sharp(input).metadata();
  const report = {
    id: spec.id,
    width: meta.width,
    height: meta.height,
    hasAlpha: !!meta.hasAlpha,
    errors: [],
    warnings: [],
    frames: [],
  };
  if (spec.kind === "biome") {
    if (meta.width / meta.height < 1.5)
      report.errors.push("Biome must be horizontal");
    return report;
  }
  if (spec.kind === "texture") {
    if (Math.abs(meta.width / meta.height - 1) > 0.02)
      report.errors.push("Material texture must be square");
    return report;
  }
  if (!meta.hasAlpha)
    report.errors.push(
      "Actual generated alpha is required; never key out a painted backdrop",
    );
  if (!spec.sheet) return report;
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { columns, rows } = spec.sheet;
  for (let index = 0; index < columns * rows; index++) {
    const col = index % columns,
      row = Math.floor(index / columns),
      left = Math.floor((col * info.width) / columns),
      top = Math.floor((row * info.height) / rows),
      right = Math.floor(((col + 1) * info.width) / columns),
      bottom = Math.floor(((row + 1) * info.height) / rows);
    let minX = right,
      minY = bottom,
      maxX = -1,
      maxY = -1,
      pixels = 0,
      border = 0,
      transparent = 0;
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        const a = data[(y * info.width + x) * 4 + 3];
        if (a === 0) transparent++;
        if (a < 24) continue;
        pixels++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        if (x === left || x === right - 1 || y === top || y === bottom - 1)
          border++;
      }
    if (!pixels) report.errors.push(`Frame${index}: empty`);
    if (transparent < (right - left) * (bottom - top) * 0.1)
      report.errors.push(`Frame${index}: insufficient transparent margin`);
    if (border > 4)
      report.errors.push(
        `Frame${index}: visible pixels touch cell border (${border})`,
      );
    report.frames.push({
      index,
      rect: [left, top, right - left, bottom - top],
      visibleBounds: pixels ? [minX, minY, maxX + 1, maxY + 1] : null,
      visiblePixels: pixels,
    });
  }
  const areas = report.frames.map((f) => f.visiblePixels).filter(Boolean);
  if (areas.length && Math.max(...areas) / Math.min(...areas) > 1.6)
    report.warnings.push(
      "Large silhouette-area variation: inspect identity/scale drift before approval",
    );
  report.warnings.push(
    "Numeric validation cannot prove stable identity, foot planting or smooth motion. Review a normal-speed loop and in-game capture.",
  );
  return report;
}
async function cli() {
  const [command, specPath, input] = process.argv.slice(2);
  if (!command || !specPath)
    throw new Error(
      "Usage: node tools/art-pipeline.mjs prompt|inspect|import spec.json [source.png]",
    );
  const spec = validateSpec(JSON.parse(await fs.readFile(specPath, "utf8"))),
    style = JSON.parse(
      await fs.readFile(
        path.join(root, "assets/pipeline/templates/style.json"),
        "utf8",
      ),
    );
  if (command === "prompt") {
    console.log(promptFor(spec, style));
    return;
  }
  if (!input) throw new Error("Source image required");
  const report = await inspectSheet(spec, input);
  if (command === "inspect") {
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.errors.length ? 1 : 0;
    return;
  }
  if (command !== "import") throw new Error("Unknown command");
  if (report.errors.length) throw new Error(report.errors.join("\n"));
  const directory = path.join(root, "public/art/v2", spec.id);
  await fs.mkdir(directory, { recursive: true });
  const output = path.join(directory, "atlas.webp");
  try {
    await fs.access(output);
    throw new Error(
      "Asset already exists; use a new version id instead of overwriting",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const bytes = await sharp(input)
    .webp(
      ["biome", "texture"].includes(spec.kind)
        ? { quality: 90 }
        : { lossless: true },
    )
    .toBuffer();
  await fs.writeFile(output, bytes);
  const manifest = {
    version: 1,
    ...spec,
    texture: `art/v2/${spec.id}/atlas.webp`,
    width: report.width,
    height: report.height,
    frames: report.frames,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    provenance:
      "Native image generation; prompt and descriptor retained; imported without repainting or alpha substitution",
    review: spec.review ?? { status: "unreviewed" },
    validation: report,
  };
  await fs.writeFile(
    path.join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await fs.writeFile(
    path.join(directory, "prompt.txt"),
    promptFor(spec, style),
  );
  console.log(
    JSON.stringify(
      {
        output: path.relative(root, output),
        bytes: bytes.length,
        review: manifest.review,
        warnings: report.warnings,
      },
      null,
      2,
    ),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  cli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
