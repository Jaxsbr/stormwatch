import { expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  configurationIdentity,
} from "../src/config/configuration";
import { resolveBoards } from "../src/content/boards";
import {
  createWorkingDraft,
  createMap,
  promoteWorkingWave,
  promoteAllWorkingChanges,
  rebaseAfterPromotion,
  validateWorkingDraft,
} from "../src/workbench/working-draft";
import { AttemptSession } from "../src/workbench/runs";
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

it("keeps pending map membership and anchors out of an existing wave candidate and preserves them after promotion", () => {
  const base = baseline();
  base.boards![0].visual.markers = Object.fromEntries(
    base.boards![0].levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
  );
  let draft = createMap(
    createWorkingDraft(base),
    "Pending map",
    base.levels[0].id,
    "pending-map",
    "pending-wave",
  );
  draft = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  draft.levelId = base.levels[0].id;
  draft.waveId = base.levels[0].waves[0].id;
  draft.content.levels[0].waves[0].reward += 5;
  draft.content.boards![0].name = "Intentional board edit";
  const pendingMap = structuredClone(draft.content.levels.at(-1)!);
  const pendingAnchor = structuredClone(
    draft.content.boards![0].visual.markers!["pending-map"],
  );
  const promoted = promoteWorkingWave(base, draft);
  expect(promoted.levels.map(({ id }) => id)).toEqual(
    base.levels.map(({ id }) => id),
  );
  expect(promoted.boards![0]).toEqual({
    ...base.boards![0],
    name: "Intentional board edit",
  });
  expect(promoted.levels[0].waves[0].reward).toBe(
    base.levels[0].waves[0].reward + 5,
  );
  const session = new AttemptSession(promoted, {
    id: "pending-map-playtest",
    levelId: draft.levelId,
    waveId: draft.waveId,
    mode: "wave",
    progression: "first-arrival",
    difficulty: "normal",
    seed: 42,
  });
  expect(session.game.level.waves[0].reward).toBe(
    promoted.levels[0].waves[0].reward,
  );
  const rebased = rebaseAfterPromotion(draft, promoted);
  expect(rebased.content.levels.at(-1)).toEqual(pendingMap);
  expect(rebased.content.boards![0].levelIds).toContain("pending-map");
  expect(rebased.content.boards![0].visual.markers!["pending-map"]).toEqual(
    pendingAnchor,
  );
  expect(() => promoteWorkingWave(promoted, rebased)).not.toThrow();
  expect(draft.content.levels.at(-1)).toEqual(pendingMap);
});

it("includes a selected new map while leaving another new map and its anchor pending", () => {
  const base = baseline();
  base.boards![0].visual.markers = Object.fromEntries(
    base.boards![0].levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
  );
  let draft = createMap(
    createWorkingDraft(base),
    "Selected new map",
    base.levels[0].id,
    "selected-new-map",
    "selected-wave",
  );
  draft.content.levels.at(-1)!.waves[0].packets = structuredClone(
    base.levels[0].waves[0].packets,
  );
  draft = createMap(
    draft,
    "Pending new map",
    base.levels[0].id,
    "pending-new-map",
    "pending-wave",
  );
  draft.levelId = "selected-new-map";
  draft.waveId = "selected-wave";
  const promoted = promoteWorkingWave(base, draft);
  expect(promoted.levels.map(({ id }) => id)).toEqual([
    ...base.levels.map(({ id }) => id),
    "selected-new-map",
  ]);
  expect(promoted.boards![0].levelIds).toEqual([
    ...base.boards![0].levelIds,
    "selected-new-map",
  ]);
  expect(promoted.boards![0].visual.markers).toHaveProperty("selected-new-map");
  expect(promoted.boards![0].visual.markers).not.toHaveProperty(
    "pending-new-map",
  );
  const rebased = rebaseAfterPromotion(draft, promoted);
  expect(rebased.content.boards![0].levelIds).toContain("pending-new-map");
  expect(rebased.content.boards![0].visual.markers).toHaveProperty(
    "pending-new-map",
  );
  expect(() => promoteWorkingWave(promoted, rebased)).not.toThrow();
});
