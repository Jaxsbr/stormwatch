import type { GameState } from "../sim/types";

/** Shared illustrated action; semantic variant classes also preserve layout hooks. */
export const button = (action: string, label: string, cls = "", extra = "") =>
  `<button data-action="${action}" class="game-art-button ${cls.includes("primary") ? "game-art-button--primary" : ""} ${cls}" ${extra}>${label}</button>`;

export function resultCard(
  state: Pick<GameState, "phase" | "stars">,
  squirrelUpgradeUnlocked: boolean,
  assisted: boolean,
) {
  const won = state.phase === "won";
  return `<section class="result-card" aria-labelledby="result-title">
    <h1 id="result-title">${won ? "Victory!" : "Defeat"}</h1>
    ${won ? `<div class="result-stars" aria-label="${state.stars} stars">${"★".repeat(state.stars)}${"☆".repeat(3 - state.stars)}</div>` : ""}
    ${won && squirrelUpgradeUnlocked ? '<section class="unlock-note" aria-labelledby="reward-title"><small>NEW REWARD</small><h2 id="reward-title">Squirrel upgrades unlocked</h2><p>Select a Squirrel during future battles to improve its damage, range, and attack speed.</p></section>' : ""}
    <div class="result-actions">
      ${button("map", "Map", won ? "primary" : "secondary")}
      ${button("retry", "Play again", won ? "secondary" : "primary")}
      ${won ? "" : button("assist", "Easier retry", "secondary", 'aria-describedby="assist-help"')}
    </div>
    ${won ? "" : '<p id="assist-help" class="assist-help">Easier retry: +70 gold, +8 health.</p>'}
    ${assisted ? "<small>Assisted game</small>" : ""}
  </section>`;
}
