import { CANONICAL_CONTENT } from "../../src/config/configuration";

/** Historical path-only campaign, before authored boards or expansion recipes. */
export function legacyFirstBoard() {
  const content = structuredClone(CANONICAL_CONTENT);
  content.levels = content.levels.slice(0, 3);
  delete content.boards;
  return content;
}
