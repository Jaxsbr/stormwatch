# Domain Docs

Stormwatch is a single-context project.

## Read before exploring

- `docs/GLOSSARY.md` is the project’s domain glossary.
- Read relevant records in `docs/decisions/`. Add consequential decisions there, following `docs/decisions/README.md`.
- Before changing gameplay or project boundaries, read `docs/SCOPE.md` and `docs/ARCHITECTURE.md`, as required by `AGENTS.md`.

## Where domain documentation lives

- Update `docs/GLOSSARY.md` when an agreed domain term needs recording.
- Record consequential choices in `docs/decisions/` with context, decision, consequences, and verification.
- Do not create parallel `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` files; use the existing glossary and decision records.
- This is a single-context repo; no nested context or ADR directories are used.

Designer tuning begins in `src/content/recipes.json`; inspect effective settings
through the shared configuration/scenario interfaces. New gameplay abilities need
typed simulation rules and matching presentation tells. Workbench editor, replay,
policy and report changes belong under `src/workbench`, outside the production
entry graph. Utility evidence is distinct from actual family play observations.
See `docs/WORKBENCH.md` for local structured operations and promotion.
