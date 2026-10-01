# Encounter visual authoring benchmark

## Reproducible comparison

Trial: change the approved visual identity of one existing enemy, then add a
map that reuses approved scenery and introduces a wave using that enemy. Count
distinct places where an author must specify the art identity, excluding
ordinary imports, tests and documentation. Inspect the resulting map's full art
set, including every wave, before Playtest. This measures authoring locality and
validation, not image loading time.

| Observation | Before | After |
| --- | ---: | ---: |
| Enemy image or rig mapping locations | 5 (`battle-art`, briefing, results, two workbench views) | 1 (`encounter-visuals` catalog) |
| Map backdrop selection | Renderer encounter-ID conditional | `visual.backdrop` beside the authored map, resolved through one approved scenery catalog |
| Missing map backdrop at promotion | No visual-specific check; renderer chose the woodland default | Promotion fails with the map ID |
| New wave using an already described animal | No new rig mapping | No new rig mapping; demand comes from all populated waves |

The existing defender portrait mapping also moves into the same catalog. The
comparison counts authoring locations, not total changed source files in this
architecture migration. A new map still needs its recipe and normal campaign
checks. New assets require review and provenance independently of this change.

## Acceptance evidence

The visual inventory test traverses the three accepted maps and their 5, 4 and
6 waves, resolves scenery, every selected enemy view and briefing image, every
selected defender rig and portrait, and checks that the referenced files exist.
The workbench round-trip test edits a new map's backdrop and wave, reloads its
saved draft, Playtests the resolved encounter, Promotes through the local API,
and reloads the runtime content. A negative test checks that unknown scenery
leaves the canonical file untouched.

Browser review at a 1280 × 720 desktop viewport showed the woodland backdrop in
Lantern Pass and The Last Lantern, the riverbank in Rainstone Crossing, the Rat
briefing image, the Squirrel build portrait, and animated Rats in a Last Lantern
workbench wave. Browser logs showed no image errors. These are
visual selection checks, not physical mobile performance measurements.

## Fresh-agent trial

A fresh agent received only a normal request to add a disposable Mossbank
Crossing with one mixed Rat and Weasel wave, using approved Rainstone scenery.
It worked in an isolated checkout without this design discussion. Its diff set
`visual.backdrop` on the new recipe, reused the existing animal catalog, and
added no art mapping to the renderer, briefing or workbench. Type checking,
317 tests, production and workbench builds, and formatting passed in that
checkout. Review found that a hard-coded three-map assertion in this feature's
visual test forced an unnecessary test edit; it was changed to preserve the
original fifteen-wave assertion while validating every future map automatically.

The agent's browser session could not reach the locked map in campaign and
opened an unrelated saved workbench draft, so it reported that visual review
gap. Independent review in a clean workbench origin showed the disposable map
with Rainstone scenery and both Rat and Weasel cutouts, with no image errors.
In the same disposable checkout, the actual UI round trip changed its backdrop
to woodland: draft autosave → browser reload retained the choice → Playtest
showed woodland → Promote wave succeeded → the game server served woodland in
`game-content.json` without rebuilding JavaScript. The reloaded campaign listed
Mossbank as its fourth map. The trial content is not part of this change.
