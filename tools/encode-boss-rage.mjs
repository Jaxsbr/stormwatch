import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
// Approved native ImageGen expression edits, kept outside runtime source control.
for (const view of process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["side"]) {
  const base = view === "side" ? "badger-rig-v1" : "badger-front-rig-v1";
  for (const phase of ["angry", "raging"]) {
    const source = `assets/source/boss-rage/${view}-${phase}.png`;
    const id = `badger-${view}-${phase}-v1`;
    const dir = `public/art/v2/${id}`;
    const rig = JSON.parse(
      await fs.readFile(`public/art/v2/${base}/rig.json`, "utf8"),
    );
    const body = rig.parts.find((p) => p.id === "body");
    const bytes = await fs.readFile(source);
    await fs.mkdir(dir, { recursive: true });
    await sharp(bytes)
      .resize(body.rect[2], body.rect[3], { fit: "fill" })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(`${dir}/body.webp`);
    const output = await fs.readFile(`${dir}/body.webp`);
    const hash = (value) =>
      crypto.createHash("sha256").update(value).digest("hex");
    body.texture = `art/v2/${id}/body.webp`;
    body.sha256 = hash(output);
    body.bytes = output.length;
    // Shared approved leg textures and joints; only torso expression changes.
    for (const key of ["validation", "encoding", "prompt", "review"])
      delete rig[key];
    rig.id = id;
    rig.provenance = {
      tool: "Native ImageGen",
      expressionSource: source,
      expressionSourceSha256: hash(bytes),
      base: `art/v2/${base}/body.webp`,
      phase,
      approval: "Owner approved expressions in conversation, 30 September 2026",
      processing:
        "Resize to original torso rectangle; WebP quality 92 with alpha preserved",
      prompt:
        "Preserve exact view, framing, silhouette, helmet, shield, armor, hands, cape, belt and painterly rendering. Change only expression and facial fur warmth. Angry: closed-mouth scowl, lowered brows, narrowed eyes, flushed cheeks. Raging: open-mouth roar, stronger red face, small natural teeth. Child-friendly, non-occult, gore-free. Transparent background.",
    };
    await fs.writeFile(`${dir}/rig.json`, JSON.stringify(rig, null, 2) + "\n");
  }
}
