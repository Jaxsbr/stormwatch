# Attached poison and deterministic combat outcomes

Status: implemented capability; campaign activation and final visual acceptance pending.

## Context

Skunk dealt only instant splash damage. Shield and evasion already have focused
simulation lifecycle owners (ADR 037), but adding poison through the existing
projectile damage function alone would incorrectly reuse armor protection and
would not represent a persistent status. Overlapping upgraded and ordinary bombs
also need one deterministic interpretation shared by Game, workbench and adapters.

## Decision

Keep `stone` as Skunk and `armored` as Boar. The optional Skunk catalog
`poisonDamage` specifies damage per tick; the existing upgrade damage multiplier
scales both blast and poison. Shared `abilityDefaults.skunkPoison` owns duration
and tick cadence. The optional Boar catalog `poisonImmune` capability is copied
into spawn state. Omitted catalog fields retain legacy instant-splash behavior.
Missing shared timings normalize to 4-second duration and 1-second cadence without
a content/draft version bump or enabling poison in old catalog entries.

The focused poison module owns application, refresh, schedule and expiry. Game
advances attached poison before movement and projectile resolution. A fresh
attachment first ticks after one cadence. Ticks exactly at expiry are included;
status then clears before that tick's impacts. Floating-point schedule comparisons
use a 1e-9-second tolerance. A weaker impact retains the strongest active damage;
any eligible refresh restarts duration but preserves next tick and cadence. Multiple
same-tick bombs never create immediate or stacked ticks. Once expired, a fresh
weaker application has its own strength and schedule. Poison deaths use Game's
existing exact-once kill, reward and wave-clear path.

At blast impact each recipient independently checks current evasion. A miss avoids
blast and attachment. Shield and armor affect blast; they do not block attachment.
Attached ticks bypass armor, shield and subsequent evasion. Permanent immunity
rejects attachment while ordinary blast and net slow still work. Dead recipients
do not attach poison. Game owns enemy-addressed application, refresh, tick, expiry,
Immune, Shield and Evade events. Enemy poison state drives the future gas adapter;
no Poisoned label is introduced. Shield/Immune cues share Evade's 0.18-second
per-enemy cadence and existing combat-text rendering. A fresh attempt owns fresh
status; pause freezes simulation time and effect ages.

Workbench shared controls edit duration, cadence, tick damage and Boar capability.
Selected-wave and all-change promotion include only the two exposed combat catalog
fields alongside shared abilities, reject stale conflicts, and preserve unrelated
catalog/map/wave changes. General catalog editing remains the agent promotion path.
Playtest uses the same promoted candidate and its identity includes combat edits.

## Consequences

One actor has one poison schedule, rather than one damage source per defender.
Poison ignores routes and operates in shared battlefield coordinates. Route and
progression owners can extend their existing interfaces independently; no board or
new encounter is registered here. Current campaign rosters and discovery are unchanged.
Initial 4 damage/tick is delegated tuning, not an approved campaign balance claim.
Approved gas, bomb motion and Boar battlefield acceptance remain separate gates.

## Verification

Focused real-Game tests use resolved authored content and fixed ticks for AoE
eligibility, armor/shield protection, later evasion, net slow, mixed-strength refresh,
inclusive expiry, simultaneous cues, upgrade shots, pause/replay and exact-once
poison rewards. API tests exercise draft serialization, atomic promotion and uncached
runtime JSON reload; existing attempts retain their immutable settings. Browser
verification and full check/build results are recorded in
[combat capability verification](../verification/poison-combat.md).
