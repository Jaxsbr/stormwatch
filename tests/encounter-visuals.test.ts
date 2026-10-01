import { describe, expect, it } from "vitest";
import { CANONICAL_CONTENT, compileLevel } from "../src/config/configuration";
import {
  describeEncounter,
  validateAuthoredVisuals,
} from "../src/content/encounter-visuals";
import type { LevelDef } from "../src/sim/types";

describe("encounter visual descriptions", () => {
  it("covers all authored maps and preserves the original fifteen waves", () => {
    expect(
      CANONICAL_CONTENT.levels.slice(0, 3).map((level) => level.waves.length),
    ).toEqual([5, 4, 6]);
    validateAuthoredVisuals(CANONICAL_CONTENT);
    for (const recipe of CANONICAL_CONTENT.levels) {
      const visual = describeEncounter(compileLevel(recipe));
      expect(visual.backdrop).toMatch(/^art\/v2\//);
      expect(visual.enemies.length).toBeGreaterThan(0);
      expect(visual.defenders.length).toBeGreaterThan(0);
    }
  });

  it("identifies the map and wave when a new wave has no art definition", () => {
    const level = structuredClone(compileLevel(CANONICAL_CONTENT.levels[0]));
    level.waves[4].groups.push({
      ...level.waves[4].groups[0],
      kind: "unpainted" as LevelDef["waves"][number]["groups"][number]["kind"],
    });
    expect(() => describeEncounter(level)).toThrow(
      "Encounter lantern-pass, wave lantern-pass-wave-5: missing unpainted enemy views or briefing art",
    );
  });

  it("rejects a map without an explicit visual description", () => {
    const level = structuredClone(compileLevel(CANONICAL_CONTENT.levels[0]));
    level.id = "new-map";
    level.visual = undefined;
    expect(() => describeEncounter(level)).toThrow(
      "Encounter new-map: missing or unapproved backdrop visual description",
    );
  });
});
