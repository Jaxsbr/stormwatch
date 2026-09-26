# 018 — Map boards end with a distinctive boss encounter

**Status:** Accepted by owner, 26 September 2026.

## Context

The holiday chapter is the first completed stretch of a longer expedition. Future maps should reveal through a board, with sequential encounters leading to a final boss map. Winning that boss advances the expedition to the next board. The current optional five-map expansion draft predates this structure and should not determine the first board's contents.

## Decision

- The first board consists of Lantern Pass, Rainstone Crossing, and The Last Lantern. The first two are sequential lessons; The Last Lantern is the board's boss map.
- A board's boss map is required to advance beyond that board. Do not expose a future board as playable before its encounters exist.
- The first board's last wave culminates in one powerful Roadwarden with escorts. Its visible rally gives the boss wave a distinct mechanic and required-defeat objective. It must be the hardest wave of the board.
- Earlier waves build through Turtle slow, Rat guard, and Weasel evasion. Waves one through five should grow into a demanding combined rehearsal while remaining easier than the boss wave.
- Iron Boars are reserved for the next map board. They do not enter the first board or its release-hardening scope.

## Consequences

Ticket 04 authors and tunes waves one through five as the escalation into the finale. Ticket 05 owns the Roadwarden procession, rally, boss-wave peak, and first-board ending. Ticket 06 corrects and releases the first board; it does not start the next board. The earlier five-map expansion material is historical and must be replanned into board-shaped progression before any of it is implemented.

## Verification

At the original 1100-HP/two-party tuning, deterministic first-arrival scenarios cleared the chapter with two build lines and one poor-opening recovery; those outcomes are historical. The owner later requested a 2200-HP boss and five escort parties; under that version the same lines lose before the boss kill. ADR 020 and `wave-plan.md` contain the current checkpoints. Focused boss tests cover rally timing, recipients, required defeat, and escape/loss rules. Browser review confirms the briefing layout, but no full boss battle was inspected. Family playtest must determine whether the revised difficulty is still completable and understandable.
