# 009 — Stable command panel and battle menu

## Status

Implemented for owner review. Supersedes ADR 008's selection-dependent resizing, optional range toggle, repeated rank badges and resource meters. Simulation rules remain unchanged.

## Context

The owner rejected the battlefield resize/flash when selecting a defender, mismatched rank counts, excess HUD labels, and separate pause/settings controls. Requested a stable strategy-game command area and one animated pause/settings overlay.

## Decision

- Reserve fixed header and command-panel grid tracks per viewport: desktop 62/156px, compact landscape 52/112px. Purchase and inspection content occupy the same track. No selection-dependent canvas sizing.
- The [official Warcraft III command-panel guide](https://news.blizzard.com/en-us/article/23229495/finding-the-fun-real-time-strategy-games-for-beginners) describes selection changing commands and stats in the bottom panel. A stable reserved band is our application of that pattern, not a claim about its renderer implementation.
- Use the same single numbered gold/teal rank badge on portrait and battlefield. Multi-digit values fit without adding badge slots; this does not introduce new gameplay levels.
- Show selected combat range automatically; deselection hides it. Stats are label/value rows immediately below the tower name. Lives/waves retain accessible labels, without visible labels or meters.
- One Menu action pauses preparation or an active wave. Continue restores the previous phase. Settings and Menu transition sequentially inside the same fixed wood/gold surface; Quit asks for confirmation before ending the attempt. Background is inert; focus stays in the dialog. Reduced-motion preferences skip page motion.
- Toasts originate at middle-right and rise 110px over four seconds. Independent continuous cubic-bezier curves decelerate movement and accelerate opacity loss late. Reduced motion removes translation.

## Consequences

The command band reserves portrait-sized room even when purchasing. This costs vertical battlefield space but eliminates selection-driven aspect changes. New stats must fit or scroll within this reservation, never enlarge it. Existing economy and upgrade limits are preserved.

## Verification

See `review/2026-09-23-battle-amendments/`. Desktop and compact canvas CSS/backing dimensions are identical before and after selection/deselection. Browser checks cover ranks 1/2, settings and reverse navigation, preparation and active-wave menus, keyboard focus, and toast placement. Unit tests cover shared rank rendering and menu transition sequencing.
