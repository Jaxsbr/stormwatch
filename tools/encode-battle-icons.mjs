import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = "assets/source/ui/battle-icons-v1.png";
const output = "public/art/v2/battle-icons-v1";
await mkdir(output, { recursive: true });
const { width, height } = await sharp(source).metadata();
const split = Math.floor(width / 2),
  top = 550;
const rects = {
  gold: [0, 0, split, top],
  heart: [split, 0, width - split, top],
  flag: [0, top, split, height - top],
  marker: [split, top, width - split, height - top],
};
const assets = [];
for (const [name, [left, y, w, h]] of Object.entries(rects)) {
  const cell = await sharp(source)
    .extract({ left, top: y, width: w, height: h })
    .png()
    .toBuffer();
  const buffer = await sharp(cell)
    .trim({ threshold: 8 })
    .resize({
      width: 256,
      height: 256,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ lossless: true })
    .toBuffer();
  await writeFile(`${output}/${name}.webp`, buffer);
  assets.push({
    name,
    sourceRect: [left, y, w, h],
    sha256: createHash("sha256").update(buffer).digest("hex"),
    bytes: buffer.length,
  });
}
await writeFile(
  `${output}/manifest.json`,
  JSON.stringify(
    {
      generator: "OpenAI native ImageGen",
      source,
      processing:
        "Crop transparent atlas cells; trim transparent margins; downsample to 256px; lossless WebP. No background removal or repainting.",
      assets,
    },
    null,
    2,
  ) + "\n",
);
