# Visual reboot baseline — 20 September 2026

## Capture conditions

Source revision `f7786711d3ee9e0cc2691a0dd94260aa60a232f3`. Read-only inspection; no implementation or asset changes. Root had modified AGENTS.md and added the visual decision/review documents. Production preview `http://127.0.0.1:4174/`, Chrome extension browser 1, viewport override 1280×720; exact browser version uncollected. Viewport reset after captures. Existing save had both encounters unlocked. Normal UI path: Continue → Lantern Pass → default Far-sight card → Take your positions → Bolt watch at canvas (434,300) → Cancel → start wave 1 → start wave 2 at 1×. Ended paused during wave 2 with four enemies visible. Tab 217889579 retained for next phase.

Clocks were not fixed. Still captures establish composition, not deterministic animation poses. Pause was only applied after the final live sample and is not evidence that every visual clock is frozen. Future matched captures need both simulation and visual clocks controlled through an explicit review fixture, alongside normal live play.

## Evidence inventory

- `before/title.png`: illustrated title, typography, CTA.
- `before/map.png`: painted map, mission overlays and surrounding space.
- `before/cards.png`: 2×2 unlocked card selection; footer CTA below initial viewport.
- `before/battle-empty.png`: preparation, 175 crowns, Far-sight, no towers.
- `before/battle-selected.png`: bolt selection and range ring after placement.
- `before/battle-live-a.png`: wave 2 just started, no spawned enemies yet.
- `before/battle-live-b.png`: wave 2, four enemies, 227 crowns, 11/12 village health. This is a live sample, not a busy-combat claim.

## Reference access and observations

Played the embedded native HTML5 video on [Phaser's Tower Legends article](https://phaser.io/news/2026/09/tower-legends-phaser-tower-defense). The visible pause control and advancing 56-second playback counter confirm actual playback. Sampled viewport screenshots: `reference/video-a.png` at 0:06, b at 0:11, c at 0:18, d at 0:25, e at 0:33, f at 0:40. These are screenshots of playback, not a video recording; gait quality, cadence, transition smoothness, latency and sound remain unassessed. No proprietary artwork is imported into the game.

- Map (a): strong multi-biome landform silhouettes, rivers, a decorated wood/gold frame and compact cream display type.
- Grass battle (b/e): horizontal and vertical lanes with rounded right-angle cobblestone bends and a darker edging curb. Continuous grass surrounds the route. Towers expose front and top surfaces. Close-ups make tower mechanics legible, but may be trailer editing; they do not prove a player zoom feature.
- Ice battle (c): horizontal stage fills the video, with scenery at its upper and lower edges; blue beam/circle effects and orange impact forms are visible. This establishes effect shape/color contrast, not timing quality.
- Dark battle (d): same broad horizontal composition and a boss health bar. Its gothic/skull fiction is outside Stormwatch's approved direction.
- Arsenal (f): thick wood/metal framing, dark textured inset, bold condensed headings, clear icon/stat rows and a large preview make an identifiable game UI.

Camera conclusion: borrow the near-top-down, front-visible, horizontal stage composition, not the current rotated diamond tabletop. The evidence does not require copying an exact projection or camera angle.

## Frozen-rubric scores

Scores describe current implementation maturity, not a temporal pass. Missing recording evidence cannot establish smoothness. All dimensions remain below the required 4.

| Dimension | Score / 5 | Confidence | Anchored reason |
|---|---:|---|---|
| title_map_menus | 2 | high | Strong title illustration; map and flat card panels lose the material identity. Card CTA requires scrolling at 1280×720. Result was not recaptured. |
| biome_path | 1 | high | Diamond slab, exposed grid, square beige path elbows, repeating pine border and low-poly props against painted sprites. |
| framing_readability | 2 | high | Battle occupies a tilted board inside a restricted stage; sidebar and tray consume substantial area. Detailed characters remain small. 844×390 not reassessed this pass. |
| character_animation | 1 | high | Source confirms one atlas image per role, sine vertical bob and hit/slow tint; no articulated gait or pose sequence. Smoothness unassessed. |
| tower_animation | 1 | high | Source confirms one sprite with a 2.5% height pulse on cooldown, without mechanical aim/windup/recovery. Smoothness unassessed. |
| ui_identity | 2 | high | Functional hierarchy and selected/disabled states, but rectangular translucent panels, generic glyphs, thin serif headings and decorative copy read as a website. |
| combat_feel | 2 | medium | Normal UI play shows wave pacing, enemy health, range and economy changes. Brief sample only; projectile/impact rhythm, slow readability and audio unassessed. |
| content_pipeline | 1 | medium | Current catalog chooses a single sprite index per role and renderer owns animation behavior. Existing assets/provenance are useful, but reusable animated import and second-example proof are absent in this baseline. |
| demo_coherence | 1 | high | Menu/battle material and framing mismatch remains visible. No actual demo recording produced; screenshots cannot satisfy the completion gate. |

Character/tower structural evidence: `src/render/battlefield.ts` lines 397–415 uses one catalog sprite, cooldown height pulse, sine bob and color tint; `src/content/catalog.ts` maps one atlas index per role. This supports the absence of articulated animation, independently of sampled screenshots. It does not measure animation smoothness.

## Concrete requirements and acceptance checks

1. **Stage composition.** The diamond slab wastes screen area and creates a toy-board impression. Replace it with a close horizontal scene whose terrain continues beyond the playable route, with a quiet upper background and selective foreground framing. Accept when both layouts read as places at 1280×720 and 844×390 and ordinary enemies remain identifiable without zooming.
2. **Terrain and route.** Tile seams and square bends disagree with painterly figures. Build a continuous trail ribbon with rounded elbows, edge blending, restrained stones/grass and distinct entry/settlement landmarks. Accept when no grid is visible in normal play, corners read as traversable turns, and two layouts share a coherent material system.
3. **Character motion.** Rigid image translation cannot convey weight. Prove one complete normal-size walk first: stable head/body identity, alternating planted feet, controlled limb arcs and clean loop seam. Then show hit/action transitions and direction changes. Compare a native generated 8-frame atlas with a reusable cutout rig using the same footprint, duration and playback scale; choose from actual recorded motion, not a contact sheet alone. Reject whole-body bobbing as the primary gait.
4. **Tower motion.** Give bolt, stone and net different readable mechanical cycles: aim/windup, release, recoil or follow-through, and recovery. Accept when the release frame aligns with projectile launch and the mechanism remains readable at normal game size. Trading lodge needs a restrained economic pulse tied to payout, not an attack cycle.
5. **UI identity.** Flat website panels dilute the illustrated world. Establish a small reusable material vocabulary: weathered timber/brass edges, warm selected states, compact robust display type and bespoke functional icons. Remove decorative headings/instructions that compete with play; preserve prices, forecasts, wave state and necessary help. Accept selected, disabled, pause and result states without obscuring the scene.
6. **Combat/demo proof.** Capture actual 1× play through menus into ordinary and crowded combat, with visible impacts, slow state, tower timing and economy decisions. Require recordings and independent review before temporal scores can pass. Maintain existing functional tests and performance limits while increasing art quality.
7. **Reusable pipeline.** Asset descriptions must include identity, view, scale, bounds/pivot, transparent edge rules, animation states/events and review criteria. Validate imported frames/rig parts, and demonstrate a second character, tower and biome without new renderer branches. Keep provenance and rejected-output reasons.

No audio listening was available. No new touch or performance claim is made. The reference clips and baseline stills are enough to choose a composition and art direction; they are not enough to certify motion or trailer readiness.
