import { describe, expect, it } from "vitest";
import { freshSave, parseSave, recordVictory } from "../src/persistence/save";

describe("save persistence adapter", () => {
  it("returns a clean default for missing, malformed, or incompatible saves", () => {
    const expected = freshSave();
    expect(parseSave(null)).toEqual(expected);
    expect(parseSave("{not json")).toEqual(expected);
    expect(
      parseSave(JSON.stringify({ version: 2, stars: { "lantern-pass": 3 } })),
    ).toEqual(expected);
  });

  it("whitelists progress, clamps settings, and derives the tactical unlock", () => {
    const parsed = parseSave(
      '{"version":1,"stars":{"lantern-pass":9,"rainstone-crossing":-2,"not-a-level":3,"__proto__":{"polluted":true}},"unlocked":["thrift","squirrel-upgrade","squirrel-upgrade","rainstone-crossing","unknown"],"music":4,"effects":-1,"muted":"yes","tutorialSeen":1}',
    );

    expect(parsed).toEqual({
      version: 1,
      stars: { "lantern-pass": 3, "rainstone-crossing": 0 },
      unlocked: ["squirrel-upgrade"],
      music: 1,
      effects: 0,
      muted: false,
      tutorialSeen: false,
    });
    expect(
      (Object.prototype as Record<string, unknown>).polluted,
    ).toBeUndefined();
  });

  it("fails closed on hostile top-level keys", () => {
    expect(parseSave('{"version":1,"__proto__":{"polluted":true}}')).toEqual(
      freshSave(),
    );
    expect(
      (Object.prototype as Record<string, unknown>).polluted,
    ).toBeUndefined();
  });

  it("records the best victory without downgrading stars or mutating the source save", () => {
    const initial = freshSave();
    const earned = recordVictory(initial, "lantern-pass", 2);

    expect(initial).toEqual(freshSave());
    expect(earned.stars).toEqual({ "lantern-pass": 2 });
    expect(earned.unlocked).toEqual(["squirrel-upgrade"]);

    const lower = recordVictory(earned, "lantern-pass", 1);
    expect(lower.stars).toEqual(earned.stars);
    expect(lower.unlocked).toEqual(earned.unlocked);
    expect(recordVictory(earned, "unknown-level", 3)).toBe(earned);
  });
});
