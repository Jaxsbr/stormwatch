# 035 — Load battle cutouts from encounter demand

**Status:** accepted.

## Context

Each battlefield previously constructed 19 cutout resources as soon as the
renderer was created. Their rig manifests initiated texture loads even for enemy
types absent from the encounter and defenders unavailable to the player. Scenery
and atlas images loaded on separate paths, and the battle could accept input
before required art appeared. The code showed excess loading work; older-device
causation was not measured.

## Decision

`BattleArt` derives demand from every wave's enemy types and the encounter's
available defenders. It initiates defender and side views first, then directional
views and boss expressions when needed. It owns the selected cutout resources,
their readiness failures and their disposal. The battlefield continues to own
its painted scenery and WebGL context under decision 027, while its `artReady`
method joins scenery and cutout readiness. Battle controls remain unavailable
until required art loads. A failed load offers a fresh retry. Retired attempts
abort pending rig-manifest requests and dispose loaded cutout textures.

The designer workbench Playtest uses the same readiness promise. It locks
placement, wave commands and replay stepping until art and one frame are ready.
On load failure, retry reconstructs the battlefield while preserving the current
Game and attempt evidence; stale load completions cannot unlock a replaced view.

The simulation, content recipe, approved art and gameplay rules are unchanged.
The synthetic QA stress fixture declares all the enemy types it injects so its
art demand matches its actors.

## Consequences

An encounter requests fewer distinct images when it uses a subset of the full
roster. The first playable battle frame has its required art; failed loading is
visible and recoverable. A new enemy or defender view must be added to the
visual catalog from decision 036 and covered by a demand test. Scene texture
disposal remains with the battlefield, preserving its existing renderer lifetime
behavior.

## Verification

The [simulated benchmark](../benchmarks/art-loading.md) uses 4× CPU slowdown,
20 Mbps network throughput and 100 ms latency in headless Chrome. In a paired
five-run comparison with representative actors rendered, Lantern Pass cold p95
fell from 6.43 s to 3.95 s and its
distinct WebP requests fell from 60 to 21. The Last Lantern cold p95 fell from
5.49 s to 5.07 s, with requests falling from 60 to 47. Warm p95 was 0.97 s
to 0.99 s and 1.23 s to 1.31 s respectively, within the CI tolerance.
These are simulated desktop measurements, not physical mobile
performance. See [paired raw samples](../evidence/art-loading-after.json).

Focused demand and disposal tests, the full test suite, type checking, the
production build, and visual battle verification cover behavior. The browser
retry and full chapter/boss replay audits passed after waiting for settled art:
both released all eight WebGL contexts, kept resource counts level across the
two cycles, and recorded no redundant resize calls. The PR gate compares future
changes against main using the same simulation.

The workbench Playtest was exercised against the current-main baseline and the
fixed view with rig-manifest responses delayed by 3.5 seconds. Before the fix,
Start was enabled and clicking it changed the control to `0 on the trail` before
the manifests returned. After the fix, Start and Pause stayed disabled during
loading; a manifest failure showed an explicit retry. Restoring requests and
retrying enabled the same attempt after art settled. Headless `AttemptSession`
replay remains renderer-independent; the view gate also prevents replay stepping
until its current art load succeeds.
