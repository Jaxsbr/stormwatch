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

The simulation, content recipe, approved art and gameplay rules are unchanged.
The synthetic QA stress fixture declares all the enemy types it injects so its
art demand matches its actors.

## Consequences

An encounter requests fewer distinct images when it uses a subset of the full
roster. The first playable battle frame has its required art; failed loading is
visible and recoverable. A new enemy or defender view must be added to the
cutout naming map and covered by a demand test. Scene texture disposal remains
with the battlefield, preserving its existing renderer lifetime behavior.

## Verification

The [simulated benchmark](../benchmarks/art-loading.md) uses 4× CPU slowdown,
20 Mbps network throughput and 100 ms latency in headless Chrome. In a paired
five-run comparison, Lantern Pass cold p95 fell from 6.08 s to 3.61 s and its
distinct WebP requests fell from 60 to 21. The Last Lantern cold p95 fell from
5.00 s to 4.57 s, with requests falling from 60 to 47. Warm timing stayed
roughly level. These are simulated desktop measurements, not physical mobile
performance. See [paired raw samples](../evidence/art-loading-after.json).

Focused demand and disposal tests, the full test suite, type checking, the
production build, and visual battle verification cover behavior. The PR gate
compares future changes against main using the same simulation.
