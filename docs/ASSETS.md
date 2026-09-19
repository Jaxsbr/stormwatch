# Asset production and review

Runtime is self-contained. New art may use native image generation; optional pixel3d or another approved model generator is only justified when a model improves the fixed-camera scene. No generated 3D model was needed for this MVP. Do not buy new generation services without owner approval. Keep private access configuration outside this repository.

## Style specification

Dark but child-friendly woodland frontier: weathered timber, slate iron, moss green, deep teal storm light and warm amber lanterns. Sturdy expressive animal guardians and armored animal raiders. Courage and shelter, no occult symbols, magic rituals, gore, skulls or horror. Painterly textured storybook illustration, large silhouettes, restrained small detail. Fixed elevated orthographic view with consistent upper-left light. Avoid glossy plastic or mismatched photographic assets.

The title background reserves the left 45% for text, with mouse/squirrel guardians and a lantern settlement on the right. The expedition map is an elevated woodland landscape without labels, with an outpost and a stone crossing. UI labels stay in HTML, never baked into generated images.

The eight-figure atlas is 4 columns × 2 rows: bolt tower, stone lobber, net tower, trading lodge; rat, weasel, armored boar, badger commander. Request whole isolated figures, transparent background, generous margins, common lighting/view, visible ground contact and no terrain pedestal. Actual output was 1774×887 rather than requested 2048×1024. Inspect actual dimensions rather than assuming the prompt was obeyed.

Ground is a top-down low-contrast moss/soil texture, without trees/paths/landmarks, spread over several cells. The forest prop is one isolated three-pine cluster on real alpha, positioned outside buildable terrain.

## Repeatable integration

1. Write asset purpose, camera, palette, silhouette, alpha/margins and prohibited content into a prompt. Generate into the local ignored `assets/source/` folder; preserve originals.
2. Visually inspect the entire output at full size and in the intended composition. Verify dimensions, genuine alpha, all roles/order, no accidental text, no clipped feet/tails/tips and no forbidden content.
3. Name sources `title-background.png`, `sprite-atlas.png`, `expedition-map.png`, `ground.png`, `forest-prop.png`. Run `node tools/encode-art.mjs` after installing dependencies. It preserves dimensions/alpha, writes WebP and regenerates the hash manifest. This step requires local source PNGs; normal build does not.
4. Update `public/art/atlas-layout.json` and renderer UV bounds together when atlas figures move. Runtime bounds are explicit visible-subject rectangles, not assumed equal cells. Changing sizes also requires shadow, anchor and health-bar review.
5. Test actual terrain compositing at desktop, landscape phone and tablet sizes. Place adjacent towers and moving enemies, select through art, check foreground occlusion and translucent halos. Compare title, map, cards and battle for consistency.
6. Update provenance/licenses and capture evidence. Commit runtime assets. Never commit generator credentials or machine-specific access instructions.

## Review findings retained

The atlas has real alpha (859,895 completely transparent source pixels). Faint alpha noise reaches some cell borders; substantial figures are isolated. Requested 50px margins were not fully met: structures have roughly 8px bottom padding and the boss roughly 13px left padding. Use recorded visible bounds, preserve meaningful outlines and inspect filtering.

The 1254×1254 forest prop has real alpha and intact roots/tips, but its perspective is slightly shallower than towers. It remains background scenery. The 1254×1254 ground texture has visually similar opposite edges but is not mathematically periodic; do not claim guaranteed seamless tiling. The renderer samples it across four-cell spans.

Transparent art is encoded losslessly; opaque backgrounds use WebP quality 88. Runtime art totals about 3.02 MB. Music is unchanged source audio. See the manifest for exact bytes and licenses for attribution.

Audio review has two parts: technical decode/playback lifecycle and actual listening for tone, clipping, loop seam, cue clarity and fatigue. A successful MP3 decode or volume UI test cannot replace listening.
