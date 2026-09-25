# 014 — Progressive discovery and a simple build economy

## Status

Owner-directed and implemented for playtesting, 25 September 2026. This decision supersedes the MVP's interest, economy-building, supply-drop, and immediate support-card commitments. It also supersedes decision 013 where that record preserved the previous economy.

## Context

Lantern Pass currently presents four structures, four prebattle advantages, upgrades, a rescue ability, savings interest, and an income building before the player understands the basic tower-defense loop. The first Rat Raider lesson showed that positioning and guard timing are already enough material for one encounter. The owner wants the campaign to reveal systems through victories and bosses, and wants frequent building choices driven by combat and small fixed wave rewards.

## Decision

- Lantern Pass offers only the Squirrel archer. The simulation enforces encounter tower availability, so hidden structures cannot be built through another adapter.
- Squirrel upgrades remain locked until the first Lantern Pass victory. That victory records the `squirrel-upgrade` unlock and shows a dedicated reward panel explaining how to use it. Existing Lantern Pass victories derive the same unlock when an old save loads.
- Encounter previews show enemy information immediately. The advantage picker appears only when the save contains explicitly earned advantages. No advantage is available at the beginning of the campaign; later maps or bosses may award them.
- Remove savings interest, the Donkey income structure, the early-supply advantage, the payout forecast, and the targeted supply-drop ability. A wave boundary grants only its fixed authored reward. Enemy kills remain the other source of attempt coins.
- Lantern Pass begins with 100 coins. A Squirrel costs 40, allowing two immediately. Rat Raiders award two coins in Lantern Pass, so ten kills fund the third Squirrel during wave 1. Fixed rewards of 25–38 coins combine with combat drops to support roughly one or two additional Squirrels between waves.
- Reduce the Squirrel's base damage from 14 to 10 and its base attack interval from 0.9 to 1 second. Its existing upgrade multipliers remain available after the unlock.

## Consequences

The first encounter teaches placement, Rat guards, spending earned coins, and wave cadence with one defender. Victory adds one new action instead of presenting another modifier choice before the base action is understood. Rainstone Crossing continues to expose the three combat defenders, while the removed economy and rescue systems no longer appear in content, simulation, or battle UI. Advantage definitions remain dormant extension content until a later reward decision assigns unlocks.

The new values are a playtest baseline rather than final balance. In particular, the owner should test whether two Squirrels can survive the opening long enough to buy the third, and whether later waves continue to create useful placement decisions.

## Verification

Focused tests cover encounter tower restrictions, upgrade locking and unlocking, save derivation, fixed-only wave rewards, the first-map coin cadence, and a Squirrel-only five-wave completion. Type checks, the complete test suite, the production build, and a browser playthrough verify the integrated flow.
