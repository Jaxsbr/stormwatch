import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { CANONICAL_CONTENT, compileLevel } from "../src/config/configuration";
import { describeEncounter } from "../src/content/encounter-visuals";

const exists = (path) => existsSync(join(process.cwd(), "public", path));

it("all selected scenery, portraits, briefing images and rigs exist", () => {
  for (const recipe of CANONICAL_CONTENT.levels) {
    const visual = describeEncounter(compileLevel(recipe));
    expect(exists(visual.backdrop), visual.backdrop).toBe(true);
    for (const enemy of visual.enemies) {
      expect(exists(`art/v2/${enemy.briefing}`), enemy.briefing).toBe(true);
      for (const rig of enemy.views)
        expect(exists(`art/v2/${rig}/rig.json`), rig).toBe(true);
      for (const rigs of Object.values(enemy.expressions ?? {}))
        for (const rig of rigs)
          expect(exists(`art/v2/${rig}/rig.json`), rig).toBe(true);
    }
    for (const defender of visual.defenders) {
      expect(exists(`art/v2/${defender.portrait}`), defender.portrait).toBe(
        true,
      );
      expect(
        exists(`art/v2/${defender.sideRig}/rig.json`),
        defender.sideRig,
      ).toBe(true);
    }
  }
});
