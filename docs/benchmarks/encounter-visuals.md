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
leaves the canonical file untouched. Browser visual review and fresh-agent trial
results are recorded after they run.
