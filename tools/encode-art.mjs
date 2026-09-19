import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = [
  "title-background",
  "sprite-atlas",
  "expedition-map",
  "ground",
  "forest-prop",
];
const manifest = [];
await mkdir("public/art", { recursive: true });
for (const name of assets) {
  const source = `assets/source/${name}.png`,
    output = `public/art/${name}.webp`;
  // Encoding only: preserve dimensions and alpha; do not alter composition or silhouettes.
  const data = await sharp(source)
    .webp(
      name === "sprite-atlas" || name === "forest-prop"
        ? { lossless: true, effort: 6 }
        : { quality: 88, effort: 6 },
    )
    .toBuffer();
  await writeFile(output, data);
  const meta = await sharp(data).metadata();
  manifest.push({
    file: output,
    width: meta.width,
    height: meta.height,
    alpha: meta.hasAlpha,
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
    source: "Native image generation for Stormwatch; original retained locally",
    encoding:
      name === "sprite-atlas" || name === "forest-prop"
        ? "lossless WebP"
        : "WebP quality 88",
  });
}
await writeFile(
  "public/art/manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(manifest.map((m) => `${m.file}: ${m.bytes} bytes`).join("\n"));
