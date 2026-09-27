# Promote must refresh the local game preview

Status: resolved

## Reproduction and cause

Source contained five raiders per repeated group, gap 1.75, delayBefore 5 and four repeats. The production bundle still contained the original count 20 and gap 3. A source-to-bundle assertion failed before rebuilding. The local game server was Vite preview over dist; source-only promotion cannot update that compiled snapshot. Browser DOM inspection after the fix confirmed the game loaded the rebuilt bundle.

## Fix

The browser promotion endpoint now awaits a local production build after its atomic source write, before success. Both development and built workbench servers wire the refresh callback. Build failure is reported explicitly alongside the saved content; it is not presented as a successful game refresh. Published deployments remain separate.

## Verification

The new regression test builds a disposable game, promotes different spawn settings through the actual middleware, then checks the emitted game includes those settings. It failed before the callback was connected and passes afterward. A second test covers refresh failure. Typechecking, both builds, production boundary and changed-file formatting pass. The original source-to-bundle check passes with the user's settings; the game URL loads that bundle.

The full suite with the user's promoted content passes 249/252 tests. Three existing authored-balance expectations still describe the original wave: rat-wave-trial, lantern-pass-strategy, and a recorded Lantern growth line. The user content is preserved; these balance expectations were not weakened to make checks green. A disposable full-suite run with the committed baseline config passes all 252 tests. The first disposable run lacked artwork fixtures; after supplying those fixtures, the complete baseline run passed.
