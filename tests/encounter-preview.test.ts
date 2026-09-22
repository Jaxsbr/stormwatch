import { describe, expect, it } from "vitest";
import { encounterEnemies } from "../src/ui/advantage-screen";
import { lanternPass } from "../src/content/lantern-pass";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";

describe("encounter roster", () => {
  it("includes the boss and deduplicates repeated enemies on both current maps", () => {
    for (const level of [lanternPass, rainstoneCrossing]) {
      expect(encounterEnemies(level)).toEqual([
        "raider",
        "runner",
        "armored",
        "boss",
      ]);
    }
  });
  it("reflects a different map roster instead of always displaying every enemy", () => {
    expect(
      encounterEnemies({
        ...lanternPass,
        waves: [
          {
            title: "Test",
            reward: 0,
            groups: [
              { kind: "runner", count: 3, gap: 1 },
              { kind: "boss", count: 0, gap: 1 },
              { kind: "runner", count: 2, gap: 1 },
            ],
          },
        ],
      }),
    ).toEqual(["runner"]);
  });
});
