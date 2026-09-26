import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import sharp from "sharp";
const base = "review/2026-09-25-rat-shield";
const manifest = JSON.parse(
  await readFile(`${base}/assets/whole-torso-v3/manifest.json`, "utf8"),
);
for (const [view, v] of Object.entries(manifest.views)) {
  const id = v.originalRig.replace("-v1", "-v3"),
    out = `public/art/v2/${id}`;
  await mkdir(out, { recursive: true });
  const old = JSON.parse(
    await readFile(`public/art/v2/${v.originalRig}/rig.json`, "utf8"),
  );
  const root = old.parts.find((p) => p.id === "body");
  const parts = [
    {
      ...root,
      texture: `art/v2/${id}/body.webp`,
      rect: [0, 0, v.body.width, v.body.height],
      attachments: {
        guard: root.pivot,
        nearHip: [v.legs[0].x, v.legs[0].y],
        farHip: [v.legs[1].x, v.legs[1].y],
      },
    },
  ];
  await copyFile(
    `${base}/assets/whole-torso-v3/${view}-down.webp`,
    `${out}/body.webp`,
  );
  await copyFile(
    `${base}/assets/whole-torso-v3/${view}-up.webp`,
    `${out}/bodyGuard.webp`,
  );
  const meta = await sharp(`${out}/bodyGuard.webp`).metadata();
  parts.push({
    id: "bodyGuard",
    texture: `art/v2/${id}/bodyGuard.webp`,
    rect: [0, 0, meta.width, meta.height],
    pivot: [
      (root.pivot[0] - v.up.x) / v.up.scale,
      (root.pivot[1] - v.up.y) / v.up.scale,
    ],
    scale: v.up.scale,
    z: 2,
    attachTo: "body.guard",
  });
  for (let i = 0; i < 2; i++) {
    const l = v.legs[i],
      pid = i ? "farLeg" : "nearLeg",
      w = l.rect.width,
      h = l.rect.height;
    await copyFile(
      `${base}/assets/whole-torso-v3/${l.file}`,
      `${out}/${pid}.webp`,
    );
    const x = view === "side" ? w * 0.48 : w * 0.5;
    parts.push({
      id: pid,
      texture: `art/v2/${id}/${pid}.webp`,
      rect: [0, 0, w, h],
      pivot: l.pivot,
      scale: v.legScale,
      z: i ? 0 : 1,
      attachTo: `body.${i ? "farHip" : "nearHip"}`,
      joints: {
        hip: l.pivot,
        knee: [x, h * 0.48],
        ankle: [x, h * 0.8],
        sole: [view === "side" ? w * 0.67 : x, h * 0.98],
      },
    });
  }
  await writeFile(
    `${out}/rig.json`,
    JSON.stringify(
      {
        id,
        kind: "cutout-character",
        view,
        animation: { hipHeight: 270 },
        parts,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    `${out}/provenance.json`,
    JSON.stringify(
      { generator: manifest.generator, review: `${base}/assembly.html`, ...v },
      null,
      2,
    ) + "\n",
  );
  for (const name of [
    "whole-torso-prompts",
    "whole-torso-correction-prompts",
    "front-guard-prompts",
    "proportions-rear-prompts",
  ])
    await copyFile(`${base}/${name}.json`, `${out}/${name}.json`);
}
