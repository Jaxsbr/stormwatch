import { describe, expect, it } from "vitest";
import { resultCard } from "../src/ui/game-chrome";

describe("result card discovery rewards", () => {
  it("announces the Squirrel upgrade when it is first earned", () => {
    const card = resultCard({ phase: "won", stars: 2 }, true, false);
    expect(card).toContain("NEW REWARD");
    expect(card).toContain("Squirrel upgrades unlocked");
    expect(card).toContain("damage, range, and attack speed");
  });

  it("does not repeat the discovery reward on later victories", () => {
    expect(resultCard({ phase: "won", stars: 3 }, false, false)).not.toContain(
      "NEW REWARD",
    );
  });
});
