import { TOWERS } from "../content/catalog";
import type { Game } from "../sim/game";
import type { GameState, Tower } from "../sim/types";
import { refundFor } from "../sim/economy";
import { towerPortrait } from "../render/portraits";
import { button } from "./game-chrome";
import { rankBadge } from "./rank-badge";

export const hudIcon = (name: string) =>
  `<img class="hud-icon" src="${import.meta.env.BASE_URL}art/v2/battle-icons-v1/${name}.webp" alt="" aria-hidden="true">`;
export function completedWaves(
  state: Pick<GameState, "wave" | "phase" | "resumePhase">,
) {
  const incomplete =
    state.phase === "wave" ||
    state.phase === "lost" ||
    (state.phase === "paused" && state.resumePhase === "wave");
  return Math.max(0, state.wave - (incomplete ? 1 : 0));
}
export function displayedWave(
  state: Pick<GameState, "wave" | "phase" | "resumePhase">,
  total: number,
) {
  if (state.phase === "won") return total;
  const active =
    state.phase === "wave" ||
    state.phase === "lost" ||
    (state.phase === "paused" && state.resumePhase === "wave");
  return Math.min(total, Math.max(1, state.wave + (active ? 0 : 1)));
}
export function battleStats(waves: number) {
  return `<div class="hud-stats battle-stats">
    <div class="resource-stat gold-stat" aria-label="Gold">${hudIcon("gold")}<b id="coins">0</b></div>
    <div class="resource-stat life-stat" role="group" aria-label="Lives remaining" title="Lives remaining. Raiders that escape cost lives.">${hudIcon("heart")}<b id="lives">12 / 12</b></div>
    <div class="resource-stat wave-stat" role="group" aria-label="Wave number">${hudIcon("flag")}<b id="wave">1 / ${waves}</b></div>
  </div>`;
}
export function towerAttributes(game: Game, t: Tower) {
  const def = TOWERS[t.kind];
  const stats = (level: number) => ({
    damage: Number((def.damage * (level === 2 ? 1.7 : 1)).toFixed(1)),
    range: Number(game.range({ ...t, level }).toFixed(1)),
    interval: Number((def.interval * (level === 2 ? 0.8 : 1)).toFixed(2)),
  });
  return { current: stats(t.level), next: t.level === 1 ? stats(2) : null };
}
export function defenderPanel(game: Game, t: Tower) {
  const { current, next } = towerAttributes(game, t);
  const attribute = (
    label: string,
    value: number | string,
    future?: number | string,
  ) =>
    `<div class="hero-attribute"><dt>${label}</dt><dd>${value}${future === undefined ? "" : `<span class="upgrade-preview"> → ${future}</span>`}</dd></div>`;
  const attributes =
    attribute("Damage", current.damage, next?.damage) +
    attribute("Range", current.range, next?.range) +
    attribute(
      "Attack",
      `${current.interval}s`,
      next ? `${next.interval}s` : undefined,
    );
  const upgradeLabel = !game.canUpgrade(t)
    ? "Upgrade locked"
    : t.level === 2
      ? "Max rank"
      : `Upgrade · ${game.upgradeCost(t)}`;
  return `<div class="hero-portrait">${towerPortrait(t.kind)}<div class="hero-rank">${rankBadge(t.level)}</div></div><div class="hero-identity"><h3>${TOWERS[t.kind].name}</h3><dl class="hero-attributes">${attributes}</dl>${!game.canUpgrade(t) ? '<p class="upgrade-lock">Win Lantern Pass to unlock Squirrel upgrades.</p>' : ""}</div><div class="selection-actions">${button("upgrade", upgradeLabel, "primary", `${!game.canUpgrade(t) || t.level === 2 || game.state.coins < game.upgradeCost(t) || !game.canAct() ? "disabled" : ""}`)}${button("sell", `Sell · +${refundFor(t.spent)}`, "quiet", `${!game.canAct() ? "disabled" : ""}`)}${button("inspect-close", "Close", "quiet")}</div>`;
}
