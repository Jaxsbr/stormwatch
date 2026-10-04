# Iron Boar runtime resistance candidate

Base: `d0b17c828b6673603bf23231c61a6526b51de00f` on the coordinated woodland
integration branch. Contribution: `codex/boar-runtime`. Parent owns synthesis;
this branch does not merge into main independently.

## Approved inputs

The owner selected the third open-mouth snarl, then **Option A — Light tuck**
(“Option A - use it”), preserving original identity and pulling the fist and
shield inward. The owner then said **“approved”** with the motion study open on
4 October 2026. The delivered study uses a 300 ms neutral → brace → neutral
reaction with the original walking legs and refreshed holds during clustered hits.
Study commit: `4fb3b4b`; motion approval record: `e36785d`.

All nine generated session outputs are preserved in the ideas catalogue with
original bytes. Repeating the session inventory finds nine already catalogued,
zero new images, zero missing outputs and no within-sweep duplicates. The full
chat was read and reconciled during the study. Recorded generation prompts are
in `generation-prompts.json`; the selected exact prompt also ships with the rig.
Catalogue verification passes for all 39 entries on this integration baseline.

## Runtime seam

- `encounter-visuals` points the Boar side view to `boar-side-resistance-v1`.
- That descriptor retains the original neutral and both legs, adding only
  `bodyResist` with source scale 0.602 and pivot (699, 919), as in the approved study.
- `Battlefield` passes `clock - immuneAt` to `CharacterRig`; the optional torso
  is visible at ages 0 through less than 0.6 seconds. It uses the same actor,
  position, tint and impact rotation. All leg resources and gait phase persist.
- Every update resets torso visibility, so returning to neutral or reusing a
  pooled rig cannot leave another actor bracing. Existing art readiness and
  disposal own the additional part; no loader or schema extension is required.
- No gameplay/simulation, recipe, inspection, gas, feedback cadence or balance
  changes. Front/rear retain original art. The shared left-facing repair is a
  separate contribution; it must reflect `bodyResist` along with `body`.

To reproduce delivery encoding, run:

```sh
node review/2026-10-04-boar-runtime/build-runtime.mjs
```

The native source is the exact selected catalogue PNG (SHA-256
`df53b4f0b033bd7b49566e1c59c78728c37d434b8ab51de3b14ac03867656913`).
It becomes a 249,916-byte WebP from 1,577,348 native bytes, without resizing.
Decoded alpha is verified byte-identical; encoding settings and delivery hash
are stored in `rig.json`. Neutral/legs reference their existing committed files.

## Reproducible real encounter review

Run `node review/2026-10-04-boar-runtime/server.mjs`. This isolated candidate
adapter uses port 4198; it leaves the parent feedback server untouched. The
adapter serves the same candidate content and promotion boundaries as the
parent fixture.

- Mixed: `/review/2026-10-04-boar-runtime/playtest.html?map=mosswater-04`
- Finale: `/review/2026-10-04-boar-runtime/playtest.html?map=mosswater-05&finale=1`

Preceding wins come from real resolved Game attempts. The fixture replays the
existing balanced strategy's legal command trace, including purchases and wave
starts. It neither assigns coins/HP/statuses nor inserts projectiles. The finale
option stops after legally earning its formation. Play runs at 1× by default;
fast playback and next-cue seeking are explicitly marked. Next side brace seeks
an actual immunity event on a horizontal route segment. Pause freezes simulation
advancement and pose; Step advances one fixed tick.

Original 300 ms candidate desktop browser evidence:

- Mixed, tick 569 / 18.97 s: three Boars, two active immunity cues, one side brace,
  zero attached poison. The selected bracing silhouette is visible with normal
  blast-hit tint in `evidence/mixed-brace.png`.
- Ten subsequent ticks (19.30 s): no active immunity cue, neutral torso restored.
  Normal-speed playback subsequently reached three simultaneously slowed Boars;
  attached poison remained zero.
- Finale, tick 3758 / 123.80 s: six Boars, two active side immunity cues and a
  maximum of two simultaneous Roadwardens. `evidence/finale-brace.png` shows both
  bosses, the brace and the existing impact gas. Prior legal replay also exercised
  Boar net slowing. No poison was attached to Boars at the capture.

The existing crowded `Immune` labels can overlap, and impact gas can obscure the
feet. These are visible taste-review topics, not implicitly approved by the
motion study. Front/rear bracing, equipment-aware mirroring, gas and actual
battlefield acceptance remain open. Physical mobile performance was not tested.

## Validation and review handoff

`npm run check`, `npm test` (**421 tests**), `npm run build` and
`npm run build:workbench` passed. Production boundary passed across 250 files;
review/QA code is excluded from the game entry graph. Existing chunk-size
warnings remain. Focused tests verify native descriptor/leg preservation,
600 ms expiry, repeated cue refresh, pooled-state reset, tint and neutral
front/rear fallback. Poison combat tests continue to pass.

No authoring fields were changed, so no new edit/Promote round-trip claim is made.
The parent will integrate the facing contribution and arrange independent high-
reasoning review before requesting battlefield acceptance or release. Browser
fixture controls were corrected during development and reloaded before final
captures; earlier console history can contain the superseded missing-button error.

## Longer hold revision

The owner requested that bracing remain longer. The runtime and preview now hold
the selected pose for 600 ms (previously 300 ms), refreshed by each emitted
immunity cue. On 4 October 2026 the owner approved the longer timing (“good,
approved”). This approval covers the 600 ms hold; it does not close the remaining
directional artwork, gas/text or overall battlefield acceptance gates.
