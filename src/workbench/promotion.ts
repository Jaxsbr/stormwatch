import {
  resolveConfiguration,
  validateContent,
  type AuthoringContent,
} from "../config/configuration";
import { contentIdentity, type DraftRevision } from "./drafts";

export interface PromotionSelection {
  levels?: string[];
  towers?: string[];
  enemies?: string[];
  rules?: string[];
}
export interface PromotionPreview {
  baseIdentity: string;
  candidateIdentity: string;
  selected: PromotionSelection;
  changes: { scope: string; before: unknown; after: unknown }[];
  content: AuthoringContent;
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
/** Preview and apply use this same complete validator; scenario-only setup is never input. */
export function previewPromotion(
  baseline: AuthoringContent,
  revision: DraftRevision,
  selection: PromotionSelection,
): PromotionPreview {
  validateContent(baseline);
  validateContent(revision.content);
  const baseIdentity = contentIdentity(baseline);
  if (revision.baseIdentity !== baseIdentity)
    throw new Error(
      "Stale draft baseline; fork or reconcile against the accepted recipe before promotion.",
    );
  if (
    !selection ||
    Object.keys(selection).some(
      (key) => !["levels", "towers", "enemies", "rules"].includes(key),
    )
  )
    throw new Error("Unsupported promotion scope");
  if (
    !Object.values(selection).some(
      (ids) => Array.isArray(ids) && ids.length > 0,
    )
  )
    throw new Error("Select authored content explicitly before promotion");
  const content = clone(baseline);
  const changes: PromotionPreview["changes"] = [];
  for (const scope of ["levels", "towers", "enemies", "rules"] as const) {
    const ids = selection[scope] ?? [];
    if (
      !Array.isArray(ids) ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => typeof id !== "string")
    )
      throw new Error(`Invalid ${scope} selection`);
    for (const id of ids) {
      if (scope === "levels") {
        const index = content.levels.findIndex((level) => level.id === id);
        const after = revision.content.levels.find((level) => level.id === id);
        if (index < 0 || !after) throw new Error(`Unknown level ${id}`);
        changes.push({
          scope: `levels/${id}`,
          before: clone(content.levels[index]),
          after: clone(after),
        });
        content.levels[index] = clone(after);
      } else {
        const target = content[scope] as unknown as Record<string, unknown>;
        const source = revision.content[scope] as unknown as Record<
          string,
          unknown
        >;
        if (!Object.hasOwn(target, id) || !Object.hasOwn(source, id))
          throw new Error(`Unknown ${scope} field ${id}`);
        changes.push({
          scope: `${scope}/${id}`,
          before: clone(target[id]),
          after: clone(source[id]),
        });
        target[id] = clone(source[id]);
      }
    }
  }
  validateContent(content);
  return {
    baseIdentity,
    candidateIdentity: contentIdentity(content),
    selected: clone(selection),
    changes: changes.filter(
      (change) =>
        contentIdentity(change.before) !== contentIdentity(change.after),
    ),
    content,
  };
}
/** Effective identity includes options; recipe equivalence alone makes no reachability claim. */
export function verifyPromotionIdentity(
  preview: PromotionPreview,
  revision: DraftRevision,
  levelId: string,
  options: Parameters<typeof resolveConfiguration>[2] = {},
): string {
  const tested = resolveConfiguration(
    revision.content,
    levelId,
    options,
  ).identity;
  const promoted = resolveConfiguration(
    preview.content,
    levelId,
    options,
  ).identity;
  if (tested !== promoted)
    throw new Error(
      "Selected authored scopes do not reproduce the tested configuration; include the remaining authored changes.",
    );
  return promoted;
}
