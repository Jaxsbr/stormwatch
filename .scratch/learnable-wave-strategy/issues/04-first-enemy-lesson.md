# 04: Ship the first approved enemy lesson in-game

**What to build:** Complete the Rat Raider guard as a playable lesson in Stormwatch. The owner-approved shield mechanic, art and sound already ship; the wave teaching and encounter verification remain. The player sees a clear tell, encounters the behavior in the approved wave plan, can respond with more than one useful tower choice, and can understand the resulting combat outcome.

**Blocked by:** 03 — Plan the two-map learning arc for remaining content changes.

**Status:** ready-for-agent

- [x] Implement the Rat Raider guard rule and reviewed whole-torso art in the real game. Existing wave groups already contain rats; intentional lesson placement is still open.
- [x] Show shield-up/down states and a guarded-hit thud; guarded hits take half tower projectile damage and do not shake or flash.
- [ ] Include the behavior in its approved low-risk introduction and practice placement in the map plan.
- [x] Verify guard timing, pause, projectile damage, hit cue, and absence of recoil through focused real-game and render tests.
- [ ] Verify authored wave progress, leaks, and at least two useful tower plans after lesson placement.
- [ ] Review the lesson in normal-speed browser play and capture any change needed before applying this approach to another enemy.

## Reconciliation

The mechanic is shipped at `8dd18eb`, ahead of the planned wave arc. Visual assembly was owner-reviewed. A live browser check showed it in Lantern Pass, but the normal-speed teaching result on both maps and the final sound mix are not established. Do not close this ticket until those checks and the authored introduction/practice sequence are complete.
