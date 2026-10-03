import "./defender-popups.css";
import { BattleSelection, popupPosition } from "./battle-selection";
import { towerPortrait, paintTowerPortraits } from "../render/portraits";
import { towerAttributes } from "./battle-ui";
import { refundFor } from "../sim/economy";
import { escapeHtml } from "./html";
import type { Point } from "../sim/types";

const control = (
  action: string,
  label: string,
  primary = false,
  disabled = false,
) =>
  `<button type="button" data-popup="${action}" class="${primary ? "popup-primary" : ""}" ${disabled ? "disabled" : ""}>${label}</button>`;
export function defenderPopupMarkup(
  selection: BattleSelection,
  locked = false,
) {
  const { game, point, kind, roster, selected, selling } = selection;
  const tower = game.state.towers.find((t) => t.id === selected);
  if (!tower && !point) return "";
  const close =
    '<button type="button" data-popup="close" class="popup-close" aria-label="Close selection">×</button>';
  const title = (name: string) =>
    `<header><span id="defender-popup-title">${name}</span>${close}</header>`;
  const identity = (name: string, role: string) =>
    `<strong>${escapeHtml(name)}</strong><small>${escapeHtml(role)}</small>`;
  if (tower) {
    const def = game.towers[tower.kind],
      refund = refundFor(tower.spent);
    if (selling)
      return (
        title(`Sell ${escapeHtml(def.name)}?`) +
        '<p>Remove this defender from the map?</p><div class="popup-actions">' +
        control("keep", "Keep defender") +
        control(
          "confirm-sell",
          `Sell · +${refund} gold`,
          true,
          locked || !game.canAct(),
        ) +
        "</div>"
      );
    const { current, next } = towerAttributes(game, tower);
    const max = tower.level === 2,
      unlocked = game.canUpgrade(tower);
    const stat = (
      label: string,
      value: number,
      future: number | undefined,
      suffix = "",
    ) =>
      `<span>${label} <b>${value}${suffix}${future !== undefined && unlocked ? ` → ${future}${suffix}` : ""}</b></span>`;
    return (
      title("Defender") +
      `<div class="popup-identity">${towerPortrait(tower.kind)}<div>${identity(def.name, `Level ${tower.level} · ${def.role}`)}</div></div><div class="popup-stats">${stat("Damage", current.damage, next?.damage)}${def.poisonDamage === undefined ? "" : stat("Poison / tick", def.poisonDamage * (tower.level === 2 ? game.rules.upgradeDamageScale : 1), max ? undefined : def.poisonDamage * game.rules.upgradeDamageScale)}${stat("Range", current.range, next?.range)}${stat("Attack", current.interval, next?.interval, "s")}</div>${def.poisonDamage === undefined ? "" : `<small>Poison: ${game.skunkPoison.durationSeconds}s, every ${game.skunkPoison.tickSeconds}s. Bypasses armor and shields; refresh keeps stronger damage.</small>`}${!unlocked && !max ? '<small class="popup-lock">Upgrades unlock through expedition rewards.</small>' : ""}<div class="popup-stack">${control("upgrade", max ? "Max level" : !unlocked ? "Upgrade locked" : `Upgrade · ${game.upgradeCost(tower)} gold`, true, max || !unlocked || locked || !game.canAct() || game.state.coins < game.upgradeCost(tower))}${control("sell", `Sell · +${refund} gold`, false, locked || !game.canAct())}</div>`
    );
  }
  const def = game.towers[kind],
    index = roster.indexOf(kind);
  const neighbour = (step: number) => {
    const k = roster[(index + step + roster.length) % roster.length];
    const label = step < 0 ? "Previous" : "Next";
    return `<button type="button" class="popup-neighbour" data-popup="${step < 0 ? "previous" : "next"}" aria-label="${label} defender: ${escapeHtml(game.towers[k].name)}"><small>${label}</small>${towerPortrait(k)}<span>${escapeHtml(game.towers[k].name)}</span></button>`;
  };
  return (
    title("Choose defender") +
    `<div class="popup-carousel ${roster.length === 1 ? "single" : ""}">${roster.length > 1 ? neighbour(-1) : ""}<div class="popup-chosen">${towerPortrait(kind)}${identity(def.name, def.role)}</div>${roster.length > 1 ? neighbour(1) : ""}</div><div class="popup-stack">${control("place", `Confirm · ${def.cost} gold`, true, locked || !game.canAct() || !game.canPlace(point!) || game.state.coins < def.cost)}</div>`
  );
}

/** Nonmodal: map stays interactive for correcting placement or selecting another defender. */
export class DefenderPopups {
  private panel: HTMLElement;
  private ghost: HTMLElement;
  private observer: ResizeObserver;
  private focusOnOpen = false;
  private previousSelection = "";
  constructor(
    readonly root: HTMLElement,
    readonly selection: BattleSelection,
    private project: (point: Point) => { x: number; y: number },
    private changed: (action: string, accepted: boolean) => void = () => {},
    private locked: () => boolean = () => false,
  ) {
    root.innerHTML =
      '<div class="placement-ghost" hidden></div><section class="defender-popup" role="dialog" aria-labelledby="defender-popup-title" tabindex="-1" hidden></section>';
    this.panel = root.querySelector(".defender-popup")!;
    this.ghost = root.querySelector(".placement-ghost")!;
    root.addEventListener("click", this.click);
    root.addEventListener("keydown", this.keydown);
    this.observer = new ResizeObserver(() => this.position());
    this.observer.observe(root.parentElement!);
  }
  private keydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.selection.close();
      this.update();
      this.changed("close", true);
    } else if (
      this.selection.point &&
      ["ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.selection.cycle(event.key === "ArrowLeft" ? -1 : 1);
      this.update();
    }
  };
  private click = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "[data-popup]",
    );
    if (!button || button.disabled) return;
    const action = button.dataset.popup!;
    if (
      this.locked() &&
      !["close", "previous", "next", "keep"].includes(action)
    )
      return;
    const accepted = this.selection.act(action);
    this.update();
    this.changed(action, accepted);
  };
  pick(point: Point) {
    this.selection.pick(point);
    this.focusOnOpen = true;
    this.update();
  }
  update() {
    const model = this.selection;
    const tower = model.game.state.towers.find((t) => t.id === model.selected);
    if (model.selected !== null && !tower) model.close();
    const key = tower
      ? `tower:${tower.id}`
      : model.point
        ? `tile:${model.point.x},${model.point.z}`
        : "";
    const markup = defenderPopupMarkup(model, this.locked());
    const active = document.activeElement as HTMLElement | null;
    const hadFocus = !!active && this.panel.contains(active);
    const action = hadFocus ? active?.dataset.popup : null;
    this.panel.hidden = !markup;
    if (this.panel.dataset.markup !== markup) {
      this.panel.dataset.markup = markup;
      this.panel.innerHTML = markup;
      void paintTowerPortraits(this.panel);
      if (markup && hadFocus)
        (
          this.panel.querySelector<HTMLButtonElement>(
            `[data-popup="${action}"]:not(:disabled)`,
          ) ??
          this.panel.querySelector<HTMLButtonElement>('[data-popup="close"]')
        )?.focus({ preventScroll: true });
    }
    if (markup && (this.focusOnOpen || key !== this.previousSelection))
      this.panel.focus({ preventScroll: true });
    if (!markup && hadFocus)
      this.root.parentElement
        ?.querySelector<HTMLElement>("canvas")
        ?.focus({ preventScroll: true });
    this.focusOnOpen = false;
    this.previousSelection = key;
    this.ghost.hidden = !model.point;
    this.position();
  }
  position() {
    const model = this.selection,
      point =
        model.point ??
        model.game.state.towers.find((t) => t.id === model.selected);
    if (!point || this.panel.hidden) return;
    const bounds = this.root.getBoundingClientRect(),
      projected = this.project(point);
    const anchor = {
      x: projected.x - bounds.left,
      y: projected.y - bounds.top,
    };
    const corner = this.project({ x: point.x + 0.5, z: point.z + 0.5 });
    const tile = {
      width: Math.abs(corner.x - projected.x) * 2,
      height: Math.abs(corner.y - projected.y) * 2,
    };
    this.panel.style.width = "";
    this.panel.style.maxHeight = "";
    const pos = popupPosition(
      anchor,
      this.panel.getBoundingClientRect(),
      bounds,
      tile,
    );
    this.panel.style.left = `${pos.x}px`;
    this.panel.style.top = `${pos.y}px`;
    this.panel.style.width = `${pos.width}px`;
    this.panel.style.maxHeight = `${pos.maxHeight}px`;
    this.ghost.style.cssText = `left:${anchor.x}px;top:${anchor.y}px;width:${Math.abs(corner.x - projected.x) * 2}px;height:${Math.abs(corner.y - projected.y) * 2}px`;
  }
  destroy() {
    this.observer.disconnect();
    this.root.removeEventListener("click", this.click);
    this.root.removeEventListener("keydown", this.keydown);
    this.root.replaceChildren();
  }
}
