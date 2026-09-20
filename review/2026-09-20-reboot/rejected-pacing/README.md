# Rejected 60 FPS pacing experiment

The fixed-credit pacer passed synthetic cadence tests but introduced uneven actual presentation: rendered p95 23.2 / 20.7 / 17.5 ms. Raw/actual long intervals remained in every run. See `docs/evidence/animal-performance-paced-qualification.json` from the repository root. The experiment was removed from normal play and QA; the source is retained here only as historical evidence. Do not use its passing unit tests as proof of browser cadence. Runtime draws every RAF again. Raw and rendered cadence metrics remain separately reported.
