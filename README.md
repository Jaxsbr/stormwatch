# Stormwatch

A small, atmospheric woodland tower-defense game: protect the lantern line, build defenses, and choose between spending now and saving for wave-end interest. Dark, child-friendly art; no occult themes or gore.

Two encounters, squirrel archers, skunk slingers, turtle trappers and donkey traders, plus support cards, a targeted supply drop, upgrades, local progress and optional assistance. Three.js draws a close orthographic battlefield with cohesive painted scenery and articulated directional characters. Landscape phones/tablets and desktop are supported layouts. The visual reboot passes its original desktop performance profile; Chrome 153 stress stalls and unverified physical-device/audio checks are documented in the current review. The published link below still serves the earlier foundation build.

[Published foundation build](https://jaxsbr.github.io/stormwatch/) · [Source repository](https://github.com/Jaxsbr/stormwatch)

## Run

Install Node.js 24 (or Node ≥22.12) and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally http://127.0.0.1:4173). No account, API keys or generation service are needed. Runtime art, fonts and music are supplied locally; running the game does not require regenerating assets.

```sh
npm run check       # TypeScript
npm run format:check # source formatting
npm test            # deterministic rule and strategy checks
npm run build       # production output in dist/
npm run preview     # serve the production build
```

Serve `dist/` over HTTP; opening its HTML as a filesystem URL is unsupported. The relative asset base supports hosting under a subdirectory.

## Play

Choose an encounter and one support card. Select a structure, then click/tap clear ground beside the trail. Placement stays active until **Cancel**. Cancel and select an existing structure to inspect its range, upgrade or sell. Start each wave when ready. During a wave, choose **Supply drop** and tap the trail. Pause and sound settings are always available. Defeat offers a free retry or assistance.

Interest pays 10% of your unspent gold, rounded down and capped at 20, when a wave ends. Donkey traders pay 12 gold per wave, or 22 when upgraded. Interest is calculated before any wave payout. Waiting and pausing earn nothing. Progress and settings stay in this browser's local storage; clearing site data removes them.

## Project guide

- [Current visual reboot assessment](review/2026-09-20-reboot/current-rubric-audit.md) and [demo provenance](review/2026-09-20-reboot/demo/README.md).
- [Reusable animated art pipeline](docs/ART-PIPELINE.md).
- [Reference research and design tree](docs/RESEARCH.md).
- [Acceptance and evidence](docs/ACCEPTANCE.md) — measured results and unverified checks.
- [Architecture and extensions](docs/ARCHITECTURE.md) — where rules, content and adapters live.
- [Roadmap and handoff](docs/ROADMAP.md) — limitations, dependencies and next work.
- [Decisions](docs/decisions/README.md), [approved scope](docs/SCOPE.md), [agent guidance](AGENTS.md).
- [Asset production](docs/ASSETS.md), [licenses](docs/ASSET-LICENSES.md), [glossary](docs/GLOSSARY.md).
- [Verification procedure](docs/VERIFY.md).

Music: **Treasure Hunter** by TAD, CC0. Fonts: Cormorant Garamond and DM Sans, SIL Open Font License. Artwork was generated for this project; see provenance and review guidance. This is a new project and does not modify the previous game.

## Publishing

The pinned GitHub Actions workflow checks, tests and builds every main-branch push, then publishes `dist/` to GitHub Pages. Pages must use the GitHub Actions build source. Failed checks prevent deployment. The optional `/qa.html` route is a clearly labeled performance laboratory, separate from normal play.
