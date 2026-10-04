import type { LevelDef } from "../sim/types";
import { levelRoutes } from "../sim/routes";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
/** Preview resolved route geometry in the authoring adapter. */
export function routePreview(
  level: Pick<LevelDef, "width" | "depth" | "path" | "routes" | "blocked">,
): string {
  const routes = levelRoutes(level);
  return `<svg class="ws-map-preview route-preview" viewBox="-1 -1 ${level.width + 2} ${level.depth + 2}" role="img" aria-label="${routes.length} fixed ${routes.length === 1 ? "route" : "routes"}; circles mark entrances, squares mark exits"><rect x="-1" y="-1" width="100%" height="100%" fill="#193b34"/>${routes
    .map((r, i) => {
      const first = r.path[0],
        last = r.path.at(-1)!;
      const color = i ? "#93c6db" : "#dcc89d";
      return `<g><title>${escape(r.id)}: entrance (${first.x}, ${first.z}), exit (${last.x}, ${last.z})</title><polyline points="${r.path.map((p) => `${p.x + 0.5},${p.z + 0.5}`).join(" ")}" fill="none" stroke="${color}" stroke-width="0.3" stroke-linejoin="round"/><circle cx="${first.x + 0.5}" cy="${first.z + 0.5}" r="0.3" fill="${color}"/><rect x="${last.x + 0.2}" y="${last.z + 0.2}" width="0.6" height="0.6" fill="${color}"/></g>`;
    })
    .join(
      "",
    )}${level.blocked.map((p) => `<rect x="${p.x}" y="${p.z}" width="1" height="1" fill="#617859"/>`).join("")}</svg>`;
}
