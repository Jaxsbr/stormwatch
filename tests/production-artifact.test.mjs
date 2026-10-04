import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkProductionArtifact } from "../tools/check-production-artifact.mjs";

const directories = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});
async function artifact() {
  const root = await mkdtemp(join(tmpdir(), "stormwatch-artifact-"));
  directories.push(root);
  await mkdir(join(root, "assets"));
  await writeFile(
    join(root, "index.html"),
    '<script src="./assets/game.js"></script>',
  );
  await writeFile(
    join(root, "assets/game.js"),
    "console.log('ordinary gameplay');",
  );
  return root;
}

describe("production artifact boundary", () => {
  it("accepts a game with relative assets for a Pages project subpath", async () => {
    await expect(checkProductionArtifact(await artifact())).resolves.toBe(2);
  });
  it("rejects copied fixture pages and diagnostic controls in emitted code", async () => {
    const root = await artifact();
    await writeFile(join(root, "qa.html"), "fixture");
    await expect(checkProductionArtifact(root)).rejects.toThrow(
      "Utility artifact",
    );
    await rm(join(root, "qa.html"));
    await writeFile(join(root, "assets/game.js"), "new MediaRecorder(canvas);");
    await expect(checkProductionArtifact(root)).rejects.toThrow("Utility code");
  });
  it("rejects root-absolute game assets that break Pages subpaths", async () => {
    const root = await artifact();
    await writeFile(
      join(root, "index.html"),
      '<script src="/assets/game.js"></script>',
    );
    await expect(checkProductionArtifact(root)).rejects.toThrow(
      "subpath-relative",
    );
  });
});

it.each([
  "mosswater-feedback",
  "prepareBoardReviewProfile",
  "Recorded legal finale build diverged",
])(
  "rejects feedback profile and replay helpers from production: %s",
  async (symbol) => {
    const root = await artifact();
    await writeFile(join(root, "assets/game.js"), symbol);
    await expect(checkProductionArtifact(root)).rejects.toThrow("Utility code");
  },
);
