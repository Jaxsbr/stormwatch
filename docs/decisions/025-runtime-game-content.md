# 025 — Load game configuration as runtime data

## Context

Source-only promotion left an existing compiled preview stale. Rebuilding inside
the workbench was a poor workaround: Vite inherited the server's development
process environment and retained the QA load-report module, correctly failing
the production boundary. The owner explicitly requested loading data without
recompiling the game.

## Decision

Load validated, uncached `game-content.json` before importing the game entry.
Install one immutable content snapshot before catalogs, level registration,
rules and save whitelists initialize. A running attempt retains its snapshot.
A reload fetches current data. Invalid or missing content blocks startup and
provides a retry action; never silently use the bundled baseline in the browser.

Local game dev/preview servers expose only a read-only JSON route backed by the
canonical recipe. Workbench promotion remains a separate validated atomic write.
Remove rebuild callbacks and build-error UI from promotion entirely. Static
production builds emit a JSON asset with the code; deployed content can be updated
by replacing that asset without changing JavaScript. URLs remain subpath-relative.

## Consequences

Tuning content no longer invokes compilation or disrupts active play. The public
game remains statically hostable and contains no authoring or QA modules. Source
baseline imports remain for deterministic tools/tests, but browser startup must
successfully load the external snapshot. Code or schema changes still require a
normal software build. Publishing is separate from local promotion.

## Verification

Reproduced the exact production-boundary failure with development NODE_ENV.
Runtime tests cover repeated five-rat wave timing, catalogs/rules, new-map save
IDs and failed loads. Middleware tests promote then read changed data with an
unchanged game artifact. In two disposable browser tabs, promotion while the game
was open preserved the existing page, then reload showed the promoted map name.
JavaScript hashes remained identical. Production builds include game-content.json
and pass the utility-module exclusion check.
