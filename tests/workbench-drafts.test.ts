import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  resolveConfiguration,
} from "../src/config/configuration";
import {
  DraftStore,
  WORKBENCH_STORAGE_KEY,
  forkDraft,
  exportExperiments,
  importExperiments,
  type ExperimentBundle,
} from "../src/workbench/drafts";
import {
  previewPromotion,
  verifyPromotionIdentity,
} from "../src/workbench/promotion";

const bundle = (): ExperimentBundle => ({
  schemaVersion: 1,
  revisions: [forkDraft(CANONICAL_CONTENT, "test-draft", "Timing experiment")],
  scenarios: [],
  traces: [],
  results: [],
});
describe("designer experiment persistence", () => {
  it("round-trips validated revisions without changing accepted content or the profile namespace", () => {
    const values = new Map<string, string>([
      ["stormwatch.save", "family profile"],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const store = new DraftStore(storage);
    const edits = bundle();
    edits.revisions[0].content.levels[0].startCoins += 5;
    store.replace(edits);
    expect(store.status.durable).toBe(true);
    expect(values.get("stormwatch.save")).toBe("family profile");
    expect([...values.keys()]).toEqual([
      "stormwatch.save",
      WORKBENCH_STORAGE_KEY,
    ]);
    expect(new DraftStore(storage).bundle).toEqual(edits);
    expect(importExperiments(exportExperiments(edits))).toEqual(edits);
    expect(CANONICAL_CONTENT.levels[0].startCoins).not.toBe(
      edits.revisions[0].content.levels[0].startCoins,
    );
  });
  it("retains in-memory edits and exposes failed durability while export remains available", () => {
    const store = new DraftStore({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });
    store.replace(bundle());
    expect(store.status).toMatchObject({ durable: false });
    expect(store.status.error).toContain("quota exceeded");
    expect(importExperiments(exportExperiments(store.bundle))).toEqual(
      bundle(),
    );
  });
  it("rejects unsupported versions, incomplete content and detached evidence before replacing saved drafts", () => {
    const store = new DraftStore();
    store.replace(bundle());
    const saved = store.bundle;
    expect(() => importExperiments('{"schemaVersion":2}')).toThrow();
    const bad = bundle();
    bad.revisions[0].content.levels[0].startCoins = -1;
    expect(() => store.replace(bad)).toThrow();
    expect(store.bundle).toEqual(saved);
    const detached = bundle();
    detached.results.push({
      id: "orphan",
      revisionId: "unknown",
      levelId: CANONICAL_CONTENT.levels[0].id,
    });
    expect(() => exportExperiments(detached)).toThrow("unknown revision");
  });
});
describe("scoped authored promotion", () => {
  it("preserves other encounters and reproduces the tested effective content", () => {
    const revision = bundle().revisions[0];
    const id = revision.content.levels[0].id;
    revision.content.levels[0].startCoins += 5;
    revision.content.levels[1].startCoins += 10;
    const preview = previewPromotion(CANONICAL_CONTENT, revision, {
      levels: [id],
    });
    expect(preview.content.levels[1]).toEqual(CANONICAL_CONTENT.levels[1]);
    expect(preview.changes.map((change) => change.scope)).toEqual([
      `levels/${id}`,
    ]);
    expect(verifyPromotionIdentity(preview, revision, id)).toBe(
      resolveConfiguration(revision.content, id).identity,
    );
  });
  it("rejects a stale baseline, invalid scope, incomplete selection and invalid content without mutation", () => {
    const revision = bundle().revisions[0];
    const original = JSON.stringify(CANONICAL_CONTENT);
    const changed = JSON.parse(original);
    changed.levels[0].startCoins += 1;
    expect(() =>
      previewPromotion(changed, revision, { levels: [changed.levels[0].id] }),
    ).toThrow("Stale");
    expect(() =>
      previewPromotion(CANONICAL_CONTENT, revision, { levels: ["unknown"] }),
    ).toThrow("Unknown");
    expect(() => previewPromotion(CANONICAL_CONTENT, revision, {})).toThrow(
      "Select",
    );
    revision.content.levels[0].startCoins = -1;
    expect(() =>
      previewPromotion(CANONICAL_CONTENT, revision, {
        levels: [revision.content.levels[0].id],
      }),
    ).toThrow();
    expect(JSON.stringify(CANONICAL_CONTENT)).toBe(original);
  });
  it("does not implicitly promote synthetic scenario resources or roster", () => {
    const experiments = bundle();
    const revision = experiments.revisions[0];
    const levelId = revision.content.levels[0].id;
    experiments.scenarios.push({
      id: "synthetic",
      revisionId: revision.id,
      levelId,
      synthetic: true,
      wallet: 99999,
      availableTowers: ["turtle"],
    });
    const preview = previewPromotion(CANONICAL_CONTENT, revision, {
      levels: [levelId],
    });
    expect(preview.content).toEqual(CANONICAL_CONTENT);
    expect(preview.changes).toEqual([]);
  });
});

describe("validated evidence envelopes", () => {
  it("rejects malformed scenario payload and mismatched stable encounter/wave references", () => {
    const experiments = bundle();
    const revision = experiments.revisions[0];
    const levelId = revision.content.levels[0].id;
    const valid = {
      id: "setup",
      levelId,
      mode: "encounter" as const,
      progression: "first-arrival" as const,
      difficulty: "normal" as const,
      seed: 7,
    };
    experiments.scenarios.push({
      id: "setup-record",
      revisionId: revision.id,
      levelId,
      scenario: valid,
    });
    expect(importExperiments(exportExperiments(experiments))).toEqual(
      experiments,
    );
    experiments.scenarios[0].scenario = {
      ...valid,
      overrides: { script: "invented" },
    };
    expect(() => exportExperiments(experiments)).toThrow("unsupported");
    experiments.scenarios[0].scenario = {
      ...valid,
      levelId: revision.content.levels[1].id,
    };
    expect(() => exportExperiments(experiments)).toThrow("references");
    experiments.scenarios[0].scenario = {
      ...valid,
      formation: [{ kind: "bolt", point: revision.content.levels[0].path[0] }],
    };
    expect(() => exportExperiments(experiments)).toThrow();
  });
  it("rejects missing setups, invalid command types, and results detached from effective content", async () => {
    const { AttemptSession } = await import("../src/workbench/runs");
    const experiments = bundle();
    const revision = experiments.revisions[0];
    const levelId = revision.content.levels[0].id;
    const scenario = {
      id: "setup",
      levelId,
      mode: "encounter" as const,
      progression: "first-arrival" as const,
      difficulty: "normal" as const,
      seed: 7,
    };
    experiments.traces.push({
      id: "trace",
      revisionId: revision.id,
      levelId,
      commands: [],
    });
    expect(() => exportExperiments(experiments)).toThrow();
    experiments.traces[0].scenario = scenario;
    experiments.traces[0].commands = [
      { tick: 0, accepted: true, command: { type: "award-money" } },
    ];
    expect(() => exportExperiments(experiments)).toThrow("Unknown command");
    experiments.traces = [];
    const attempt = new AttemptSession(revision.content, scenario);
    const report = attempt.report({ type: "encounter-win" });
    experiments.results.push({
      id: "result",
      revisionId: revision.id,
      levelId,
      report,
    });
    expect(importExperiments(exportExperiments(experiments))).toEqual(
      experiments,
    );
    experiments.results[0].report = {
      ...report,
      configurationIdentity: "wrong",
    };
    expect(() => exportExperiments(experiments)).toThrow();
    experiments.results[0].report = {
      ...report,
      trace: [{ tick: 1, command: { type: "start" }, accepted: "yes" }],
    };
    expect(() => exportExperiments(experiments)).toThrow();
  });
});
it("checks catalog-only promotion across affected encounters and preserves declared synthetic setups", async () => {
  const { verifyPromotionScenarios } =
    await import("../src/workbench/promotion");
  const revision = bundle().revisions[0];
  revision.content.towers.bolt.damage += 1;
  revision.content.levels[1].startCoins += 10;
  const catalogOnly = previewPromotion(CANONICAL_CONTENT, revision, {
    towers: ["bolt"],
  });
  expect(() => verifyPromotionScenarios(catalogOnly, revision)).toThrow(
    "tested scenario",
  );
  const complete = previewPromotion(CANONICAL_CONTENT, revision, {
    towers: ["bolt"],
    levels: [revision.content.levels[1].id],
  });
  const scenario = {
    id: "synthetic-check",
    levelId: revision.content.levels[1].id,
    mode: "encounter" as const,
    progression: "replay" as const,
    difficulty: "assist" as const,
    seed: 3,
    overrides: { coins: 5000, lives: 30 },
  };
  expect(verifyPromotionScenarios(complete, revision, [scenario])).toHaveLength(
    CANONICAL_CONTENT.levels.length,
  );
  expect(complete.content.levels[1].startCoins).toBe(
    revision.content.levels[1].startCoins,
  );
  expect(complete.content.levels[1].startCoins).not.toBe(5000);
});
