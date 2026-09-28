import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { lanternPass } from "../src/content/lantern-pass";
import { BattleSelection, popupPosition } from "../src/ui/battle-selection";
import { defenderPopupMarkup } from "../src/ui/defender-popups";
import { refundFor } from "../src/sim/economy";

function fixture(locked = false) {
  const game = new Game(
    {
      ...lanternPass,
      availableTowers: ["bolt", "net", "stone"],
      startCoins: 500,
    },
    "none",
    false,
    42,
    { unlockedUpgrades: locked ? [] : ["bolt"] },
  );
  game.state.coins = 500;
  const points = [];
  for (let z = 0; z < game.level.depth; z++)
    for (let x = 0; x < game.level.width; x++)
      if (game.canPlace({ x, z })) points.push({ x, z });
  return { game, selection: new BattleSelection(game), points };
}
describe("tile-first defender interaction", () => {
  it("previews and corrects without spending, confirms once, and remembers the defender", () => {
    const { game, selection, points } = fixture();
    selection.pick(points[0]);
    selection.cycle(1);
    selection.pick(points[1]);
    expect(game.state.coins).toBe(500);
    expect(game.state.towers).toHaveLength(0);
    expect(selection.kind).toBe("net");
    expect(selection.act("place")).toBe(true);
    expect(game.state.coins).toBe(500 - game.towers.net.cost);
    expect(game.state.towers[0]).toMatchObject({ ...points[1], kind: "net" });
    expect(selection.act("place")).toBe(false);
    selection.pick(points[0]);
    expect(selection.kind).toBe("net");
  });
  it("selects existing defenders while previewing, cancels on repeat/invalid taps, and never sells on first tap", () => {
    const { game, selection, points } = fixture();
    game.place("bolt", points[0]);
    selection.pick(points[1]);
    selection.pick(points[0]);
    expect(selection.point).toBeNull();
    expect(selection.selected).toBe(game.state.towers[0].id);
    selection.act("sell");
    expect(game.state.towers).toHaveLength(1);
    selection.act("keep");
    expect(selection.act("confirm-sell")).toBe(false);
    selection.pick(points[0]);
    expect(selection.selected).toBeNull();
    selection.pick(points[1]);
    selection.pick(game.level.path[0]);
    expect(selection.point).toBeNull();
  });
  it("uses real upgrade costs, stats, locks and invested refund", () => {
    const { game, selection, points } = fixture();
    game.place("bolt", points[0]);
    selection.pick(points[0]);
    const tower = game.state.towers[0],
      cost = game.upgradeCost(tower),
      coins = game.state.coins;
    expect(defenderPopupMarkup(selection)).toContain(`Upgrade · ${cost} gold`);
    expect(selection.act("upgrade")).toBe(true);
    expect(game.state.coins).toBe(coins - cost);
    expect(selection.act("upgrade")).toBe(false);
    expect(defenderPopupMarkup(selection)).toContain("Max level");
    const refund = refundFor(tower.spent);
    selection.act("sell");
    expect(defenderPopupMarkup(selection)).toContain(`Sell · +${refund} gold`);
    selection.act("confirm-sell");
    expect(game.state.coins).toBe(coins - cost + refund);
    expect(selection.selected).toBeNull();
    const locked = fixture(true);
    locked.game.place("bolt", locked.points[0]);
    locked.selection.pick(locked.points[0]);
    expect(locked.selection.act("upgrade")).toBe(false);
    expect(defenderPopupMarkup(locked.selection)).toContain("Upgrade locked");
  });
  it("rejects unaffordable and paused purchases, with no shortfall price", () => {
    const { game, selection, points } = fixture();
    selection.pick(points[0]);
    game.state.coins = 0;
    const markup = defenderPopupMarkup(selection);
    expect(markup).toContain(`Confirm · ${game.towers.bolt.cost} gold`);
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("Need");
    expect(selection.act("place")).toBe(false);
    game.state.coins = 500;
    game.pause();
    expect(selection.act("place")).toBe(false);
    expect(game.state.towers).toHaveLength(0);
  });
  it("uses attempt roster and handles one available defender without navigation", () => {
    const game = new Game(lanternPass);
    const selection = new BattleSelection(game);
    selection.point = { x: 0, z: 0 };
    expect(defenderPopupMarkup(selection)).not.toContain('data-popup="next"');
    selection.cycle(1);
    expect(selection.kind).toBe("bolt");
  });
  it("allows an external command adapter to reject without losing the preview", () => {
    const { game, points } = fixture();
    const selection = new BattleSelection(game, () => false);
    selection.pick(points[0]);
    expect(selection.act("place")).toBe(false);
    expect(selection.point).toEqual(points[0]);
    expect(game.state.towers).toHaveLength(0);
  });
});
it("keeps edge popups inside short landscape bounds", () => {
  for (const x of [0, 422, 844])
    for (const y of [0, 130, 280]) {
      const p = popupPosition(
        { x, y },
        { width: 300, height: 240 },
        { width: 844, height: 280 },
      );
      expect(p.x).toBeGreaterThanOrEqual(8);
      expect(p.x + 300).toBeLessThanOrEqual(836);
      expect(p.y).toBeGreaterThanOrEqual(8);
      expect(p.y + 240).toBeLessThanOrEqual(272);
    }
});
