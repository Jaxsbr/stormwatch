import { BOARD_ILLUSTRATIONS } from "../content/boards";
import {
  boardNavigation,
  encounterUnlocked,
  viewedBoard,
  type ProgressionContext,
} from "../content/progression";
import type { SaveData } from "../persistence/save";
import type { LevelDef } from "../sim/types";
import { escapeHtml } from "./html";
import { button } from "./game-chrome";

export function expeditionScreen(
  levels: readonly LevelDef[],
  save: SaveData,
  context: ProgressionContext,
): string {
  const board = viewedBoard(context, save);
  const navigation = boardNavigation(context, save);
  const expanded = !board.visual.markers && board.levelIds.length > 3;
  const nodes = board.levelIds
    .map((id, position) => {
      const index = levels.findIndex((level) => level.id === id);
      const level = levels[index];
      const unlocked = encounterUnlocked(context, id, save);
      const completed = (save.stars[id] ?? 0) > 0;
      const previous = levels.find(
        ({ id }) => id === board.levelIds[position - 1],
      );
      const anchor = board.visual.markers?.[id];
      const requirement = previous
        ? `Complete ${previous.name}`
        : "Complete the previous board";
      return `<button class="map-node node-${position} ${unlocked ? (completed ? "completed" : "current") : "locked"}" ${anchor ? `style="left:${anchor.x}%;top:${anchor.y}%"` : ""} aria-label="${escapeHtml(level.name)}${completed ? `, ${save.stars[id]} stars earned` : unlocked ? ", next crossing" : `: ${escapeHtml(requirement)} to unlock`}" title="${escapeHtml(level.name)}" data-action="level:${index}" ${unlocked ? "" : "disabled"}><span class="node-medallion">${unlocked ? "♜" : "⌑"}</span><span class="node-number">${String(position + 1).padStart(2, "0")}</span><strong>${escapeHtml(level.name)}</strong><span class="map-stars">${"★".repeat(save.stars[id] ?? 0)}${"☆".repeat(3 - (save.stars[id] ?? 0))}</span><small>${unlocked ? "" : escapeHtml(requirement)}</small></button>`;
    })
    .join("");
  return `<main class="menu-screen expedition" data-board="${escapeHtml(board.id)}"><section class="map-heading"><h1>${escapeHtml(board.name)}</h1></section><div class="expedition-map ${expanded ? "expanded-campaign" : ""}"><div class="map-land" style="background-image:url('${import.meta.env.BASE_URL}${BOARD_ILLUSTRATIONS[board.visual.illustration]}')"></div>${nodes}</div><footer class="menu-footer">${button("title", "Back", "quiet")}${navigation.previous ? button(`board:${escapeHtml(navigation.previous.id)}`, `← ${escapeHtml(navigation.previous.name)}`, "quiet") : ""}${navigation.next ? button(`board:${escapeHtml(navigation.next.id)}`, `${escapeHtml(navigation.next.name)} →`, "primary") : ""}</footer></main>`;
}
