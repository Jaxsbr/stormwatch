import { describe, expect, it } from "vitest";
import { freshSave, recordVictory } from "../src/persistence/save";
import { loadProfiles } from "../src/persistence/profiles";

describe("two local player slots", () => {
  it("moves the legacy save into player one without changing its stars or settings", () => {
    const legacy = {
      ...freshSave(),
      stars: { "lantern-pass": 2, "rainstone-crossing": 3 },
      music: 0.25,
      effects: 0.9,
      muted: true,
    };
    const profiles = loadProfiles(null, JSON.stringify(legacy));

    expect(profiles.active).toBe(0);
    expect(profiles.slots[0]).toEqual({
      ...legacy,
      unlocked: ["squirrel-upgrade", "turtle"],
    });
    expect(profiles.slots[1]).toEqual(freshSave());
    expect(loadProfiles(JSON.stringify(profiles), null)).toEqual(profiles);
  });

  it("keeps each player's victories and unlocks separate after a reload", () => {
    const profiles = loadProfiles(null, null);
    profiles.slots[1] = recordVictory(profiles.slots[1], "lantern-pass", 2);
    profiles.active = 1;
    const reloaded = loadProfiles(JSON.stringify(profiles), null);

    expect(reloaded.slots[0]).toEqual(freshSave());
    expect(reloaded.slots[1].stars["lantern-pass"]).toBe(2);
    expect(reloaded.slots[1].unlocked).toContain("squirrel-upgrade");
    expect(reloaded.active).toBe(1);
  });
});
