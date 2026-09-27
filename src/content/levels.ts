import { CANONICAL_CONTENT, compileLevel } from "../config/configuration";

// Recipe order is campaign order, including encounters promoted by the workbench.
export const LEVELS = CANONICAL_CONTENT.levels.map((level) =>
  compileLevel(level),
);
