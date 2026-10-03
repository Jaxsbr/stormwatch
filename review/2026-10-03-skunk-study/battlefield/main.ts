import { Game } from "/src/sim/game";
import { Battlefield } from "/src/render/battlefield";
import {
  CANONICAL_CONTENT,
  normalizeAbilities,
  resolveConfiguration,
} from "/src/config/configuration";
const $ = (id: string) => document.getElementById(id)!;
const field = new Battlefield($("field"));
let game: Game,
  ready = false;
async function restart() {
  ready = false;
  const content = normalizeAbilities(structuredClone(CANONICAL_CONTENT));
  const level = content.levels[0];
  level.width = 12;
  level.depth = 8;
  level.path = [
    { x: -1, z: 3 },
    { x: 5, z: 3 },
    { x: 5, z: 6 },
    { x: 12, z: 6 },
  ];
  level.blocked = [];
  level.startCoins = 2000;
  level.availableTowers = ["stone"];
  level.requiresBossDefeat = false;
  level.waves = [
    {
      id: "skunk-runtime-crowd",
      title: "Skunk runtime review",
      reward: 0,
      abilities: { ratShield: true, weaselEvade: true },
      packets: [
        {
          id: "mixed",
          groups: [
            { id: "rats", kind: "raider", count: 16, gap: 0.25 },
            { id: "weasels", kind: "runner", count: 8, gap: 0.4 },
            { id: "boars", kind: "armored", count: 6, gap: 0.6 },
          ],
        },
      ],
    },
  ];
  for (const enemy of Object.values(content.enemies)) {
    enemy.hp = 500;
    enemy.speed = 0.7;
  }
  content.abilityDefaults!.weaselEvade = { downSeconds: 1, upSeconds: 3 };
  const config = resolveConfiguration(content, level.id);
  game = new Game(config.level, "none", false, 42, { configuration: config });
  for (const p of [
    { x: 1, z: 4 },
    { x: 7, z: 4 },
    { x: 5, z: 1 },
  ])
    if (!game.place("stone", p)) throw new Error("Fixture placement failed");
  field.load(config.level);
  await field.artReady(config.level);
  ready = true;
  game.startWave();
  game.pause();
}
function label() {
  const s = game.state;
  $("pause").textContent = s.phase === "paused" ? "Resume" : "Pause";
  $("state").textContent =
    `${s.clock.toFixed(3)}s · ${s.phase} · ${s.shots.length} bombs · ${s.enemies.filter((e) => e.poison).length} poisoned (diagnostic count only) · ${s.enemies.filter((e) => e.kind === "armored" && e.poison).length} poisoned Boars · ${s.towers.reduce((n, t) => n + t.shots, 0)} shots`;
}
$("pause").onclick = () => game.pause();
$("restart").onclick = () => void restart();
$("step").onclick = () => {
  if (game.state.phase === "paused") game.pause();
  game.tick(1 / 30);
  if (game.state.phase !== "paused") game.pause();
};
$("advance").onclick = () => {
  if (game.state.phase === "paused") game.pause();
  for (let i = 0; i < 150; i++) game.tick(1 / 30);
  game.pause();
};
$("sell").onclick = () => {
  if (game.state.phase === "paused") game.pause();
  for (const t of [...game.state.towers]) game.sell(t.id);
  game.pause();
};
let previous = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (ready) {
    game.advance(dt * Number(($("speed") as HTMLSelectElement).value));
    field.update(game, null, dt);
    label();
  }
  requestAnimationFrame(frame);
}
await restart();
requestAnimationFrame(frame);
