## Summary

Add the approved local designer workflow while preserving current campaign recipes and family profiles.

```text
canonical recipes → validated frozen configuration → shared Game
                         ↑                       ↑
                  draft / scenario        manual / replay / policy / search
                         ↓
                 scoped local promotion
```

Closes the local spec `.scratch/designer-workbench/spec.md` and implementation tickets 01–06. This repository tracks specs/tickets as local Markdown files.

## Evidence

- **Before:** Wave configuration required implementation edits and production included QA diagnostics.
  **After:** Browser journey edits finale cadence 0.8s → 1s, updates the preview 52.80s → 54.40s, plays the actual battlefield, saves/imports a revision and previews scoped promotion. Accepted recipes remain unchanged.
- **Before:** Utility controls were reachable from the game build.
  **After:** Production graph/artifact verification passes across 220 files; ordinary gameplay boots under `/stormwatch/`, and workbench/QA outputs build separately.
- Type checks, formatting, all 223 tests and game/workbench/QA builds pass. Both review axes are resolved. See `docs/evidence/designer-workbench.md` for verification and physical-device/audio limits.

## Merge Danger

**Door:** two-way

Content remains under source control; promotion is explicit and atomic. No tuning, deployment or new assets are included.

**Blast Radius:** gameplay

Shared configuration/scheduling extraction is covered by existing campaign outcomes and focused real-attempt tests, including unchanged recorded finale losses. Experiments use a separate storage namespace and cannot award family progress.
