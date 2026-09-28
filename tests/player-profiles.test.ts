import { describe, expect, it } from "vitest";
import { freshSave, recordVictory } from "../src/persistence/save";
import { loadProfiles, createProfile } from "../src/persistence/profiles";

describe("local woodland profiles", () => {
  it("starts without invented users", () => {
    expect(loadProfiles(null, null)).toEqual({
      version: 2,
      active: null,
      users: [],
    });
  });
  it("preserves legacy progress and settings and skips unused slots", () => {
    const progress = recordVictory(
      { ...freshSave(), music: 0.25, muted: true },
      "lantern-pass",
      2,
    );
    const profiles = loadProfiles(
      JSON.stringify({ version: 1, active: 0, slots: [progress, freshSave()] }),
      null,
    );
    expect(profiles.users).toHaveLength(1);
    expect(profiles.users[0].progress).toEqual(progress);
    expect(
      loadProfiles(null, JSON.stringify(progress)).users[0].progress,
    ).toEqual(progress);
    expect(loadProfiles(JSON.stringify(profiles), null)).toEqual(profiles);
  });
  it("keeps progress and last player through rename, avatar change and reload", () => {
    const profiles = loadProfiles(null, null);
    profiles.users = [
      createProfile("a", "Alice", "fox"),
      createProfile("b", "Ben", "rabbit"),
    ];
    profiles.active = "b";
    profiles.users[1].progress = recordVictory(
      profiles.users[1].progress,
      "lantern-pass",
      2,
    );
    profiles.users[1].nickname = "Benny";
    profiles.users[1].avatar = "badger";
    const loaded = loadProfiles(JSON.stringify(profiles), null);
    expect(loaded).toEqual(profiles);
    expect(loaded.users[0].progress).toEqual(freshSave());
  });
  it("validates names and recovers invalid identities and stale active ids", () => {
    expect(() => createProfile("a", "  ", "fox")).toThrow();
    expect(() => createProfile("a", "a".repeat(25), "fox")).toThrow();
    const user = createProfile("a", "  Alice  ", "fox");
    expect(user.nickname).toBe("Alice");
    const loaded = loadProfiles(
      JSON.stringify({
        version: 2,
        active: "missing",
        users: [user, user, { id: "bad", nickname: "" }],
      }),
      null,
    );
    expect(loaded.users).toHaveLength(1);
    expect(loaded.active).toBe("a");
    expect(loadProfiles("broken", null).users).toEqual([]);
    expect(
      loadProfiles(JSON.stringify({ version: 2, users: [] }), null).active,
    ).toBeNull();
  });
});
