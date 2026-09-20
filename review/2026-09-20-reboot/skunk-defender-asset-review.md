# Skunk side defender asset review

One native ImageGen call, squirrel side sheet used as style/camera reference. Source1536×1024, genuine alpha:1,060,205 pixels fully transparent. Dark colored RGB under alpha0 is retained; composited check `after/skunk-native-alpha-check.png` shows no painted backdrop. All four crops pass standard cutout inspect/import with47–55% clear pixels. No repainting, segmentation, or alpha replacement.

Identity/style: distinct black-and-white skunk, broad striped tail, matching olive tunic/leather boots, warm painted finish, right-facing slightly chest-visible side view. Body retains head/torso/tail and both planted boots at native scale1; no attached arms beyond sleeve sockets. Whole support and throwing arms and separate rock are isolated. No gore/occult content, text or scenery.

Imported `public/art/v2/skunk-side-defender-v1/{rig.json,body.webp,holdArm.webp,drawArm.webp,payload.webp,prompt.txt}`. Exact native prompt also preserved at `assets/source/defenders-v1/skunk-side-prompt.txt`; source `skunk-side-parts.png`. Spec `assets/pipeline/specs/skunk-side-defender-v1.json`.

Anchors are initial manual assembly candidates: body holdShoulder[760,330],drawShoulder[550,340],payloadGrip[699.5,301]. Both arm scales.65; payload.65; body1. Throwing arm grip[310,70] at crop pivot[80,130] yields the declared body-local payload grip. Rock pivot is its lower holding region. All attachments direct body. Support arm layers behind body and throwing arm in front. Exact overlap, gripping pose and motion require root's runtime assembly review; imported status remains candidate. Large curled tail occupies substantial width and should be checked for neighboring-defender overlap rather than trimming it away.

## Front/rear extension

Two native calls referenced the same side sheet. Source files `assets/source/defenders-v1/skunk-{front,rear}-parts.png`, each1536×1024; exact `skunk-{front,rear}-prompt.txt` beside each source and copied to runtime `prompt.txt`. Imported `public/art/v2/skunk-{front,rear}-defender-v1/rig.json` with the same body/holdArm/drawArm/payload names. Both standard pipeline alpha inspection and runtime `validateCutoutDefinition(...,{namespace:'v2'})` pass; all body attachments are inside their crop, no string/rail fields.

Front source SHA256:5fc72e20ca0dd7bb913d1232d0fc16cfec9693ce31b4f5da50c52334be54c227. Rear:608819c36154ed8a5f2f34de8ebab619f403fa3cf92c54c9d61e0e6b3c794402.

Front has both eyes, white forehead stripe, frontal tunic, toe-facing planted boots. Rear has no face, matching back stripe/tunic, heel-facing boots. Both retain the large striped tail, full armless body, two isolated full arms and rock. Native transparent crop fractions40.8–57.8%; no alpha replacement. Body scale1; front arms.58 and rear arms.65 compensate the larger generated arm islands, rock.65. Manual flat anchors and crop-local grip joints are declared.

Limitation: arms still extend laterally in the sheet rather than a strongly foreshortened forward throw. The rear support paw is less explicitly palm-up, but still cupped. Resting arm angle/hand-rock contact and directional throw projection require assembled motion review; these remain candidate descriptors, not motion approval. No runtime edits.
