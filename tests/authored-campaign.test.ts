import { afterEach, expect, it, vi } from "vitest";
import source from "../src/content/recipes.json";
import { levelUnlocked } from "../src/content/progression";
import { advantageScreen } from "../src/ui/advantage-screen";

// A promoted recipe is part of the game build, not runtime browser storage.
afterEach(() => {
  vi.doUnmock("../src/content/recipes.json");
  vi.resetModules();
});

it("registers appended recipes in campaign order and preserves their earned stars across reload", async () => {
  const promoted = structuredClone(source);
  promoted.levels.push({
    ...structuredClone(promoted.levels[0]),
    id: "new-crossing",
    name: "New <Crossing> & trail",
  });
  vi.resetModules();
  vi.doMock("../src/content/recipes.json", () => ({ default: promoted }));
  const { LEVELS } = await import("../src/content/levels");
  const { freshSave, recordVictory, parseSave } =
    await import("../src/persistence/save");
  const { loadProfiles } = await import("../src/persistence/profiles");
  expect(LEVELS.map((level) => level.id)).toEqual(
    promoted.levels.map((level) => level.id),
  );
  let progress = freshSave();
  expect(levelUnlocked(LEVELS, 3, progress)).toBe(false);
  for (const level of LEVELS.slice(0, 3))
    progress = recordVictory(progress, level.id, 1);
  expect(levelUnlocked(LEVELS, 3, progress)).toBe(true);
  progress = recordVictory(progress, "new-crossing", 3);
  expect(parseSave(JSON.stringify(progress))).toEqual(progress);
  const profiles = loadProfiles(
    JSON.stringify({ version: 1, active: 0, slots: [progress, freshSave()] }),
    null,
  );
  expect(profiles.slots[0].stars["new-crossing"]).toBe(3);
  expect(profiles.slots[1].stars["new-crossing"]).toBeUndefined();
  expect(recordVictory(progress, "not-promoted", 3)).toBe(progress);
  expect(
    parseSave(
      JSON.stringify({
        ...progress,
        stars: { ...progress.stars, "not-promoted": 3 },
      }),
    ).stars["not-promoted"],
  ).toBeUndefined();
  expect(advantageScreen(LEVELS[3], [], "none")).toContain(
    "New &lt;Crossing&gt; &amp; trail",
  );
  expect(LEVELS[3].path).toEqual(LEVELS[0].path);
});
