# Poison combat capability verification

## Baseline and seam

The feature branch starts at remotely verified main `c8a5c4b`. The previous
checkout `dc16046` was stale. Existing lifecycle/shared-ability regression coverage
passed 14 tests. Before: Skunk has no attachment state or poison ticks; Game owns
instant splash damage. After: one focused poison policy owns schedule/application
and expiry; Game owns damage/death, event identity and wave resolution; adapters
consume semantic state. This is a rule capability extension, not a frame-rate
optimization. Its measured benefit is deterministic rule/authoring coverage and
one status source instead of independent defender damage sources.

## Evidence

- Real Game and authoring tests: 12 focused poison tests plus the API round trip.
- Full suite: 60 files, 337 tests passed at the final rule candidate run.
- Browser: edited duration to 6 seconds, cadence to 0.5 seconds, damage to 7;
  draft reload restored all three; Playtest opened the selected wave; Promote
  reported success and disabled promotion as all changes were saved. Restored
  candidate tuning to 4/1/4 afterward. Browser input verification found and fixed
  numeric edits relying on blur; controls now auto-save on input.
- Disposable-file API round trip asserts uncached runtime response and equal
  Playtest/reloaded configuration identity, unchanged encounters and immutable
  running attempts. Catalog conflict retry returns failure without altering disk.
- `npm run check`, `npm test`, `npm run build` and `npm run build:workbench`
  passed. Production boundary verified across 241 files. Vite reports its existing
  large-chunk advisory; no frame-rate claim is made.
- Game-mode uncached startup restored the playable title/profile screen with no
  captured console errors. Workbench mode serves its editor API, so game reload
  was verified using a separate game-mode server.
- An isolated rendering check displays Evade, Immune and Shield using the actual
  CombatText adapter; no console errors. This verifies texture/label rendering,
  not crowded battlefield acceptance.
- Desktop workbench controls visually inspected at 1280×720. This is authoring UI
  evidence, not acceptance of new character motion/gas or crowded combat labels.

## Remaining gates

Parent must review shared-file edits and reconcile route/board contributions before
merge. Skunk gas/bomb adapter and Boar motion/directional/battlefield approvals are
pending in their visual chats; no discovery or second-board activation is added.
Owner play-experience balance acceptance remains pending. Physical mobile and
post-merge deployment are unverified. No generated assets are introduced here.

## Main integration

Integrated remotely verified main `98cfea9538f1006b822421578e6d49731684bd46`
(PR 16). The only overlap was the decision index; both records are preserved.
Updated root and catalogue instructions were read before committing. No generated
art is introduced by this capability; diagnostic captures remain outside the repo.

After integration: check, all 345 tests across 61 files, production build and
workbench build passed. Production boundary remains verified across 241 files.
Catalogue verification passed for 16 entries; staged capture gate recognized all
three PNGs inherited from main as captured. No capture exclusions were needed.
