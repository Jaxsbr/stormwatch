# 011 — Review rat shield assembly before gameplay integration

Status: visual candidate withdrawn from gameplay; assembly review pending, 25 September 2026.

## Context

The owner proposed periodic Rat Raider guard, half damage, shield recoil and a thunk. The first implementation generated separate body, arm, shield and leg parts for three views and integrated them directly. The resulting normal-size animation did not preserve the approved rat silhouette or arm placement. The owner rejected it and requested a part assembly preview with adjustable positions and rotations before any new art is added to the game.

## Decision

Restore the original fixed rat rigs and existing gameplay rules. Keep the separated v2 rat textures as review candidates only. Present original and candidate side, front and rear assemblies together in `review/2026-09-25-rat-shield/assembly.html`. The page lets the owner move, rotate, resize and layer each candidate part, overlay the original reference, and export settings for all views. No candidate rig or shield rule returns to the game before the assembled art is reviewed.

The armless body must not retain a painted sleeve cup or shoulder pad. Each detached arm owns its red shoulder and must seat directly into the torso. Match the original rest pose before testing guard, recoil or walking swing.

## Consequences

The game currently retains the original rat appearance and behavior. The shield mechanic, sound and animation remain unshipped. The editable page is an art review tool, not proof of finished motion or balance.

## Verification

The game references the v1 rat rigs again. `npm run check`, `npm test` and `npm run build` pass after the rollback. The assembly page loaded all three views; part position changes persisted across reload, reset restored defaults, JSON export copied successfully, and the browser console had no errors.
