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

/** Reserve the whole projected cell plus a gap, including when space is tight. */
export function popupPosition(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  bounds: { width: number; height: number },
  tile = { width: 0, height: 0 },
) {
  const gap = 12,
    edge = 8;
  const left = anchor.x - tile.width / 2 - gap;
  const right = anchor.x + tile.width / 2 + gap;
  const top = anchor.y - tile.height / 2 - gap;
  const bottom = anchor.y + tile.height / 2 + gap;
  const regions = [
    {
      x: edge,
      y: bottom,
      width: bounds.width - 2 * edge,
      height: bounds.height - edge - bottom,
    },
    { x: edge, y: edge, width: bounds.width - 2 * edge, height: top - edge },
    {
      x: right,
      y: edge,
      width: bounds.width - edge - right,
      height: bounds.height - 2 * edge,
    },
    { x: edge, y: edge, width: left - edge, height: bounds.height - 2 * edge },
  ].filter((r) => r.width > 0 && r.height > 0);
  // If no side fits at natural size, use the largest region and scroll internally.
  const region = regions.find(
    (r) => r.width >= size.width && r.height >= size.height,
  ) ??
    regions.sort(
      (a, b) =>
        Math.min(b.width, size.width) * Math.min(b.height, size.height) -
        Math.min(a.width, size.width) * Math.min(a.height, size.height),
    )[0] ?? {
      x: edge,
      y: edge,
      width: Math.max(0, bounds.width - 2 * edge),
      height: Math.max(0, bounds.height - 2 * edge),
    };
  const width = Math.min(size.width, region.width),
    height = Math.min(size.height, region.height);
  const y = Math.max(
    region.y,
    Math.min(anchor.y - height / 2, region.y + region.height - height),
  );
  return {
    x: Math.max(
      region.x,
      Math.min(anchor.x - width / 2, region.x + region.width - width),
    ),
    y,
    width,
    maxHeight: region.y + region.height - y,
  };
}
