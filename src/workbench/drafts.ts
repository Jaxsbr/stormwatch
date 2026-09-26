import {
  validateContent,
  resolveConfiguration,
  configurationIdentity,
  type AuthoringContent,
} from "../config/configuration";

export const WORKBENCH_STORAGE_KEY = "stormwatch.designer-workbench.v1";
export interface DraftRevision {
  id: string;
  name: string;
  baseIdentity: string;
  content: AuthoringContent;
}
export interface ExperimentRecord {
  id: string;
  revisionId: string;
  levelId: string;
  waveId?: string;
  [field: string]: unknown;
}
export interface ExperimentBundle {
  schemaVersion: 1;
  revisions: DraftRevision[];
  scenarios: ExperimentRecord[];
  traces: ExperimentRecord[];
  results: ExperimentRecord[];
}
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const emptyBundle = (): ExperimentBundle => ({
  schemaVersion: 1,
  revisions: [],
  scenarios: [],
  traces: [],
  results: [],
});

/** Stable full authored-content identity, independent of scenario resources or loadout. */
export const contentIdentity = configurationIdentity;
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function identifier(value: unknown): value is string {
  return (
    typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)
  );
}
function unique(records: { id: string }[], scope: string) {
  const seen = new Set<string>();
  for (const record of records) {
    if (!identifier(record.id) || seen.has(record.id))
      throw new Error(`${scope}: invalid or duplicate identity`);
    seen.add(record.id);
  }
}
export function validateBundle(input: unknown): ExperimentBundle {
  if (!object(input) || input.schemaVersion !== 1)
    throw new Error("Unsupported experiment version");
  for (const key of ["revisions", "scenarios", "traces", "results"])
    if (!Array.isArray(input[key])) throw new Error(`Missing ${key}`);
  const bundle = input as unknown as ExperimentBundle;
  for (const revision of bundle.revisions) {
    if (
      !object(revision) ||
      typeof revision.name !== "string" ||
      !revision.name.trim() ||
      typeof revision.baseIdentity !== "string"
    )
      throw new Error("Invalid draft revision");
    validateContent(revision.content);
  }
  unique(bundle.revisions, "revisions");
  for (const key of ["scenarios", "traces", "results"] as const) {
    for (const record of bundle[key]) {
      if (
        !object(record) ||
        !identifier(record.revisionId) ||
        !identifier(record.levelId)
      )
        throw new Error(`Invalid ${key} record`);
      const revision = bundle.revisions.find(
        (entry) => entry.id === record.revisionId,
      );
      if (!revision)
        throw new Error(`${key}: unknown revision ${record.revisionId}`);
      const level = resolveConfiguration(
        revision.content,
        record.levelId,
      ).level;
      if (
        record.waveId !== undefined &&
        !level.waves.some((wave) => wave.id === record.waveId)
      )
        throw new Error(`${key}: unknown wave ${record.waveId}`);
    }
    unique(bundle[key], key);
  }
  return clone(bundle);
}
export function importExperiments(serialized: string): ExperimentBundle {
  return validateBundle(JSON.parse(serialized));
}
export function exportExperiments(bundle: ExperimentBundle): string {
  return JSON.stringify(validateBundle(bundle), null, 2);
}
export function forkDraft(
  content: AuthoringContent,
  id: string,
  name: string,
): DraftRevision {
  const revision = {
    id,
    name,
    baseIdentity: contentIdentity(content),
    content: clone(content),
  };
  validateBundle({ ...emptyBundle(), revisions: [revision] });
  return revision;
}

/** A failed write retains the edit in memory and explicitly reports it as unsaved. */
export class DraftStore {
  private value = emptyBundle();
  status: { durable: boolean; error?: string } = { durable: false };
  constructor(private readonly storage?: StorageAdapter) {
    if (!storage) {
      this.status = {
        durable: false,
        error: "Storage unavailable; export to preserve experiments.",
      };
      return;
    }
    try {
      const saved = storage.getItem(WORKBENCH_STORAGE_KEY);
      if (saved) this.value = importExperiments(saved);
      this.status = { durable: true };
    } catch (error) {
      this.failed(error);
    }
  }
  get bundle(): ExperimentBundle {
    return clone(this.value);
  }
  replace(bundle: ExperimentBundle): void {
    this.value = validateBundle(bundle);
    if (!this.storage) {
      this.status = {
        durable: false,
        error: "Storage unavailable; export to preserve experiments.",
      };
      return;
    }
    try {
      this.storage.setItem(
        WORKBENCH_STORAGE_KEY,
        exportExperiments(this.value),
      );
      this.status = { durable: true };
    } catch (error) {
      this.failed(error);
    }
  }
  private failed(error: unknown): void {
    this.status = {
      durable: false,
      error: `Experiments are only in memory: ${error instanceof Error ? error.message : String(error)}. Export to preserve them.`,
    };
  }
}
