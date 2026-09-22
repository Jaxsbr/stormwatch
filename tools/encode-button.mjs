import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

// Native crop only: preserve generated art/alpha, then losslessly encode.
const source = "assets/source/ui/timber-button-v2.png";
const output = "public/art/v2/timber-button-v2";
const crop = { left: 66, top: 71, width: 1644, height: 740 };
const original = await readFile(source);
const native = await sharp(original)
  .extract(crop)
  .ensureAlpha()
  .raw()
  .toBuffer();
const encoded = await sharp(original)
  .extract(crop)
  .webp({ lossless: true, effort: 6 })
  .toBuffer();
const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer();
let minCenterAlpha = 255;
for (let i = 3; i < native.length; i += 4) {
  if (native[i] !== decoded[i])
    throw new Error("Alpha changed during encoding");
}
for (let y = 166; y < crop.height - 166; y++) {
  for (let x = 166; x < crop.width - 166; x++) {
    minCenterAlpha = Math.min(
      minCenterAlpha,
      native[(y * crop.width + x) * 4 + 3],
    );
  }
}
if (minCenterAlpha < 240) throw new Error("Unexpected hole in button center");
await mkdir(output, { recursive: true });
await writeFile(`${output}/skin.webp`, encoded);
await writeFile(
  `${output}/manifest.json`,
  JSON.stringify(
    {
      id: "timber-button-v2",
      kind: "ui",
      provenance:
        "Native built-in image generation; exact prompt retained in prompt.txt",
      source,
      sourceSha256: createHash("sha256").update(original).digest("hex"),
      crop,
      width: crop.width,
      height: crop.height,
      slices: [166, 166, 166, 166],
      center: "Integrated generated brown fill; no transparent opening",
      encoding:
        "Lossless WebP; decoded alpha checked byte-for-byte against native crop",
      minCenterAlpha,
      bytes: encoded.length,
      sha256: createHash("sha256").update(encoded).digest("hex"),
    },
    null,
    2,
  ) + "\n",
);
console.log({ crop, minCenterAlpha, bytes: encoded.length });
