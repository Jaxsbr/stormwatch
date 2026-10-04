# Accepted Mosswater canonical activation — 4 October 2026

The owner completed the assembled eight-map expansion playthrough and explicitly
accepted merge. Activation copies the exact accepted snapshot to canonical
recipes. Original first-board recipes and all accepted runtime image bytes remain
unchanged. This report describes local activation verification; parent owns main
merge and deployment verification.

## Automated verification

Type checking and all 462 tests in 75 files pass. Production, workbench and QA
builds pass; production boundary verifies 250 files and excludes feedback
namespaces, profile/replay helpers and utility modules. Canonical data equals the
accepted snapshot semantically, including the original three recipes; whitespace
formatting follows the canonical source convention. Focused regressions cover all
fresh gates, actual legal wins, twin-boss completion, independent profiles,
legacy version 1/2 migration, saved travel and correct upgrade/replay rosters.
Seven runtime manifest/rig checks verify owner acceptance, hashes, byte counts,
alpha and actual dimensions. The Poolbanks dimension record was corrected to the
observed 1672×940 for both source and unchanged runtime bitmap.

## Production browser and canonical promotion

The ordinary production artifact was served on separate disposable origins.
A fresh profile begins with only Lantern Pass available and its Rat roster;
nickname/avatar survive reload. Two independently created profiles remain listed.
A version-1 fixture serialized from actual legal first-board wins preserves all
three earned one-star records, opens Mosswater, and leaves encounters 2–5 locked.
Travel to Mosswater survives reload. The first encounter opens with 180 crowns,
12 hearts and three waves. Completed eight-map records from legal Game wins make
all encounters replayable. The Twin Wardens briefing includes Rat, Weasel, Boar
and Roadwarden; ordinary preparation shows 400 crowns, 12 hearts and five waves.
Pause and quit operate through the ordinary menu. Browser fixtures are disposable
save setup outside the production artifact; this does not claim eight browser
wins. The legal campaign tests verify actual wins and both finale boss kills.

In a disposable canonical checkout, Poolbank Muster starting crowns changed from
240 to 241. Draft reload retained the edit; Playtest displayed 241; Promote wave
reported success; a newly bootstrapped ordinary game displayed 241. A recursive
JSON comparison found exactly one promoted difference, `/levels/6/startCoins`.
The disposable source was then restored to the accepted snapshot. Canonical
repository JSON remains semantically identical to the accepted snapshot and its
original three recipes match the integration baseline. The promotion used the
normal canonical file API and ordinary game runtime loader.

Diagnostic captures: [Mosswater gates](mosswater-production-gates.png),
[finale preparation](mosswater-production-finale.png), and
[promoted ordinary game](mosswater-canonical-roundtrip.png).

## Headless cold/warm readiness

The purpose-built art benchmark ran the five Mosswater levels with two cold and
two warm samples per level, without a baseline. Simulation used 4× CPU slowdown,
100 ms latency and 2,500,000 bytes/s bandwidth. All 20 samples report zero missing
art. Values below are the tool's first-render summaries in milliseconds; with
only two samples the reported p95 is descriptive, not a statistical guarantee.

| Map          | Cold median | Cold p95 | Warm median | Warm p95 | Image requests |
| ------------ | ----------: | -------: | ----------: | -------: | -------------: |
| mosswater-01 |      4171.6 |   5666.6 |       589.9 |    599.7 |             25 |
| mosswater-02 |      2080.3 |   2325.9 |       618.3 |    661.8 |             22 |
| mosswater-03 |      2264.2 |   2267.5 |       577.2 |    621.0 |             23 |
| mosswater-04 |      4902.5 |   4921.1 |       703.4 |    712.1 |             44 |
| mosswater-05 |      5580.4 |   5656.4 |       698.1 |    720.6 |             57 |

This is headless simulated readiness, not physical mobile performance. Raw logs
remain temporary; CI thresholds and default benchmark levels were unchanged.
Deployment is not verified locally and remains the parent integration task.

## Acceptance limits

Owner visual, animation and play-feel acceptance is complete for this version.
Physical-device performance remains unverified and requires real device access.
Painted entrance/exit registration and trail spill remain an explicitly deferred
follow-up; no measured-registration claim is made. No additional art was generated
or purchased. Historical study screenshots and numeric checks are not substituted
for the owner's completed assembled playthrough.
