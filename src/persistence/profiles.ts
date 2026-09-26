import { freshSave, parseSave, type SaveData } from "./save";

export const PROFILES_KEY = "stormwatch.profiles.v1";
export type PlayerSlot = 0 | 1;

export interface PlayerProfiles {
  version: 1;
  active: PlayerSlot;
  slots: [SaveData, SaveData];
}

/** The old single save belongs to player one; it remains in storage as a backup. */
export function loadProfiles(
  rawProfiles: string | null,
  rawLegacySave: string | null,
): PlayerProfiles {
  const fresh = (): PlayerProfiles => ({
    version: 1,
    active: 0,
    slots: [parseSave(rawLegacySave), freshSave()],
  });
  if (!rawProfiles) return fresh();

  try {
    const parsed: unknown = JSON.parse(rawProfiles);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      !Object.hasOwn(parsed, "version") ||
      !Object.hasOwn(parsed, "slots")
    )
      return fresh();
    const data = parsed as Record<string, unknown>;
    if (
      data.version !== 1 ||
      !Array.isArray(data.slots) ||
      data.slots.length !== 2 ||
      data.slots.some((slot) => typeof slot !== "object" || slot === null)
    )
      return fresh();

    return {
      version: 1,
      active: data.active === 1 ? 1 : 0,
      slots: [
        parseSave(JSON.stringify(data.slots[0])),
        parseSave(JSON.stringify(data.slots[1])),
      ],
    };
  } catch {
    return fresh();
  }
}
