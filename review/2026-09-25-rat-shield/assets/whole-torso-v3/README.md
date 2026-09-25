# Whole torso review candidate

Generated with native ImageGen, 25 September 2026. Not approved or referenced by gameplay.

- `*-down.webp`: byte-identical original v1 torso. Both arms and shield remain painted into the torso.
- `*-up.webp`: complete generated shield-up torso, lossless encoding with native alpha.
- `*-leg-0/1.webp`: alpha-bounded crops from a generated pair. No image mirroring or painted anatomy repairs. Both legs share one scale.
- `manifest.json`: native source hashes, crop rectangles, anatomical labels, attachment positions, frame registration and pair scale.
- `hashes.json`: delivery texture SHA-256 hashes.

Exact prompts are in `../../whole-torso-prompts.json`; final side/front torso edits use `../../whole-torso-correction-prompts.json`. The final front guard uses `../../front-guard-prompts.json` (forward outer face, hidden carrying arm, then shield-size correction). Side legs use the correction prompt. Native PNG sources remain locally ignored under `assets/source/reboot/rat-whole-torso-v3/`. The preparation script accepts the native generation directory as a command argument, preserving original files. It crops and encodes only; it does not repaint or remove backgrounds.

Review all directions, frame identity, shield height, paired boot anatomy, hip overlap and small-size readability. Fine-detail consistency is not guaranteed by generation or automated checks. The prior separate-arm v2 candidates are rejected historical evidence.
