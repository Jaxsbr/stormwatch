import type { Game } from "../sim/game";
import type { Point, TowerKind } from "../sim/types";

export type LegalCommand =
  | { type: "place"; kind: TowerKind; point: Point }
  | { type: "upgrade"; id: number }
  | { type: "sell"; id: number }
  | { type: "start" }
  | { type: "pause" };
export interface RecordedCommand {
  tick: number;
  command: LegalCommand;
  accepted: boolean;
}
export function executeCommand(game: Game, command: LegalCommand): boolean {
  switch (command.type) {
    case "place":
      return game.place(command.kind, command.point);
    case "upgrade":
      return game.upgrade(command.id);
    case "sell":
      return game.sell(command.id);
    case "start":
      return game.startWave();
    case "pause": {
      const before = game.state.phase;
      game.pause();
      return before !== game.state.phase;
    }
  }
}
