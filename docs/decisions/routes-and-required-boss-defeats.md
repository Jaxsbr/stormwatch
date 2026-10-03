# Stable routes, reusable layouts and required boss defeats

## Status

Implementation candidate for parent review. The owner approved two fixed crossing
routes, shared hearts, simultaneous twin Roadwardens and the Twin switchbacks
geometry. Campaign scenery and balance acceptance remain separate. This record
uses a descriptive filename pending coordinated ADR numbering.

## Context

The single `path` fed spawning, movement, occupancy, renderer gait and targeting.
Boss rage was already per actor, but rally compared all escorts' travel distances
without route identity. Final-wave victory checked only that some boss died.
Copying geometry into three encounters would allow the shared layout to drift.
The existing sequential group cadence could not spawn two separate route groups
at exactly the same instant.

## Decision

`routeLayouts` is an optional identity-keyed library in schema version 1. A map
can reference `routeLayoutId`, author inline `routes`, or retain its legacy `path`.
Shared layout geometry owns dimensions, routes and blocked cells. References
carry matching dimensions and empty local `path`/`blocked`; inline routes also
use an empty legacy path. Validation rejects competing geometry sources.
Compiled `LevelDef.path` remains a first-route compatibility adapter, while
`LevelDef.routes` is authoritative for all route-aware consumers.

Legacy content resolves to `default-route`. An omitted group assignment selects
the first route in authored order; compilation makes that assignment explicit
for route-aware maps. Unknown assignments fail. Every spawned enemy retains its
route identity until retirement. Paths never form a navigable graph: crossing
traffic cannot switch routes. Build occupancy excludes the complete route union.

`src/sim/routes.ts` owns interpretation and the immutable attempt's precomputed
route lengths. Simulation movement and targeting share one effective-speed rule:
catalog speed × group movement scale × boss rage × maximum of current evasion
and rally multipliers × current slow. Explicit-route maps prioritize remaining
route length / that current speed, then stable enemy ID. Future ability windows
are not predicted. Legacy path-only encounters retain their distance priority:
applying the new policy to them changed established strategy timings. Authors can
opt a single-route map into the new policy with an explicit route entry.

`startTogether` starts a group at the previous authored group's start plus its
own wait. The following sequential group waits for the longest cadence handoff.
The scheduler returns arrivals in time order, retaining authored insertion order
for ties. This affects only opted-in groups; old schedules and nonmonotonic-tail
rejection survive. The timeline and workbench expose the same rule.

Splash remains a spatial radius across routes. Rally retains its existing
along-route proximity rule and adds matching route identity. Rage and slow are
unchanged. Required finale defeats count every boss in the compiled finale;
zero required bosses cannot win. Any required boss escape loses immediately.
Movement/leaks resolve in stable actor order before projectile impacts, so a
projectile arriving on the escape tick cannot rescue that boss. Arrival, rally
and leak events carry actor and route identities.

Shared layout edits promote atomically per layout identity, including selected
wave promotion when it references that layout. All referencing maps validate
against the result. Unrelated layouts/maps/waves are preserved, stale edited
layouts reject the whole write, and rebasing retains pending layout conflicts.
Old saved drafts acquire the approved layout library without rewriting their
legacy paths or schedules. Already-running attempts retain frozen snapshots.

## Consequences

Twin switchbacks is one unused approved library entry, with `route-a` and
`route-b`, lengths 31 and 29, crossings (2,3) and (11,1), width 12, depth 8 and no
extra blocked cells. Campaign registration, names and scenery are not added here.
The later encounters can share `routeLayoutId: "twin-switchbacks"` exactly.
Changing its playable geometry or adding scenery blocks requires coordination
with the design owners before campaign acceptance.

Renderer samplers and scenery reuse keys include every route. Actor/resource
pools retain their existing lifetime. Briefing and workbench previews show both
entrances and exits, using the same resolved geometry.

## Verification

Real-`Game` tests cover the approved geometry, fixed routes through crossings,
union occupancy, speed-aware ordering and ties, spatial splash, both exits/shared
hearts, independent rage, route-local rally, two simultaneous deaths, one death
followed by escape, both escape exits, escape-before-impact, pause and replay.
Projection checks compare both route samplers with the simulation. Resource
lifecycle coverage checks second-route edits and unchanged retry reuse.

Authoring tests cover old drafts, exact shared resolution across three fixture
maps, immutable attempts, scoped/all/CLI promotion and conflicts. A disposable
file API test performs saved draft → Playtest → Promote → uncached reload.
Browser verification performs route selection/assignment, saved draft reload,
Playtest, pause, promotion and reloaded-game briefing against a disposable copy.
The existing campaign stays on its original paths in committed content.

See [route verification and measurements](../benchmarks/routes.md). Required
checks and production separation are recorded there. Parent review, overlap
integration and post-merge deployment verification remain pending.
