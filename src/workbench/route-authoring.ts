import {
  configurationIdentity,
  type AuthoringContent,
  type LevelRecipe,
} from "../config/configuration";
import {
  DEFAULT_ROUTE_ID,
  resolveRouteLayout,
  levelRoutes,
} from "../sim/routes";
import type { RouteLayout } from "../sim/types";

export function authoredGeometry(
  content: AuthoringContent,
  level: LevelRecipe,
) {
  return resolveRouteLayout(level, content.routeLayouts);
}
export function useRouteLayout(
  content: AuthoringContent,
  level: LevelRecipe,
  id: string,
) {
  const layout = content.routeLayouts?.find((l) => l.id === id);
  if (!layout) throw new Error("Choose an existing shared route layout");
  level.routeLayoutId = id;
  delete level.routes;
  level.path = [];
  level.blocked = [];
  level.width = layout.width;
  level.depth = layout.depth;
  assignMissingRoutes(
    level,
    layout.routes.map((r) => r.id),
  );
}
/** Layout changes preserve assignments where possible; removed routes use the first route. */
export function assignMissingRoutes(level: LevelRecipe, ids: string[]) {
  for (const wave of level.waves)
    for (const packet of wave.packets)
      for (const group of packet.groups) {
        if (!ids.includes(group.routeId ?? DEFAULT_ROUTE_ID))
          group.routeId = ids[0];
      }
}
const equal = (a: unknown, b: unknown) =>
  a === undefined || b === undefined
    ? a === b
    : configurationIdentity(a) === configurationIdentity(b);
/** Shared layout edits are atomic per identity, including every referencing encounter. */
export function mergeRouteLayouts(
  current: AuthoringContent,
  base: AuthoringContent,
  authored: AuthoringContent,
  selectedIds?: string[],
): RouteLayout[] | undefined {
  const result = structuredClone(current.routeLayouts ?? []);
  for (const layout of authored.routeLayouts ?? []) {
    if (selectedIds && !selectedIds.includes(layout.id)) continue;
    const old = base.routeLayouts?.find((l) => l.id === layout.id);
    if (equal(layout, old)) continue;
    const index = result.findIndex((l) => l.id === layout.id);
    if (!equal(result[index], old))
      throw new Error(
        `Shared route layout ${layout.id} changed in game config. Reload its latest settings before promoting.`,
      );
    if (index < 0) result.push(structuredClone(layout));
    else result[index] = structuredClone(layout);
  }
  return current.routeLayouts === undefined && !result.length
    ? undefined
    : result;
}
export function routesForEditor(content: AuthoringContent, level: LevelRecipe) {
  return levelRoutes(authoredGeometry(content, level));
}
