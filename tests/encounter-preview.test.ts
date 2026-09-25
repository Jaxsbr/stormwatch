import { describe, expect, it } from "vitest";
import { advantageScreen, encounterEnemies } from "../src/ui/advantage-screen";
import { lanternPass } from "../src/content/lantern-pass";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";

describe("encounter roster", () => {
  it("shows the Rat Raider trial roster on Lantern and the full roster on Rainstone", () => {
    expect(encounterEnemies(lanternPass)).toEqual(["raider"]);
    expect(encounterEnemies(rainstoneCrossing)).toEqual([
      "raider",
      "runner",
      "armored",
      "boss",
    ]);
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
  it("introduces the first watch without showing unexplained advantages", () => {
    const screen = advantageScreen(lanternPass, [], "none");
    expect(screen).toContain("First watch");
    expect(screen).toContain("Begin with the Squirrel archer");
    expect(screen).not.toContain("Choose one advantage");
    expect(screen).not.toContain('data-action="card:');
  });
});
