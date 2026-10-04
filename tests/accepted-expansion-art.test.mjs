import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import sharp from "sharp";

it.each([
  "mosswater-board-candidate-v1",
  "mossy-poolbanks-candidate-v1",
  "skunk-side-defender-v1",
  "boar-rig-v1",
  "boar-side-resistance-v1",
  "boar-front-rig-v1",
  "boar-rear-rig-v1",
])(
  "records owner acceptance and verifies immutable runtime provenance for %s",
  async (id) => {
    const manifest = id.startsWith("moss") ? "manifest.json" : "rig.json";
    const asset = JSON.parse(
      await readFile(`public/art/v2/${id}/${manifest}`, "utf8"),
    );
    expect(asset.id).toBe(id);
    expect(asset.review.status).toBe("owner-accepted-runtime");
    expect(asset.review.date).toBe("2026-10-04");
    expect(asset.review.notes).toContain("playthrough");
    const parts = manifest === "manifest.json" ? [asset] : asset.parts;
    for (const part of parts) {
      const bytes = await readFile(`public/${part.texture}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        part.sha256,
      );
      expect(bytes.length).toBe(part.bytes);
      const meta = await sharp(bytes).metadata();
      if (manifest === "manifest.json")
        expect([meta.width, meta.height]).toEqual([asset.width, asset.height]);
      else expect(meta.hasAlpha).toBe(true);
    }
    if (id === "mossy-poolbanks-candidate-v1")
      expect(asset.review.notes).toContain(
        "deferred battlefield-art-registration",
      );
  },
);
