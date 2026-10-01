import { expect, it } from "vitest";
import { Game } from "../src/sim/game";
import { rainstoneCrossing } from "../src/content/rainstone-crossing";

const dt = 1 / 30;

function encounter() {
  const game = new Game({
    ...rainstoneCrossing,
    width: 100,
    path: [
      { x: -1, z: 3 },
      { x: 99, z: 3 },
    ],
    waves: [
      {
        title: "Behavior states",
        reward: 0,
        groups: [
          {
            kind: "raider",
            count: 1,
            gap: 0.1,
            shieldCycle: { upSeconds: 3, downSeconds: 5 },
          },
          {
            kind: "runner",
            count: 1,
            gap: 0.1,
            evasionCycle: { downSeconds: 3, upSeconds: 2 },
          },
        ],
      },
    ],
  });
  game.startWave();
  while (game.state.enemies.length < 2) game.tick(dt);
  return game;
}

function toAge(game: Game, age: number) {
  const spawn = game.state.enemies[0].spawnedAt;
  while (game.state.clock - spawn < age) game.tick(dt);
}

it("exposes the same shield and evasion windows to movement, impacts and presentation", () => {
  const game = encounter();
  const rat = game.state.enemies.find((e) => e.kind === "raider")!;
  const weasel = game.state.enemies.find((e) => e.kind === "runner")!;

  toAge(game, 2.5);
  expect(rat.shieldRaised).toBe(false);
  expect(rat.shieldStrength).toBe(0);
  expect(weasel.evasion).toEqual({ active: false, warning: true });

  toAge(game, 3.2);
  expect(weasel.evasion).toEqual({ active: true, warning: false });
  const movingFast = weasel.distance;
  game.pause();
  for (let i = 0; i < 150; i++) game.tick(dt);
  expect(weasel.distance).toBe(movingFast);
  expect(weasel.evasion).toEqual({ active: true, warning: false });
  game.pause();

  toAge(game, 5.2);
  expect(weasel.evasion).toEqual({ active: false, warning: false });
  expect(rat.shieldRaised).toBe(true);
  expect(rat.shieldStrength).toBeGreaterThan(0);

  const replay = encounter();
  const freshWeasel = replay.state.enemies.find((e) => e.kind === "runner")!;
  expect(freshWeasel.evasion).toEqual({ active: false, warning: false });
  expect(freshWeasel.evadeAt).toBe(-1);
});
