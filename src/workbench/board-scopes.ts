import type { AuthoringContent } from "../config/configuration";
import { configurationIdentity } from "../config/configuration";
import { resolveBoards, type BoardDef } from "../content/boards";

const equal = (a: unknown, b: unknown) =>
  a === undefined || b === undefined
    ? a === b
    : configurationIdentity(a) === configurationIdentity(b);
/** Board membership, presentation and ordering are one conflict scope per board. */
export function mergeBoardScopes(
  current: AuthoringContent,
  base: AuthoringContent,
  authored: AuthoringContent,
  selected?: readonly string[],
): AuthoringContent {
  const result = structuredClone(current);
  if (authored.boards === undefined) return result;
  const old = resolveBoards(base),
    live = resolveBoards(current),
    next = resolveBoards(authored);
  const changes = selected ?? [
    ...new Set([...old, ...next].map(({ id }) => id)),
  ];
  for (const id of changes) {
    const before = old.find((b) => b.id === id),
      after = next.find((b) => b.id === id);
    if (selected && !before && !after) throw new Error(`Unknown board ${id}`);
    if (equal(before, after)) continue;
    const index = live.findIndex((b) => b.id === id);
    if (!equal(live[index], before))
      throw new Error(
        `Board ${id} changed in game config. Reload its latest settings before promoting.`,
      );
    if (!after) live.splice(index, 1);
    else if (index < 0) live.push(structuredClone(after));
    else live[index] = structuredClone(after);
  }
  const oldOrder = old.map(({ id }) => id),
    newOrder = next.map(({ id }) => id);
  // Collection order is a separate scope. A single-board promotion cannot reorder travel.
  if (!selected && !equal(oldOrder, newOrder)) {
    const currentOrder = resolveBoards(current).map(({ id }) => id);
    if (!equal(oldOrder, currentOrder))
      throw new Error(
        "Board order changed in game config. Reload its latest settings before promoting.",
      );
    result.boards = newOrder.map((id) =>
      live.find((board) => board.id === id)!,
    );
  } else result.boards = live;
  return result;
}
/** Rebase without accepting conflicting board edits as a fresh baseline. */
export function rebaseBoardScopes(
  base: AuthoringContent,
  authored: AuthoringContent,
  current: AuthoringContent,
): { content?: BoardDef[]; comparison?: BoardDef[] } {
  if (!base.boards && !authored.boards && !current.boards) return {};
  const old = resolveBoards(base),
    next = resolveBoards(authored);
  const content = resolveBoards(current),
    comparison = resolveBoards(current);
  for (const id of new Set([...old, ...next].map(({ id }) => id))) {
    const before = old.find((b) => b.id === id),
      after = next.find((b) => b.id === id);
    if (equal(before, after)) continue;
    const live = content.find((b) => b.id === id);
    const replace = (list: BoardDef[], value?: BoardDef) => {
      const index = list.findIndex((b) => b.id === id);
      if (index >= 0) list.splice(index, 1);
      if (value)
        list.splice(index < 0 ? list.length : index, 0, structuredClone(value));
    };
    if (!equal(live, before) && !equal(live, after))
      replace(comparison, before);
    replace(content, after);
  }
  const oldOrder = old.map(({ id }) => id),
    newOrder = next.map(({ id }) => id);
  if (!equal(oldOrder, newOrder)) {
    const currentOrder = resolveBoards(current).map(({ id }) => id);
    const ordered = newOrder.map((id) =>
      content.find((board) => board.id === id)!,
    );
    const extras = content.filter((board) => !newOrder.includes(board.id));
    if (!equal(currentOrder, oldOrder) && !equal(currentOrder, newOrder)) {
      const compared = oldOrder.flatMap(
        (id) => comparison.find((board) => board.id === id) ?? [],
      );
      return {
        content: [...ordered, ...extras],
        comparison: [
          ...compared,
          ...comparison.filter((board) => !oldOrder.includes(board.id)),
        ],
      };
    }
    return { content: [...ordered, ...extras], comparison };
  }
  return { content, comparison };
}
