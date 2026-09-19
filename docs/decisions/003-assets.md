# 003 — Self-contained reviewed runtime assets

**Status:** accepted.

**Context:** Atmosphere is a primary product goal, while the public repository must run without private generator access or machine configuration.

**Decision:** Commit reviewed WebP art, local font files/licenses and a licensed MP3 loop. Keep full-resolution generation sources locally ignored. Record dimensions, hashes, provenance and integration steps. Generated 3D models are optional and were not used. Generation tooling is a production capability, never a game dependency.

**Consequences:** A clean checkout has all required runtime media. Editing art still requires the production workflow or another appropriately licensed source. A successful audio decode does not establish a pleasant mix or seamless loop; listening remains a separate acceptance check. No external runtime font/media requests or service credentials are required.

**Verification:** `../ASSETS.md`, `../ASSET-LICENSES.md`, `public/art/manifest.json`, asset byte checks and clean-checkout evidence.
