# Board/profile infrastructure evidence

Candidate base: remote main verified at `98cfea9538f1006b822421578e6d49731684bd46`
after preserving the initial work from `c8a5c4b` (the measured baseline checkout). No parent checkout edits were copied.
No canonical recipes, new illustrations or discovery activation changed.

## Boundary and benefit

The same resolved board context now supplies progression, save validation,
per-profile restoration, results and attempt rosters. The existing discovery
boundary remains the reward authority. `boards` is optional in content schema 1;
save schema 2 remains readable with or without `viewedBoard`.

The reproducible baseline defect is a one-star finale-only save reporting the
whole first board complete. The candidate reports false until every member has
won. The same public-save benchmark records this result and two-profile parsing:

| Measurement | Baseline | Candidate |
| --- | ---: | ---: |
| Finale-only board completion | true (incorrect) | false |
| Two-profile load median, ms | 0.005125 | 0.010833 |
| Two-profile load p95, ms | 0.010166 | 0.023750 |
| Timed samples after 50 warmups | 300 | 300 |

Node 24.3.0 on the development Mac; these are local public-interface measurements,
not browser frame timings or physical mobile performance. Board resolution adds
small parsing overhead; the intended benefit is correct continuation and unified
policy. Raw samples are in [baseline.json](baseline.json) and [after.json](after.json).
Run `node tools/benchmark-board-profiles.mjs <checkout>` against each checkout to
repeat the same boundary. Correctness cases are stable regression tests; noisy
sub-millisecond timings are deliberately not CI thresholds.

## Automated behavior and authoring

- Public victory/save/profile seams: every member must win, one star is enough,
  out-of-order final completion, first/repeated discovery rewards, no automatic
  travel, profile independence, unknown/locked/unavailable destination recovery,
  legacy defaults/entitlement derivation and retained settings.
- Explicit synthetic two-board fixtures test authored ordering, forward/back travel,
  viewed-board restoration, earned Skunk/upgrade mappings, earlier replay rosters,
  next-board first arrivals, result/save agreement and real Game upgrade availability.
  These fixture encounters/rules are never installed in canonical content.
- Board validation rejects unknown/duplicate/missing encounter membership,
  duplicate board identity, unapproved illustration and invalid/incomplete anchors.
- Working drafts preserve absent legacy collections and pending map/wave edits.
  Selected-wave promotion includes its board, preserves unrelated live/draft edits,
  and rejects stale board conflicts. All-change promotion handles complete membership
  moves and travel order. Rebase retains conflicting comparison bases.
- The disposable API round trip exercises draft reload → real AttemptSession →
  selected promotion → disk → uncached runtime response → progression/save context.
  The running attempt remains immutable; stale retry cannot rewrite disk.

## Browser evidence

In-app browser, 1280×720 desktop and 844×390 landscape-phone viewport simulation.
Matched desktop marker rectangles are unchanged at 58×58. The candidate's phone targets measure 46×46.
Their desktop top-left positions remain `(328.46875,447.578125)`,
`(723.984375,479.375)`, `(912.328125,224.984375)`.

- [Desktop before](map-desktop-before.png) / [after](map-desktop-after.png): same
  reviewed art and marker positions, correct initial locks, no onward destination.
- [Candidate phone](map-phone-after.png): minimum targets remain above 44px;
  keyboard Enter opens the briefing from the first waypoint. A baseline phone
  override did not retain the requested size, so no matched phone comparison is claimed.
- Two test profiles were created through the game UI. Switching and reload retain
  the active profile; [Bob after reload](bob-reloaded-board.png) remains fresh.
- A disposable copy performed Board name edit → Save board draft → page reload →
  Playtest preparation → Promote wave → uncached normal-game load without rebuilding.
  The game displays the promoted name in [legacy completed board](legacy-completed-board.png).
  The draft reload retained the edit (promotion stayed enabled). Playtest loaded
  the real Lantern battlefield; this is preparation evidence, not a completed win.
- A deliberately old schema-2 completed Alice and fresh Bob with an invalid viewed
  board were loaded on that disposable origin. Alice retains all one-star victories
  and Squirrel/Turtle replay briefing. [Recovered Bob](invalid-destination-recovered.png)
  returns to the first board with only Lantern available, independent of Alice.

Screenshots are diagnostic captures of existing art. No art generation, new variants
or new runtime assets occurred in this session; capture exclusions record that fact.

## Integration checklist and limits

The infrastructure candidate keeps the actual three-map campaign. Reserve, but do
not register, `mosswater-reach` and `mosswater-01` through `mosswater-05` until the
parent combines playable accepted campaign, routes, Skunk/Boar and real art.

1. Register both boards with approved names/illustrations/marker anchors and the
   actual ordered encounter IDs. Add the reviewed board illustration catalog entry
   and committed asset/provenance. Keep the existing encounter IDs.
2. Add to the central discovery definitions: `skunk` triggered by `board:
   "first-board"`, `legacy: true`, `replayTower: "stone"`, tower-unlock stone; and
   `skunk-upgrade` triggered by `encounter: "mosswater-02"`, tower-upgrade stone.
   Do this only with ready gameplay/presentation. Public save parsing, result rewards,
   earned upgrades and replay rosters already consume those definitions.
3. Reconcile shared `configuration.ts`, `working-draft.ts`, `main.ts`, scenario and
   promotion edits with route/combat branches. No branch independently bumps schema.
4. Verify real two-board navigation appearance at phone/tablet/desktop, final
   celebration, two profiles and last-viewed restoration, legacy completed Skunk
   derivation, real encounter-2 upgrade, first/repeated wins and full promotion flow.
5. Parent review establishes merge order. Verify deployed game after authorized merge.

Real second-board visuals, owner acceptance, full new-campaign browser wins,
physical mobile performance and post-merge deployment remain pending. Synthetic
fixtures establish infrastructure behavior, not campaign affordability or art approval.

## Candidate checks

`npm run check`, `npm test` (346 tests across 62 files), `npm run build`
and `npm run build:workbench` pass on the refreshed baseline. The production
artifact boundary verifies 241 files. Existing bundle-size warnings remain.

## Selected-wave scope correction

Independent acceptance reproduced a pending-map scope leak: create a map on an
explicit board, select an existing wave, then Playtest or Promote. The selected
board included the unpublished map identity and anchor without its recipe, so
validation failed with `board.levelIds: unknown or duplicate encounter`.

The regression first failed at the public selected-wave seam. That candidate now
projects board membership and anchors onto accepted recipes plus its selected new
map. Other new maps remain in the draft. Known membership moves are not projected
away, so cross-board moves still require atomic all-board promotion. Rebase accepts
promoted metadata while retaining pending membership/anchors and genuine conflicts.

Regressions cover existing-wave Playtest/promotion, selection of one new map with
another pending, unchanged pending drafts and repeat promotion after rebase. The
disposable API round trip now includes a pending map during draft reload, real
Playtest, promotion and uncached game reload; no unpublished map reaches disk.

## Concurrent recipe rebase correction

Acceptance at the combined integration head reproduced successful selected-wave
promotion followed by failed draft rebase when live content added or removed a
recipe on the same board. Both public-seam regressions failed before the fix.
Board snapshots now reconcile recipe membership after recipe scopes have rebased:
concurrent additions retain their live ordering and anchors, deletions lose their
references, and unpublished draft maps retain their membership and anchors.
Comparison snapshots stay valid while preserving genuine stale board conflicts.

The focused regressions include serialized draft reload, repeated selected-wave
promotion and subsequent all-change promotion for both additions and removals,
plus refusal of a concurrent board-name conflict. Full validation passes: type
check, 390 tests across 65 files, game and workbench builds, and formatting.

## Cross-board ownership rebase correction

Final acceptance found that a live move of an existing recipe between boards,
combined with a pending draft map, mixed authored and live memberships during
rebase. The resulting comparison or content snapshot registered a recipe twice.
The supplied public-seam reproduction and two related valid regressions fail
against the previous implementation and pass with this correction.

Rebase now chooses recipe ownership across the whole board collection before
materializing memberships and anchors. Unchanged existing scopes use live
ownership; genuine draft scope edits preserve authored ownership, and conflicting
comparison scopes retain their previous ownership. This makes both snapshots
valid while retaining stale promotion guards. Independent live moves stay intact,
concurrent live additions retain their order/anchors, and pending maps retain their
anchors. Tests cover draft reload, repeat selected-wave promotion, all-change
promotion, and refusals for conflicting board metadata or membership edits.

Validation passes: `npm run check`, `npm test` (394 tests across 65 files),
`npm run build`, `npm run build:workbench`, and `npm run format:check`.
The production boundary still verifies 241 files. Existing bundle warnings remain.

## Live and historical topology separation

Acceptance reproduced a valid live board created by moving another board's member
into it. A pending name edit and unpublished map on the original board then caused
rebase to materialize the new live board without any members. The public-seam
regression failed with `board.levelIds: encounters required` before correction.

Authored content now separates presentation edits from actual membership edits:
pending names and marker coordinates overlay the live ownership topology, while
pending membership changes retain their authored scope. Historical comparison
ownership remains available for genuine stale-board checks. Comparison topology
is materialized from those owners, so a newly introduced live board is absent
when its member belongs to an older board in that comparison. Restoring ownership
also completes any affected existing board that would otherwise lose its last
member; independent live moves remain intact. Content validation is unchanged.
This supersedes the earlier description that all presentation edits protect
historical ownership in authored content.

Regressions preserve a new live board's sole member and markers, pending name and
anchor edits, serialized draft reload, and conflict refusal after a second
unrelated promotion/rebase. A chained move checks historical topology completion.
All 64 assignments of three recipes across existing and new board identities
preserve live ownership for metadata-only drafts and produce valid snapshots.

Validation passes: type check, 397 tests across 65 files, formatting, game build
and workbench build. Production boundary verification still covers 241 files;
existing bundle-size warnings remain.
