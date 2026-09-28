# Responsive UI review — 28 September 2026

The owner requested fixing the profile overlap, improving title placement and reviewing button/text sizing across the game, especially mobile. The supplied screenshots establish the reference defects. This round preserves woodland artwork, gameplay and the landscape battle requirement. Avatar-only screen chrome is authorized; nicknames remain on the title switcher and profile records.

## Kept changes

- Title: primary Play action followed by a compact profile switcher with a prominent brass-ring portrait. Settings is secondary. Independent GPT-6 Astra reviewer implemented and reviewed the title. The requested `astra-6-light` model was unavailable; GPT-6 Astra with low reasoning effort was used, as disclosed before delegation.
- Map: replace fixed-position overlapping cards with three separate landscape cards and a vertical portrait list. Locked labels and star ratings remain visible.
- Identity: avatar badges occupy reserved heading space on map, briefing, profiles and results; battle uses a framed avatar in its header. Remove the floating bottom-right nickname badge responsible for the Play overlap.
- Shared controls: 48px menu actions, 44px on short landscape, explicit profile-row sizes, readable identity above a horizontal action row on narrow portrait screens. Preserve red destructive actions and confirmation dialogs.
- Briefing: keep Back/Play outside the scrollable roster/choice area. Resize advantage artwork so the full choice row fits phone landscape.
- Paused/settings: maintain 44px rows and slider hit areas; safe scroll alignment; place fullscreen and Menu actions alongside each other on short landscape so the footer fits.
- Results: bound reward artwork to its reserved area so it no longer overlaps the reward name. These result/choice layouts were inspected with the actual UI markup in a review fixture, without fabricating campaign outcomes.

## Evidence

Matched static menu comparisons at390×844, same local profile and first encounter:

| Scenario | Before | After |
| --- | --- | --- |
| Title | [before](before/title-390.png) | [after](after/title-390.png) |
| Map | [before](before/map-390.png) | [after](after/map-390.png) |
| First briefing | [before](before/briefing-390.png) | [after](after/briefing-390.png) |

Additional verified captures:

- [Desktop title1280×720](after/title-1280.png), [desktop map](after/map-1280.png), [desktop briefing](after/briefing-1280.png).
- Phone844×390: [title](after/title-844.png), [map](after/map-844.png), [briefing](after/briefing-844.png), [battle preparation](after/battle-844.png), [defender inspection](after/defender-844.png), [paused menu](after/paused-844.png), [settings](after/settings-844.png), [profiles](after/profiles-844.png).
- Portrait: [profile list390×844](after/profiles-390.png), [list320×568](after/profiles-320.png), [creation dialog](after/create-390.png).
- Actual component fixtures: [advantage choices landscape](after/cards-844.png), [choices portrait](after/cards-390.png), [scrolled choices with visible navigation](after/cards-390-scrolled.png), [victory landscape](after/victory-844.png), [victory portrait](after/victory-390.png), [defeat portrait](after/defeat-390.png). Reproduce with `fixtures.html?view=cards`, `?view=victory` or `?view=defeat` through the development server.

Screenshots were captured using the Codex in-app browser on28 September2026, with explicit viewport overrides. PNG dimensions were verified; one baseline resize-transition capture is retained under that descriptive name and excluded from matched comparisons. Runtime UI changes do not depend on the review fixture.

## Acceptance outcomes

| Fixed criterion | Outcome and confidence |
| --- | --- |
| Identity avoids primary actions | Pass, high: header placement; measured briefing badge44×44 at(780,12), Play104×44 at(720,334) in844×390; rectangles do not intersect. |
| Separate readable map cards | Pass, high:390/844/1280 captures show distinct cards and unlock labels. |
| Clear Play priority | Keep, independent reviewer judgment: title hierarchy rated4/5; profile switcher remains subordinate. |
| Prominent avatar and readable profile names | Pass, high:48px menu badge,40px battle badge; title64px/52px portrait; profile names22px and portraits56–60px. |
| Touch sizes and scroll reachability | Pass for inspected actions: title Settings48px, Play62px, profile switcher76px; mobile briefing44px actions; battle speed/Menu/wave/upgrade/sell/close44px. Battle settings music/effects rows48px, mute44px.320px creation dialog has no horizontal overflow and all avatar buttons exceed44px. Escape cancels the dialog. |
| Navigation and component coverage | Actual title→map→briefing→battle, construction, inspection, pause/settings and profile dialog cancellation exercised. Rewards and earned-card states use component fixtures, not a fresh full campaign playthrough. |

Independent UI reviewer found no concrete remaining blockers in the requested final captures. Provisional UI-only rubric ratings: `title_map_menus`4, `ui_identity`4. These do not certify the full demo rubric, animation, sound, fun or physical-device performance. Ratings are agent judgments, not user approval.

## Verification and limits

`npm run check`, `npm test` (49 files,265 tests), `npm run build` and `git diff --check` passed. Build retains its existing bundle-size warning. Production artifact boundaries passed. No new gameplay rules or content schemas were introduced.

The main mobile targets were390×844 and844×390; the320×568 dialog/list was checked additionally. Real mobile browser chrome, virtual keyboards, touch feel, physical device performance and live combat motion remain unverified. The fixture does not establish campaign completion or usability under combat pressure. The whole game received a source review and representative UI-state inspection; not every possible unlock/settings combination was exercised.

Next review question: does the new Play/profile hierarchy feel balanced on the owner's actual phone and tablet?
