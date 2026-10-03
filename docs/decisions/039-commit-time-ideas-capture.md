# 039: Commit-time ideas capture

## Status

Accepted — 3 October 2026; owner-requested commit-time capture mechanism.

## Context

Art brainstorming produces useful alternatives that are easily lost when only the
selected asset is integrated. The owner requested a commit-time reminder and
review mechanism so humans and agents retain those ideas without repeated prompts.

## Decision

A [Husky pre-commit hook](../../.husky/pre-commit) runs the
[staged image check](../../ideas-catalogue/check-staged.mjs) for added, modified
and renamed staged PNG/JPEG images.
Each image must match the bytes of a staged catalogue asset with its metadata, or
have a staged exclusion recording its path, SHA-256 and a specific reason. The
hook prints its purpose and points to `ideas-catalogue/AGENTS.md` on every run.
Unreviewed images block the commit. The catalogue remains an independent local
archive, with no gameplay or deployment dependency.

The Git index is authoritative, including partially staged images, catalogue data
and exclusions. The hook recognizes duplicate bytes automatically; visual judgment
and captions remain with the human or agent. Changed bytes invalidate exclusions.
Existing unchanged images and deleted images require no retrospective review.
WebP assets are outside the requested detection scope, although an identical
catalogue asset in any supported format can satisfy the byte comparison.

## Consequences

New PNG/JPEG art prompts a durable capture decision. Diagnostic screenshots and
fixtures can be excluded without adding noise to the gallery. Catalogue assets and
metadata must be staged together. Package installation enables hooks through
`prepare`; Git hooks remain local checks and can be bypassed by Git’s normal hook
controls. The gate neither calls an AI service nor stages files automatically.

## Verification

[Eight focused tests](../../tests/ideas-capture-hook.test.mjs) cover extension
variants and unusual filenames, captures,
partially staged content, exclusions and changed bytes, mismatched asset hashes,
renames/deletions, and a real blocked-then-successful commit in a temporary repo.
The installed repository hook was also invoked without making a commit. Type
checking, all 332 tests, catalogue verification and the production build passed;
the production artifact boundary remains intact.
