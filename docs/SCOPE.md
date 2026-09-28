# Stormwatch — approved MVP and acceptance contract

> Direction updates: the owner subsequently approved the horizontal visual reboot, animal defenders, and progressive discovery with a simple wave economy. [ADR 004](decisions/004-visual-course-correction.md), [ADR 005](decisions/005-animal-defenders.md), and [ADR 014](decisions/014-progressive-discovery-and-simple-wave-economy.md) supersede the original presentation and economy commitments below. Current verification is tracked in the [reboot audit](../review/2026-09-20-reboot/current-rubric-audit.md).

> Tower presentation update (29 September 2026): side-only towers and pose-first animation are approved in [ADR 031](decisions/031-side-only-tower-animation.md). Follow the [tower animation process](TOWER-ANIMATION-PROCESS.md).

Status: confirmed by the owner on 20 September 2026; implementation authorized. Approved title and personal repository name: Stormwatch / `Jaxsbr/stormwatch`. This document records the confirmed product decisions; architectural records live in `decisions/`.

## Product promise

A short, atmospheric tower-defense expedition for confident readers who are new to strategy games. Brave animal defenders protect woodland settlements from armored raiders. Dark forests, storms, weathered structures and lantern warmth create danger without occult content or gore. The emotional outcome is courage, shelter and earned victory. Visual direction: painterly, expressive, sturdy characters and clear silhouettes.

Landscape phone/tablet first, with desktop mouse support. Calm preparation, manually launched waves, occasional live interventions, and meaningful saving/investment decisions. Free retry after defeat; optional assist, no permanent-progress penalty. No accounts, monetization, multiplayer or required grinding.

## Complete playable path

Title/settings → expedition map → encounter preview and one-of-three support-card choice → preparation/building → waves → victory or defeat → reward/retry/map. Two encounters within one biome, the second unlocked by the first. Target 5–8 minutes per encounter; exact wave counts are tuning. Show enemy roles and next payout clearly. Save completion, stars, one tactical unlock and settings locally; wallet and temporary effects reset per attempt. The one unlock is an alternative support card, not a required permanent damage increase.

Fixed enemy paths; place structures on any valid ground tile. Three defense roles: focused damage, splash and slowing. Three ordinary enemy roles: ordinary, fast and armored; one boss variant. One upgrade per defense and one economy building with one upgrade. Sell, cancel, inspect range, pause/resume, and one targeted rescue ability. No movable hero or player-shaped enemy routing.

Proposed concrete, non-occult fiction: bolt tower, lobbed stone tower, adhesive/net slowing tower; an emergency supply drop as the rescue ability. The exact art/name can be adjusted within these roles. Support cards emphasize reach, crowd control or early resources; choices must affect actual gameplay. One alternative card unlock demonstrates progression.

## Economy (superseded by ADR 014)

Combat rewards and wave rewards supply funds. A capped interest payout uses remaining savings after a completed wave. Economy buildings pay on the same wave boundary. Both building and upgrading them compete with immediate defense spending. Income stops during waiting and pause; no benefit from deliberately extending combat time. Show current funds, expected fixed income and projected interest separately.

Lead owns rates/caps/refunds/rounding and records their rationale. Proposed atomic ordering: calculate interest from pre-payout savings, then credit interest, fixed wave rewards and economy-building income exactly once. The interest cap should be reachable in normal play and prevent unlimited compounding. Tests cover exact-once payout, rounding/cap boundaries, insufficient funds, upgrades/sell, replay resets and no paused/preparation income. Demonstrate viable spending-led and saving/investment-led approaches; do not claim perfect balance from a handful of runs.

## Rendering and architecture

Fixed orthographic isometric camera. Three.js renders simple 3D terrain/ground and camera-facing illustrated entities; no camera rotation. Terrain relief is cosmetic in the MVP. Generated 2D art uses consistent view angle, scale, lighting and palette; grounding shadows and restrained effects integrate it into the scene. A small representative scene must validate occlusion, transparent edges, pointer picking and sprite readability before expanding content.

TypeScript simulation has no rendering/browser dependency: fixed time steps, seeded randomness, explicit commands/events and fresh attempt state. Separate content definitions, simulation, rendering/input adapter, screen/UI flow, audio, versioned local save and test scenarios. UI can use semantic HTML controls over the rendered battlefield. Concrete dependency versions are selected and pinned during setup. ADRs document consequential technical decisions; no speculative engine-switching framework.

Native image generation provides representative final assets after style exploration/review. Generated 3D models are optional if they improve the result; a model-generation pipeline is not required to prove this 2.5D architecture. Existing Blender tooling may help prepare assets. No new paid services or additional asset charges without approval. Runtime never depends on generation services.

Music proposal: adventurous instrumental percussion and strings, with tension during combat and a warm victory cue. One licensed/original loop plus UI, attack, impact, economy and result sounds; separate music/effects volume and mute. Verify gesture unlock, pause/resume, replay and audible mix. Do not pretend sound synthesis or an unlicensed placeholder meets final music quality. If suitable music cannot be obtained within existing access, report the limitation before substituting a changed product experience.

## Required capabilities and evidence

| Capability        | MVP example                                               | Acceptance evidence                                                             |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Full game flow    | Two encounters, both end states, reward and replay        | Reproducible mouse/tap path, screenshots or recording                           |
| Combat            | Three towers, three enemy roles, boss, upgrade and rescue | Focused deterministic rule tests and browser play                               |
| Economy           | Capped interest, income building/upgrade, spending/saving | Boundary tests, HUD payout agreement and two contrasting play strategies        |
| Choices/progress  | Three initial cards, one alternative unlocked, stars/save | Observable rule differences, reload and malformed-save tests                    |
| Hybrid art        | 3D ground plus illustrated entities and effects           | Matched scene captures; overlap, picking, scale and silhouette checks           |
| Asset pipeline    | Source art → reviewed/processed runtime asset             | Provenance manifest, reproducible integration instructions and asset review     |
| Audio             | Loop, cue family, settings and replay lifecycle           | Actual listening plus functional checks; unavailable listening stays unverified |
| Content extension | Second encounter built after first using definitions      | Focused diff without unrelated runtime restructuring and authoring instructions |
| Maintainability   | Implemented boundaries, extension points, ADRs            | Code-aligned architecture map and review                                        |
| Reproducibility   | Clean checkout install/run/build/test                     | Recorded commands, versions and results                                         |
| Publication       | New public personal repository                            | Outgoing files/history reviewed for secrets/private details; verified owner     |

## Proposed verification contract

- All essential actions work via mouse and touch: card select, tower/economy placement, inspect, upgrade, sell, cancel, ability targeting, wave start, pause, result, replay and settings. No hover-only requirement; minimum essential touch targets 44 CSS px. Proposed representative viewports: desktop 1280×720, phone 844×390, tablet 1024×768. Responsive handling must preserve HUD and placement readability.
- Build, type/static checks and focused tests pass. Core rules include movement/leaks, damage and status expiry, targeting, purchases, economy, wave transitions, win/loss, pause, fresh replay and saves. One command each for setup/run/build/check/test and documented browser/performance scenarios.
- Proposed physical desktop baseline: available Apple Silicon Mac, exact chip/OS/browser/display recorded. Target 60 FPS, p95 frame interval ≤20 ms and no gameplay-caused frame >100 ms after warmup.
- Proposed mobile targets: iPhone 12-class Safari and Pixel 6-class Chrome; floor 30 FPS, p95 frame interval ≤35 ms. Physical-device access is not established. Touch/viewport/CPU emulation is reported separately and cannot establish physical mobile performance.
- Scenario: three seeded 180-second runs after 10-second warmup, representative peaks of 60 enemies, 12 defenses, three economy buildings, and at most 150 active projectiles/effects. Include simultaneous slow, splash, ability, payout and result transition. Record frame timing method, median FPS, p95/worst intervals, entity counts, viewport, device/browser versions, throttling and console errors. Distinguish artificial stress fixtures from normal gameplay. Changes to budgets or target populations require explicit rationale and owner agreement.
- Cold load target ≤5 seconds at a documented 10 Mbps/100 ms latency profile; ≤8 MB initial transfer and ≤20 MB full MVP assets. Record transfer bytes and loading milestones.
- Clean-checkout verification uses only public setup instructions and pinned dependencies, without private generator access; committed runtime assets make the game self-contained.
- Acceptance report maps each criterion to evidence and labels unmet/unavailable checks unverified. If physical mobile checks are unavailable, deliver a playable verified-on-desktop candidate with a documented mobile validation gap, not a claim of fully verified completion.

## Roadmap and handoff

1. Foundation: runtime scaffold, pure simulation skeleton, fixed-camera art/input slice. Accept when mixed 2D/3D overlap and selection work at target layouts; record architecture ADR.
2. One complete encounter: core combat, economy, choices, results/replay and audio. Accept when rules and full interaction path pass.
3. Extension/progression: second encounter added through content definitions; local saves and one unlock. Accept with extension diff and reload tests.
4. Polish/verification: coherent reviewed artwork, music/mix, assist, performance measurement and clean-checkout check. Accept only evidenced criteria; report gaps.
5. Publication/handoff: scan/review outgoing files and history, verify personal GitHub identity, create/publish repository, provide run instructions, acceptance report and prioritized next work.

Documentation stays proportional: README commands; architecture/extension map; brief ADRs and revision procedure; agent guidance; asset review/integration guide; glossary; roadmap with dependencies/acceptance criteria; evidence report and handoff. Private machine/service access instructions remain outside the public repository. No changes to CuteDefense.

The owner confirmed this integrated scope and authorized implementation. Return for new evidence that changes agreed product direction, requires additional spending, or makes an agreed acceptance condition unattainable.
