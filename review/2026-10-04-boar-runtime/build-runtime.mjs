// Reproduce delivery encoding from the exact owner-selected native image.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const source = "ideas-catalogue/assets/boar-brace-a-20261003.png";
const hash = (b) => createHash("sha256").update(b).digest("hex");
const native = await fs.readFile(source);
const sourceSha256 =
  "df53b4f0b033bd7b49566e1c59c78728c37d434b8ab51de3b14ac03867656913";
if (hash(native) !== sourceSha256) throw Error("Selected source changed");
const delivery = await sharp(native)
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toBuffer();
const alpha = async (b) =>
  sharp(b).ensureAlpha().extractChannel(3).raw().toBuffer();
if (!(await alpha(native)).equals(await alpha(delivery)))
  throw Error("Alpha changed");
const previous = JSON.parse(
  await fs.readFile("public/art/v2/boar-rig-v1/rig.json", "utf8"),
);
const parts = structuredClone(previous.parts);
parts[0].attachments.resistance = [...parts[0].pivot];
parts.push({
  id: "bodyResist",
  texture: "art/v2/boar-side-resistance-v1/body-resist.webp",
  rect: [0, 0, 1410, 1116],
  pivot: [699, 919],
  scale: 0.602,
  z: 2,
  attachTo: "body.resistance",
  sha256: hash(delivery),
  bytes: delivery.length,
});
const descriptor = {
  version: 1,
  id: "boar-side-resistance-v1",
  kind: "cutout-character",
  view: "side",
  animation: previous.animation,
  units: previous.units,
  parts,
  provenance: {
    neutralRig: "boar-rig-v1",
    selectedSource: source,
    selectedSourceSha256: sourceSha256,
    prompt: "prompt.txt",
    poseApproval: "Option A - use it",
    motionApproval: "approved",
    motionApprovalDate: "2026-10-04",
    studyCommit: "4fb3b4b",
    approvalCommit: "e36785d",
    scope:
      "Side torso and 300 ms reaction approved. Directional variants, equipment mirroring, gas and battlefield acceptance pending.",
  },
  encoding: {
    format: "webp",
    quality: 92,
    alphaQuality: 100,
    effort: 6,
    source: "native selected image; no resizing",
    alphaVerifiedExact: true,
  },
};
await fs.writeFile(
  "public/art/v2/boar-side-resistance-v1/body-resist.webp",
  delivery,
);
await fs.writeFile(
  "public/art/v2/boar-side-resistance-v1/rig.json",
  JSON.stringify(descriptor, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    sourceBytes: native.length,
    deliveryBytes: delivery.length,
    alpha: "exact",
    scale: 0.602,
    pivot: [699, 919],
  }),
);
