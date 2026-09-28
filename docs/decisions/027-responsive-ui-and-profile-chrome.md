# Responsive UI and profile chrome

## Context
The owner reported overlapping profile/Play controls, a scattered title layout, colliding portrait map cards and inconsistent button/avatar sizing. They authorized a game-wide UI review and avatar-only identity indicators where useful.

## Decision
Keep the illustrated timber controls while defining final responsive layout rules in a presentation stylesheet. Use a prominent portrait switcher under Play on the title. Place avatar-only indicators in reserved screen headings, including the battle header, with accessible nickname labels. Nicknames remain visible in profile management.

Keep the first campaign board as a spatial progress map; use responsive grid flow only for the existing expanded campaign. Keep briefing navigation separate from scrollable choices. Menu actions use48px targets, reduced to44px in short landscape, with explicit profile controls and44px settings rows. Preserve landscape-only battle play and the orientation guide.

## Consequences
Portrait menus remain navigable without compressing battle simulation or artwork. Long choice lists scroll while Play remains visible. Map points remain anchored to the illustrated first board, with compact markers at smaller sizes. Rules remain presentation-only; simulation, progression and saving are unchanged.

## Verification
See the [responsive UI review](../../review/2026-09-28-responsive-ui/report.md) for paired evidence, independent agent assessment, desktop/mobile viewport checks, regression commands and physical-device limitations.

### Owner correction: progress board

The first board remains a spatial progress map with markers anchored at its three
artwork locations. The earlier responsive card-grid replacement misread this
intent. Small layouts now reduce markers to number and stars, preserving the
whole map and its future animation surface. Desktop markers retain names;
accessible labels retain crossing names and unlock requirements. Expanded
campaign layout is unchanged. The profile editor also reserves space below the
nickname input for its focus outline. Verified at 390 × 844 with captures in
`review/2026-09-28-responsive-ui/after/map-points-390.png` and
`create-spacing-390.png`.
