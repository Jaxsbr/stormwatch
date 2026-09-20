# Animal defender prototype delivery

Playable roster: squirrel archer, skunk rock thrower, turtle net thrower and donkey trader. Three native source views per role provide front/rear and mirrored left/right. Characters stand on low tiles and animate independent limbs. The trader currently uses its side view in normal gameplay; its front/rear artwork is available in the directional lab. The latest correction uses fixed bone lengths rather than stretching arms.

Verification: typecheck and production build passed; 90 tests pass, including all 12 delivered rig descriptors and required elbow/grip landmarks. Normal Rainstone wave one held all 12 hearts, paid 7 interest + 12 trade + 28 reward, and turtle upgrade changed damage 5 to 9 and range 2.6 to 3.0. This is one normal wave, not a full-run acceptance.

Evidence: [20-second normal gameplay](after/animal-normal-wave-one-20s.webm), [roster preview](after/animal-defender-roster.png), [independent motion review](animal-defender-review.md). The clip is canvas-only without audio and was captured from the rebuilt production renderer at 1× speed.

## Native generation prompts and delivered assets

- squirrel side: [exact prompt](../../public/art/v2/squirrel-side-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/squirrel-side-defender-v1/rig.json). Native source: `assets/source/defenders-v1/squirrel-side-parts.png`.
- squirrel front: [exact prompt](../../public/art/v2/squirrel-front-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/squirrel-front-defender-v1/rig.json). Native source: `assets/source/defenders-v1/squirrel-front-parts.png`.
- squirrel rear: [exact prompt](../../public/art/v2/squirrel-rear-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/squirrel-rear-defender-v1/rig.json). Native source: `assets/source/defenders-v1/squirrel-rear-parts.png`.
- skunk side: [exact prompt](../../public/art/v2/skunk-side-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/skunk-side-defender-v1/rig.json). Native source: `assets/source/defenders-v1/skunk-side-parts.png`.
- skunk front: [exact prompt](../../public/art/v2/skunk-front-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/skunk-front-defender-v1/rig.json). Native source: `assets/source/defenders-v1/skunk-front-parts.png`.
- skunk rear: [exact prompt](../../public/art/v2/skunk-rear-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/skunk-rear-defender-v1/rig.json). Native source: `assets/source/defenders-v1/skunk-rear-parts.png`.
- turtle side: [exact prompt](../../public/art/v2/turtle-side-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/turtle-side-defender-v1/rig.json). Native source: `assets/source/defenders-v1/turtle-side-parts.png`.
- turtle front: [exact prompt](../../public/art/v2/turtle-front-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/turtle-front-defender-v1/rig.json). Native source: `assets/source/defenders-v1/turtle-front-parts.png`.
- turtle rear: [exact prompt](../../public/art/v2/turtle-rear-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/turtle-rear-defender-v1/rig.json). Native source: `assets/source/defenders-v1/turtle-rear-parts.png`.
- donkey side: [exact prompt](../../public/art/v2/donkey-side-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/donkey-side-defender-v1/rig.json). Native source: `assets/source/defenders-v1/donkey-side-parts.png`.
- donkey front: [exact prompt](../../public/art/v2/donkey-front-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/donkey-front-defender-v1/rig.json). Native source: `assets/source/defenders-v1/donkey-front-parts.png`.
- donkey rear: [exact prompt](../../public/art/v2/donkey-rear-defender-v1/prompt.txt), [runtime rig and crop inventory](../../public/art/v2/donkey-rear-defender-v1/rig.json). Native source: `assets/source/defenders-v1/donkey-rear-parts.png`.

Placement tile: [exact prompt](../../public/art/v2/defender-placement-tile/prompt.txt), [delivery manifest](../../public/art/v2/defender-placement-tile/manifest.json). Native source: `assets/source/defenders-v1/placement-tile.png`.
