import {
  progressionContext,
  type ProgressionContext,
} from "../content/progression";
import { freshSave, parseSave, type SaveData } from "./save";

// Keep the existing storage key so slot saves migrate in place.
export const PROFILES_KEY = "stormwatch.profiles.v1";
export const AVATARS = [
  "squirrel",
  "rabbit",
  "fox",
  "badger",
  "bear",
  "otter",
  "hedgehog",
  "owl",
] as const;
export type Avatar = (typeof AVATARS)[number];
export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: Avatar;
  progress: SaveData;
}
export interface PlayerProfiles {
  version: 2;
  active: string | null;
  users: PlayerProfile[];
}
export function createProfile(
  id: string,
  nickname: string,
  avatar: Avatar,
  context: ProgressionContext = progressionContext(),
): PlayerProfile {
  const name = nickname.trim();
  if (!name || name.length > 24)
    throw new Error("Choose a nickname of 1–24 characters.");
  if (!AVATARS.includes(avatar)) throw new Error("Choose an animal avatar.");
  return { id, nickname: name, avatar, progress: freshSave(context) };
}
export function loadProfiles(
  rawProfiles: string | null,
  rawLegacySave: string | null,
  context: ProgressionContext = progressionContext(),
): PlayerProfiles {
  const empty = (): PlayerProfiles => ({ version: 2, active: null, users: [] });
  const migrate = (slots: unknown[], active: unknown): PlayerProfiles => {
    const users = slots.flatMap((slot, index) => {
      const progress = parseSave(JSON.stringify(slot), context);
      // Empty automatic slots are not real people. Preserve any played slot.
      if (
        !Object.keys(progress.stars).length &&
        JSON.stringify(progress) === JSON.stringify(freshSave(context))
      )
        return [];
      return [
        {
          id: `legacy-${index}`,
          nickname: `Player ${index + 1}`,
          avatar: AVATARS[index % AVATARS.length],
          progress,
        },
      ];
    });
    return {
      version: 2,
      users,
      active:
        users.find((user) => user.id === `legacy-${active}`)?.id ??
        users[0]?.id ??
        null,
    };
  };
  try {
    if (!rawProfiles)
      return rawLegacySave ? migrate([JSON.parse(rawLegacySave)], 0) : empty();
    const data = JSON.parse(rawProfiles);
    if (
      data?.version === 1 &&
      Array.isArray(data.slots) &&
      data.slots.length === 2
    )
      return migrate(data.slots, data.active);
    if (data?.version !== 2 || !Array.isArray(data.users)) return empty();
    const ids = new Set<string>();
    const users: PlayerProfile[] = [];
    for (const user of data.users) {
      if (
        typeof user?.id !== "string" ||
        !user.id ||
        ids.has(user.id) ||
        typeof user.nickname !== "string"
      )
        continue;
      try {
        const profile = createProfile(
          user.id,
          user.nickname,
          AVATARS.includes(user.avatar) ? user.avatar : "squirrel",
          context,
        );
        profile.progress = parseSave(JSON.stringify(user.progress), context);
        users.push(profile);
        ids.add(profile.id);
      } catch {
        /* Ignore malformed identities without losing other players. */
      }
    }
    return {
      version: 2,
      users,
      active: users.some((user) => user.id === data.active)
        ? data.active
        : (users[0]?.id ?? null),
    };
  } catch {
    return empty();
  }
}
