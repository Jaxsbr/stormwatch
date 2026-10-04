import { legacyFirstBoard } from "./fixtures/first-board-content";
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
  const content = legacyFirstBoard();
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
  const draft = createWorkingDraft(legacyFirstBoard());
  draft.content.levels[0].name = "Pending map";
  const restored = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  expect(restored.content.boards).toBeUndefined();
  expect(restored.content.levels[0].name).toBe("Pending map");
  expect(resolveBoards(restored.content)[0].levelIds).toEqual(
    CANONICAL_CONTENT.levels.slice(0, 3).map(({ id }) => id),
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

it.each(["addition", "removal"] as const)(
  "rebases pending map membership after a concurrent live recipe %s",
  (change) => {
    const base = baseline();
    base.boards![0].visual.markers = Object.fromEntries(
      base.boards![0].levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
    );
    let draft = createMap(
      createWorkingDraft(base),
      "Pending draft map",
      base.levels[0].id,
      "pending-draft-map",
      "pending-draft-wave",
    );
    draft.levelId = base.levels[0].id;
    draft.waveId = base.levels[0].waves[0].id;
    draft.content.levels[0].waves[0].reward += 1;
    const pendingAnchor = structuredClone(
      draft.content.boards![0].visual.markers!["pending-draft-map"],
    );
    const live = structuredClone(base);
    const removedId = base.levels[1].id;
    if (change === "addition") {
      live.levels.push({
        ...structuredClone(base.levels[0]),
        id: "added-live-map",
        name: "Added live map",
      });
      live.boards![0].levelIds.push("added-live-map");
      live.boards![0].visual.markers!["added-live-map"] = { x: 80, y: 50 };
    } else {
      live.levels = live.levels.filter(({ id }) => id !== removedId);
      live.boards![0].levelIds = live.boards![0].levelIds.filter(
        (id) => id !== removedId,
      );
      delete live.boards![0].visual.markers![removedId];
    }
    const promoted = promoteWorkingWave(live, draft);
    expect(promoted.boards).toEqual(live.boards);
    expect(promoted.levels.map(({ id }) => id)).toEqual(
      live.levels.map(({ id }) => id),
    );
    const rebased = validateWorkingDraft(
      JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, promoted))),
    );
    expect(rebased.base.boards).toEqual(promoted.boards);
    expect(rebased.content.boards![0].levelIds).toEqual([
      ...live.boards![0].levelIds,
      "pending-draft-map",
    ]);
    expect(
      rebased.content.boards![0].visual.markers!["pending-draft-map"],
    ).toEqual(pendingAnchor);
    if (change === "addition")
      expect(
        rebased.content.boards![0].visual.markers!["added-live-map"],
      ).toEqual({ x: 80, y: 50 });
    else
      expect(rebased.content.boards![0].visual.markers).not.toHaveProperty(
        removedId,
      );
    expect(() => promoteWorkingWave(promoted, rebased)).not.toThrow();
    rebased.content.levels.find(
      ({ id }) => id === "pending-draft-map",
    )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
    const all = promoteAllWorkingChanges(promoted, rebased);
    expect(all.boards).toEqual(rebased.content.boards);
    expect(all.levels.map(({ id }) => id)).toEqual([
      ...live.levels.map(({ id }) => id),
      "pending-draft-map",
    ]);
  },
);

it("preserves a stale board comparison alongside concurrent recipe additions", () => {
  const base = baseline();
  const draft = createMap(
    createWorkingDraft(base),
    "Pending map",
    base.levels[0].id,
    "pending-map",
    "pending-wave",
  );
  draft.levelId = base.levels[0].id;
  draft.waveId = base.levels[0].waves[0].id;
  draft.content.boards![0].name = "Pending board name";
  const live = structuredClone(base);
  live.levels.push({ ...structuredClone(base.levels[0]), id: "live-map" });
  live.boards![0].levelIds.push("live-map");
  live.boards![0].name = "Live board name";
  const rebased = rebaseAfterPromotion(draft, live);
  expect(rebased.base.boards![0].name).toBe(base.boards![0].name);
  expect(rebased.base.boards![0].levelIds).toContain("live-map");
  expect(rebased.content.boards![0].levelIds).toEqual([
    ...live.boards![0].levelIds,
    "pending-map",
  ]);
  expect(() => promoteWorkingWave(live, rebased)).toThrow(
    "Board first-board changed",
  );
});

it.each(["pending only", "metadata conflict", "membership conflict"] as const)(
  "rebases a live cross-board move with %s and pending map anchors",
  (change) => {
    const base = baseline();
    for (const board of base.boards!)
      board.visual.markers = Object.fromEntries(
        board.levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
      );
    const draft = createMap(
      createWorkingDraft(base),
      "Pending D",
      base.levels[0].id,
      "pending-d",
      "wave-d",
    );
    draft.levelId = base.levels[0].id;
    draft.waveId = base.levels[0].waves[0].id;
    const anchor = structuredClone(
      draft.content.boards![0].visual.markers!["pending-d"],
    );
    const live = structuredClone(base);
    const moved = live.boards![0].levelIds.pop()!;
    live.boards![1].levelIds.unshift(moved);
    live.boards![1].visual.markers![moved] = { x: 75, y: 60 };
    delete live.boards![0].visual.markers![moved];
    if (change === "metadata conflict")
      draft.content.boards![0].name = "Pending board name";
    if (change === "membership conflict") {
      const other = draft.content.boards![0].levelIds.shift()!;
      draft.content.boards![1].levelIds.push(other);
      draft.content.boards![1].visual.markers![other] = { x: 60, y: 60 };
      delete draft.content.boards![0].visual.markers![other];
    }
    const promoted =
      change === "pending only" ? promoteWorkingWave(live, draft) : live;
    expect(promoted.boards).toEqual(live.boards);
    const rebased = validateWorkingDraft(
      JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, promoted))),
    );
    expect(rebased.content.boards![0].visual.markers!["pending-d"]).toEqual(
      anchor,
    );
    if (change === "pending only") {
      expect(rebased.base.boards).toEqual(live.boards);
      expect(rebased.content.boards![0].levelIds).toEqual([
        ...live.boards![0].levelIds,
        "pending-d",
      ]);
      expect(rebased.content.boards![1]).toEqual(live.boards![1]);
      expect(() => promoteWorkingWave(promoted, rebased)).not.toThrow();
      rebased.content.levels.find(
        ({ id }) => id === "pending-d",
      )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
      expect(promoteAllWorkingChanges(promoted, rebased).boards).toEqual(
        rebased.content.boards,
      );
    } else {
      expect(() => promoteWorkingWave(promoted, rebased)).toThrow(
        /Board .* changed/,
      );
      expect(() => promoteAllWorkingChanges(promoted, rebased)).toThrow(
        /Board .* changed/,
      );
    }
  },
);

it("preserves independent live moves while retaining a conflicting board scope", () => {
  const base = baseline();
  base.levels.push(
    { ...structuredClone(base.levels[0]), id: "independent-map" },
    { ...structuredClone(base.levels[0]), id: "third-map" },
  );
  base.boards![1].levelIds.push("independent-map");
  base.boards!.push({
    ...structuredClone(base.boards![1]),
    id: "third-board",
    levelIds: ["third-map"],
  });
  const draft = createMap(
    createWorkingDraft(base),
    "Pending map",
    base.levels[0].id,
    "pending-map",
    "pending-wave",
  );
  draft.content.boards![0].name = "Pending name";
  const live = structuredClone(base);
  const moved = live.boards![0].levelIds.pop()!;
  live.boards![1].levelIds.unshift(moved);
  live.boards![1].levelIds = live.boards![1].levelIds.filter(
    (id) => id !== "independent-map",
  );
  live.boards![2].levelIds.push("independent-map");
  const rebased = rebaseAfterPromotion(draft, live);
  for (const snapshot of [rebased.content, rebased.base]) {
    expect(snapshot.boards![2]).toEqual(live.boards![2]);
    expect(snapshot.boards![1].levelIds).not.toContain("independent-map");
  }
  expect(rebased.base.boards![0]).toEqual(base.boards![0]);
  rebased.content.levels.find(
    ({ id }) => id === "pending-map",
  )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
  expect(() => promoteAllWorkingChanges(live, rebased)).toThrow(
    "Board first-board changed",
  );
});

it("preserves a new live board's sole member while retaining historical conflict topology", () => {
  const base = baseline();
  for (const board of base.boards!)
    board.visual.markers = Object.fromEntries(
      board.levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
    );
  const draft = createMap(
    createWorkingDraft(base),
    "Pending D",
    base.levels[0].id,
    "pending-d",
    "wave-d",
  );
  draft.content.boards![0].name = "Pending name";
  draft.content.boards![0].visual.markers![base.levels[0].id] = {
    x: 30,
    y: 40,
  };
  const pendingAnchor = structuredClone(
    draft.content.boards![0].visual.markers!["pending-d"],
  );
  draft.levelId = base.levels[2].id;
  draft.waveId = base.levels[2].waves[0].id;
  draft.content.levels[2].waves[0].reward += 1;
  const live = structuredClone(base);
  const moved = live.boards![0].levelIds.pop()!;
  delete live.boards![0].visual.markers![moved];
  live.boards!.push({
    ...structuredClone(base.boards![0]),
    id: "new-third",
    name: "New live board",
    levelIds: [moved],
    visual: {
      illustration: "expedition-map-v1",
      markers: { [moved]: { x: 80, y: 60 } },
    },
  });
  const promoted = promoteWorkingWave(live, draft);
  expect(promoted.boards).toEqual(live.boards);
  const rebased = validateWorkingDraft(
    JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, promoted))),
  );
  expect(rebased.content.boards!.find(({ id }) => id === "new-third")).toEqual(
    live.boards![2],
  );
  expect(rebased.content.boards![0].name).toBe("Pending name");
  expect(rebased.content.boards![0].levelIds).toEqual([
    base.levels[0].id,
    "pending-d",
  ]);
  expect(rebased.content.boards![0].visual.markers![base.levels[0].id]).toEqual(
    { x: 30, y: 40 },
  );
  expect(rebased.content.boards![0].visual.markers!["pending-d"]).toEqual(
    pendingAnchor,
  );
  expect(rebased.base.boards).toEqual(base.boards);
  expect(() => promoteWorkingWave(promoted, rebased)).not.toThrow();
  const repeated = rebaseAfterPromotion(
    rebased,
    promoteWorkingWave(promoted, rebased),
  );
  expect(repeated.content.boards).toEqual(rebased.content.boards);
  expect(repeated.base.boards).toEqual(base.boards);
  repeated.levelId = base.levels[0].id;
  repeated.waveId = base.levels[0].waves[0].id;
  expect(() => promoteWorkingWave(promoted, repeated)).toThrow(
    "Board first-board changed",
  );
  rebased.levelId = base.levels[0].id;
  rebased.waveId = base.levels[0].waves[0].id;
  expect(() => promoteWorkingWave(promoted, rebased)).toThrow(
    "Board first-board changed",
  );
  rebased.content.levels.find(
    ({ id }) => id === "pending-d",
  )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
  expect(() => promoteAllWorkingChanges(promoted, rebased)).toThrow(
    "Board first-board changed",
  );
});

it("keeps historical comparison topology valid across chained live ownership moves", () => {
  const base = baseline();
  base.levels.push({ ...structuredClone(base.levels[0]), id: "third-map" });
  base.boards!.push({
    ...structuredClone(base.boards![1]),
    id: "third-board",
    levelIds: ["third-map"],
  });
  const draft = createMap(
    createWorkingDraft(base),
    "Pending map",
    base.levels[0].id,
    "pending-map",
    "pending-wave",
  );
  draft.content.boards![0].name = "Pending name";
  const live = structuredClone(base);
  const moved = live.boards![0].levelIds.pop()!;
  const second = live.boards![1].levelIds[0];
  live.boards![0].levelIds.push("third-map");
  live.boards![1].levelIds = [moved];
  live.boards![2].levelIds = [second];
  const rebased = validateWorkingDraft(
    JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, live))),
  );
  expect(rebased.content.boards!.map(({ levelIds }) => levelIds)).toEqual([
    [...live.boards![0].levelIds, "pending-map"],
    live.boards![1].levelIds,
    live.boards![2].levelIds,
  ]);
  expect(rebased.base.boards).toEqual(base.boards);
  rebased.levelId = base.levels[0].id;
  rebased.waveId = base.levels[0].waves[0].id;
  expect(() => promoteWorkingWave(live, rebased)).toThrow(
    "Board first-board changed",
  );
});

it("rebases metadata conflicts over every three-recipe ownership assignment to existing and new boards", () => {
  const base = baseline();
  for (const board of base.boards!)
    board.visual.markers = Object.fromEntries(
      board.levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
    );
  const draft = createMap(
    createWorkingDraft(base),
    "Pending map",
    base.levels[0].id,
    "pending-map",
    "pending-wave",
  );
  draft.content.boards![0].name = "Pending name";
  const candidates = [
    ...base.boards!,
    ...["new-third", "new-fourth"].map((id) => ({
      ...structuredClone(base.boards![0]),
      id,
      name: id,
    })),
  ];
  for (let assignment = 0; assignment < 64; assignment++) {
    const live = structuredClone(base);
    live.boards = candidates
      .map((board, index) => {
        const ids = base.levels
          .filter((_, i) => Math.floor(assignment / 4 ** i) % 4 === index)
          .map(({ id }) => id);
        return {
          ...structuredClone(board),
          levelIds: ids,
          visual: {
            ...board.visual,
            markers: Object.fromEntries(
              ids.map((id, i) => [id, { x: 20 + i * 20, y: 50 }]),
            ),
          },
        };
      })
      .filter((board) => board.levelIds.length);
    const rebased = validateWorkingDraft(
      JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, live))),
    );
    for (const level of base.levels)
      expect(
        rebased.content.boards!.find((board) =>
          board.levelIds.includes(level.id),
        )!.id,
      ).toBe(
        live.boards.find((board) => board.levelIds.includes(level.id))!.id,
      );
    const pending = rebased.content.boards!.find(
      ({ id }) => id === base.boards![0].id,
    )!;
    expect(pending.name).toBe("Pending name");
    expect(pending.visual.markers!["pending-map"]).toEqual(
      draft.content.boards![0].visual.markers!["pending-map"],
    );
  }
});

it("retains a moved encounter's authored marker in its original board dependency snapshot", () => {
  const base = baseline();
  for (const board of base.boards!)
    board.visual.markers = Object.fromEntries(
      board.levelIds.map((id, i) => [id, { x: 20 + i * 30, y: 50 }]),
    );
  const draft = createMap(
    createWorkingDraft(base),
    "Pending D",
    base.levels[0].id,
    "pending-d",
    "wave-d",
  );
  const moved = base.boards![0].levelIds[1];
  draft.content.boards![0].visual.markers![moved] = { x: 31, y: 41 };
  draft.levelId = base.levels[2].id;
  draft.waveId = base.levels[2].waves[0].id;
  const live = structuredClone(base);
  live.boards![0].levelIds.pop();
  delete live.boards![0].visual.markers![moved];
  live.boards!.push({
    ...structuredClone(base.boards![0]),
    id: "new-third",
    levelIds: [moved],
    visual: {
      illustration: "expedition-map-v1",
      markers: { [moved]: { x: 80, y: 60 } },
    },
  });
  const promoted = promoteWorkingWave(live, draft);
  const rebased = validateWorkingDraft(
    JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, promoted))),
  );
  const owner = rebased.content.boards!.find((board) =>
    board.levelIds.includes(moved),
  )!;
  expect(owner.id).toBe(base.boards![0].id);
  expect(owner.visual.markers![moved]).toEqual({ x: 31, y: 41 });
  expect(promoted.boards!.at(-1)!.visual.markers![moved]).toEqual({
    x: 80,
    y: 60,
  });
  const repeated = validateWorkingDraft(
    JSON.parse(
      JSON.stringify(
        rebaseAfterPromotion(rebased, promoteWorkingWave(promoted, rebased)),
      ),
    ),
  );
  expect(repeated.content.boards).toEqual(rebased.content.boards);
  repeated.content.levels.find(
    ({ id }) => id === "pending-d",
  )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
  expect(() => promoteAllWorkingChanges(promoted, repeated)).toThrow(
    /Board .* changed/,
  );
});

it("retains a removed board's recipe dependency for a pending travel-order edit", () => {
  const base = baseline();
  const draft = createMap(
    createWorkingDraft(base),
    "Pending D",
    base.levels[0].id,
    "pending-d",
    "wave-d",
  );
  draft.levelId = base.levels[0].id;
  draft.waveId = base.levels[0].waves[0].id;
  draft.content.boards!.reverse();
  const live = structuredClone(base);
  const removed = live.boards!.pop()!.levelIds[0];
  live.levels = live.levels.filter(({ id }) => id !== removed);
  const rebased = validateWorkingDraft(
    JSON.parse(JSON.stringify(rebaseAfterPromotion(draft, live))),
  );
  expect(rebased.content.boards!.map(({ id }) => id)).toEqual(
    draft.content.boards!.map(({ id }) => id),
  );
  expect(rebased.content.levels.find(({ id }) => id === removed)).toEqual(
    base.levels.find(({ id }) => id === removed),
  );
  const repeated = rebaseAfterPromotion(
    rebased,
    promoteWorkingWave(live, rebased),
  );
  repeated.content.levels.find(
    ({ id }) => id === "pending-d",
  )!.waves[0].packets = structuredClone(base.levels[0].waves[0].packets);
  expect(() => promoteAllWorkingChanges(live, repeated)).toThrow(
    "Board order changed",
  );
  expect(live.levels.some(({ id }) => id === removed)).toBe(false);
});
