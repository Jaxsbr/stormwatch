# Runtime game configuration

Status: resolved

Reproduced the reported boundary error by running the previous refreshGamePreview
under NODE_ENV=development: the QA load-report chunk was reachable. Removed that
rebuild path rather than suppressing the boundary check.

Added runtime JSON loading before game initialization, read-only current-content
routes for local game dev/preview, and a JSON asset for static publishing. Promote
only validates and writes canonical content. Reload is required for changed data;
existing game state retains its snapshot. Failed loads block startup with retry.

Verification:
- Typecheck, production and workbench builds pass; 222 production artifact files
  pass the utility exclusion check. Changed-file formatting and diff checks pass.
- All 253 tests pass against the committed baseline in a disposable copy.
- With the owner's current edited wave, 252/253 pass. The remaining authored trial
  expects original count 20/gap 3; current content has count 5/gap 2.5. Preserve the
  owner content and that baseline expectation, without weakening tests.
- Runtime tests validate actual repeated-group spawn schedule, catalogs, rules,
  new map save IDs, and rejection of failed/invalid loads.
- Middleware regression promotes data and reads it through the runtime route,
  verifying no-store and unchanged compiled game content.
- Disposable browser game remained open while promoting a renamed map through the
  workbench. Before reload it retained Lantern Pass; after reload it showed Runtime
  data proof. Game JavaScript hashes stayed identical throughout.
- Restarted the actual local game and workbench at their existing ports; game
  startup succeeded with the new loader. No user configuration edits were made.
