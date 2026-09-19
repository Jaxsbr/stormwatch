# Acceptance report — Stormwatch MVP candidate

Recorded 20 September 2026. **Candidate under final verification.** An implemented feature is not automatically a passed acceptance check. Physical mobile performance and actual listening are unavailable in this session and remain unverified; the approved scope allows a desktop-verified candidate with these gaps explicitly reported.

## Capability mapping

| Criterion | Working example / evidence | Status |
|---|---|---|
| Complete screen/game path | Title, map, card choice, eight-wave Lantern Pass, result/retry; browser evidence and captures | Browser review in progress |
| Second encounter | Rainstone Crossing data, two deterministic winning strategies | Rule-verified; browser review pending |
| Combat | Bolt, stone splash, net slow, rat/weasel/boar/badger, upgrades, supply drop | Tests pass; browser interactions observed |
| Economy | Interest cap/rounding, atomic payout, lodge upgrade, sell, paused/preparation rules | Tests pass; browser payout observed |
| Cards/progress/save | Three initial modifiers, thrift unlock, best stars and settings validation | Tests pass; reload review in progress |
| Hybrid visual foundation | Actual 3D tiles, cropped billboard sprites, shadows, rain and effects | Desktop captures; responsive fix under review |
| Mouse/touch/layout | Desktop pointer interaction, phone/tablet layouts | Desktop in progress; physical touch unverified |
| Audio | Committed licensed loop, cue family, gesture and volume lifecycle | Decode/source license verified; actual listening unverified |
| Extension proof | `48c9a4a` → `3fbd136`: only new level file and registry changed | Passed |
| Static/build/tests | TypeScript, production bundle, 28 focused tests | Passed before final formatting; final run pending |
| Desktop performance | Separate seed42 stress fixture, 3×180s after10s warmup | Pending measurement |
| Physical mobile performance | iPhone12-class Safari / Pixel6-class Chrome | Unverified: devices unavailable |
| Loading/bytes | Runtime art about3.02MB; local profiled HTTP procedure | Final measurement pending |
| Clean checkout | README-only install/check/test/build/serve | Pending |
| Public repository | Personal owner, outgoing files/history scan | Scan clean to date; publication pending |
| Maintainability/handoff | Architecture, ADRs, roadmap, glossary, agent and asset guidance | Written, final review pending |

## Evidence interpretation

Deterministic strategies take roughly257–278 combat simulation seconds, excluding planning. See [balance evidence](evidence/balance.json) and test scenarios; these establish two viable lines per encounter, not complete balancing or observed children's playtime.

Artificial stress reports raw RAF intervals rather than capped simulation dt. Normal player flow and artificial maximum population are different tests. Emulated viewport screenshots cannot establish physical touch or mobile GPU behavior. Local request-delay/bandwidth shaping does not reproduce a mobile radio network.

## Remaining sign-off

A person with the target phones should run the procedure in [VERIFY](VERIFY.md), and listen to the music loop/mix in the actual game. Record failures and measurements before promoting this candidate to fully verified release. No claim of passed physical-device or audible-mix checks is made here.
