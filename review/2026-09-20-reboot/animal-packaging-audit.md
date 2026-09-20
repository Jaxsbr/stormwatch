# Animal asset packaging audit

Date: 20 September 2026. This is a read-only audit of the current worktree. No
source, asset, browser or build changes were made.

## What the runtime currently uses

`src/render/battlefield.ts` loads four enemy side rigs, twelve enemy directional
rigs in total, four defender side rigs, front/rear rigs for squirrel, skunk and
turtle, the placement tile, both biome plates and the cobblestone material.
`src/main.ts` also loads enemy body portraits and `src/render/portraits.ts` loads
the four defender portraits. These resolve through `import.meta.env.BASE_URL` to
`public/art/v2/`; the legacy `public/art/sprite-atlas.webp` remains a fallback
and supplies older menu metadata.

The v2 directory currently contains 24 `rig.json` descriptors, seven manifests,
and 157 files totalling 9,152,386 bytes. A read-only descriptor walk found no
missing source, prompt or delivery texture references. SHA-256 checks passed for
the referenced native sources, every per-part delivery texture and the base
`public/art/manifest.json` assets. This confirms internal provenance and path
consistency in the current worktree; it does not establish that the files are in
a clean checkout.

The donkey front/rear descriptors are present for provenance and future use, but
the active renderer deliberately sets the trading lodge's front/rear resources
to `null` and loads the side resource only. The delivery note currently lists
all three donkey views as delivered without distinguishing this runtime choice.

## Release blockers and evidence gaps

1. **Required runtime art is not staged.** `git status` reports `?? public/art/v2/`
   and `git ls-files public/art/v2` reports zero tracked files. `.gitignore`
   ignores `assets/source/`, as intended, but does not ignore `public/art/v2/`.
   The generated animal/biome runtime bundle is therefore untracked rather than
   safely packaged. A clean clone or Pages checkout that contains only committed
   files will miss the rigs, prompts, descriptors, biome plates, material and
   portraits. Enemy rendering can fall back to the tracked atlas, while towers
   hide their legacy sprite as soon as a defender is expected, so missing v2 art
   can make placed defenses invisible.

2. **The clean-checkout evidence is for an older revision.**
   `docs/evidence/clean-checkout.md` records revision `ed66cb5...`, six test files
   and 28 tests, before the current animal bundle existed. It cannot prove the
   current v2 assets are present. `docs/evidence/asset-bytes.json` enumerates the
   older base art/audio/font bundle and omits all 9.15 MB of `public/art/v2/`.
   The 3.02 MB runtime-art statement in `docs/ASSETS.md` is consequently stale
   for the current animal presentation. Regenerate byte accounting and clean
   checkout/build evidence after the v2 files are staged.

3. **Public provenance coverage is incomplete.** The v2 descriptors carry source
   paths, source hashes, delivery hashes and encoding details, and ignored local
   source notes retain the native-generation prompts. `docs/ASSET-LICENSES.md`
   still documents only the five original WebP images, however; it does not
   enumerate or state the provenance of the animal rigs, portraits, biome v2
   plates, material, placement tile or advantage icons. The ignored source tree
   is intentionally unavailable to a clean checkout, so the committed review
   and license guidance should carry the necessary high-level provenance.

4. **Historical v3 hits are not active runtime references.** There are no
   `public/art/v3` files and no `art/v3` loads under `src/`. The remaining
   `art/v3` strings are in archived mechanical specs, rejected/superseded review
   descriptors and a validation fixture; `docs/ART-PIPELINE.md` explicitly marks
   those tower rigs as historical. They should remain clearly labelled so a
   future importer or reviewer does not mistake them for current package inputs.

5. **Several review links name removed intermediate assets.**
   `review/2026-09-20-reboot/biome-ui-assets.md` links to
   `public/art/v2/woodland-clearing-v2/` and
   `public/art/v2/rainstone-riverbank-v1/`, while the current directories are
   `woodland-clearing-v3/` and `rainstone-riverbank-v2/`. The animation spike
   review similarly names `rat-walk-v2` and `bolt-action-v2`, which are absent
   from the current v2 directory. These are documentation/review staleness,
   not app fetches, but they make provenance and acceptance links misleading.

## Runtime path conclusion

The application code uses `BASE_URL` for dynamic v2 fetches and the Vite config
sets `base: "./"`; the existing built HTML/CSS shows Vite rewriting static
root-looking URLs to relative output paths. The source paths are therefore not
the primary packaging failure. The release must still be rebuilt after staging
v2 and checked for `dist/art/v2/**`; the currently ignored `dist/` is not clean
checkout evidence and may be stale. Review fixtures use root-relative `/art/v2`
URLs intentionally for the local Vite origin and should not be treated as the
production app's packaging contract.

## Recommended release gate

Before calling the animal presentation cleanly packaged, stage the complete
`public/art/v2/` directory, keep `assets/source/` ignored, regenerate the asset
byte/provenance records, and run a fresh clone's check, test, build and production
smoke check. The smoke check should request the two biome plates, cobblestone,
placement tile, all enemy directional rigs and the four defender side rigs from
the built `dist/art/v2/` tree. Mark the donkey front/rear files as staged but
currently unused, and either update or label the stale intermediate review links.
