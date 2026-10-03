import type { AuthoringContent } from "../config/configuration";
import { configurationIdentity } from "../config/configuration";
import { resolveBoards, type BoardDef } from "../content/boards";

const equal = (a: unknown, b: unknown) =>
  a === undefined || b === undefined
    ? a === b
    : configurationIdentity(a) === configurationIdentity(b);
/** Keep only board members whose recipes belong to this candidate. */
function boardInCandidate(
  board: BoardDef,
  levelIds: readonly string[],
): BoardDef {
  const result = structuredClone(board);
  result.levelIds = result.levelIds.filter((id) => levelIds.includes(id));
  if (result.visual.markers) {
    for (const id of Object.keys(result.visual.markers))
      if (!result.levelIds.includes(id)) delete result.visual.markers[id];
  }
  return result;
}
/** Reconcile ownership for the entire collection, then materialize each board.
 * Protected scopes retain authored (or comparison) ownership for their recipes;
 * other recipes retain live ownership. Every recipe gets exactly one owner.
 */
function reconcileMemberships(
  snapshot: BoardDef[],
  preferred: BoardDef[],
  live: BoardDef[],
  baseIds: readonly string[],
  candidateIds: readonly string[],
  protectedBoards: ReadonlySet<string>,
): BoardDef[] {
  const protectedIds = new Set(
    [...preferred, ...live].flatMap((board) =>
      protectedBoards.has(board.id)
        ? board.levelIds.filter((id) => baseIds.includes(id))
        : [],
    ),
  );
  const owner = (boards: BoardDef[], id: string) =>
    boards.find((board) => board.levelIds.includes(id));
  const sources = new Map(
    candidateIds.map((id) => {
      const current = owner(live, id),
        pending = owner(preferred, id);
      return [
        id,
        protectedIds.has(id) ? (pending ?? current) : (current ?? pending),
      ] as const;
    }),
  );
  return snapshot.map((board) => {
    const first = protectedBoards.has(board.id)
      ? preferred.find((entry) => entry.id === board.id)
      : live.find((entry) => entry.id === board.id);
    const pending = preferred.find((entry) => entry.id === board.id);
    const current = live.find((entry) => entry.id === board.id);
    const belongs = (id: string) => sources.get(id)?.id === board.id;
    const ids = (first?.levelIds ?? []).filter(belongs);
    // Place concurrent live additions among their live neighbours before
    // appending unpublished recipes from the draft.
    for (const id of current?.levelIds ?? []) {
      if (!belongs(id) || ids.includes(id)) continue;
      const following = current!.levelIds
        .slice(current!.levelIds.indexOf(id) + 1)
        .find((member) => ids.includes(member));
      const preceding = current!.levelIds
        .slice(0, current!.levelIds.indexOf(id))
        .reverse()
        .find((member) => ids.includes(member));
      ids.splice(
        following
          ? ids.indexOf(following)
          : preceding
            ? ids.indexOf(preceding) + 1
            : ids.length,
        0,
        id,
      );
    }
    for (const id of [...(pending?.levelIds ?? []), ...candidateIds])
      if (belongs(id) && !ids.includes(id)) ids.push(id);
    const result = boardInCandidate(board, ids);
    result.levelIds = ids;
    if (result.visual.markers) {
      result.visual.markers = Object.fromEntries(
        ids.flatMap((id) => {
          const marker = sources.get(id)?.visual.markers?.[id];
          return marker ? [[id, structuredClone(marker)]] : [];
        }),
      );
    }
    return result;
  });
}
/** Board membership, presentation and ordering are one conflict scope per board. */
export function mergeBoardScopes(
  current: AuthoringContent,
  base: AuthoringContent,
  authored: AuthoringContent,
  selected?: readonly string[],
  candidateLevelIds?: readonly string[],
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
    const before = old.find((b) => b.id === id);
    let after = next.find((b) => b.id === id);
    if (after && selected && candidateLevelIds)
      after = boardInCandidate(after, candidateLevelIds);
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
  contentIds = authored.levels.map(({ id }) => id),
  comparisonIds = current.levels.map(({ id }) => id),
): { content?: BoardDef[]; comparison?: BoardDef[] } {
  if (!base.boards && !authored.boards && !current.boards) return {};
  const old = resolveBoards(base),
    next = resolveBoards(authored);
  let content = resolveBoards(current),
    comparison = resolveBoards(current);
  const changed = new Set<string>(),
    conflicted = new Set<string>();
  const baseIds = base.levels.map(({ id }) => id);
  const projectedOld = old.map((board) =>
    boardInCandidate(board, comparisonIds),
  );
  const projectedNext = next.map((board) =>
    boardInCandidate(board, comparisonIds),
  );
  // Adding a pending recipe alone does not edit an existing board scope.
  // Compare presentation, order and ownership only for already-known recipes.

  for (const id of new Set([...old, ...next].map(({ id }) => id))) {
    const before = old.find((b) => b.id === id),
      after = next.find((b) => b.id === id);
    if (
      equal(
        before && boardInCandidate(before, baseIds),
        after && boardInCandidate(after, baseIds),
      )
    )
      continue;
    changed.add(id);
    const live = content.find((b) => b.id === id);
    const replace = (list: BoardDef[], value?: BoardDef) => {
      const index = list.findIndex((b) => b.id === id);
      if (index >= 0) list.splice(index, 1);
      if (value)
        list.splice(index < 0 ? list.length : index, 0, structuredClone(value));
    };
    // A selected-wave promotion may accept board metadata while new-map
    // membership remains pending. Accept that projected scope as the new base.
    const expectedBefore = reconcileMemberships(
      projectedOld,
      old,
      resolveBoards(current),
      baseIds,
      comparisonIds,
      new Set([id]),
    ).find((board) => board.id === id);
    const acceptedAfter = reconcileMemberships(
      projectedNext,
      next,
      resolveBoards(current),
      baseIds,
      comparisonIds,
      new Set([id]),
    ).find((board) => board.id === id);
    if (!equal(live, expectedBefore) && !equal(live, acceptedAfter)) {
      conflicted.add(id);
      replace(comparison, before);
    }
    replace(content, after);
  }
  const live = resolveBoards(current);
  content = reconcileMemberships(
    content,
    next,
    live,
    baseIds,
    contentIds,
    changed,
  );
  comparison = reconcileMemberships(
    comparison,
    old,
    live,
    baseIds,
    comparisonIds,
    conflicted,
  );
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
