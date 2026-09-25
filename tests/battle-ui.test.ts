import { describe, expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { lanternPass } from "../src/content/lantern-pass";
import { TOWERS } from "../src/content/catalog";
import {
  battleStats,
  completedWaves,
  displayedWave,
  defenderPanel,
  towerAttributes,
} from "../src/ui/battle-ui";
import type { Tower, TowerKind } from "../src/sim/types";
import { rankBadge } from "../src/ui/rank-badge";

describe("battle presentation values", () => {
  it("shows the upcoming wave during preparation and the active wave in combat", () => {
    expect(
      displayedWave(
        { wave: 0, phase: "preparation", resumePhase: "preparation" },
        5,
      ),
    ).toBe(1);
    expect(
      displayedWave({ wave: 1, phase: "wave", resumePhase: "wave" }, 5),
    ).toBe(1);
    expect(
      displayedWave(
        { wave: 1, phase: "preparation", resumePhase: "preparation" },
        5,
      ),
    ).toBe(2);
    expect(
      displayedWave({ wave: 5, phase: "won", resumePhase: "wave" }, 5),
    ).toBe(5);
  });
  it("does not count a failed or ongoing wave as cleared", () => {
    for (const phase of ["wave", "lost", "paused"] as const)
      expect(completedWaves({ wave: 3, phase, resumePhase: "wave" })).toBe(2);
    expect(
      completedWaves({
        wave: 3,
        phase: "preparation",
        resumePhase: "preparation",
      }),
    ).toBe(3);
    expect(completedWaves({ wave: 8, phase: "won", resumePhase: "wave" })).toBe(
      8,
    );
  });
  const game = new Game(lanternPass, "reach");
  const tower = (kind: TowerKind, level = 1): Tower => ({
    kind,
    level,
    id: 1,
    x: 3,
    z: 3,
    spent: TOWERS[kind].cost,
    cooldown: 0,
    shots: 0,
  });
  it("shows actual combat multipliers, not rounded invented attributes", () => {
    const t = tower("bolt");
    const values = towerAttributes(game, t);
    expect(values.current.damage).toBe(10);
    expect(values.next?.damage).toBe(17);
    expect(values.next?.interval).toBe(0.8);
    expect(values.current.range).toBe(Number(game.range(t).toFixed(1)));
    expect(values.next?.range).toBe(
      Number(game.range({ ...t, level: 2 }).toFixed(1)),
    );
  });
  it("max rank removes upgrade preview and disables upgrade", () => {
    const t = tower("stone", 2);
    expect(towerAttributes(game, t).next).toBeNull();
    expect(defenderPanel(game, t)).toMatch(/disabled>Max rank/);
    expect(defenderPanel(game, t)).toContain(rankBadge(2));
  });
  it("places stat rows directly beneath the name without role copy or range controls", () => {
    const panel = defenderPanel(game, tower("bolt"));
    expect(panel).toContain('</h3><dl class="hero-attributes">');
    expect(panel.match(/class="hero-attribute"/g)).toHaveLength(3);
    expect(panel).toContain("<dt>Damage</dt><dd>10");
    expect(panel).not.toContain('data-action="range"');
    expect(panel).not.toContain(TOWERS.bolt.role);
    expect(panel).not.toContain("Upgrade gains shown");
    expect(panel).not.toContain("rank-empty");
    expect(panel).toContain(rankBadge(1));
  });
  it("explains why Squirrel upgrades are locked on the first Lantern attempt", () => {
    const firstAttempt = new Game(lanternPass, "none", false, 1, {
      unlockedUpgrades: [],
    });
    const panel = defenderPanel(firstAttempt, tower("bolt"));
    expect(panel).toContain("Upgrade locked");
    expect(panel).toContain("Win Lantern Pass to unlock Squirrel upgrades");
  });
  it("labels the remaining status indicators", () => {
    expect(battleStats(8)).toContain('aria-label="Lives remaining"');
    expect(battleStats(5)).toContain('aria-label="Wave number"');
    expect(battleStats(5)).toContain('id="wave">1 / 5</b>');
    expect(battleStats(8)).not.toMatch(/<(?:small|meter|progress)\b/);
  });
});
