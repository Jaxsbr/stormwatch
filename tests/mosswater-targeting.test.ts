import { expect, it } from "vitest";
import { CANONICAL_CONTENT } from "../src/config/configuration";
import {
  campaign,
  createAttempt,
} from "../review/mosswater-encounters/strategies";
import { progressionContext } from "../src/content/progression";
import { freshSave, recordVictoryOutcome } from "../src/persistence/save";
import { distance, pathLength } from "../src/sim/path";

it("targets the soonest arrival on new single routes, including actual net-slowed Boars in the earned campaign", () => {
  const content = CANONICAL_CONTENT;
  const context = progressionContext(content);
  const expedition = campaign(content);
  let save = freshSave(context);
  const mismatches: unknown[] = [];
  const slowOvertakes = new Map<string, number>();
  for (const report of expedition.reports) {
    expect(report.phase).toBe("won");
    if (report.id === "mosswater-03" || report.id === "mosswater-04") {
      const game = createAttempt(content, report.id, save);
      const length = pathLength(game.level.path);
      const seen = new Set<number>();
      let index = 0;
      let overtakes = 0;
      for (
        let tick = 0;
        tick < 36000 &&
        game.state.phase !== "won" &&
        game.state.phase !== "lost";
        tick++
      ) {
        while (
          index < report.trace.length &&
          report.trace[index].tick === tick
        ) {
          const command = report.trace[index++].command;
          expect(
            command.type === "place"
              ? game.place(command.kind, command.point)
              : command.type === "upgrade"
                ? game.upgrade(command.id)
                : command.type === "start" && game.startWave(),
          ).toBe(true);
        }
        const before = new Map(
          game.state.enemies.map((e) => [
            e.id,
            { slowUntil: e.slowUntil, evading: e.evasion?.active },
          ]),
        );
        game.tick(1 / 30);
        game.drainEvents();
        // Projectile impacts occur after targeting. Only inspect ticks whose
        // movement status did not change at impact or at an evasion boundary.
        const stable = game.state.enemies.every(
          (e) =>
            !before.has(e.id) ||
            (before.get(e.id)!.slowUntil === e.slowUntil &&
              before.get(e.id)!.evading === e.evasion?.active),
        );
        for (const shot of game.state.shots) {
          if (seen.has(shot.id)) continue;
          seen.add(shot.id);
          if (!stable) continue;
          const target = game.state.enemies.find((e) => e.id === shot.targetId);
          const tower = game.state.towers.find(
            (t) => t.x === shot.source.x && t.z === shot.source.z,
          );
          if (!target || !tower) continue;
          const arrivalTime = (enemy: typeof target) =>
            (length - enemy.distance) /
            (game.enemies[enemy.kind].speed *
              (enemy.movementScale ?? 1) *
              (enemy.evasion?.active ? game.rules.evasionSpeedScale : 1) *
              (enemy.slowUntil > game.state.clock ? game.rules.slowScale : 1));
          const inRange = game.state.enemies.filter(
            (e) => e.alive && distance(e, tower) <= game.range(tower),
          );
          const sooner = inRange.find(
            (e) => arrivalTime(e) + 1e-6 < arrivalTime(target),
          );
          if (sooner && mismatches.length < 2)
            mismatches.push({
              map: report.id,
              clock: game.state.clock,
              target: { id: target.id, seconds: arrivalTime(target) },
              sooner: { id: sooner.id, seconds: arrivalTime(sooner) },
            });
          // Coverage must include the actual disagreement with legacy distance
          // priority: a further-along slowed Boar loses priority to this target.
          if (
            target.slowUntil <= game.state.clock &&
            inRange.some(
              (e) =>
                e.kind === "armored" &&
                e.slowUntil > game.state.clock &&
                e.distance > target.distance &&
                arrivalTime(e) > arrivalTime(target) + 1e-6,
            )
          )
            overtakes++;
        }
      }
      expect(game.state.phase).toBe("won");
      slowOvertakes.set(report.id, overtakes);
    }
    save = recordVictoryOutcome(save, report.id, 1, context).save;
  }
  expect(mismatches).toEqual([]);
  expect(slowOvertakes.get("mosswater-03")).toBeGreaterThan(0);
  expect(slowOvertakes.get("mosswater-04")).toBeGreaterThan(0);
});
