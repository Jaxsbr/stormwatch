# Battle UI review candidate

Baseline checkpoint: `49cfcd4c0f11ff0a3585aaf31b31ce5f0b722720`, committed at owner's request before implementation. New work deliberately remains uncommitted. Baseline screenshots: `../2026-09-22-button-skin/battle-desktop.png`, `selection-compact.png`, plus the owner's annotated current-game capture. These are structural comparisons, not pixel-identical seeded captures.

## Direction / acceptance set before judging

Owner explicitly supplied the scope and reference (Tower Legends), retained the woodland artwork and wood/gold buttons, and delegated creative alternatives. No further direction questions were necessary.

1. Unobvious counters and inspection → weak decision feedback → icons, strong numerals, large portrait, real attribute/upgrade blocks → values readable and correct at 1280×720 and 844×390.
2. Static intrusive selection and ambiguous income → weak connection to the defender → base-first animated selection, optional soft range, source-local coin reward, dismissible forecast → terrain remains readable, selection changes with chosen defender, automatic income retains exact rules.

## Research

Revisited [Tower Legends developer store](https://store.steampowered.com/app/5012660/Tower_Legends/) and [Phaser feature](https://www.phaser.io/news/2026/09/tower-legends-phaser-tower-defense). Also inspected retained trailer frames `../2026-09-20-reboot/reference/video-c.png` and `video-d.png`: large bold gold counters, health bars and compact material-backed resource groups provide clear visual hierarchy. These are direct still observations, not proof of selection-animation timing. Soft coverage and base pulse are our design experiment. No reference artwork copied. Gameplay was not purchased or played hands-on.

## Evidence and iterations

- `donkey-desktop.png`, `archer-desktop.png`, `veteran-desktop.png`: larger portrait, one/two rank badges, real attributes and post-upgrade values.
- `payout-open-desktop.png`: forecast uses shared skin, aligned sum, automatic payment breakdown and Close. Escape tested; collapsed aria state restored.
- `donkey-phone.png`, `archer-phone.png`, `range-phone.png`: compact controls and attributes fit. DOM bounds confirmed action buttons remain inside 844px viewport with 44px height.
- First pass clipped the tall detail tray because the old grid reserved only 102px. Corrected desktop row to 156px and compact row to 106px. Final captures show full portrait/action rows.
- Actual Lantern Pass wave 1 completed with two archers and one donkey: 12/12 lives, 130 gold and 1/8 waves cleared. Archer upgrade deducted 55, displayed 23.8 damage, 3.7 range and 0.72s attack; rank two badge visible.
- `donkey-payout-live.png`: a second real wave-one run captured the source-local illustrated +12 reward above the donkey and a temporary +45 total payout message. No manual deposit or collection action. Recording controls visible in this evidence-only capture.
- Newly generated icons: `public/art/v2/battle-icons-v1/`, native ImageGen prompt and manifest retained. Existing portrait artwork reused at larger size. CSS gives subtle portrait sway, not facial/rig animation.
- Motion clip: `../recordings/gameplay-1790075720301-b1fe8b33.webm`, 20-second canvas recording of the optional range shimmer, base pulse and illustrated selection marker during preparation. Canvas-only capture does not include portrait or DOM coin animations; no claim of independently assessed smoothness.

## Verdict / limits

Implementing-agent judgment: HUD and inspection hierarchy improved; values and selected/disabled controls pass functional checks. Selection animation and presentation remain an owner-review candidate, not a certified fun/quality score. No economy balance redesign, no full campaign replay, physical mobile performance or audio assessment. Animated scene captures are not suitable for pixel-diff scoring. See ADR 008 for alternatives and rule boundary.

Checks: `npm run check`, `npm test` (119 tests / 19 files), `npm run build`. Coverage includes excluding an ongoing/failed wave from the completed-wave counter. Existing large battlefield bundle warning remains.

Review question: does optional range plus the brighter base feel clear enough, or should the range briefly appear automatically on selection?
