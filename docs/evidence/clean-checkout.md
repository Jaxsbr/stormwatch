# Clean-checkout evidence

20 September 2026. A new local clone of committed revision `ed66cb5a7c3163bb0234a267168954b1f5b33a61` was created in an empty temporary directory, without ignored asset sources, installed dependencies or environment files. No private generator access was used.

Environment: Apple M4 Pro, 48GB RAM, macOS 26.6.2; Node 24.3.0, npm 11.4.2.

| Command | Result |
|---|---|
| `npm ci` | Passed;123 packages installed,0 audit vulnerabilities |
| `npm run check` | Passed |
| `npm run format:check` | Passed |
| `npm test` | Passed;6 files,28 tests |
| `npm run build` | Passed; Vite 8.3.0, production game and separate QA page |
| `npm run preview -- --port 4177` | Server started successfully; browser smoke check recorded separately |

The build emits a warning for the approximately568KB uncompressed renderer/Three.js shared chunk (about144KB gzip). This is a bundler size heuristic, not a failed build or the measured loading budget. It remains visible rather than being hidden by a raised warning threshold.

The public repository also completed a fresh Linux GitHub Actions checkout/install/check/format/test/build and Pages deployment at `c4a1d5237e13ac3f462d8bbc8ab4be678475638f`: [successful run](https://github.com/Jaxsbr/stormwatch/actions/runs/35475531100). Later publication runs are available in the repository's Actions history.
