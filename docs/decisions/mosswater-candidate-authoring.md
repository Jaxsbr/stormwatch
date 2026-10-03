# Author the complete Mosswater candidate without campaign activation

Status: functional implementation; visual and balance acceptance pending.

## Context

The expansion requires five encounters with exact shared crossing geometry, earned Skunk discovery/upgrades and a simultaneous twin-boss finale. Capability support is integrated, but runtime art and owner play-feel gates are still open. Registering partial content in the released campaign would expose an incomplete destination; synthetic wallets would not establish campaign affordability.

## Decision

Author all five maps in one held, complete AuthoringContent candidate, preserving the first three canonical recipes verbatim. A named local adapter loads this candidate for the actual game, workbench and scoped promotion; profile/draft storage is isolated. The existing progression interface adds Skunk rewards only when the complete ordered Mosswater destination is registered. Legal balance evidence runs the real Game from fresh first-board victories, using normal resources, public purchases and earned upgrades. A focused feedback entry accelerates those attempts without injecting state.

Keep Roadwarden HP, rage, simultaneous arrival and escape-loss rules unchanged. Use starting wallets, fixed wave payouts, coverage and upgrades as the tuning levers. Explain permanent tough-skin immunity and direct/blast/slow counterplay in the briefing and a paused enemy-inspection page. Inspection reads the immutable attempt catalog; simulation owns immunity.

All new maps use explicit routes. Maps 03/04 reference one shared Rainstone single-route layout with unchanged path, dimensions and blocked cells; wave groups carry its stable route ID. Existing simulation interprets this as remaining-travel-time targeting with effective movement modifiers. Legacy distance priority remains limited to the unchanged first three recipes. Acceptance reproduced an erroneous shot at a slowed Boar with 37.3 seconds remaining instead of an in-range Boar with 20.1 seconds remaining when new single routes were left implicit; content must not accidentally opt into that legacy exception.

## Consequences

Normal builds retain the accepted first board and do not activate discoveries or another destination. The local candidate can be playtested and promoted before art acceptance without being mistaken for a released campaign. Conditional discovery IDs and encounter order are an explicit activation contract: renaming/reordering the five maps requires coordinated progression changes. Parent owns promotion to canonical content after the complete art and owner gates. No architecture/schema or combat-rule fork is introduced.

## Verification

See the [candidate evidence](../../review/mosswater-encounters/README.md): eight normal-mode earned wins, contrasting losses, shared geometry and spawn-tick assertions, all-wave art demand, discovery/save/replay checks, and browser authoring round trips on every new map. Required checks/builds pass; deployment, final visual review, owner balance acceptance and physical mobile performance remain unverified.

The targeting regression replays legal campaign commands on both single-route maps, covering actual net-slowed Boars and in-range arrival-order inversions. Full balance evidence is regenerated after the route correction: all eight baseline wins remain, map 04 has six hearts instead of seven and its direct-only policy now wins with four. No tuning changes were made to conceal those consequences; owner acceptance stays pending.
