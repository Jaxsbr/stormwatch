# Iron Boar resistance torso

Status: side pose and motion accepted; directional extensions and battlefield taste review pending.

## Context

The owner wanted frequent poison rejections to read as deliberate resistance,
while preserving the existing Iron Boar identity. After expression and bracing
comparisons, the owner selected the third snarl and then Option A — Light tuck.
On 4 October 2026 the owner approved the neutral → brace → neutral motion study.

The owner subsequently requested a longer brace in the battlefield preview.
The revised candidate doubles the hold to 600 ms. The owner approved this longer
hold on 4 October 2026 (“good, approved”). Other visual acceptance gates remain open.

## Decision

Preserve the original neutral torso and walking legs. Add the selected complete
side torso as `bodyResist`, following the existing alternate-torso pattern.
The character rig displays it for 600 ms from the simulation-owned `immuneAt`
timestamp. Repeated emitted immunity cues extend the hold without intermediate
neutral flicker. The simulation still owns immunity and cue cadence; this pose
has no effect on damage, movement, nets or poison application.

## Consequences

Both torso images share the original actor and legs, so cue changes allocate no
new rigs or leg meshes. The new side descriptor reuses all original neutral and
leg textures; its extra resource follows existing encounter readiness/disposal.
The selected native image is registered with the same fixed scale and pivot as
the approved study. No generated whole-body walking frames or artwork warping
are introduced. Original front/rear views remain until their bracing art is
reviewed. A separate shared facing fix must reflect every torso variant together
without mutating shared textures. Existing splash gas and `Immune` text stay as
provided by the combat implementation; this is not approval of those visuals.

## Verification

The focused rig tests cover cue expiry, repeated cues, pooled-state reset,
unchanged leg resources, hit/slow tint and neutral front/rear behavior. Real
resolved encounter playback demonstrated the brace in mixed and twin-boss crowds,
normal net slowing and zero attached poison on Boars. Checks, 421 tests, game and
workbench builds passed. See the [runtime evidence](../../review/2026-10-04-boar-runtime/README.md).
Deployment and owner battlefield acceptance remain pending coordinated integration.
