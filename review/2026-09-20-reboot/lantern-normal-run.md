# Independent normal Lantern Pass run — 2026-09-20

Actual Chrome UI play at `http://127.0.0.1:4176/?record`, fresh origin/save, 1280×720 viewport. No fixture, injected state, assistance, supply drop, sales, or source edits. Exact Chrome version not collected. CUA screenshots and accessible UI observations establish actions/outcome; saved canvas videos establish motion artifacts. This report does not claim continuous perceptual playback or audio listening.

## Route and decisions

Title → Begin expedition → Lantern Pass → Supply wagons → Take positions. Initial 220 crowns. Placed squirrel (screen approximately 435,315), skunk (520,385), turtle (770,315), donkey (1080,200), through visible battlefield clicks. These are screen positions, not programmatic grid coordinates.

- Wave 1 at 1×, four level-one roles; recorded and verified save-to-folder before proceeding.
- Upgraded donkey after wave 1; wave 2 at 2×, upgraded primary squirrel during wave 2.
- Upgraded skunk before wave 3; upgraded turtle before wave 4. Waves 3–5 at 2×.
- Added reserve squirrel near (995,390) before wave 5; upgraded it before wave 6.
- Wave 6 began at 2×, switched to 1× before recording. Waves 7–8 entirely 1×. No further construction or spending.
- Final result: 8/8 waves, 12/12 village, three stars, 178 raiders stopped, 131 interest, 166 trading income, 1552 crowns. Return to expedition verified Lantern three stars and Rainstone Crossing / Careful carpenters unlocked.

## Actual saved recordings

All paths relative to project root. The recorder captures battlefield canvas only (1280×556), without the separate DOM HUD. Full HUD screenshots below are separate evidence. Every file was saved by clicking the visible **Save clip to review folder** UI, which displayed its resulting path.

| File in review/recordings | Content | Verified metadata |
|---|---|---|
| gameplay-1789874231567-042a71c1.webm | Wave 1, early normal combat | VP9, 1280×556, 19.959462 s, 6,595,442 bytes |
| gameplay-1789874505143-6dff8522.webm | Wave 6 roadwarden and rats; recording at 1× | Save UI verified; not independently probed in this pass |
| gameplay-1789874580344-e716dd27.webm | Wave 7 Briar and Iron, mixed boars/runners/raiders; seven on trail at start; 1× | VP9, 1280×556, 30 fps nominal, 19.958994 s, 9,305,754 bytes |
| gameplay-1789874634833-ada8fa82.webm | Wave 8 opening, two roadwardens and raiders, 1× | Save UI verified; not independently probed in this pass |
| gameplay-1789874673050-c912f669.webm | Wave 8 busy continuation, eleven on trail near start; front-facing roadwarden receives hits, 1× | VP9, 1280×556, 30000/1001 nominal, 19.958783 s, 7,538,279 bytes; actual frame at 3 s decoded and viewed |

Frame rate metadata is not a smoothness/performance verdict. These files are genuine normal-play captures, not synthetic animations. Wave 7 may end within its 20-second recording; retain its actual pacing when editing. The wave-8 busy continuation is the strongest crowd/impact excerpt.

## Screenshots

Under `review/2026-09-20-reboot/after/`:

- `lantern-wave-six-hud.png`: 1280×720, boss/rat group, 1×, wave 6, selected reserve archer/range.
- `lantern-wave-seven-hud.png`: 1280×720, seven mixed enemies, 1×, wave 7.
- `lantern-wave-eight-hud.png`: 1280×720, two rear-facing roadwardens and rat group, 1×.
- `lantern-wave-eight-busy-hud.png`: 1280×720, eleven enemies and front-facing roadwarden, 1×.
- `lantern-wave-eight-clip-frame.png`: actual decoded 3-second frame of busy continuation; 1280×556.
- `lantern-normal-victory.png`: full result/HUD.
- `lantern-normal-unlock-map.png`: actual post-victory map.
- `lantern-capture-title.png`: initial title capture is **837×720**, before the viewport override was successfully reapplied. Do not label it 1280×720.

## Independent visual judgment

The actual late wave remains legible as a route and battle: large badger silhouette and red equipment distinguish enemies from warm-colored animal defenders; the slowing turtle and throwing skunk retain coherent silhouettes. The decoded busy frame shows a struck front-facing roadwarden with changed warm impact coloration, matching an actual normal encounter rather than only a fixture. View changes are discrete but identity remains recognizable. No obvious detached arm or ballooning cuff was observed in this run's sampled states. Existing fixed-length-arm targeted review remains relevant.

Crowding is still the most material visual weakness: consecutive roadwardens/raiders overlap deeply on vertical bends, sometimes hiding boots and health bars; the first bend also places enemies close to the squirrel silhouette. This is visible in raw HUD captures and must not be hidden by selective trailer cropping. This run used five defenders with comfortable placement; it does **not** disprove the prior adjacent-defender selection ambiguity or establish 844×390 readability.

Scores: tower/defender animation retains targeted **4/5, medium confidence**. Character animation remains **3/5 provisional** until consecutive motion review of these newly saved impacts/gaits; still snapshots plus file existence do not establish every walk/action/impact transition. Framing/readability remains **3/5 provisional**, particularly dense adjacent placement and mobile. Combat feel now has substantially stronger normal-play evidence: economy rewards were meaningful and all waves completed, but sampled observations alone do not justify upgrading every impact/pacing criterion. The missing *saved busy ordinary footage* gate is now resolved; final edited-demo coherence still requires review of the revised artifact. Audio and physical touch are unassessed.

Browser task tab closed and viewport override reset after the unlocked map. No runtime edits or builds performed during the run.
