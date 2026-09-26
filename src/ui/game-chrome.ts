import { ENEMIES, TOWERS } from "../content/catalog";
import { towerPortrait } from "../render/portraits";
import type { EnemyKind, GameState, TowerKind } from "../sim/types";

/** Shared illustrated action; semantic variant classes also preserve layout hooks. */
export const button = (action: string, label: string, cls = "", extra = "") =>
  `<button data-action="${action}" class="game-art-button ${cls.includes("primary") ? "game-art-button--primary" : ""} ${cls}" ${extra}>${label}</button>`;

export type ResultReward = { kind: "tower-upgrade"; tower: TowerKind };

const enemyArt: Record<EnemyKind, string> = {
  raider: "rat-rig-v3",
  runner: "weasel-rig-v1",
  armored: "boar-rig-v1",
  boss: "badger-rig-v1",
};

export function resultCard(
  state: Pick<
    GameState,
    "phase" | "stars" | "goldEarned" | "kills" | "killsByKind"
  >,
  rewards: readonly ResultReward[] = [],
) {
  const won = state.phase === "won";
  const defeatedEnemies = (Object.keys(ENEMIES) as EnemyKind[])
    .filter((kind) => state.killsByKind[kind] > 0)
    .map(
      (
        kind,
      ) => `<li aria-label="${ENEMIES[kind].name}: ${state.killsByKind[kind]}">
        <img src="${import.meta.env.BASE_URL}art/v2/${enemyArt[kind]}/body.webp" alt="" aria-hidden="true">
        <strong>×${state.killsByKind[kind]}</strong>
      </li>`,
    )
    .join("");
  return `<section class="result-card" aria-labelledby="result-title">
    <header class="result-heading"><h1 id="result-title" tabindex="-1">${won ? "Victory!" : "Defeat"}</h1>
    ${won ? `<div class="result-stars" aria-label="${state.stars} stars">${"★".repeat(state.stars)}${"☆".repeat(3 - state.stars)}</div>` : ""}
    </header>
    <section class="result-summary" aria-label="Battle results">
      <span class="result-accessible-total">Enemies stopped: ${state.kills}</span>
      ${defeatedEnemies ? `<ul class="result-enemies" aria-label="Enemies stopped by type">${defeatedEnemies}</ul>` : ""}
      <div class="result-gold-total" aria-label="Gold earned: ${state.goldEarned}">
        <img src="${import.meta.env.BASE_URL}art/v2/battle-icons-v1/gold.webp" alt="" aria-hidden="true">
        <strong>+${state.goldEarned.toLocaleString("en")}</strong>
      </div>
    </section>
    ${
      rewards.length
        ? `<section class="result-rewards" aria-label="Rewards" data-count="${rewards.length}">${rewards
            .map((reward) => {
              if (reward.kind === "tower-upgrade")
                return `<article class="result-reward"><div class="reward-art">${towerPortrait(reward.tower)}</div><h2>Tower Upgrade</h2><p>${TOWERS[reward.tower].name}</p></article>`;
              return "";
            })
            .join("")}</section>`
        : ""
    }
    <div class="result-actions">${button("map", "Back to map", "primary")}</div>
  </section>`;
}
