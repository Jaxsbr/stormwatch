import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import sharp from "sharp";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pair = (p) =>
  Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
export function validateRig(def, width, height) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(def.id ?? ""))
    throw new Error("Rig id must be a lowercase slug");
  if (!["cutout-character", "cutout-tower"].includes(def.kind))
    throw new Error("Unsupported rig kind");
  if (!Array.isArray(def.parts) || !def.parts.length)
    throw new Error("Parts required");
  const ids = new Set();
  for (const p of def.parts) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(p.id ?? "") || ids.has(p.id))
      throw new Error("Unique simple part ids required");
    ids.add(p.id);
    if (
      !Array.isArray(p.rect) ||
      p.rect.length !== 4 ||
      !p.rect.every(Number.isInteger)
    )
      throw new Error(`${p.id}: integer crop rectangle required`);
    const [x, y, w, h] = p.rect;
    if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height)
      throw new Error(`${p.id}: crop outside source`);
    if (
      !pair(p.pivot) ||
      p.pivot[0] < 0 ||
      p.pivot[0] > w ||
      p.pivot[1] < 0 ||
      p.pivot[1] > h
    )
      throw new Error(`${p.id}: pivot outside part`);
    if (!Number.isFinite(p.scale) || p.scale <= 0 || !Number.isFinite(p.z))
      throw new Error(`${p.id}: positive scale and finite layer required`);
    for (const point of Object.values({ ...p.attachments, ...p.joints }))
      if (!pair(point)) throw new Error(`${p.id}: invalid landmark`);
  }
  for (const p of def.parts)
    if (p.attachTo) {
      const [parentId, anchor, ...extra] = p.attachTo.split(".");
      const parent = def.parts.find((q) => q.id === parentId);
      if (
        extra.length ||
        !parent ||
        !parent.attachments?.[anchor] ||
        parent === p
      )
        throw new Error(`${p.id}: missing attachment`);
      // Current runtime intentionally supports one root plus directly attached parts.
      if (parent.attachTo)
        throw new Error(`${p.id}: nested attachment unsupported`);
    }
  if (def.parts.filter((p) => !p.attachTo).length !== 1)
    throw new Error("Exactly one root part required");
  if (def.animation?.action) {
    const action = def.animation.action;
    if (!["archer", "thrower", "trader"].includes(action))
      throw new Error("Unsupported defender action");
    for (const id of ["holdArm", "drawArm"]) {
      const arm = def.parts.find((part) => part.id === id);
      if (!arm || !pair(arm.joints?.elbow) || !pair(arm.joints?.grip))
        throw new Error(`${id}: defender elbow and grip required`);
      const same = (a, b) => a[0] === b[0] && a[1] === b[1];
      if (
        same(arm.pivot, arm.joints.elbow) ||
        same(arm.joints.elbow, arm.joints.grip)
      )
        throw new Error(`${id}: defender bones must have positive length`);
    }
    const object = def.parts.find(
      (part) => part.id === (action === "archer" ? "bow" : "payload"),
    );
    if (!object) throw new Error("Defender held object required");
    if (
      action === "archer" &&
      !["tipNear", "tipFar", "braceCenter", "drawCenter"].every((key) =>
        pair(object.string?.[key]),
      )
    )
      throw new Error("Archer bow string landmarks required");
  }
  return def;
}
export async function inspectRig(def, input) {
  const meta = await sharp(input).metadata();
  validateRig(def, meta.width, meta.height);
  if (!meta.hasAlpha)
    throw new Error(
      "Native transparency required; do not key a painted background",
    );
  const parts = [];
  for (const p of def.parts) {
    const [x, y, width, height] = p.rect;
    const { data, info } = await sharp(input)
      .extract({ left: x, top: y, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let visible = 0,
      transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] >= 24) visible++;
      if (data[i] === 0) transparent++;
    }
    if (!visible) throw new Error(`${p.id}: empty part`);
    if (transparent / (info.width * info.height) < 0.05)
      throw new Error(`${p.id}: no clear margin; inspect backdrop/clipping`);
    parts.push({
      id: p.id,
      visiblePixels: visible,
      transparentFraction: transparent / (info.width * info.height),
    });
  }
  return {
    width: meta.width,
    height: meta.height,
    parts,
    warnings: [
      "Manual projection, silhouette, attachment, occlusion and motion review still required. Numeric checks do not approve artwork.",
    ],
  };
}
async function main() {
  const [command, descriptor, input] = process.argv.slice(2);
  if (!["inspect", "import"].includes(command) || !descriptor || !input)
    throw new Error(
      "Usage: node tools/cutout-pipeline.mjs inspect|import descriptor.json source.png",
    );
  const def = JSON.parse(await fs.readFile(descriptor, "utf8"));
  const report = await inspectRig(def, input);
  if (command === "inspect") {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const directory = path.join(root, "public/art/v2", def.id);
  await fs.mkdir(directory); // An existing id must never be silently overwritten.
  for (const p of def.parts) {
    const [left, top, width, height] = p.rect;
    const filename = `${p.id}.webp`;
    await sharp(input)
      .extract({ left, top, width, height })
      .webp({ lossless: true })
      .toFile(path.join(directory, filename));
    p.texture = `art/v2/${def.id}/${filename}`;
    p.sha256 = crypto
      .createHash("sha256")
      .update(await fs.readFile(path.join(directory, filename)))
      .digest("hex");
  }
  def.sourceSha256 = crypto
    .createHash("sha256")
    .update(await fs.readFile(input))
    .digest("hex");
  def.review = {
    status: "candidate",
    notes:
      "Imported native separated parts. Assembly and motion gates pending.",
  };
  def.validation = report;
  await fs.writeFile(
    path.join(directory, "rig.json"),
    JSON.stringify(def, null, 2) + "\n",
  );
  console.log(directory);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
