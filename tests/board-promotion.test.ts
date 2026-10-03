import { expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  configurationIdentity,
} from "../src/config/configuration";
import { resolveBoards } from "../src/content/boards";
import {
  createWorkingDraft,
  promoteWorkingWave,
  promoteAllWorkingChanges,
  rebaseAfterPromotion,
  validateWorkingDraft,
} from "../src/workbench/working-draft";
import { forkDraft } from "../src/workbench/drafts";
import {
  previewPromotion,
  verifyPromotionScenarios,
} from "../src/workbench/promotion";

const baseline = () => {
  const content = structuredClone(CANONICAL_CONTENT);
  const first = resolveBoards(content)[0];
  content.boards = [
    { ...first, levelIds: first.levelIds.slice(0, 2) },
    {
      ...structuredClone(first),
      id: "fixture-board",
      name: "Fixture board",
      levelIds: first.levelIds.slice(2),
    },
  ];
  return content;
};
it("migrates absent board collections without changing pending maps or eagerly freezing legacy membership", () => {
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].name = "Pending map";
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  expect(restored.content.boards).toBeUndefined();
  expect(restored.content.levels[0].name).toBe("Pending map");
  expect(resolveBoards(restored.content)[0].levelIds).toEqual(
    CANONICAL_CONTENT.levels.map(({ id }) => id),
  );
});
it("promotes one board with its wave, preserves unrelated live/draft boards and rejects stale conflicts after rebase", () => {
  const base = baseline(),
    draft = createWorkingDraft(base),
    live = structuredClone(base);
  draft.content.boards![0].name = "Changed first";
  draft.content.boards![1].name = "Pending second";
  live.boards![1].name = "Live second";
  live.levels[1].startCoins += 5;
  const promoted = promoteWorkingWave(live, draft);
  expect(promoted.boards!.map(({ name }) => name)).toEqual([
    "Changed first",
    "Live second",
  ]);
  expect(promoted.levels[1].startCoins).toBe(live.levels[1].startCoins);
  const rebased = rebaseAfterPromotion(draft, promoted);
  expect(rebased.content.boards![1].name).toBe("Pending second");
  expect(rebased.base.boards![1].name).toBe(base.boards![1].name);
  expect(() => promoteAllWorkingChanges(promoted, rebased)).toThrow(
    "Board fixture-board changed",
  );
  expect(() => promoteWorkingWave(promoted, draft)).toThrow(
    "Board first-board changed",
  );
});
it("keeps board travel order separate from selected-wave promotion and rejects stale order", () => {
  const base = baseline(),
    draft = createWorkingDraft(base);
  draft.content.boards!.reverse();
  expect(promoteWorkingWave(base, draft).boards).toEqual(base.boards);
  expect(promoteAllWorkingChanges(base, draft).boards).toEqual(
    draft.content.boards,
  );
  const live = structuredClone(base);
  live.boards!.reverse();
  expect(() => promoteAllWorkingChanges(live, draft)).toThrow(
    "Board order changed",
  );
});
it("requires a complete membership transaction when moving an encounter and preserves untouched waves", () => {
  const base = baseline(),
    draft = createWorkingDraft(base);
  const moved = draft.content.boards![0].levelIds.pop()!;
  draft.content.boards![1].levelIds.unshift(moved);
  expect(() => promoteWorkingWave(base, draft)).toThrow(
    "register every encounter",
  );
  const promoted = promoteAllWorkingChanges(base, draft);
  expect(promoted.boards).toEqual(draft.content.boards);
  expect(promoted.levels).toEqual(base.levels);
});
it("makes board scopes explicit in agent previews and includes metadata in the authored identity", () => {
  const base = baseline(),
    revision = forkDraft(base, "board-revision", "Board edit");
  revision.content.boards![0].name = "New board name";
  const preview = previewPromotion(base, revision, { boards: ["first-board"] });
  expect(preview.changes[0].scope).toBe("boards/first-board");
  expect(preview.candidateIdentity).not.toBe(configurationIdentity(base));
  expect(verifyPromotionScenarios(preview, revision)).toHaveLength(2);
  expect(preview.content.levels).toEqual(base.levels);
});
