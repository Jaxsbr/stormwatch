import { ENEMIES, TOWERS } from "../content/catalog";
import { towerPortrait } from "../render/portraits";
import type { CardId, EnemyKind, GameState } from "../sim/types";
import { artPath, enemyVisuals } from "../content/encounter-visuals";
import type { ResultReward } from "../content/progression";

/** Shared illustrated action; semantic variant classes also preserve layout hooks. */
export const button = (action: string, label: string, cls = "", extra = "") =>
  `<button data-action="${action}" class="game-art-button ${cls.includes("primary") ? "game-art-button--primary" : ""} ${cls}" ${extra}>${label}</button>`;

const advantageRewards: Record<
  Exclude<CardId, "none" | "thrift">,
  { name: string; effect: string; crop: [number, number] }
> = {
  reach: { name: "Reach", effect: "+18% tower range", crop: [0, 565] },
  nets: {
    name: "Longer Nets",
    effect: "+50% slow duration",
    crop: [1115, 515],
  },
};

export function resultCard(
  state: Pick<
    GameState,
    "phase" | "stars" | "goldEarned" | "kills" | "killsByKind"
  >,
  rewards: readonly ResultReward[] = [],
  firstBoardComplete = false,
) {
  const won = state.phase === "won";
  const defeatedEnemies = (Object.keys(ENEMIES) as EnemyKind[])
    .filter((kind) => state.killsByKind[kind] > 0)
    .map(
      (
        kind,
      ) => `<li aria-label="${ENEMIES[kind].name}: ${state.killsByKind[kind]}">
        <img src="${import.meta.env.BASE_URL}${artPath(enemyVisuals[kind].briefing)}" alt="" aria-hidden="true">
        <strong>×${state.killsByKind[kind]}</strong>
      </li>`,
    )
    .join("");
  return `<section class="result-card" aria-labelledby="result-title">
    <header class="result-heading"><h1 id="result-title" tabindex="-1">${firstBoardComplete ? "First Board Complete!" : won ? "Victory!" : "Defeat"}</h1>
    ${won ? `<div class="result-stars" aria-label="${state.stars} stars">${"★".repeat(state.stars)}${"☆".repeat(3 - state.stars)}</div>` : ""}
    ${firstBoardComplete ? '<p class="chapter-complete-copy">The Roadwarden is turned back. Your first board is complete.</p>' : ""}
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
              if (reward.kind === "advantage-unlock") {
                const {
                  name,
                  effect,
                  crop: [x, width],
                } = advantageRewards[reward.card];
                return `<article class="result-reward advantage-reward"><div class="reward-art"><svg viewBox="${x} 0 ${width} 724" aria-hidden="true" focusable="false"><defs><clipPath id="reward-clip-${reward.card}"><rect x="${x}" y="0" width="${width}" height="724"/></clipPath></defs><image clip-path="url(#reward-clip-${reward.card})" href="${import.meta.env.BASE_URL}art/v2/advantage-icons-v1/atlas.webp" width="2172" height="724"/></svg></div><h2>${name}</h2><p>${effect}</p></article>`;
              }
              if (
                reward.kind === "tower-upgrade" ||
                reward.kind === "tower-unlock"
              )
                return `<article class="result-reward"><div class="reward-art">${towerPortrait(reward.tower)}</div><h2>${reward.kind === "tower-upgrade" ? "Tower Upgrade" : "New Defender"}</h2><p>${TOWERS[reward.tower].name}</p></article>`;
              return "";
            })
            .join("")}</section>`
        : ""
    }
    <div class="result-actions">${button("map", "Back to map", "primary")}</div>
  </section>`;
}
