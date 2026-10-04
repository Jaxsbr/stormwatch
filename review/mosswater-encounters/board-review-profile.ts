import { type AuthoringContent } from "../../src/config/configuration";
import { progressionContext } from "../../src/content/progression";
import {
  createProfile,
  loadProfiles,
  type PlayerProfiles,
} from "../../src/persistence/profiles";
import { freshSave, recordVictoryOutcome } from "../../src/persistence/save";
import { play } from "./strategies";

export type BoardReviewPreset = "first-board" | "all-maps";

/** Local feedback entry: earn progress through normal won attempts, then use real profile persistence. */
export function prepareBoardReviewProfile(
  content: AuthoringContent,
  preset: BoardReviewPreset,
  rawProfiles: string | null,
  rawLegacySave: string | null,
): PlayerProfiles {
  const context = progressionContext(content);
  if (context.boards.length < 2)
    throw new Error("Board review requires the Mosswater candidate.");
  const profiles = loadProfiles(rawProfiles, rawLegacySave, context);
  const id = `mosswater-board-review-${preset}`;
  if (profiles.users.some((profile) => profile.id === id)) {
    profiles.active = id;
    return profiles;
  }
  const previous = profiles.users.find(
    (profile) => profile.id === profiles.active,
  );
  let progress = freshSave(context);
  const required =
    preset === "first-board" ? context.boards[0].levelIds : context.levelIds;
  for (const levelId of required) {
    const outcome = play(content, levelId, progress);
    if (outcome.phase !== "won")
      throw new Error(
        `Board review could not earn ${levelId}: ${outcome.phase}`,
      );
    progress = recordVictoryOutcome(progress, levelId, 1, context).save;
  }
  progress.viewedBoard = context.boards[0].id;
  progress.tutorialSeen = true;
  if (previous) {
    progress.music = previous.progress.music;
    progress.effects = previous.progress.effects;
    progress.muted = previous.progress.muted;
    progress.showGrid = previous.progress.showGrid;
  }
  const profile = createProfile(
    id,
    preset === "first-board" ? "Board navigation review" : "All maps review",
    "otter",
    context,
  );
  profile.progress = progress;
  profiles.users.push(profile);
  profiles.active = id;
  return profiles;
}
