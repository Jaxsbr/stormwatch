# Designer workbench

Run `npm run dev:workbench` and open the local workbench URL. For the built version,
run `npm run build:workbench` followed by `npm run preview:workbench`.
The production game build remains separate.

## Design, play, promote

Choose a map and wave, then shape the arrival timeline. Every accepted edit saves
automatically into one browser working draft. Changing selection or reloading
restores that draft; there is no revision picker or manual draft-save step.
Storage failures are reported explicitly. Keep the page open if a draft is only
in memory.

Select an enemy group to reveal handles. Drag its body to change the preceding
wait; stretch its timing or adjust its count. The batch detail controls enemies
per batch, spacing and uniform staggering. Repeated patterns show linked copies;
editing a copy updates their shared source. All groups follow one arrival order.
Timing drags snap to 0.05 seconds, counts to integers. Grid lines reveal finer
subdivisions as you zoom in. Undo/redo covers accepted visual edits during the
session; Escape cancels a drag.

**Playtest** launches the selected wave using the candidate that would be promoted,
normal difficulty and legitimate first-arrival tools. Its progress stays separate
from family profiles. Return with Workbench to continue editing.

**Promote** writes the selected wave and its map settings into
`src/content/recipes.json`. Other waves, maps and global catalogs stay unchanged;
their pending edits remain in the working draft. New selected maps/waves are
inserted into the canonical configuration. Promotion does not commit, publish or
rebuild the production game. Subsequent game builds use the updated configuration.

The local endpoint validates the complete result, checks the current selected
scope against the draft baseline and atomically replaces the fixed config file.
If that scope changed elsewhere, promotion refuses the overwrite. The conflict
message offers **Keep draft with latest game config**: it retains your edits and
refreshes their comparison base. Review those edits before promoting over the
newer settings. Unrelated promotion never silently clears another pending conflict.

## New maps and waves

Use **+ Map**, enter a name and choose an existing layout. The map starts with an
empty first wave; choose an enemy to create its first group. Use **+ Wave** to add
more named waves. Empty waves save as drafts but cannot play or promote until an
enemy group exists.

**Map & wave settings** contains names, starting crowns, the wave reward and a
layout selector with a route preview. Layouts copy dimensions, route, blocked
cells and accent from an existing game map. New map IDs use the woodland scenery;
this is a route/layout selector, not a custom painted-background editor.

Promoted map order drives the campaign and progress whitelist. New encounters
follow existing maps and unlock sequentially. Campaigns with more than three maps
use a scrollable encounter-card grid. Original encounter rewards remain unchanged.

## Existing experiments and agent tools

On first use, the most recent valid legacy revision supplies map/wave edits to the
single draft. Old experiment storage remains intact for agent recovery but is not
shown or appended to by the workspace. Hidden legacy global catalog/rule edits do
not influence the new Playtest or Promote workflow; those operations use game
catalogs and rules.

Automated run, compare, search, scenarios, command traces and scoped legacy
promotion remain available to agents through existing modules and commands:

- `npm run workbench -- list`
- `npm run workbench -- inspect request.json`
- `npm run workbench -- validate request.json`
- `npm run workbench -- run request.json`
- `npm run workbench -- compare request.json`
- `npm run workbench -- search request.json`
- `npm run workbench:promote -- experiments.json REVISION selection.json [--apply]`

Structured requests use the types in `src/workbench/scenarios.ts` and `runs.ts`.
The optional request `content` supplies an authored candidate. Existing CLI
promotion previews its explicit selected scopes before `--apply`; it remains
separate from the one-wave browser Promote action.

The browser writer is available only in local workbench dev/preview mode. It
requires a loopback connection, matching origin and a server-issued request token.
The production build exposes neither the workbench nor its write endpoint.
