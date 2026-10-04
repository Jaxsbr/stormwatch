# Activate the accepted Mosswater campaign

Status: accepted by owner playthrough on 4 October 2026; canonical implementation.

## Context

The complete expansion was staged independently of the released first board so
its mechanics, progression, artwork and balancing could be reviewed together.
The owner completed the assembled playthrough and explicitly accepted merge.
The fixed landscape frame and longer 600 ms Boar resistance cue are part of that
accepted version. Painted entrance/exit registration and trail spill were already
captured as a deferred follow-up and remain permitted in this version.

## Decision

Promote the exact accepted `review/mosswater-encounters/game-content.json` into
canonical `src/content/recipes.json`. Preserve the original three recipes,
stable identities, accepted waves/resources, all asset bytes, 600 ms cue and fixed
landscape frame. Record acceptance in the runtime manifests without renaming or
regenerating assets. Keep ordinary profile/save keys and derive promised Skunk
rewards for genuine completed legacy saves. No review profile, replay shortcut or
feedback namespace is included in the production graph or output.

## Consequences

Production now has eight encounters across two authored boards. Complete the
first board to travel to Mosswater and earn Skunk; complete Mosswater 02 to earn
its upgrade. Every victory gates the following encounter; one star is sufficient.
Board travel is explicit and persisted per profile. The final wave must defeat
both independent Roadwardens. Replay and another player's first arrival retain
separate earned capabilities. No simulation, schema, renderer or gameplay rule is
changed by activation.

Owner visual and play-feel gates are complete for this exact assembled version.
Physical-device performance remains unverified; the deferred scenery-registration
issue requires a later bounded implementation and owner art review. It does not
permit moving accepted routes or adding asset spending here. Main merge and
published deployment verification remain the parent's responsibility.

## Verification

See [activation evidence](../evidence/mosswater-activation.md) for canonical and
legacy profile regressions, legal campaign results, all-wave art demand, build
boundary/provenance checks, production browser verification and a disposable
canonical edit-to-promote round trip. The earlier [candidate decision](mosswater-candidate-authoring.md)
remains historical staging provenance.
