# Roadmap and handoff

## Current state

Playable two-encounter visual reboot with generated painterly scenery, an orthographic Three.js battlefield, articulated animal defenders and directional enemies, upgrades/sell, targeted rescue, support choice/unlock, local stars/settings, retry/assistance, orchestral loop and effect cues. Fixed-step rules and both encounter strategies have focused tests. See the [current visual audit](../review/2026-09-20-reboot/current-rubric-audit.md) and [historical foundation acceptance](ACCEPTANCE.md) for exact evidence and gaps; implementation does not imply every device/audio check passed.

## Prioritized next work

| Priority | Work | Depends on | Acceptance |
|---|---|---|---|
| P0 | Physical phone and audible mix sign-off | Candidate build, iPhone 12-class Safari/Pixel 6-class Chrome, listener | Essential taps on physical devices; 3 stress runs per device at p95≤35ms; music loop/mix heard and notes recorded |
| P1 | MVP feedback follow-up and individual animation review | Owner review of prototypes; current gameplay capture | Refine mobile placement around variant B and clear-ground guidance; use A for physical hits and C for effect/status cues; audit every current role individually at normal speed and record evidence gaps |
| P1 | Family playtest and economy tuning | Stable verified input/layout | Observe first-time play without coaching; 5–8min encounters including planning; spending and saving both understandable; document failures before adjusting costs |
| P1 | Resolve any measured performance gaps | Raw benchmark and gameplay evidence | Desktop p95≤20ms and no attributable >100ms gameplay frame; retain before/after evidence |
| P2 | Roster matchup and two-map challenge audit | Owner-confirmed wave-learning and overlap direction; current-build play scenarios; family playtest | Complete four-enemy × three-combat-tower matrix; set a teach → practice → combine purpose across the two fixed-route maps; establish whether current one-of-each play is dominant and what causes understandable leaks |
| P2 | Extract screen controllers as content grows | More UI complexity | Same full-loop regression evidence; simulation remains DOM-free; screen lifecycle owns cleanup |
| P2 | Stronger content validation and save migration | Third encounter or changed save schema | Bad ids/paths/groups fail clearly; old version migrates without losing best stars |
| P3 | Production-lineage enemy/tower gameplay slices | Roster and map plan reviewed; one candidate lesson selected | Implement one enemy ability at a time through real content/simulation/rendering; retain focused rule tests and visual cues; expand towers/upgrades only when needed for overlapping trade-offs |

## Known limits

Battlefield textures stream in after entering the scene; a dedicated asset-ready transition would improve slower connections.

The first encounter is intentionally forgiving and can leave a large late wallet; deterministic viable strategies are not a substitute for children's playtesting. Combat simulation duration is roughly 4.3–4.6 minutes for tested lines, plus planning; the 5–8 minute target includes player preparation. The 2× convenience speed shortens wall time.

Characters use separated native parts and articulated limb rigs, with front/rear/side views. Direction swaps are abrupt and removal is simple. Painted biome plates use consistent scale and the route has rounded continuous corners. Map layout is designed for two nodes. Main screen orchestration remains one module. Local progress has no cloud sync; clearing browser storage removes it. Full keyboard-only battlefield placement, screen-reader gameplay, localization and portrait-first layout are not implemented.

Artificial stress is separate from real gameplay and excludes the normal HUD/audio workload. Physical-device and actual listening evidence must be reported independently. Asset source PNGs are locally retained and ignored; committed runtime WebP/audio/font files are sufficient for a clean build.

## Working method

Read scope/ADRs, make one bounded change, add rule tests only where behavior needs them, run check/test/build, and use actual browser inputs for gameplay acceptance. Review delegated code before merging it. Creative reviewers own visual coherence; reasoning reviewers own rule correctness/evidence; small implementation units may use an approved local model tool. Do not assume a model/service is free or substitute paid configurations without consent. Keep access instructions and credentials outside public files.
