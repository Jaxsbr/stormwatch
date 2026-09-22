import { TOWERS } from "../content/catalog";
import type { Game } from "../sim/game";
import type { GameState, Tower } from "../sim/types";
import { refundFor, tradeIncome } from "../sim/economy";
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
export function battleStats(waves: number) {
  return `<div class="hud-stats battle-stats">
    <div class="resource-stat gold-stat" aria-label="Gold">${hudIcon("gold")}<b id="coins">0</b></div>
    <div class="resource-stat life-stat" role="group" aria-label="Lives remaining" title="Lives remaining. Raiders that escape cost lives.">${hudIcon("heart")}<b id="lives">12 / 12</b></div>
    <div class="resource-stat wave-stat" role="group" aria-label="Waves cleared">${hudIcon("flag")}<b id="wave">0 / ${waves}</b></div>
  </div>`;
}
export function economyPanel() {
  return `<div class="economy-panel"><button class="game-art-button payout-toggle" data-action="payout-toggle" aria-expanded="false" aria-controls="payout-details">${hudIcon("gold")}<span>Next payout</span><b id="forecast-summary">+0</b></button><section id="payout-details" hidden><div class="payout-heading"><strong>After this wave</strong>${button("payout-close", "Close", "quiet")}</div><dl><div><dt>Wave reward</dt><dd id="forecast-reward">+0</dd></div><div><dt>Donkey earnings</dt><dd id="forecast-trade">+0</dd></div><div><dt>Savings bonus</dt><dd id="forecast-interest">+0</dd></div></dl><p>Paid automatically. Savings earn 10%, up to 20 gold.</p></section></div>`;
}
export function towerAttributes(game: Game, t: Tower) {
  const def = TOWERS[t.kind];
  const stats = (level: number) => ({
    damage: Number((def.damage * (level === 2 ? 1.7 : 1)).toFixed(1)),
    range: Number(game.range({ ...t, level }).toFixed(1)),
    interval: Number((def.interval * (level === 2 ? 0.8 : 1)).toFixed(2)),
    income: tradeIncome([{ ...t, level }]),
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
    t.kind === "trade"
      ? attribute(
          "Gold / wave",
          `+${current.income}`,
          next ? `+${next.income}` : undefined,
        ) + attribute("Collection", "Automatic")
      : attribute("Damage", current.damage, next?.damage) +
        attribute("Range", current.range, next?.range) +
        attribute(
          "Attack",
          `${current.interval}s`,
          next ? `${next.interval}s` : undefined,
        );
  return `<div class="hero-portrait">${towerPortrait(t.kind)}<div class="hero-rank">${rankBadge(t.level)}</div></div><div class="hero-identity"><h3>${TOWERS[t.kind].name}</h3><dl class="hero-attributes">${attributes}</dl></div><div class="selection-actions">${button("upgrade", t.level === 2 ? "Max rank" : `Upgrade · ${game.upgradeCost(t)}`, "primary", `${t.level === 2 || game.state.coins < game.upgradeCost(t) || !game.canAct() ? "disabled" : ""}`)}${button("sell", `Sell · +${refundFor(t.spent)}`, "quiet", `${!game.canAct() ? "disabled" : ""}`)}${button("inspect-close", "Close", "quiet")}</div>`;
}
