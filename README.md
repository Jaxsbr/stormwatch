# Stormwatch

A small, atmospheric woodland tower-defense expedition: protect the lantern line,
build animal defenses and choose when to spend wave rewards on reinforcements and
upgrades. Dark, child-friendly art; no occult themes or gore.

The expedition has eight encounters across two boards. Lantern Pass → Rainstone
Crossing → The Last Lantern opens Mosswater Reach: five encounters introducing
Skunk poison, permanently poison-immune Iron Boars and simultaneous twin
Roadwardens. Earn Squirrel upgrades, Turtle control and Skunk replay rosters;
Mosswater encounter 2 earns the Skunk upgrade. Three.js draws the close orthographic battlefield with
painted scenery and articulated directional characters. Landscape phone/tablet
and desktop layouts are supported; physical-device and family-play verification
remain distinct from automated checks. The owner accepted the assembled expansion
playthrough on 4 October 2026; [activation evidence](docs/evidence/mosswater-activation.md)
records automated verification and the deferred scenery-registration exception.
[Project game link](https://jaxsbr.github.io/stormwatch/) · [Source repository](https://github.com/Jaxsbr/stormwatch)

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

Choose an unlocked encounter. First arrival uses its teaching roster; completed
encounters can use earned discoveries on replay. Select a defender, then click/tap
clear ground beside the trail. Placement stays active until **Cancel**. Cancel and
select an existing defender to inspect range, upgrade or sell. Start the first wave
when ready; subsequent waves have a preparation countdown with an early-start
button. Pause and sound settings are available. Defeat offers a free retry or
assistance. Fixed wave rewards and enemy rewards supply crowns; waiting and
pausing earn nothing. Two local player profiles retain progress and settings.

## Local designer workbench

```sh
npm run dev:workbench
# or a separate built preview:
npm run build:workbench
npm run preview:workbench
```

Open `/workbench.html` on the printed local URL. Inspect waves, fork/edit named
drafts, play through the actual battlefield, replay legal commands, run policies
or bounded goal search, and export validated experiments. Drafts never write family
profiles or released recipes. Deliberate local promotion previews selected authored
changes and rejects stale baselines. See [workbench usage](docs/WORKBENCH.md),
[verification](docs/evidence/designer-workbench.md) and
[architecture](docs/ARCHITECTURE.md). The workbench is excluded from `dist`.

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

The pinned GitHub Actions workflow checks, tests and builds every main-branch push, then publishes `dist/` to GitHub Pages when repository access and Pages are available. Pages must use the GitHub Actions build source. Failed checks prevent deployment. The optional performance laboratory builds separately with `npm run build:qa` into `dist-qa`; its `/qa.html` entry and diagnostic controls are excluded from the published game.


### Family release handoff

See the [candidate record](docs/evidence/family-release.md) for the verified journey,
remaining browser and family-device checks. The verified
play URL is [Stormwatch on Pages](https://jaxsbr.github.io/stormwatch/).

To check the emitted artifact under the same subpath, copy `dist` into a temporary
folder as `stormwatch`, then serve its parent:

```sh
npm run build
candidate_dir=$(mktemp -d)
cp -R dist "$candidate_dir/stormwatch"
python3 -m http.server 4187 --bind 127.0.0.1 --directory "$candidate_dir"
```

Use a new empty folder for each candidate so old files cannot remain. Open
`http://127.0.0.1:4187/stormwatch/`. Keep the verified copy and note
`git rev-parse HEAD` before rebuilding. This checks the actual built content and
assets without a development adapter. It is a local candidate, not publication.
Progress is local to each browser origin; localhost progress does not transfer to
Pages or another device. Each device/browser supplies two independent slots.
