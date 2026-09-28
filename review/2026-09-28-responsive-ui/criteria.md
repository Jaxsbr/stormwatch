# Responsive UI round

Baseline revision: c9966092c8a338fb6e050939ac20153d2ec5220d, with the current uncommitted profile implementation. User references: before/user-title.png, before/user-map-portrait.png and before/user-briefing.png. User priorities: remove overlaps, improve mobile sizing/placement and make profile identity more prominent; avatar-only chrome is acceptable. Preserve game artwork and gameplay.

## Fixed acceptance checks
- No identity/action overlap in title, map, briefing, profile, result or battle screens.
- Map cards remain separate and readable at 390×844 and 844×390.
- Primary play action is easy to find; secondary actions use a smaller, consistent size.
- Profile avatar is distinct, framed and visible; nicknames remain readable in profile management.
- Essential touch controls retain at least 44 CSS pixels; narrow menus scroll instead of clipping controls.
- Verify title/map/briefing/profiles and gameplay/menu/result at desktop and mobile landscape, plus menu portrait states. Physical mobile performance and ease of use remain unassessed.

## Baseline critique
1. Observed: profile badge absolutely anchored at bottom right intersects briefing Play. Consequence: identity competes with action and obscures label. Change: avatar-only identity in reserved header space; verify rectangles do not intersect.
2. Observed: fixed map-node positions overlap on portrait. Consequence: level names/unlock status and targets become unreadable. Change: responsive non-overlapping card grid; verify all cards and Back remain visible.
3. Observed: title Swap profile is as visually large as Play while identity is tiny. Change: primary Play column and compact prominent avatar switcher; independent subagent review.
4. Source-based: profile action width/padding rules conflict with later button skin styles; narrow records squeeze names. Change: explicit final responsive sizes and identity above horizontal actions on narrow screens.
5. Source-based: battle settings rows shrink below44px and center-overflow can hide controls. Change:44px rows and safe scrolling.

Rubric focus: title_map_menus and ui_identity; no composite score. Before captures use same profile and encounter; no actors moving during preparation captures. Scenery clocks are irrelevant for static menus. Other art, animation, sound and gameplay dimensions are unassessed in this UI round.
