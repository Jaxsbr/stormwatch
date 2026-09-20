# Stormwatch isolated delivery export

- Export: fresh temporary directory, outside the original worktree.
- Snapshot type: direct copy of the current uncommitted worktree; this is not a git clone and no commit was created.
- Latest source inventory (325 paths, excluding generated `node_modules` and `dist`): [source inventory](delivery-source-inventory.txt)
- Exact emitted art inventory: [built art inventory](delivery-dist-art-inventory.txt)

## Initial export source (historical)

- Root/config: 10 files — `.gitignore`, `.nvmrc`, `AGENTS.md`, `README.md`, `index.html`, `qa.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`.
- `src/`: 28 files.
- `tests/`: 12 files.
- `tools/`: 7 files.
- `public/`: 175 files, including all runtime art, audio and fonts.
- `assets/pipeline/`: 45 files, including all 41 pipeline specs, 3 templates and the pipeline prompt.
- `docs/`: 15 selected public documentation files, including all decision records.
- Review fixtures: exactly two JSON files imported by tests:
  - `review/2026-09-20-reboot/rejected-assets/bolt-rig-v1/rig.json`
  - `review/2026-09-20-reboot/superseded-mechanical-assets/v3/bolt-rig/rig.json`

Ignored source art, `.git`, captures, unrelated review binaries, pre-existing `node_modules`, and pre-existing `dist` were omitted from the source copy. `node_modules` and `dist` were generated inside the isolated export during verification.

## Initial export commands and results

Environment: Node `v24.3.0`, npm `11.4.2`.

- `npm ci --offline`: passed; 123 packages added, 124 audited, 0 vulnerabilities.
- `npm run check`: passed (`tsc --noEmit`).
- `npm run format:check`: passed; all checked files matched Prettier.
- `npm test`: passed; 12 test files, 102 tests.
- `npm run build`: passed; Vite `8.3.0` produced `dist/`. It emitted the existing warning that the Battlefield bundle is larger than 500 kB after minification.

## Initial export runtime asset verification

- `public/art`: 164 files, 12,175,595 bytes.
- `public/art/v2`: 157 files.
- `dist/art`: 164 files, exactly 12,175,595 bytes.
- `dist/art/v2`: 157 files across 31 directories: 24 rig descriptors, 7 manifests, 31 prompt copies and 95 WebP files.
- Every public file was found in `dist` with zero byte mismatches. There were no missing or unexpected `dist/art` paths.
- `dist` total: 17,285,544 bytes; public paths account for 175 files, with 2 HTML entry points and 7 Vite bundles added.

## Camera-only refresh recheck

After the initial isolated export, only `src/render/battlefield.ts` was refreshed from the current uncommitted worktree into the existing isolated temporary export. The camera delta was `camera.position.y: H / 2 → H / 2 + 50` and minimum orthographic span `660 → 680`. In that refreshed export, `npm run check`, `npm run format:check`, `npm test` (12 files / 102 tests), and `npm run build` all passed. The build emitted the existing >500 kB Battlefield chunk warning. No additional build ran during the browser measurement.

## Renderer refresh — final gait build

A fresh isolated copy of the current source contains 325 files, including all source, tests, tools, runtime public files, pipeline descriptors and public docs, plus the two required historical rig test fixtures. The source inventory above now describes this refreshed copy. It remains a worktree export, not a committed clone.

Offline install passed (123 packages, 0 reported vulnerabilities). Type checking, formatting, all 110 tests in 16 files, and production build passed. The existing >500 kB bundle warning remains. All 175 public files match emitted files byte for byte. The refreshed production directory is 17294160 bytes, below the 20 MB budget. Performance acceptance remains separately open.

## Committed implementation check

Local commit `45f0a98` contains the implementation, runtime assets, pipeline descriptors, tools and test fixtures. A fresh `git archive HEAD` extraction (without worktree overlays, existing dependencies or built output) passed offline install, type checking, formatting, all 110 tests in 16 files, and production build. It emitted the same production bundle names and the existing size warning. This verifies committed implementation completeness; the final documentation/evidence packaging is a separate pending commit. No remote push occurred.
