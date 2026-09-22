# Advantage selection: art and direct effects

The owner requested a simpler encounter setup screen for younger players. Remove the game header/settings, story paragraph, wave/time/heart statistics, economy explanation, footer hint and card selection copy. Keep map identity and an enemy preview that informs the advantage choice.

The screen presents each available advantage as existing illustrated art, a prominent numeric effect and a short label. Full explanations remain accessible names. A warm fill and gold outline indicate selection; keyboard focus has a separate outer outline. Updating selection preserves focus. The fourth unlocked upgrade-discount card uses the same component.

Derive the enemy roster from positive-count wave groups in first-appearance order. Include bosses. Labels describe actual traits, without inventing abilities: no armor, fast movement, damage blocking, and a tough armored boss. Both current maps contain the same roster. Range means shooting range, not a separate line-of-sight mechanic; nets lengthen the slowing duration, not the slowing strength.

Back and Play use `.game-art-button`, with `.game-art-button--primary` for the forward action. The reusable control uses the existing timber/brass atlas with 9-slice borders and a painted-color center, live serif labels, pointer/pressed/keyboard states, and a minimum 48px height in compact landscape. No glyph arrows or new image generation. Reuse this primitive when other navigation screens are revised. Settings belong on the main menu and during play; this pass removes them from advantage selection only, with other screens outside the requested implementation scope.

Screen layout and markup live in `src/ui/advantage-screen.*`. Existing gameplay effects, progression and simulation remain intact. Scoped review and verification: `review/2026-09-22-advantages/README.md`.
