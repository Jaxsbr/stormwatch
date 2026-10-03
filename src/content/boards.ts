import type { AuthoringContent } from "../config/configuration";

export const FIRST_BOARD_ID = "first-board";
/** Reviewed board artwork. New illustrations join only with accepted runtime assets. */
export const BOARD_ILLUSTRATIONS = {
  "expedition-map-v1": "art/v2/expedition-map-v1/atlas.webp",
} as const;
export interface BoardDef {
  id: string;
  name: string;
  levelIds: string[];
  visual: {
    illustration: keyof typeof BOARD_ILLUSTRATIONS;
    /** Percentage anchors in the full board image. Absent on legacy CSS-positioned boards. */
    markers?: Record<string, { x: number; y: number }>;
  };
}

/** Old recipes keep their exact encounter order and reviewed presentation. */
export function resolveBoards(
  content: Pick<AuthoringContent, "boards" | "levels">,
): BoardDef[] {
  return structuredClone(
    content.boards ?? [
      {
        id: FIRST_BOARD_ID,
        name: "Choose your crossing",
        levelIds: content.levels.map(({ id }) => id),
        visual: { illustration: "expedition-map-v1" },
      },
    ],
  );
}

export function validateBoards(
  content: Pick<AuthoringContent, "boards" | "levels">,
): void {
  if (content.boards === undefined) return;
  if (!Array.isArray(content.boards) || !content.boards.length)
    throw new Error("boards: at least one board is required");
  const ids = new Set<string>(),
    members = new Set<string>();
  const known = new Set(content.levels.map(({ id }) => id));
  const exact = (value: object, allowed: string[], label: string) => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.includes(key))
    )
      throw new Error(`${label}: unsupported field`);
  };
  for (const board of content.boards) {
    exact(board, ["id", "name", "levelIds", "visual"], "board");
    if (
      typeof board.id !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(board.id) ||
      ids.has(board.id)
    )
      throw new Error("boards: invalid or duplicate identity");
    ids.add(board.id);
    if (typeof board.name !== "string" || !board.name.trim())
      throw new Error("board.name: required");
    if (!Array.isArray(board.levelIds) || !board.levelIds.length)
      throw new Error("board.levelIds: encounters required");
    for (const id of board.levelIds) {
      if (!known.has(id) || members.has(id))
        throw new Error("board.levelIds: unknown or duplicate encounter");
      members.add(id);
    }
    exact(board.visual, ["illustration", "markers"], "board.visual");
    if (!Object.hasOwn(BOARD_ILLUSTRATIONS, board.visual.illustration))
      throw new Error("board.visual: unapproved illustration");
    if (board.visual.markers !== undefined) {
      const markers = board.visual.markers;
      if (
        !markers ||
        typeof markers !== "object" ||
        Array.isArray(markers) ||
        Object.keys(markers).length !== board.levelIds.length
      )
        throw new Error("board markers: one anchor per encounter required");
      for (const [id, marker] of Object.entries(markers)) {
        if (!board.levelIds.includes(id))
          throw new Error("board markers: unknown encounter");
        exact(marker, ["x", "y"], "board marker");
        if (
          ![marker.x, marker.y].every(
            (n) =>
              typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100,
          )
        )
          throw new Error("board markers: use percentages from 0 to 100");
      }
    }
  }
  if (members.size !== known.size)
    throw new Error("boards: register every encounter exactly once");
}
