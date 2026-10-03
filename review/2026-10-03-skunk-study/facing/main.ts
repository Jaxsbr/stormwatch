import { Battlefield } from "../../../src/render/battlefield";
import candidate from "../../mosswater-encounters/game-content.json";
import { type AuthoringContent } from "../../../src/config/configuration";
import { play, createAttempt } from "../../mosswater-encounters/strategies";
import { progressionContext } from "../../../src/content/progression";
import { freshSave, recordVictoryOutcome } from "../../../src/persistence/save";
const content = candidate as AuthoringContent;
const context = progressionContext(content);
let save = freshSave(context);
for (const id of context.levelIds) {
  if (id === "mosswater-01") break;
  const result = play(content, id, save);
  if (result.phase !== "won") throw new Error("Legal entry replay failed");
  save = recordVictoryOutcome(save, id, 1, context).save;
}
const trace = play(content, "mosswater-01", save).trace;
const field = new Battlefield(document.getElementById("field")!);
let game = createAttempt(content, "mosswater-01", save),
  tick = 0,
  commandIndex = 0;
function step(render = true) {
  if (game.state.phase === "paused") game.pause();
  while (commandIndex < trace.length && trace[commandIndex].tick === tick) {
    const c = trace[commandIndex++].command;
    const accepted =
      c.type === "place"
        ? game.place(c.kind, c.point)
        : c.type === "upgrade"
          ? game.upgrade(c.id)
          : c.type === "start"
            ? game.startWave()
            : false;
    if (!accepted) throw new Error("Legal replay command rejected");
  }
  game.tick(1 / 30);
  game.drainEvents();
  tick++;
  if (render) field.update(game, null, 1 / 30);
}
function inspect() {
  game.pause();
  field.update(game, null, 0);
  const shots = game.state.shots.filter((p) => p.kind === "stone");
  document.getElementById("state")!.textContent =
    `${game.state.clock.toFixed(3)}s · paused · ${shots.map((p) => `Skunk (${p.source.x},${p.source.z}) → enemy ${p.targetId} at x ${p.target.x.toFixed(2)}`).join(" · ") || "no live bombs"}`;
}
async function replay(to: number, late = false) {
  game = createAttempt(content, "mosswater-01", save);
  tick = commandIndex = 0;
  field.load(game.level);
  await field.artReady(game.level);
  field.update(game, null, 0);
  for (let i = 0; i < to; i++) step(!late || i < 195);
  inspect();
}
document.getElementById("first")!.onclick = () => void replay(21);
document.getElementById("conflict")!.onclick = () => void replay(201);
document.getElementById("late")!.onclick = () => void replay(204, true);
document.getElementById("step")!.onclick = () => {
  step();
  inspect();
};
document.getElementById("sell")!.onclick = () => {
  const shot = game.state.shots.find((p) => p.kind === "stone");
  const tower = game.state.towers.find(
    (t) => shot && t.x === shot.source.x && t.z === shot.source.z,
  );
  if (tower) {
    if (game.state.phase === "paused") game.pause();
    game.sell(tower.id);
  }
  inspect();
};
await replay(21);
