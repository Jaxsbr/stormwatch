import { expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  compileLevel,
  resolveConfiguration,
  validateContent,
} from "../src/config/configuration";
import {
  createWorkingDraft,
  promoteWorkingWave,
  promoteAllWorkingChanges,
  rebaseAfterPromotion,
  validateWorkingDraft,
  setMapLayout,
} from "../src/workbench/working-draft";
import {
  useRouteLayout,
  authoredGeometry,
} from "../src/workbench/route-authoring";
import { Game } from "../src/sim/game";
import {
  previewPromotion,
  verifyPromotionIdentity,
} from "../src/workbench/promotion";
import { configurationIdentity } from "../src/config/configuration";

function shared() {
  const c = structuredClone(CANONICAL_CONTENT);
  for (const map of c.levels) useRouteLayout(c, map, "twin-switchbacks");
  return c;
}
it("normalizes old version-one drafts without rewriting legacy routes, groups or timings", () => {
  const old = structuredClone(CANONICAL_CONTENT);
  delete old.routeLayouts;
  const wave = structuredClone(old.levels[0].waves[0]);
  const path = structuredClone(old.levels[0].path);
  const draft = validateWorkingDraft({
    schemaVersion: 1,
    base: old,
    content: old,
    levelId: old.levels[0].id,
    waveId: wave.id,
  });
  expect(draft.content.levels[0].path).toEqual(path);
  expect(draft.content.levels[0].waves[0]).toEqual(wave);
  expect(draft.content.routeLayouts).toEqual(CANONICAL_CONTENT.routeLayouts);
  const g = new Game(resolveConfiguration(draft.content).level);
  expect(g.level.routes).toBeUndefined();
});
it("promotes a newly chosen shared layout when disk content predates the layout library", () => {
  const old = structuredClone(CANONICAL_CONTENT);
  delete old.routeLayouts;
  const draft = createWorkingDraft(old);
  useRouteLayout(draft.content, draft.content.levels[0], "twin-switchbacks");
  const promoted = promoteWorkingWave(old, draft);
  expect(promoted.routeLayouts).toEqual(CANONICAL_CONTENT.routeLayouts);
  expect(resolveConfiguration(promoted).level.routes).toEqual(
    CANONICAL_CONTENT.routeLayouts![0].routes,
  );
  expect(promoted.levels.slice(1)).toEqual(old.levels.slice(1));
});
it("allows unfinished required-boss drafts but rejects Playtest and promotion until the finale has bosses", () => {
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  draft.content.levels[0].requiresBossDefeat = true;
  const saved = validateWorkingDraft(JSON.parse(JSON.stringify(draft)));
  expect(saved.content.levels[0].requiresBossDefeat).toBe(true);
  expect(() => resolveConfiguration(saved.content)).toThrow(
    "requires a boss wave in its finale",
  );
  expect(() => promoteWorkingWave(CANONICAL_CONTENT, saved)).toThrow(
    "requires a boss wave in its finale",
  );
  expect(() => promoteAllWorkingChanges(CANONICAL_CONTENT, saved)).toThrow(
    "requires a boss wave in its finale",
  );
});
it("resolves three referenced encounters from exactly one edited geometry, preserving immutable attempts", () => {
  const c = shared();
  const configs = c.levels.map((m) => resolveConfiguration(c, m.id));
  const old = new Game(configs[0].level, "none", false, 42, {
    configuration: configs[0],
  });
  c.routeLayouts![0].routes[0].path[2].z = 6;
  c.routeLayouts![0].routes[0].path[3].z = 6;
  const after = c.levels.map((m) => resolveConfiguration(c, m.id).level.routes);
  expect(after[0]).toEqual(after[1]);
  expect(after[1]).toEqual(after[2]);
  expect(old.level.routes).toEqual(configs[0].level.routes);
  expect(after[0]).not.toEqual(old.level.routes);
  expect(Object.isFrozen(old.level.routes)).toBe(true);
});
it("promotes changed shared layout by identity alongside a selected wave, preserving unrelated changes", () => {
  const c = shared();
  const draft = createWorkingDraft(c);
  draft.content.routeLayouts![0].routes[0].path[2].z = 6;
  draft.content.routeLayouts![0].routes[0].path[3].z = 6;
  draft.content.levels[0].waves[0].packets[0].groups[0].routeId = "route-b";
  draft.content.levels[1].waves[0].reward += 11;
  const live = structuredClone(c);
  live.levels[2].startCoins += 17;
  live.routeLayouts!.push({
    ...structuredClone(live.routeLayouts![0]),
    id: "unrelated",
  });
  const promoted = promoteWorkingWave(live, JSON.parse(JSON.stringify(draft)));
  expect(promoted.levels[2].startCoins).toBe(live.levels[2].startCoins);
  expect(promoted.levels[1].waves[0].reward).toBe(c.levels[1].waves[0].reward);
  expect(promoted.routeLayouts!.find((l) => l.id === "unrelated")).toEqual(
    live.routeLayouts![1],
  );
  expect(resolveConfiguration(promoted).level.routes).toEqual(
    resolveConfiguration(draft.content).level.routes,
  );
  expect(
    compileLevel(
      promoted.levels[0],
      promoted.abilityDefaults,
      promoted.routeLayouts,
    ).waves[0].groups[0].routeId,
  ).toBe("route-b");
  const rebased = rebaseAfterPromotion(draft, promoted);
  expect(rebased.content.levels[1].waves[0].reward).toBe(
    draft.content.levels[1].waves[0].reward,
  );
  expect(
    promoteAllWorkingChanges(promoted, rebased).levels[1].waves[0].reward,
  ).toBe(draft.content.levels[1].waves[0].reward);
});
it("rejects stale shared geometry atomically and retains conflict on draft rebase", () => {
  const c = shared();
  const draft = createWorkingDraft(c);
  draft.content.routeLayouts![0].routes[0].path[2].z = 6;
  draft.content.routeLayouts![0].routes[0].path[3].z = 6;
  const live = structuredClone(c);
  live.routeLayouts![0].routes[1].path[1].x = 1;
  live.routeLayouts![0].routes[1].path[2].x = 1;
  const snapshot = structuredClone(live);
  expect(() => promoteWorkingWave(live, draft)).toThrow("Shared route layout");
  expect(live).toEqual(snapshot);
  const rebased = rebaseAfterPromotion(draft, live);
  expect(rebased.content.routeLayouts![0]).toEqual(
    draft.content.routeLayouts![0],
  );
  expect(() => promoteAllWorkingChanges(live, rebased)).toThrow(
    "Shared route layout",
  );
});
it("switches back to legacy layouts without leaving route IDs or shared references invalid", () => {
  const draft = createWorkingDraft(CANONICAL_CONTENT);
  useRouteLayout(draft.content, draft.content.levels[0], "twin-switchbacks");
  expect(validateWorkingDraft(draft).content.levels[0].routeLayoutId).toBe(
    "twin-switchbacks",
  );
  const restored = setMapLayout(draft, CANONICAL_CONTENT.levels[1].id);
  expect(restored.content.levels[0].routeLayoutId).toBeUndefined();
  expect(restored.content.levels[0].routes).toBeUndefined();
  expect(restored.content.levels[0].path).toEqual(
    CANONICAL_CONTENT.levels[1].path,
  );
  validateContent(restored.content);
});
it("requires shared geometry selection for CLI promotion to reproduce the tested attempt", () => {
  const c = shared();
  const candidate = structuredClone(c);
  candidate.routeLayouts![0].routes[0].path[2].z = 6;
  candidate.routeLayouts![0].routes[0].path[3].z = 6;
  const revision = {
    id: "route-edit",
    name: "Route edit",
    baseIdentity: configurationIdentity(c),
    content: candidate,
  };
  const missing = previewPromotion(c, revision, { levels: [c.levels[0].id] });
  expect(() =>
    verifyPromotionIdentity(missing, revision, c.levels[0].id),
  ).toThrow("Selected authored scopes");
  const complete = previewPromotion(c, revision, {
    levels: [c.levels[0].id],
    routeLayouts: ["twin-switchbacks"],
  });
  expect(verifyPromotionIdentity(complete, revision, c.levels[0].id)).toBe(
    resolveConfiguration(candidate).identity,
  );
  expect(
    authoredGeometry(complete.content, complete.content.levels[0]).routes,
  ).toEqual(candidate.routeLayouts![0].routes);
});
