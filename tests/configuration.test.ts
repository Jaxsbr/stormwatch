import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
  validateContent,
  type AuthoringContent,
} from "../src/config/configuration";
import { compileSpawnSchedule } from "../src/sim/spawn-schedule";
import { Game } from "../src/sim/game";

const draft = () => structuredClone(CANONICAL_CONTENT) as AuthoringContent;
describe("authored attempt configuration", () => {
  it("uses the inspector schedule for observable appearances, including partial batches and trailing rest", () => {
    const content = draft();
    content.levels[0].waves = [
      {
        id: "test-wave",
        title: "Partial pairs",
        reward: 0,
        packets: [
          {
            id: "pairs",
            groups: [
              {
                id: "rats",
                kind: "raider",
                count: 3,
                gap: 1,
                batchSize: 2,
                batchStagger: 0.2,
              },
              {
                id: "weasel",
                kind: "runner",
                count: 1,
                gap: 1,
                delayBefore: 2,
              },
            ],
          },
        ],
      },
    ];
    const config = resolveConfiguration(content, "lantern-pass");
    const game = new Game(config.level, "none", false, 42, {
      configuration: config,
    });
    const schedule = compileSpawnSchedule(
      config.level.waves[0],
      config.rules.initialSpawnDelay,
    );
    expect(schedule.map((s) => s.at)).toEqual([
      0.7, 0.8999999999999999, 1.7, 4.7,
    ]);
    game.startWave();
    for (let tick = 1; tick <= 150; tick++) {
      game.tick(1 / 30);
      expect(game.state.enemies.map((e) => e.kind)).toEqual(
        schedule.filter((s) => s.tick <= tick).map((s) => s.kind),
      );
    }
  });
  it("freezes each attempt and presents the same catalog used by legal purchases and range", () => {
    const content = draft();
    content.towers.bolt.cost = 17;
    content.towers.bolt.range = 4;
    const config = resolveConfiguration(content, "lantern-pass");
    const candidate = new Game(config.level, "none", false, 42, {
      configuration: config,
    });
    const baselineConfig = resolveConfiguration();
    const baseline = new Game(baselineConfig.level);
    content.towers.bolt.cost = 99;
    content.levels[0].startCoins = 1;
    expect(candidate.place("bolt", { x: 1, z: 2 })).toBe(true);
    expect(candidate.state.coins).toBe(83);
    expect(candidate.towers.bolt.cost).toBe(17);
    expect(candidate.range(candidate.state.towers[0])).toBe(4);
    expect(baseline.place("bolt", { x: 1, z: 2 })).toBe(true);
    expect(baseline.state.coins).toBe(60);
    expect(CANONICAL_CONTENT.towers.bolt.cost).toBe(40);
    expect(Object.isFrozen(candidate.level.waves[0].groups[0])).toBe(true);
  });
  it("rejects invalid edits before an attempt can start without altering accepted recipes", () => {
    const content = draft();
    const g = content.levels[0].waves[0].packets[0].groups[0];
    g.batchSize = 4;
    g.batchStagger = 1.1;
    g.gap = 3;
    expect(() => resolveConfiguration(content)).toThrow(/nondecreasing/);
    g.batchStagger = 0.1;
    g.evasionCycle = { upSeconds: 2, downSeconds: 2 };
    expect(() => validateContent(content)).toThrow(/Weasel only/);
    delete g.evasionCycle;
    g.count = 0;
    expect(() => validateContent(content)).toThrow();
    expect(() => resolveConfiguration()).not.toThrow();
  });
  it("retains repeated recipe identities in the finale register and rejects duplicates", () => {
    const content = draft();
    expect(content.levels[2].waves[1].packets[0].repeat).toBe(18);
    const level = resolveConfiguration(content, "the-last-lantern").level;
    expect(level.waves[1].groups).toHaveLength(36);
    content.levels[2].waves[1].id = content.levels[2].waves[0].id;
    expect(() => validateContent(content)).toThrow(/duplicate/);
  });
});
