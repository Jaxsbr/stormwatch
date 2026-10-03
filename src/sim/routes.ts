import type { LevelDef, RouteDef, RouteLayout } from "./types";
import { pathLength } from "./path";

export const DEFAULT_ROUTE_ID = "default-route";
/** Legacy normalization is interpretation only: old saved content remains valid. */
export function levelRoutes(
  level: Pick<LevelDef, "path" | "routes">,
): RouteDef[] {
  return level.routes ?? [{ id: DEFAULT_ROUTE_ID, path: level.path }];
}
export function routeFor(
  level: Pick<LevelDef, "path" | "routes">,
  id?: string,
): RouteDef {
  const routes = levelRoutes(level);
  if (id === undefined) return routes[0];
  const route = routes.find((route) => route.id === id);
  if (!route) throw new Error(`Unknown or missing route ${id ?? "assignment"}`);
  return route;
}
export interface TravelRoute extends RouteDef {
  length: number;
}
export function createRoutePlan(
  level: Pick<LevelDef, "path" | "routes">,
): ReadonlyMap<string, TravelRoute> {
  return new Map(
    levelRoutes(level).map((route) => [
      route.id,
      { ...route, length: pathLength(route.path) },
    ]),
  );
}
export function remainingTravelTime(
  route: TravelRoute,
  travel: number,
  speed: number,
): number {
  return Math.max(0, route.length - travel) / speed;
}
export function resolveRouteLayout(
  level: Pick<LevelDef, "width" | "depth" | "path" | "routes" | "blocked"> & {
    routeLayoutId?: string;
  },
  layouts: RouteLayout[] = [],
): Pick<LevelDef, "width" | "depth" | "path" | "routes" | "blocked"> {
  if (level.routeLayoutId !== undefined) {
    const layout = layouts.find((entry) => entry.id === level.routeLayoutId);
    if (!layout) throw new Error(`Unknown route layout ${level.routeLayoutId}`);
    return {
      width: layout.width,
      depth: layout.depth,
      routes: layout.routes,
      path: layout.routes[0]?.path ?? [],
      blocked: layout.blocked,
    };
  }
  return {
    width: level.width,
    depth: level.depth,
    routes: level.routes,
    path: level.routes?.[0]?.path ?? level.path,
    blocked: level.blocked,
  };
}
