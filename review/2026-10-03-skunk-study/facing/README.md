# Skunk release facing correction — 4 October 2026

Status: verified correction on combined candidate `7cef169`; final owner
battlefield acceptance, parent integration and deployment checks remain pending.
Open `/review/2026-10-03-skunk-study/facing/index.html` through the normal Vite
server. The page replays legal commands from the normal-mode Mosswater policy,
seed 42, after earning entry through the preceding encounters. It freezes the
actual Game and Battlefield at the reported first shot (0.7s), route-priority
conflict (6.7s), or a late first release render (6.8s). Step frame and sale use
public Game commands. No resources, actor positions or combat flags are overridden.

## Evidence and bounded seam

The old Battlefield selected preparation targets by largest enemy distance even
on explicit-route maps, whose Game instead chooses least remaining travel time.
Its 0.16-second release lock also retained the idle rig's facing when the first
shot arrived. These are independent presentation defects: the first shot at
0.7s targets left despite the idle right pose; at 6.7s the Game targets enemy 20
at x 0.60 from (1,2), while raw-distance preparation selected enemy 13 on the right.

`Game.targetFor` exposes its existing firing choice as a read-only query. Firing
and preparation consume this single implementation, including effective speed,
explicit-route versus legacy policy, alive/range eligibility and stable-ID ties.
The query does not advance clocks or alter actor state/order. There are no new
content fields, authoring/loading changes or combat rules; a new promotion round
trip is therefore unnecessary for this change.

When a Skunk's shot count advances, the newest live shot establishes facing
before the release lock. Following renders retain that facing during the existing
lock. The held/flying texture, scale and exact launch origin, motion phase,
reduced-motion support, pause and pooled rigs retain their established interfaces.
Existing Squirrel/Turtle release-lock behavior is preserved; their preparation
now also reads the same authoritative target query.

## Reproducible regression and before/after

`npx vitest run tests/defender-target-render.test.ts` executes actual Game,
Battlefield, DefenderRig and projectile meshes. It replaces browser/WebGL/image
I/O; enemy illustrations are unnecessary for facing assertions. The focused
cases isolate preparation priority, first shot, late rendering after the priority
changes, immutable querying, pause and sale of an already-rendered projectile.
The full legal replay renders each simulation tick across all five encounters.

| Same command replay | Skunk releases | Opposite-side releases |
| --- | ---: | ---: |
| Original Battlefield at `7cef169` | 504 | 80 |
| Corrected Battlefield | 504 | 0 |

Both focused tests were run red before the fix. The full replay was also run
against the original renderer and reproduced exactly 80/504, then passed against
the correction. This is a deterministic correctness measurement, not a frame-rate
benchmark; median/p95 frame timings and physical mobile performance are not claimed.
The measured benefit is eliminating all opposite-side launches in this replay.

- `npm run check`, `npm test`: 410 tests across 68 files pass.
- `npm run build`: passes; production boundary verified across 247 files.
- `npm run build:workbench`: passes. Existing large-chunk advisories remain.
- Desktop browser inspection: first shot, cross-route conflict, late frame,
  paused step, replay reset and sale while in flight; no errors or warnings.
- [First shot](first.jpg), [cross-route release](routes.jpg). Diagnostic captures
  contain existing approved/candidate art and introduce no new generated artwork.

Parent integration owns the remaining single-route authoring and board-topology
fixes, combined acceptance and post-merge deployment verification. This handoff
contains only the targeting query, facing correction, focused regression/evidence
and this replay page.
