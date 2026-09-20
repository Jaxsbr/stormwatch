import squirrelSide from "../public/art/v2/squirrel-side-defender-v1/rig.json";
import squirrelFront from "../public/art/v2/squirrel-front-defender-v1/rig.json";
import squirrelRear from "../public/art/v2/squirrel-rear-defender-v1/rig.json";
import skunkSide from "../public/art/v2/skunk-side-defender-v1/rig.json";
import skunkFront from "../public/art/v2/skunk-front-defender-v1/rig.json";
import skunkRear from "../public/art/v2/skunk-rear-defender-v1/rig.json";
import turtleSide from "../public/art/v2/turtle-side-defender-v1/rig.json";
import turtleFront from "../public/art/v2/turtle-front-defender-v1/rig.json";
import turtleRear from "../public/art/v2/turtle-rear-defender-v1/rig.json";
import donkeySide from "../public/art/v2/donkey-side-defender-v1/rig.json";
import donkeyFront from "../public/art/v2/donkey-front-defender-v1/rig.json";
import donkeyRear from "../public/art/v2/donkey-rear-defender-v1/rig.json";
import { describe, expect, it } from "vitest";

import ratRig from "../public/art/v2/rat-rig-v1/rig.json";
import boltRig from "../review/2026-09-20-reboot/rejected-assets/bolt-rig-v1/rig.json";
import boltRigV3 from "../review/2026-09-20-reboot/superseded-mechanical-assets/v3/bolt-rig/rig.json";
import {
  validateCutoutDefinition,
  type CutoutDefinition,
} from "../src/render/cutout-validation";

function validDefinition(): CutoutDefinition {
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
        attachments: {
          hip: [50, 70],
          mount: [30, 20],
        },
      },
      {
        id: "leg",
        texture: "art/v2/watch-rig/leg.webp",
        rect: [100, 0, 40, 60],
        pivot: [10, 50],
        scale: 0.5,
        z: 1,
        attachTo: "body.hip",
        attachments: { hook: [20, 20] },
        // Deliberately offset from the pivot: the runtime must support this.
        joints: {
          hip: [12, 51],
          knee: [20, 35],
          sole: [15, 55],
        },
      },
    ],
  };
}

function cloneDefinition() {
  return structuredClone(validDefinition());
}

describe("runtime cutout descriptor validation", () => {
  it("accepts the checked-in rat and bolt runtime descriptors", () => {
    expect(() =>
      validateCutoutDefinition(ratRig, {
        sourceWidth: 2172,
        sourceHeight: 724,
        namespace: "v2",
      }),
    ).not.toThrow();
    expect(() =>
      validateCutoutDefinition(boltRig, {
        sourceWidth: 2172,
        sourceHeight: 724,
        namespace: "v2",
      }),
    ).not.toThrow();
    expect(() =>
      validateCutoutDefinition(boltRigV3, {
        namespace: "v3",
      }),
    ).not.toThrow();
  });

  it("accepts a direct-child rig, optional animation landmarks, and hip offsets", () => {
    const definition = validDefinition();
    definition.parts[0].string = {
      tipNear: [10, 20],
      tipFar: [10, 60],
      braceCenter: [35, 40],
      drawCenter: [55, 40],
    };
    definition.parts[0].rail = {
      rear: [70, 40],
      release: [15, 40],
    };
    definition.parts[0].recoilAxis = [1, 0];

    expect(() =>
      validateCutoutDefinition(definition, {
        sourceWidth: 140,
        sourceHeight: 80,
        namespace: "v2",
      }),
    ).not.toThrow();
    expect(() =>
      validateCutoutDefinition(validDefinition(), 140, 80, "v2"),
    ).not.toThrow();
  });

  it("does not mutate the descriptor while returning validated data", () => {
    const definition = validDefinition();
    const before = structuredClone(definition);
    const validated = validateCutoutDefinition(definition);

    expect(definition).toEqual(before);
    expect(validated.parts[1].joints?.hip).toEqual([12, 51]);
  });

  it("checks crop rectangles against optional source dimensions", () => {
    expect(() =>
      validateCutoutDefinition(validDefinition(), {
        sourceWidth: 120,
        sourceHeight: 80,
      }),
    ).toThrow(/source width/);

    const definition = cloneDefinition();
    definition.parts[1].rect = [100, 0, 40, 61];
    expect(() =>
      validateCutoutDefinition(definition, {
        sourceWidth: 140,
        sourceHeight: 60,
      }),
    ).toThrow(/source height/);

    const embeddedDimensions = cloneDefinition() as CutoutDefinition & {
      width: number;
      height: number;
    };
    embeddedDimensions.width = 120;
    embeddedDimensions.height = 80;
    expect(() => validateCutoutDefinition(embeddedDimensions)).toThrow(
      /source width/,
    );
  });

  it("rejects malformed crops, pivots, scales, layers, and landmarks", () => {
    const cases: [string, (definition: CutoutDefinition) => void, RegExp][] = [
      [
        "fractional crop",
        (d) => (d.parts[0].rect = [0.5, 0, 100, 80] as never),
        /integer crop/,
      ],
      ["negative crop", (d) => (d.parts[0].rect = [-1, 0, 100, 80]), /crop/],
      ["zero scale", (d) => (d.parts[1].scale = 0), /positive scale/],
      ["non-finite layer", (d) => (d.parts[1].z = Number.NaN), /finite number/],
      [
        "pivot outside crop",
        (d) => (d.parts[0].pivot = [101, 60]),
        /inside crop/,
      ],
      [
        "non-finite joint",
        (d) => (d.parts[1].joints!.knee = [Number.POSITIVE_INFINITY, 35]),
        /finite \[x, y\]/,
      ],
      [
        "attachment outside crop",
        (d) => (d.parts[0].attachments!.hip = [101, 70]),
        /inside crop/,
      ],
      [
        "non-finite recoil axis",
        (d) => (d.parts[0].recoilAxis = [0, Number.NaN]),
        /finite \[x, y\]/,
      ],
    ];

    for (const [name, mutate, message] of cases) {
      const definition = cloneDefinition();
      mutate(definition);
      expect(() => validateCutoutDefinition(definition), name).toThrow(message);
    }
  });

  it("requires one root and unique simple part ids", () => {
    const duplicate = cloneDefinition();
    duplicate.parts[1].id = "body";
    expect(() => validateCutoutDefinition(duplicate)).toThrow(/unique/);

    const twoRoots = cloneDefinition();
    delete twoRoots.parts[1].attachTo;
    expect(() => validateCutoutDefinition(twoRoots)).toThrow(
      /exactly one root/,
    );

    const invalidId = cloneDefinition();
    invalidId.parts[1].id = "leg-two";
    expect(() => validateCutoutDefinition(invalidId)).toThrow(
      /simple unique id/,
    );
  });

  it("fully resolves direct attachments and rejects malformed references", () => {
    for (const reference of [
      "",
      "body",
      "missing.hip",
      "body.missing",
      "body.hip.extra",
    ]) {
      const definition = cloneDefinition();
      definition.parts[1].attachTo = reference;
      expect(() => validateCutoutDefinition(definition), reference).toThrow(
        /attachment|parent|reference/,
      );
    }
  });

  it("rejects attachment cycles before nested attachment resolution", () => {
    const definition = cloneDefinition();
    definition.parts.push({
      id: "cycleA",
      texture: "art/v2/watch-rig/a.webp",
      rect: [0, 0, 20, 20],
      pivot: [10, 10],
      scale: 1,
      z: 0,
      attachTo: "cycleB.anchor",
      attachments: { anchor: [10, 10] },
    });
    definition.parts.push({
      id: "cycleB",
      texture: "art/v2/watch-rig/b.webp",
      rect: [20, 0, 20, 20],
      pivot: [10, 10],
      scale: 1,
      z: 0,
      attachTo: "cycleA.anchor",
      attachments: { anchor: [10, 10] },
    });
    definition.parts[0].attachTo = "cycleA.anchor";

    expect(() => validateCutoutDefinition(definition)).toThrow(/cycle/);
  });

  it("rejects nested attachments because runtime supports one root level", () => {
    const definition = cloneDefinition();
    definition.parts.push({
      id: "toe",
      texture: "art/v2/watch-rig/toe.webp",
      rect: [0, 0, 20, 20],
      pivot: [10, 10],
      scale: 1,
      z: 0,
      attachTo: "leg.hook",
    });

    expect(() => validateCutoutDefinition(definition)).toThrow(/nested/);
  });

  it("requires complete string and rail point groups when present", () => {
    const missingStringPoint = cloneDefinition();
    missingStringPoint.parts[0].string = { tipNear: [1, 1] };
    expect(() => validateCutoutDefinition(missingStringPoint)).toThrow(
      /tipFar/,
    );

    const missingRailPoint = cloneDefinition();
    missingRailPoint.parts[0].rail = { rear: [1, 1] };
    expect(() => validateCutoutDefinition(missingRailPoint)).toThrow(/release/);

    const missingRailGroup = cloneDefinition();
    missingRailGroup.parts[0].string = {
      tipNear: [1, 1],
      tipFar: [1, 2],
      braceCenter: [1, 3],
      drawCenter: [1, 4],
    };
    expect(() => validateCutoutDefinition(missingRailGroup)).toThrow(/rail/);
  });

  it("accepts safe relative paths and rejects traversal, absolute, encoded, and wrong namespace paths", () => {
    const relative = cloneDefinition();
    relative.parts[0].texture = "sprites/body.webp";
    expect(() => validateCutoutDefinition(relative)).not.toThrow();

    for (const texture of [
      "../body.webp",
      "/body.webp",
      "\\body.webp",
      "https://example.test/body.webp",
      "art/v2/../body.webp",
      "art/v2/body%2ewebp",
    ]) {
      const definition = cloneDefinition();
      definition.parts[0].texture = texture;
      expect(() => validateCutoutDefinition(definition), texture).toThrow(
        /texture path|relative|unsafe|normalized/,
      );
    }

    expect(() =>
      validateCutoutDefinition(validDefinition(), { namespace: "v3" }),
    ).toThrow(/art\/v3/);
  });
});

describe("animal defender delivery assets", () => {
  for (const raw of [
    squirrelSide,
    squirrelFront,
    squirrelRear,
    skunkSide,
    skunkFront,
    skunkRear,
    turtleSide,
    turtleFront,
    turtleRear,
    donkeySide,
    donkeyFront,
    donkeyRear,
  ])
    it(`${raw.id} has valid crops and complete arm landmarks`, () => {
      const rig = validateCutoutDefinition(raw, {
        namespace: "v2",
        sourceWidth: raw.validation.width,
        sourceHeight: raw.validation.height,
      });
      for (const id of ["holdArm", "drawArm"]) {
        const arm = rig.parts.find((part) => part.id === id)!;
        expect(arm.joints?.elbow, `${id} elbow`).toHaveLength(2);
        expect(arm.joints?.grip, `${id} grip`).toHaveLength(2);
        expect(arm.joints?.elbow).not.toEqual(arm.pivot);
        expect(arm.joints?.grip).not.toEqual(arm.joints?.elbow);
      }
    });
});
