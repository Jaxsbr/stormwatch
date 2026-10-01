# 036 — Describe encounter visuals beside authored maps

**Status:** proposed pending verification and deployment.

## Context

Scenery previously came from an encounter-ID conditional in `Battlefield`.
Enemy rig identities lived in `BattleArt`, while briefing, results and two
workbench views repeated enemy image names. Defender portraits had another map.
Changing an existing animal's visual identity required coordinated edits across
five files. A new map using a distinct approved backdrop also required a renderer
edit. The workbench can promote a new map as data, so a code-only map-ID registry
would break that existing workflow.

## Decision

Each authored map has a `visual.backdrop` scenery ID beside its waves in the
canonical recipe. `src/content/encounter-visuals.ts` owns approved scenery IDs
and reusable enemy and defender asset identities. `describeEncounter` derives
the complete enemy set from populated groups across every wave and the available
defender set from the map. It returns the selected art for adapters to consume;
simulation rules do not use it. The battle-art module still owns loading,
readiness, failure and disposal.

Runtime content installation and both workbench promotion paths validate every
map's visual description. Asset inventory tests check the referenced committed
files. The workbench exposes a Painted backdrop control and copies the template
choice into a new map. Old saved drafts restore known maps' visual choices from
the accepted content; a new map without a choice must select one explicitly.

## Consequences

An existing animal art update has one catalog edit instead of five adapter edits.
A new wave using an existing animal needs no visual mapping edit. A new map can
reuse approved scenery through data-only promotion and game reload. New scenery
or animal art still needs reviewed runtime files, provenance and a catalog edit.
The authored `visual` field is presentation data carried with the level; the
browser-independent simulation ignores it. Missing or unknown scenery fails
promotion and runtime installation with the encounter ID. Missing enemy art
reports the encounter and wave. A catalog path typo is caught by the asset test.

## Verification

Compare the same art-change scenario before and after using
[the authoring benchmark](../benchmarks/encounter-visuals.md). Check all three
maps and all fifteen waves, the explicit missing-art failures, and the complete
draft reload → Playtest → Promote → game reload path in a disposable copy.
Run type checking, tests, production and workbench builds. Review the briefing
and battlefield in a browser. A fresh agent trial in a disposable checkout must
add a map and wave using only repository guidance, with the resulting diff and
visual selection reviewed. Complete the deployment check after merge.
