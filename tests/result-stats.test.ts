import { describe, expect, it } from "vitest";
import { lanternPass } from "../src/content/lantern-pass";
import { Game } from "../src/sim/game";

const singleRat = {
  ...lanternPass,
  path: [
    { x: -1, z: 3 },
    { x: 3, z: 3 },
  ],
  healthScale: 0.2,
  waves: [
    {
      title: "Test watch",
      reward: 25,
      groups: [{ kind: "raider" as const, count: 1, gap: 1 }],
    },
  ],
};

describe("result totals", () => {
  it("counts earned kill and wave gold separately from starting gold", () => {
    const game = new Game(singleRat);
    expect(game.place("bolt", { x: 1, z: 2 })).toBe(true);
    game.startWave();
    for (let i = 0; i < 2000 && game.state.phase === "wave"; i++)
      game.tick(1 / 30);

    expect(game.state.phase).toBe("won");
    expect(game.state.kills).toBe(1);
    expect(game.state.leaks).toBe(0);
    expect(game.state.goldEarned).toBe(27);
  });

  it("counts raiders that escape without calling lost lives enemy losses", () => {
    const game = new Game(singleRat);
    game.startWave();
    for (let i = 0; i < 2000 && game.state.phase === "wave"; i++)
      game.tick(1 / 30);

    expect(game.state.phase).toBe("won");
    expect(game.state.kills).toBe(0);
    expect(game.state.leaks).toBe(1);
    expect(game.state.goldEarned).toBe(25);
  });
});
