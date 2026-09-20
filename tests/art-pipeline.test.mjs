import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { inspectSheet, validateSpec } from "../tools/art-pipeline.mjs";

const temporaryDirectories = [];

afterAll(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) => rm(directory, { recursive: true })),
  );
});

function makeSpec(overrides = {}) {
  return {
    id: "rat-walk-test",
    kind: "character",
    subject: "A small woodland rat guard",
    sheet: { columns: 4, rows: 2 },
    frameInstructions: Array.from({ length: 8 }, (_, index) => `pose ${index}`),
    clips: {
      walk: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 10, loop: true },
    },
    pivot: [0.5, 0.92],
    worldHeight: 1.1,
    ...overrides,
  };
}

async function temporaryPng({ width = 80, height = 40, channels = 4, draw }) {
  const directory = await mkdtemp(join(tmpdir(), "stormwatch-art-test-"));
  temporaryDirectories.push(directory);
  const file = join(directory, "sheet.png");
  const data = Buffer.alloc(width * height * channels);
  const rectangle = (left, top, right, bottom, alpha = 255) => {
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const offset = (y * width + x) * channels;
        data[offset] = 160;
        data[offset + 1] = 120;
        data[offset + 2] = 80;
        if (channels === 4) data[offset + 3] = alpha;
      }
    }
  };
  draw?.({ rectangle });
  await sharp(data, { raw: { width, height, channels } }).png().toFile(file);
  return file;
}

async function validSheet() {
  return temporaryPng({
    draw: ({ rectangle }) => {
      for (let index = 0; index < 8; index += 1) {
        const left = (index % 4) * 20;
        const top = Math.floor(index / 4) * 20;
        rectangle(left + 3, top + 3, left + 17, top + 17);
      }
    },
  });
}

describe("art pipeline descriptor validation", () => {
  it("accepts a complete descriptor and rejects invalid numeric contracts", () => {
    expect(() => validateSpec(makeSpec())).not.toThrow();
    expect(() => validateSpec(makeSpec({ id: "Rat Walk" }))).toThrow(
      /lowercase slug/,
    );
    expect(() =>
      validateSpec(makeSpec({ sheet: { columns: 0, rows: 2 } })),
    ).toThrow(/Sheet/);
    expect(() =>
      validateSpec(makeSpec({ frameInstructions: ["one pose"] })),
    ).toThrow(/Every cell/);
    expect(() => validateSpec(makeSpec({ pivot: [1.1, 0.92] }))).toThrow(
      /Normalized pivot/,
    );
    expect(() => validateSpec(makeSpec({ worldHeight: 0 }))).toThrow(
      /worldHeight/,
    );
    expect(() =>
      validateSpec(
        makeSpec({
          clips: {
            walk: { frames: [0], fps: Number.POSITIVE_INFINITY, loop: true },
          },
        }),
      ),
    ).toThrow(/Invalid clip/);
  });
});

describe("art pipeline sheet inspection", () => {
  it("accepts a transparent sheet with numeric frame bounds", async () => {
    const report = await inspectSheet(makeSpec(), await validSheet());

    expect(report.errors).toEqual([]);
    expect(report.width).toBe(80);
    expect(report.height).toBe(40);
    expect(report.hasAlpha).toBe(true);
    expect(report.frames).toHaveLength(8);
    expect(report.frames[0].rect).toEqual([0, 0, 20, 20]);
    expect(report.frames[0].visibleBounds).toEqual([3, 3, 17, 17]);
  });

  it("accepts odd sheet dimensions when exact cell rectangles cover the image", async () => {
    const spec = makeSpec({
      id: "odd-sheet-test",
      sheet: { columns: 2, rows: 2 },
      frameInstructions: ["one", "two", "three", "four"],
      clips: { idle: { frames: [0, 1, 2, 3], fps: 6, loop: true } },
    });
    const odd = await temporaryPng({
      width: 7,
      height: 5,
      draw: ({ rectangle }) => {
        rectangle(1, 1, 2, 2);
        rectangle(4, 1, 5, 2);
        rectangle(1, 3, 2, 4);
        rectangle(4, 3, 5, 4);
      },
    });

    const report = await inspectSheet(spec, odd);
    expect(report.errors).toEqual([]);
    expect(report.frames.map((frame) => frame.rect)).toEqual([
      [0, 0, 3, 2],
      [3, 0, 4, 2],
      [0, 2, 3, 3],
      [3, 2, 4, 3],
    ]);
  });

  it("detects empty frames and pixels touching a cell border", async () => {
    const empty = await temporaryPng({
      draw: ({ rectangle }) => {
        rectangle(23, 3, 37, 17);
      },
    });
    const emptyReport = await inspectSheet(makeSpec(), empty);
    expect(emptyReport.errors).toContain("Frame0: empty");

    const border = await temporaryPng({
      draw: ({ rectangle }) => {
        rectangle(0, 3, 6, 17);
      },
    });
    const borderReport = await inspectSheet(makeSpec(), border);
    expect(borderReport.errors).toContain(
      "Frame0: visible pixels touch cell border (14)",
    );
  });

  it("rejects alpha-less or marginless character sheets and narrow biome plates", async () => {
    const alphaLess = await temporaryPng({
      channels: 3,
      draw: ({ rectangle }) => rectangle(3, 3, 17, 17),
    });
    const alphaLessReport = await inspectSheet(makeSpec(), alphaLess);
    expect(alphaLessReport.errors).toContain(
      "Actual generated alpha is required; never key out a painted backdrop",
    );

    const marginless = await temporaryPng({
      draw: ({ rectangle }) => rectangle(0, 0, 80, 40),
    });
    const marginlessReport = await inspectSheet(makeSpec(), marginless);
    expect(marginlessReport.errors).toContain(
      "Frame0: insufficient transparent margin",
    );

    const narrow = await temporaryPng({ width: 24, height: 24, channels: 3 });
    const biome = await inspectSheet(
      {
        id: "clearing-test",
        kind: "biome",
        subject: "A woodland clearing",
        composition: "Wide horizontal open clearing",
      },
      narrow,
    );
    expect(biome.errors).toContain("Biome must be horizontal");
  });
});
