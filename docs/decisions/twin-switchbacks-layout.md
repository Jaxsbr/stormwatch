# Twin switchbacks crossing battlefield

Status: owner-approved geometry; shared layout capability implemented; campaign scenery and playable acceptance pending.

## Context

New woodland encounters 1, 2 and 5 must reuse one exact battlefield with two fixed
crossing routes and widely separated entrances and exits. The owner compared
central, late and double-crossing alternatives, chose early/late crossings as the
base, then reviewed staggered zigzag, broad double-back and twin-switchback
variations. The owner selected Twin switchbacks with “the winner — use it”.

## Decision

Use the reviewed Twin switchbacks geometry for all three encounters. Both routes
fold back through separate upper and lower pockets. Retain the existing 12 × 8
integer-cell battlefield. Coordinates below are ordered `(x, z)` waypoints; `z`
increases downward in the tactical study. These are geometry definitions, not a
new canonical content schema. The shared layout library uses identity
`twin-switchbacks`, with stable routes `route-a` and `route-b` for study routes A
and B respectively. See the [route capability decision](routes-and-required-boss-defeats.md)
and [canonical layout library](../../src/content/recipes.json).

- Route A: `(-1,1) → (2,1) → (2,7) → (7,7) → (7,5) → (4,5) → (4,4) → (9,4) → (9,1) → (12,1)`.
- Route B: `(-1,6) → (0,6) → (0,3) → (6,3) → (6,1) → (4,1) → (4,0) → (11,0) → (11,6) → (12,6)`.

Entrances are five cells apart on the left; exits are five cells apart on the
right. Crossings are `(2,3)` and `(11,1)`. Enemies remain on their assigned route.
Every cell on either route is unbuildable, including crossings. The study adds no
extra scenery-blocked cells; any later blocking must preserve the reviewed
coverage and receive layout review. Route lengths are 31 and 29 cells respectively.

## Consequences

The crossings create early and late shared-coverage opportunities, while the
folds create separate defense pockets and repeated exposure to nearby defenders.
Longer travel and asymmetry require balance verification; diagram range coverage
is not proof of affordability, difficulty or a viable campaign strategy.

The route implementation owns schema, validation, workbench and runtime loading.
Scenery work must frame this geometry without hiding its bends, exits or buildable
cells. Encounters 1, 2 and 5 reference one reusable layout rather than maintaining
three copies. This decision approves geometry only, not finished scenery,
animation, enemy changes, campaign activation or playable balance.

## Verification

The design study checked nonzero orthogonal segments, no route self-intersections,
exactly two shared cells and legal example defender positions. Range overlays used
current base defender ranges. This is schematic evidence, not a played attempt.

Campaign acceptance still requires:

- Verify movement through both crossings without route switching, including westward folds.
- Verify the complete route union rejects placement and preserves useful buildable coverage.
- Play legal campaign attempts for staggered Rat teaching, immediate two-route Weasel pressure and the simultaneous twin-Roadwarden finale.
- Compare central investment with divided exit defenses; verify meaningful investment choices.
- Review approved scenery and crowded movement at desktop, landscape phone and tablet sizes.
- Verify edit → draft reload → Playtest → Promote → uncached game reload and identical geometry in encounters 1, 2 and 5.

The shared layout library was compared against the owner-approved study: both
ordered waypoint arrays, dimensions and empty blocked-cell list match exactly.
Route capability tests and authoring evidence are recorded in the
[route verification report](../benchmarks/routes.md); the remaining campaign checks
above belong to encounter authoring and release acceptance.

Whole-session art review covered all design alternatives and revisions. No raster
art was generated, and the generated-image inventory contained no outputs. The
inline HTML studies are tactical diagrams. Browser screenshots were diagnostic
verification captures, with no new reusable art, and remain outside this commit.
No catalogue additions or staged-image exclusions are required.

This record uses a descriptive filename to avoid parallel decision-number
collisions; decision 039 remains the commit-time ideas capture policy.
No canonical content or runtime implementation is changed by this record.
