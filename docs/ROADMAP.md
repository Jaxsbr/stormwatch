# Roadmap and handoff

## Current state

Playable two-encounter candidate with generated painterly art, hybrid Three.js battlefield, three defenses plus economy building, upgrades/sell, targeted rescue, support choice/unlock, local stars/settings, retry/assistance, orchestral loop and effect cues. Fixed-step rules and both encounter strategies have focused tests. See [acceptance](ACCEPTANCE.md) for exact evidence and gaps; implementation does not imply every device/audio check passed.

## Prioritized next work

| Priority | Work | Depends on | Acceptance |
|---|---|---|---|
| P0 | Physical phone and audible mix sign-off | Candidate build, iPhone12-class Safari/Pixel6-class Chrome, listener | Essential taps on physical devices; 3 stress runs per device at p95≤35ms; music loop/mix heard and notes recorded |
| P1 | Family playtest and economy tuning | Stable verified input/layout | Observe first-time play without coaching; 5–8min encounters including planning; spending and saving both understandable; document failures before adjusting costs |
| P1 | Resolve any measured performance gaps | Raw benchmark and gameplay evidence | Desktop p95≤20ms and no attributable >100ms gameplay frame; retain before/after evidence |
| P2 | More varied second encounter tactics | Playtest results | A distinct pressure pattern without extra rules unless justified; both reasonable strategies viable, no required grinding |
| P2 | Extract screen controllers as content grows | More UI complexity | Same full-loop regression evidence; simulation remains DOM-free; screen lifecycle owns cleanup |
| P2 | Stronger content validation and save migration | Third encounter or changed save schema | Bad ids/paths/groups fail clearly; old version migrates without losing best stars |
| P3 | Additional biome and enemy/tower behavior | Above foundations stable | New content follows documented extension process, has cohesive art, focused rule tests and budgets |

## Known limits

The first encounter is intentionally forgiving and can leave a large late wallet; deterministic viable strategies are not a substitute for children's playtesting. Combat simulation duration is roughly 4.3–4.6 minutes for tested lines, plus planning; the 5–8 minute target includes player preparation. The 2× convenience speed shortens wall time.

Sprites are single-view cutouts with subtle motion, not rigged animation. Terrain relief is decorative. Map layout is designed for two nodes. Ground borders are visually similar but not exact mathematical tiles. Main screen orchestration remains one module. Local progress has no cloud sync; clearing browser storage removes it. Full keyboard-only battlefield placement, screen-reader gameplay, localization and portrait-first layout are not implemented.

Artificial stress is separate from real gameplay and excludes the normal HUD/audio workload. Physical-device and actual listening evidence must be reported independently. Asset source PNGs are locally retained and ignored; committed runtime WebP/audio/font files are sufficient for a clean build.

## Working method

Read scope/ADRs, make one bounded change, add rule tests only where behavior needs them, run check/test/build, and use actual browser inputs for gameplay acceptance. Review delegated code before merging it. Creative reviewers own visual coherence; reasoning reviewers own rule correctness/evidence; small implementation units may use an approved local model tool. Do not assume a model/service is free or substitute paid configurations without consent. Keep access instructions and credentials outside public files.
