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
from family profiles. It waits for the encounter's scenery and required cutout art
before enabling placement or wave commands. If art fails to load, use **Retry art
loading** to rebuild the battlefield and continue the same attempt. Return with
Workbench to continue editing.

**Promote wave** writes the selected wave and its map settings into
`src/content/recipes.json`. Changed shared ability timings are saved with it. Other waves, maps and global catalogs stay unchanged;
their pending edits remain in the working draft. New selected maps/waves are
inserted into the canonical configuration. Promotion is data-only: it does not
compile JavaScript, restart a game attempt, commit or publish a deployment.
**Promote all changes** saves pending map settings, waves and shared ability timings
across the entire working draft in one atomic operation. Unedited content on disk
is preserved; a conflict in any edited scope rejects the whole operation. Empty
new waves must receive enemies before all changes can be promoted. The status
shows when other draft changes remain after promoting one wave.

Reload the local game to load the promoted configuration. A running game keeps
its loaded settings until reload.

The game fetches `game-content.json` without a cache before initializing maps,
catalogs and save validation. Local development and preview servers read the
canonical file on every request. A production build emits the same JSON alongside
the game; static hosting needs no configuration server. Publishing changed data
means replacing that JSON asset on the deployed site. Invalid or unavailable
content shows a retry message instead of silently loading an old bundled wave.

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

## Shared enemy abilities

Use **Abilities for this wave** below the timeline to switch Rat shield and Weasel
evade on or off for every matching enemy in that wave, including repeats.

Expand **Shared ability settings** to set each ability's active and exposed times.
These values apply to every wave with that ability enabled. Initial defaults are
Rat shield 3s active/5s exposed and Weasel evade 2s active/3s exposed. Both begin
with their exposed interval after spawning. Timings use 0.05-second increments.
Edits auto-save; Playtest uses them immediately. **Promote** saves changed shared
timings together with the current map/wave. Reload the game to use them.

Old draft arrival patterns are preserved while individual shield/evade timing
variations are replaced by shared settings. Introductory waves that lacked evade
keep it off. Concurrent edits to shared settings are checked before promotion.

Boss rage controls appear under **Shared ability settings**: damage to trigger
(% of max HP), angry/full-rage durations and their speed multipliers. Defaults
are 10% damage, three seconds angry, four seconds raging, and 1.35× / 1.6× speed.
Recovery starts a fresh damage window; damage taken during rage is not banked.
At 25% health, full rage becomes permanent. Both Promote actions save these
settings. Older drafts keep their speed tuning and gain the cycle defaults.
Turtle slow remains fully effective in every phase.

## Shared routes

Map & wave settings includes a **Shared route layout** selector. Choose
`twin-switchbacks` to reference the approved two-route geometry; this does not
register a new campaign encounter. The map preview shows both fixed routes,
with circles for entrances and squares for exits. Select an enemy group on the
timeline to edit **Assigned route**. New groups use the first route unless assigned
otherwise. **Arrive with previous group** begins at that group's start plus this
group's wait; use zero wait for simultaneous twin arrivals. Following sequential
groups wait for both cadences. The first group of a wave cannot use this setting.
Enable **Require every finale boss defeated** for the twin finale. Draft saving
allows an unfinished finale, but Playtest/runtime loading/promotion require at
least one finale boss, and the actual game requires every authored boss to die.

A selected shared layout exposes one x,z waypoint per line for each route. Apply
shared routes validates the complete draft before saving; invalid coordinates or
nonorthogonal segments leave the saved geometry unchanged. Geometry changes
affect every map referencing that layout. Coordinate changes to accepted campaign
geometry with its design owners, including any new scenery blocks.

Promote wave includes changed geometry for its referenced shared layout. Promote
all changes includes every changed shared layout. Both preserve unrelated disk
layouts and reject a stale edited layout before writing any content. Existing
attempts retain their old geometry; reload the game to start with promoted data.
Old version-one drafts keep their paths and timings and acquire the approved
layout library. No schema-version bump is needed.

For structured promotion, include `routeLayouts: ["twin-switchbacks"]` in the
selection when its geometry changed. A shared reference uses `routeLayoutId` plus
empty local `path` and `blocked` arrays and matching layout dimensions. Inline
`routes` also require an empty legacy `path`. Legacy maps keep their existing path
and target priority; explicit routes use remaining travel time. See the
[route contract](decisions/routes-and-required-boss-defeats.md).
For new single-route encounters, enable **Prioritize remaining travel time** to
author an explicit single route. Leaving it off preserves a legacy map's recorded
distance priority. Map-owned route coordinates remain editable after detaching a
shared layout; this changes only that map.

## Boards

Board settings reference existing encounter identities; they do not duplicate map
recipes. Set the display name, reviewed illustration, encounter order and travel
order. Enable authored marker anchors to position every encounter by percentage of
the full illustration. Save board draft applies the complete validated transaction
and persists it automatically; reloading retains it. Existing recipes without a
board collection retain their current first-board illustration and marker positions.

Promote wave includes the selected encounter's board settings, map settings, wave
and changed shared abilities. Other board/map/wave edits stay pending. Use Promote
all changes for travel-order changes or membership moves between boards. Conflicting
board settings or travel order reject promotion without writing partial content.
The agent promotion preview also accepts explicit `boards` identity selections.
Review the game board after uncached reload; Playtest uses the same content model
but never writes campaign/profile progress. New board illustrations require asset
acceptance and catalog registration before they can be selected.
