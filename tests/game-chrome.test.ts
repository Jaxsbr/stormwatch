import { describe, expect, it } from "vitest";
import { resultCard } from "../src/ui/game-chrome";

describe("result card discovery rewards", () => {
  const result = {
    phase: "won" as const,
    stars: 2,
    goldEarned: 188,
    kills: 70,
    killsByKind: { raider: 68, runner: 2, armored: 0, boss: 0 },
  };
  it("shows the earned tower upgrade, enemy portraits and gold", () => {
    const card = resultCard(result, [{ kind: "tower-upgrade", tower: "bolt" }]);
    expect(card).toContain("Tower Upgrade");
    expect(card).toContain("Squirrel archer");
    expect(card).toContain('data-tower-portrait="bolt"');
    expect(card).toContain("rat-rig-v3/body.webp");
    expect(card).toContain("weasel-rig-v1/body.webp");
    expect(card).toContain("×68");
    expect(card).toContain("×2");
    expect(card).toContain("battle-icons-v1/gold.webp");
    expect(card).toContain("188");
    expect(card).toContain("70");
    expect(card).toContain('data-action="map"');
    expect(card).not.toContain('data-action="continue"');
    expect(card).not.toContain('data-action="retry"');
  });

  it("does not repeat the discovery reward on later victories", () => {
    expect(resultCard(result)).not.toContain("Tower Upgrade");
    expect(resultCard(result)).toContain("Back to map");
  });

  it("celebrates the first-board finish and shows its two replay advantages", () => {
    const card = resultCard(
      { ...result, killsByKind: { ...result.killsByKind, boss: 1 } },
      [
        { kind: "advantage-unlock", card: "reach" },
        { kind: "advantage-unlock", card: "nets" },
      ],
      true,
    );
    expect(card).toContain("First Board Complete!");
    expect(card).toContain("The Roadwarden is turned back");
    expect(card).toContain("Reach");
    expect(card).toContain("Longer Nets");
    expect(card).toContain("+18% tower range");
    expect(card).toContain("+50% slow duration");
  });
});
