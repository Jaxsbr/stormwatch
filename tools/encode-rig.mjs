import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

// Always derive delivery images from the native source, never recompress a WebP.
// Coordinates and alpha remain exact; only RGB receives delivery compression.
for (const filename of process.argv.slice(2)) {
  const descriptor = path.resolve(filename);
  const def = JSON.parse(await fs.readFile(descriptor, "utf8"));
  const source = await fs.readFile(path.resolve(root, def.source));
  if (hash(source) !== def.sourceSha256)
    throw new Error(`${def.id}: source hash changed`);
  const encoded = [];
  let before = 0;
  for (const part of def.parts) {
    const [left, top, width, height] = part.rect;
    const crop = sharp(source).extract({ left, top, width, height });
    const bytes = await crop
      .clone()
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toBuffer();
    const originalAlpha = await crop
      .clone()
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    const deliveryAlpha = await sharp(bytes)
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    if (!originalAlpha.equals(deliveryAlpha))
      throw new Error(`${def.id}/${part.id}: alpha changed`);
    const output = path.resolve(root, "public", part.texture);
    if (!output.startsWith(path.join(root, "public/art/")))
      throw new Error("Invalid delivery path");
    before += (await fs.stat(output)).size;
    encoded.push({ part, output, bytes });
  }
  // Validate every part before updating the delivery set.
  for (const { part, output, bytes } of encoded) {
    await fs.writeFile(output, bytes);
    part.sha256 = hash(bytes);
    part.bytes = bytes.length;
  }
  def.encoding = {
    format: "webp",
    quality: 92,
    alphaQuality: 100,
    effort: 6,
    source: "native source crop",
    alphaVerifiedExact: true,
  };
  await fs.writeFile(descriptor, JSON.stringify(def, null, 2) + "\n");
  console.log(
    JSON.stringify({
      id: def.id,
      before,
      after: encoded.reduce((sum, p) => sum + p.bytes.length, 0),
      alpha: "exact",
    }),
  );
}
