# Stormwatch

Read docs/SCOPE.md and docs/ARCHITECTURE.md before changing gameplay or boundaries. The owner confirmed the scope on 20 September 2026. Preserve dark, child-friendly, non-occult, gore-free woodland art, touch-first input, and meaningful wave-end saving/investment choices. The owner subsequently authorized a close horizontal landscape presentation and a reusable properly animated 2D art pipeline; see docs/decisions/004-visual-course-correction.md and review/rubric.json. The old fixed isometric/tiled presentation is superseded.

Keep simulation deterministic and browser-independent. Content is data; rendering, UI, audio and persistence are adapters. New rules need focused tests; cosmetic adjustments need visual verification. Use npm run check, npm test and npm run build. Never report physical mobile performance from emulation.

Keep patches bounded. Review delegated edits before integrating. Public docs describe capabilities generically; never commit machine paths, credentials, account configuration, infrastructure access instructions or private logs. Generated runtime assets must be committed and have provenance. Source assets can remain locally ignored. Do not modify the previous game.

Record consequential choices in docs/decisions with context, decision, consequences and verification. New product direction or additional asset spending requires owner approval. Do not replace agreed capabilities with placeholders to make checks pass.

For every architecture job, follow [the architecture change procedure](docs/adr-0001.md): establish evidence and a baseline, choose and record the seam, verify behavior and measurable benefit, then check deployment.

Before adding or changing an enemy behavior, follow [the mechanic lifecycle contract](docs/agents/mechanic-lifecycle.md).

## Map and wave authoring

Before adding or changing maps, waves, shared abilities, content schemas, or workbench promotion/loading, follow [the content authoring contract](docs/agents/content-authoring.md). Keep canonical data, workbench controls and runtime game loading aligned; verify the edit → Promote → game-reload round trip.

## Agent skills

### Issue tracker

Issues and specs are local Markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: use `docs/GLOSSARY.md` and relevant records in `docs/decisions/`. See `docs/agents/domain.md`.
