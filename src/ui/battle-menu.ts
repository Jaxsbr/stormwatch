import type { SaveData } from "../persistence/save";
import { enemyInspection } from "./enemy-inspection";
import type { EnemyDef, EnemyKind, LevelDef } from "../sim/types";
import { button } from "./game-chrome";

export type MenuView = "menu" | "settings" | "quit" | "enemies";
export function battleMenuMarkup(
  save: Pick<SaveData, "music" | "effects" | "muted" | "showGrid">,
  fullscreenLabel?: string,
  inspection?: { level: LevelDef; enemies: Record<EnemyKind, EnemyDef> },
) {
  return `<div class="modal-backdrop battle-menu-backdrop"><section class="game-menu-surface" role="dialog" aria-modal="true" aria-labelledby="battle-menu-title" tabindex="-1"><h2 id="battle-menu-title">Game paused</h2><div class="menu-pages">
    <div class="menu-page" data-menu-view="menu">${button("menu-continue", "Continue", "primary")}${inspection ? button("menu-enemies", "Inspect enemies") : ""}${button("menu-settings", "Settings")}${button("menu-quit", "Quit")}</div>
    <div class="menu-page" data-menu-view="settings" hidden inert><h3>Settings</h3><label>Music<input data-setting="music" type="range" min="0" max="1" step="0.05" value="${save.music}"></label><label>Sound effects<input data-setting="effects" type="range" min="0" max="1" step="0.05" value="${save.effects}"></label><label class="mute-row"><input data-setting="muted" type="checkbox" ${save.muted ? "checked" : ""}>Mute all sound</label><label class="mute-row"><input data-setting="showGrid" type="checkbox" ${save.showGrid ? "checked" : ""}>Show placement grid</label>${fullscreenLabel ? button("fullscreen", fullscreenLabel) : ""}${button("menu-back", "Menu", "primary")}</div>
    ${inspection ? `<div class="menu-page" data-menu-view="enemies" hidden inert>${enemyInspection(inspection.level, inspection.enemies)}${button("menu-back", "Menu", "primary")}</div>` : ""}
    <div class="menu-page" data-menu-view="quit" hidden inert><h3>Quit this game?</h3><p>This attempt will end. Completed maps stay saved.</p>${button("menu-confirm-quit", "Quit", "primary")}${button("menu-back", "Menu")}</div>
  </div></section></div>`;
}

/** One fixed dialog; outgoing content finishes before the incoming page appears. */
export class BattleMenu {
  view: MenuView = "menu";
  transitioning = false;
  private alive = true;
  private animations: Animation[] = [];
  constructor(
    private root: HTMLElement,
    save: Pick<SaveData, "music" | "effects" | "muted" | "showGrid">,
    fullscreenLabel?: string,
    inspection?: { level: LevelDef; enemies: Record<EnemyKind, EnemyDef> },
  ) {
    root.innerHTML = battleMenuMarkup(save, fullscreenLabel, inspection);
    root.querySelector<HTMLElement>('[data-action="menu-continue"]')?.focus();
  }
  async navigate(view: MenuView) {
    if (!this.alive || this.transitioning || this.view === view) return;
    this.transitioning = true;
    const previous = this.root.querySelector<HTMLElement>(
      `[data-menu-view="${this.view}"]`,
    )!;
    const next = this.root.querySelector<HTMLElement>(
      `[data-menu-view="${view}"]`,
    )!;
    const direction = view === "menu" ? -1 : 1;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    previous.inert = true;
    this.root.querySelector<HTMLElement>('[role="dialog"]')?.focus();
    const animate = async (
      element: HTMLElement,
      keyframes: Keyframe[],
      duration: number,
    ) => {
      if (reduced) return;
      const animation = element.animate(keyframes, {
        duration,
        easing: "cubic-bezier(.22,.7,.25,1)",
        fill: "both",
      });
      this.animations.push(animation);
      await animation.finished.catch(() => {});
      animation.cancel();
    };
    await animate(
      previous,
      [
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0, transform: `translateX(${-direction * 32}px)` },
      ],
      170,
    );
    if (!this.alive) return;
    previous.hidden = true;
    next.hidden = false;
    await animate(
      next,
      [
        { opacity: 0, transform: `translateX(${direction * 32}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      230,
    );
    if (!this.alive) return;
    next.inert = false;
    this.view = view;
    this.transitioning = false;
    this.animations = [];
    next.querySelector<HTMLElement>("button,input")?.focus();
  }
  destroy() {
    this.alive = false;
    this.animations.forEach((animation) => animation.cancel());
    this.root.replaceChildren();
  }
}
