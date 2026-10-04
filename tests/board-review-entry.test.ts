import { expect, it } from "vitest";
import candidate from "../review/mosswater-encounters/game-content.json";
import {
  type AuthoringContent,
  validateContent,
  resolveConfiguration,
  CANONICAL_CONTENT,
} from "../src/config/configuration";
import {
  boardNavigation,
  encounterUnlocked,
  progressionContext,
} from "../src/content/progression";
import { createProfile, loadProfiles } from "../src/persistence/profiles";
import { recordViewedBoard } from "../src/persistence/save";
import { expeditionScreen } from "../src/ui/expedition-screen";
import { prepareBoardReviewProfile } from "../review/mosswater-encounters/board-review-profile";
import { createAttempt } from "../review/mosswater-encounters/strategies";

const content: AuthoringContent = JSON.parse(JSON.stringify(candidate));
validateContent(content);
const context = progressionContext(content);

it("earns a navigable first-board entry without overwriting a player and resumes the saved board", () => {
  const existing = createProfile("existing", "Existing player", "fox", context);
  existing.progress.music = 0.15;
  existing.progress.muted = true;
  const profiles = prepareBoardReviewProfile(
    content,
    "first-board",
    JSON.stringify({ version: 2, active: existing.id, users: [existing] }),
    null,
  );
  expect(profiles.users[0]).toEqual(existing);
  const review = profiles.users.find((p) => p.id === profiles.active)!;
  expect(Object.keys(review.progress.stars)).toEqual(
    context.boards[0].levelIds,
  );
  expect(review.progress.music).toBe(0.15);
  expect(review.progress.muted).toBe(true);
  expect(boardNavigation(context, review.progress).next?.id).toBe(
    "mosswater-reach",
  );
  review.progress = recordViewedBoard(
    review.progress,
    "mosswater-reach",
    context,
  );
  expect(encounterUnlocked(context, "mosswater-01", review.progress)).toBe(
    true,
  );
  expect(encounterUnlocked(context, "mosswater-02", review.progress)).toBe(
    false,
  );
  const levels = context.levelIds.map(
    (id) => resolveConfiguration(content, id).level,
  );
  expect(expeditionScreen(levels, review.progress, context)).toContain(
    'data-board="mosswater-reach"',
  );
  expect(boardNavigation(context, review.progress).previous?.id).toBe(
    context.boards[0].id,
  );
  expect(
    createAttempt(content, "mosswater-01", review.progress).state.phase,
  ).toBe("preparation");
  const reloaded = loadProfiles(JSON.stringify(profiles), null, context);
  const resumed = prepareBoardReviewProfile(
    content,
    "first-board",
    JSON.stringify(reloaded),
    null,
  );
  expect(resumed.users).toEqual(reloaded.users);
  expect(
    resumed.users.find((p) => p.id === resumed.active)!.progress.viewedBoard,
  ).toBe("mosswater-reach");
});

it("earns every replay entry for all-map review while retaining ordinary attempt resources and canonical content", () => {
  const before = JSON.stringify(content);
  const profiles = prepareBoardReviewProfile(content, "all-maps", null, null);
  const review = profiles.users[0];
  expect(Object.keys(review.progress.stars)).toEqual(context.levelIds);
  expect(boardNavigation(context, review.progress).next?.id).toBe(
    "mosswater-reach",
  );
  const save = recordViewedBoard(review.progress, "mosswater-reach", context);
  expect(boardNavigation(context, save).next).toBeUndefined();
  for (const id of context.boards[1].levelIds) {
    expect(encounterUnlocked(context, id, save)).toBe(true);
    const game = createAttempt(content, id, save);
    expect(game.state.phase).toBe("preparation");
    expect(game.state.coins).toBe(
      resolveConfiguration(content, id).level.startCoins,
    );
  }
  expect(JSON.stringify(content)).toBe(before);
  expect(CANONICAL_CONTENT).toEqual(content);
});
