# Shared game UI and gold

The owner approved the advantage-screen artwork, borders and simpler copy, and requested the same pass across every screen. Currency is now called gold. Baseline includes the prior uncommitted advantage redesign on top of `ff2a7d1`.

Acceptance criteria: remove the map header and footer hints; title shows Play with no subtitle or arrow; every action uses the approved artwork with legible focus/disabled states; simplify settings/pause/results/leave prompts while preserving actionable information and credit access; use gold in every runtime currency label without changing the economy or saves. Check desktop 1280×720 and landscape phone 844×390, real navigation and modal interactions, plus isolated result fixtures. Motion, audio quality and physical mobile performance are outside this UI pass.

Baseline captures: [title](before-title.png), [map](before-map.png), [settings](before-settings.png). Highest-impact issues: inconsistent action styling makes navigation feel disconnected; repeated narrative and tips distract from choices. Existing approved advantage design is the reference. Implementer baseline judgment for consistency/useful text: 3/5, high confidence from captures and owner feedback. Keep/revert judgment follows matched captures, not a composite game score.

## Result and verification

Kept the pass. [Title after](after-title.png), [map after](after-map.png), and [settings after](after-settings.png) match the desktop baseline sizes. The title now offers Play and Settings; the map contains its heading, map choices and Back. No intermediate settings header or footer advice. Currency labels, accessibility names, feedback, payout messages, and current README use gold. Source scan found no remaining `crowns` or arrow-glyph navigation in runtime source/entry HTML; internal coin fields remain unchanged.

Phone checks at 844×390: [title](after-title-phone.png), [map](after-map-phone.png), [battle](after-battle-phone.png), [pause](after-pause-phone.png), [settings](after-settings-phone.png), [leave confirmation](after-leave-phone.png), [build/cancel](after-build-phone.png), [upgrade/disabled state](after-upgrade-phone.png). A long placing label initially crowded Cancel; hide that duplicate label while Cancel is visible (the field instruction and selected card still identify the defender). Final screenshot confirms the correction. [Desktop gameplay](after-battle.png) and [portrait orientation guide](after-orientation.png) were also checked.

Real pointer flow: title Play → map → advantage → battle; pause/resume; settings/back; leave/stay. Supply choice started with 220 gold. In a separate default attempt, construction reduced 175 to 135, upgrade to 80, and sale refunded 61 to reach 141. Upgrade disabled state and all action buttons remained readable. Progress was not edited to stage results.

Victory and defeat use the real shared result component in the isolated [result fixture](results.html): [victory](after-victory-phone.png), [defeat](after-defeat-phone.png). These validate layout and labels, not a new end-to-end victory playthrough. Assisted retry explicitly displays its existing +70 gold/+8 health benefit. Settings retain music credits behind a disclosure.

Production build/type checks and all 114 tests (18 files) passed; existing battlefield chunk-size warning remains. Implementer judgment: consistency/useful text 4/5, medium confidence; matched captures and real interaction support the improvement, while independent review and child-player comprehension remain unassessed. No physical-device performance claim. Existing advantage screen had explicit user acceptance; this broader pass awaits their visual judgment.

Next review question: does the compact in-game control strip preserve enough battlefield space while matching the new menu style?
