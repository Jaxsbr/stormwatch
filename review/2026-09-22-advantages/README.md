# Advantage selection review

Baseline: `ff2a7d1a71b4beda46f4d4c2f952f468e0a683a6`, clean worktree. User reference: annotated existing advantage screen and detailed feedback, 22 September 2026. Retain existing illustrated woodland materials; limit implementation to this screen and a reusable button primitive.

## Criteria fixed before editing

1. Remove the shared header/settings, narrative, mission statistics, economy tip, footer hint and selection instructions. Player consequence: less reading before a single decision. Accept when only map identity, actual enemy roster/traits, advantage effects and Back/Play remain.
2. Make effects and actions readable at a glance. Player consequence: younger players can compare the three bonuses without deciphering titles and descriptions. Accept large art plus one concise effect per card, visible selected/focus states, illustrated Back/Play controls, and all essentials fitting 1280×720 and 844×390.
3. Enemy preview derives from positive-count wave groups, including bosses; traits describe implemented behavior. Both current maps contain the same roster; do not imply invented differences.
4. Card selection, Back and Play work using pointer and keyboard; the fourth unlocked advantage fits. Existing simulation remains unchanged.

## Baseline

In-app browser, 1280×720 and 844×390, Lantern Pass, default reach choice, static pre-game screen (no simulation clock). Captures: [desktop](before-desktop.png), [phone](before-phone.png). No physical mobile claim.

Implementer assessment: useful-copy/readability 2/5, confidence high from captures and explicit user feedback; UI identity 3/5, confidence medium (illustrated frames coexist with plain navigation). These are scoped judgments within the existing `review/rubric.json` UI dimensions, not a whole-game score. Unrelated motion, gameplay, sound and performance are unassessed.

## Result

Kept the redesign. Matched captures: [desktop after](after-desktop.png), [phone after](after-phone.png), and [keyboard-selected net card](after-keyboard.png). The removed copy and header are absent. Artwork and a single numeric effect replace the card title/category/paragraph stack. The existing timber atlas now also frames Back and Play via a reusable control; see [decision 006](../../docs/decisions/006-advantage-screen.md).

The roster includes the Roadwarden and derives from actual positive-count wave groups. Unit checks cover both real maps, duplicate groups, a different enemy subset and a zero-count boss. No invented map differences or enemy abilities.

Pointer selection and Tab → Space selection passed, with focus retained on the newly selected card. Play with the supply advantage entered preparation with 220 crowns (175 + 45); Back returned to the expedition picker. The fourth unlocked card and Rainstone title were visually checked using [an isolated fixture](fixture.html): [desktop](after-four-cards-desktop.png), [phone](after-four-cards-phone.png). This fixture imports the real component and never changes progression or saved data. Run it through Vite dev; it is not a production entry point.

Type checking, production build, and 114 tests in 18 files passed. The build retains the existing large battlefield chunk warning. Captures use the in-app browser at 1280×720 and 844×390. Physical touch-device testing and young-player comprehension testing remain unassessed.

Implementer assessment: useful-copy/readability 4/5 (high confidence for layout/copy removal; medium for ease of understanding), UI identity 4/5 (medium confidence). The dominant art and short labels are clearer in paired captures, and all essential choices/actions fit both landscape sizes. These are implementer judgments, not independent or user acceptance. No whole-game rating.

Next review question: are the range and slowing labels clear to the intended young players, or would a small visual demonstration improve their understanding?
