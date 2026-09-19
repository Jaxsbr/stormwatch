# Asset licenses and attribution

## Expedition music

**Treasure Hunter**, by **TAD**, published 24 June 2021 on [the author's OpenGameArt submission](https://opengameart.org/content/treasure-hunter).

- Runtime file: `public/audio/expedition.mp3`
- Original download: [treasure_hunter_0.mp3](https://opengameart.org/sites/default/files/treasure_hunter_0.mp3)
- License: [CC0 1.0 Universal public-domain dedication](https://creativecommons.org/publicdomain/zero/1.0/), with [full legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode).
- Evidence checked 20 September 2026: the author's submission explicitly lists CC0 and describes the work as a simple orchestral loop, with orchestral/adventurer/journey/violin/drum tags. The linked CC0 deed permits copying, modifying and distributing, including commercially, without permission. Public game and repository redistribution is covered by that grant.
- Voluntary credit: “Treasure Hunter” by TAD, via OpenGameArt.org, CC0 1.0. No author endorsement is implied.
- Changes: filename only; downloaded audio bytes are unchanged.
- SHA-256: `379f3f2c6f967afaf4f2bd95027cf123cf6770b8d1f35acea0eb32fbeb6798c2`
- Size: 2,086,369 bytes. MP3, stereo, 44,100 Hz, approximately 256 kb/s. Probed duration approximately 65.071 seconds (MP3 bitrate estimate).

Selection is based on the author-provided orchestral adventure/violin/drum description and loop designation. Full decoding with FFmpeg succeeded. Measured mean level is −13.9 dBFS and peak is −0.1 dBFS. These are technical checks, **not a listening review**. Audible instrumentation, hopeful tone, seamless loop transition, repetition fatigue, and the final music/effects mix remain unverified until listened to in the running game. The author supplies it as an orchestral music loop; its instrumentation has not been independently verified by listening. Playback should begin after a user gesture, respect volume/mute, and pause with gameplay.

## Generated illustrations

The title scene, entity atlas, expedition map, ground texture and forest prop were created for Stormwatch with OpenAI native image generation on 20 September 2026. No third-party reference images were supplied. Runtime files are the five WebP images in `public/art/`. Their dimensions, encoding and SHA-256 hashes are in `public/art/manifest.json`; sprite bounds are in `atlas-layout.json`. Full-resolution PNGs are retained locally, not required to build. See [production guidance](ASSETS.md) for review and prompt specifications. These are generated project assets, not third-party CC0 works; the CC0 dedication above applies only to TAD's music.

## Fonts

Cormorant Garamond and DM Sans were obtained from the official Google Fonts distribution and are served locally. Their SIL Open Font License notices are committed in `public/fonts/cormorantgaramond-OFL.txt` and `public/fonts/dmsans-OFL.txt`. Font files retain the downloaded TrueType bytes; filenames and CSS declare their `.ttf` format. No external font request is made at runtime.

## Sound effects

UI, build, combat, economy and result cues are synthesized by project code using Web Audio oscillators. They do not use third-party sample packs. They supplement the licensed music track.
