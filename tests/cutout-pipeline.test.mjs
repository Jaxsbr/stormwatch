import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { validateRig } from "../tools/cutout-pipeline.mjs";

function validRig() {
  return {
    id: "watch-rig",
    kind: "cutout-character",
    parts: [
      {
        id: "body",
        texture: "art/v2/watch-rig/body.webp",
        rect: [0, 0, 100, 80],
        pivot: [50, 60],
        scale: 1,
        z: 2,
        attachments: { hip: [50, 70], mount: [30, 20] },
        string: {
          tipNear: [10, 20],
          tipFar: [10, 60],
          braceCenter: [35, 40],
          drawCenter: [55, 40],
        },
        rail: { rear: [70, 40], release: [15, 40] },
      },
      {
        id: "leg",
        texture: "art/v2/watch-rig/leg.webp",
        rect: [100, 0, 40, 60],
        pivot: [10, 50],
        scale: 0.5,
        z: 1,
        attachTo: "body.hip",
        joints: { hip: [12, 51], knee: [20, 35], sole: [15, 55] },
      },
    ],
  };
}

describe("cutout pipeline descriptor validation", () => {
  it("accepts a direct-child rig with optional string and rail landmarks", () => {
    expect(() => validateRig(validRig(), 140, 80)).not.toThrow();
  });

  it("rejects duplicate ids, out-of-bounds crops, and malformed roots", () => {
    const duplicate = validRig();
    duplicate.parts[1].id = "body";
    expect(() => validateRig(duplicate, 140, 80)).toThrow(/Unique/);

    const crop = validRig();
    crop.parts[1].rect = [100, 0, 41, 60];
    expect(() => validateRig(crop, 140, 80)).toThrow(/crop outside/);

    const roots = validRig();
    delete roots.parts[1].attachTo;
    expect(() => validateRig(roots, 140, 80)).toThrow(/root/);
  });

  it("rejects nested direct-child references", () => {
    const nested = validRig();
    nested.parts[1].attachments = { anchor: [20, 20] };
    nested.parts.push({
      id: "toe",
      texture: "art/v2/watch-rig/toe.webp",
      rect: [0, 0, 20, 20],
      pivot: [10, 10],
      scale: 1,
      z: 0,
      attachTo: "leg.anchor",
    });
    expect(() => validateRig(nested, 140, 80)).toThrow(/nested/);
  });
});

describe("reusable animal specifications", () => {
  for (const animal of ["squirrel", "skunk", "turtle", "donkey"])
    for (const view of ["side", "front", "rear"])
      it(`${animal} ${view} reproduces runtime rig landmarks and behavior`, () => {
        const id = `${animal}-${view}-defender-v1`;
        const spec = JSON.parse(
          fs.readFileSync(`assets/pipeline/specs/${id}.json`, "utf8"),
        );
        const runtime = JSON.parse(
          fs.readFileSync(`public/art/v2/${id}/rig.json`, "utf8"),
        );
        expect(() =>
          validateRig(
            spec,
            runtime.validation.width,
            runtime.validation.height,
          ),
        ).not.toThrow();
        expect(spec.animation).toEqual(runtime.animation);
        expect(spec.portrait).toEqual(runtime.portrait);
        expect(spec.parts).toEqual(
          runtime.parts.map(({ texture, sha256, bytes, ...part }) => part),
        );
        const missingElbow = structuredClone(spec);
        delete missingElbow.parts.find((part) => part.id === "drawArm").joints
          .elbow;
        expect(() =>
          validateRig(
            missingElbow,
            runtime.validation.width,
            runtime.validation.height,
          ),
        ).toThrow(/elbow/);
      });
});
