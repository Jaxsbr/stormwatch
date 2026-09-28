import type { Game } from "../sim/game";
import type { Point, TowerKind } from "../sim/types";

export type DefenderCommand =
  | { type: "place"; kind: TowerKind; point: Point }
  | { type: "upgrade" | "sell"; id: number };

/** Selection is presentation state. Only explicit confirmation issues a command. */
export class BattleSelection {
  point: Point | null = null;
  selected: number | null = null;
  selling = false;
  kind: TowerKind;
  readonly roster: readonly TowerKind[];
  constructor(
    readonly game: Game,
    private command: (command: DefenderCommand) => boolean = (command) => {
      if (command.type === "place")
        return game.place(command.kind, command.point);
      return game[command.type](command.id);
    },
  ) {
    this.roster =
      game.level.availableTowers ?? (Object.keys(game.towers) as TowerKind[]);
    this.kind = this.roster[0];
  }
  close() {
    this.point = null;
    this.selected = null;
    this.selling = false;
  }
  pick(point: Point) {
    if (!this.game.canAct()) return;
    const tower = this.game.state.towers.find(
      (t) => t.x === point.x && t.z === point.z,
    );
    if (tower) {
      const wasSelected = this.selected === tower.id;
      this.close();
      if (!wasSelected) this.selected = tower.id;
    } else if (this.game.canPlace(point) && this.roster.length) {
      const same = this.point?.x === point.x && this.point?.z === point.z;
      this.close();
      if (!same) this.point = { ...point };
    } else this.close();
  }
  cycle(direction: number) {
    if (!this.point || !this.roster.length) return;
    this.kind =
      this.roster[
        (this.roster.indexOf(this.kind) + direction + this.roster.length) %
          this.roster.length
      ];
  }
  act(action: string) {
    if (action === "close") {
      this.close();
      return true;
    }
    if (action === "previous" || action === "next") {
      this.cycle(action === "next" ? 1 : -1);
      return true;
    }
    if (action === "keep") {
      this.selling = false;
      return true;
    }
    if (!this.game.canAct()) return false;
    if (action === "place" && this.point && this.roster.includes(this.kind)) {
      if (this.command({ type: "place", kind: this.kind, point: this.point })) {
        this.close();
        return true;
      }
    }
    const tower = this.game.state.towers.find((t) => t.id === this.selected);
    if (!tower) return false;
    if (action === "sell") {
      this.selling = true;
      return true;
    }
    if (action === "confirm-sell" && this.selling) {
      if (this.command({ type: "sell", id: tower.id })) {
        this.close();
        return true;
      }
    }
    if (action === "upgrade" && !this.selling)
      return this.command({ type: "upgrade", id: tower.id });
    return false;
  }
}

/** Prefer beside the tile; flip at edges and clamp in compact landscapes. */
export function popupPosition(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  bounds: { width: number; height: number },
) {
  const gap = 38,
    edge = 8;
  let x = anchor.x - size.width / 2,
    y = anchor.y + gap;
  if (y + size.height > bounds.height - edge) y = anchor.y - size.height - gap;
  if (y < edge) {
    y = anchor.y - size.height / 2;
    x = anchor.x + gap;
    if (x + size.width > bounds.width - edge) x = anchor.x - size.width - gap;
  }
  return {
    x: Math.max(edge, Math.min(x, bounds.width - size.width - edge)),
    y: Math.max(edge, Math.min(y, bounds.height - size.height - edge)),
  };
}
