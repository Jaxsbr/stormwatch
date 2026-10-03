# Authored boards and profile continuation

Status: implemented candidate; parent review and deployment verification pending.

## Context

The campaign adapter rendered one flat recipe list. A first win on the finale
reported board completion even if another encounter had no victory. Save IDs and
profile restoration had no board context. The expansion needs all-member victory
gates, explicit travel and independent remembered destinations, while retaining
first-board rewards and teaching rosters. ADR 038 owns discovery decisions.

## Decision

Add an optional `boards` collection to schema 1 authoring content. Each board owns
its stable ID, display name, ordered encounter references, approved illustration
identity and optional percentage marker anchors. Its collection order determines
travel order. Validate unique membership of every authored encounter and approved
illustrations; a spatial board requires an anchor for every member. Absent boards
resolve to `first-board`, preserving existing recipe order, illustration and CSS
marker positions. No content or draft version bump and no second-board registration
are needed for this infrastructure change.

Deepen the existing progression boundary. A resolved context connects board gates,
completion, adjacent real destinations, discoveries, earned upgrades and attempt
rosters. Completion means positive recorded victory on every member; one star is
sufficient. Additional stars remain optional. Results report newly completed boards
once, separately from newly earned rewards. The save writer stores the same outcome.
Travel happens only after selection, and only to registered unlocked destinations.

Save schema 2 gains `viewedBoard`. Missing, unknown and locked destinations recover
to the first registered board without dropping valid stars, rewards or settings.
Each profile uses this same parser. Discovery rules can trigger on an encounter or
on whole-board completion; promised legacy entitlements derive through the same
rule. Runtime discovery definitions remain unchanged in this candidate. Skunk and
its upgrade are demonstrated only by explicitly supplied isolated test rules.

Workbench board settings use the same validated metadata. A selected wave includes
its board scope; other board edits remain pending. Travel order and cross-board
membership moves require all-board promotion. Each board and collection order have
stale-scope checks; rebase retains pending edits and their conflicting comparison
base. Catalog/rule edits retain their existing separate promotion workflow. Board
metadata does not change a running combat snapshot or combat configuration identity.

### Pending board intent and dependency snapshots

A live projection cannot express every historical edit: an edited marker belongs
on its authored illustration even if live content moved its encounter elsewhere,
and a pending travel-order edit can still reference a board deleted in live
content. Repeatedly projecting those edits loses the authored values and can erase
stale-scope refusal.

Keep valid dependency snapshots in the existing working draft instead of adding
a separate unchecked intent store. A marker edit that cannot be represented on
its authored board retains that board's encounter ownership. A pending order edit
retains removed board recipes in both authored and comparison snapshots. These
recipes remain draft data; selected promotion of an unrelated scope preserves
live disk content, and historical board/order checks still refuse stale all-change
promotion. Coordinates are never copied onto a different board illustration.

The tradeoff is that a conflicting draft can display its historical board or
encounter rather than the current live arrangement. The author must reload the
latest scope to reconcile it before promotion. Existing version-one drafts and
content validation stay unchanged. Board rebase policy owns these dependencies;
the working-draft adapter retains the recipes that policy requires.

## Consequences

Existing three-encounter gameplay and artwork remain active. Generic navigation,
completion celebrations and replay roster carryover are available when accepted
real content is registered. No arrow points at reserved or nonexistent content.
Old drafts keep absent collections and pending wave/map edits rather than freezing
a derived board too early. Authoring a new map on an explicit board copies the
selected marker as a draft starting point; its position needs author review.

Board illustration additions still require accepted assets and provenance. The
campaign integration must add real second-board recipes, accepted names/markers/
illustrations, the board-completion Skunk rule, and the encounter-2 upgrade rule
together with ready gameplay and presentation. The registry is never a substitute
for that activation gate.

## Verification

See [evidence and integration checklist](../../review/boards-profiles/report.md).
Public progression/save/profile tests cover first/repeated wins, all-member gates,
legacy derivation, profile isolation, destination recovery and roster/result/save
agreement. Board promotion tests and a disposable API/browser round trip verify
migration, scoped conflicts, unrelated edits and uncached loading. Matched captures
preserve first-board marker geometry. A repeatable save benchmark records the small
parsing overhead; correctness rather than faster parsing is the intended benefit.
Dependency regressions cover moved marker edits, removed boards with pending
travel order, serialized reload and repeated unrelated promotions. Disposable API
round trips verify real Playtest, stale all-change refusal without disk writes,
and uncached game reload. Deployment verification follows parent review, safe
merge order and release.
