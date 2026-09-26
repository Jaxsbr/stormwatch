import { describe, expect, it } from "vitest";
import { advantageScreen, encounterEnemies } from "../src/ui/advantage-screen";
import { lanternPass } from "../src/content/lantern-pass";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";
import { theLastLantern } from "../src/content/the-last-lantern";

describe("encounter roster", () => {
  it("shows the Rat Raider trial roster on Lantern and the mixed Rat/Weasel roster on Rainstone", () => {
    expect(encounterEnemies(lanternPass)).toEqual(["raider"]);
    expect(encounterEnemies(rainstoneCrossing)).toEqual(["raider", "runner"]);
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
  it("uses the map's actual defenders in later no-card briefings", () => {
    const screen = advantageScreen(rainstoneCrossing, [], "none");
    expect(screen).toContain("Ready for the crossing");
    expect(screen).toContain("Squirrel archer");
    expect(screen).not.toContain("Turtle trapper");
    expect(screen).not.toContain("First watch");
  });
  it("does not add a separate boss directive to the Last Lantern briefing", () => {
    const screen = advantageScreen(theLastLantern, [], "none");
    expect(screen).not.toContain("First-board finale");
    expect(screen).not.toContain("Defeat the Roadwarden to finish the board");
  });
  it("summarizes a sole equipped advantage and offers None", () => {
    const screen = advantageScreen(lanternPass, ["reach"], "reach");
    expect(screen).toContain("Equipped advantage");
    expect(screen).toContain('data-action="card:none" aria-pressed="false"');
    expect(screen).toContain('data-action="card:reach" aria-pressed="true"');
  });
  it("asks for a choice between two applicable advantages", () => {
    const screen = advantageScreen(
      rainstoneCrossing,
      ["reach", "nets"],
      "none",
    );
    expect(screen).toContain("Choose one advantage");
    expect(screen).toContain('data-action="card:none" aria-pressed="true"');
    expect(screen).toContain('data-action="card:reach"');
    expect(screen).toContain('data-action="card:nets"');
  });
});
