# Native animation sheet candidates — 20 September 2026

Generated using built-in image_gen only, from reusable rat-walk and bolt-action JSON specs via `node tools/art-pipeline.mjs prompt`. No API fallback, repainting, alpha substitution or procedural redraw. Raw source images retained here; exact prompts and import manifests under public/art/v2/{rat-walk-v2,bolt-action-v2}/.

Both returned 1774×887 RGBA, not the preferred 2048×1024. Importer supports integer-partitioned 443/444px cells. Numeric inspection reported no errors and preserved genuine transparency; neither candidate is motion-approved.

## Rat

Eight isolated poses, readable armor/face, broadly consistent costume and identity. Legs visibly change bend/contact configurations; upper body is relatively stable. Tail and silhouette position vary, particularly second row; apparent ground contacts span roughly y398–415 within cells, so foot drift needs playback review. The generator does not convincingly distinguish opposite legs in every contact pose: potential four-pose repetition rather than ideal alternating eight-pose gait. No cell bleed observed at inspection threshold. A few tail/extremity margins are under requested 8%. Do not call smooth or grounded until played at normal size.

## Bolt

Strong silhouette and stable pedestal composition; operator arm/head and bow geometry visibly change across cells. Crossbow reaches close to cell right edges and flag approaches top edge: margins are roughly 3%, not requested 8%, although not clipped or bleeding at inspection threshold. Last frame does not exactly match first: weapon orientation and operator differ, so loop seam may pop. Base looks broadly stationary in sheet but subtle texture/geometry drift must be tested. Mechanism could read as turning rather than flexing; normal-size playback required. No projectile baked into image.

## Next review

Use animation lab to compare each candidate at ordinary gameplay footprint and enlarged inspection size, 1× speed, against a fixed floor marker. Review planted feet, silhouette drift, identity stability, bow release timing and seam. Retain unreviewed state until recorded and reviewed. If motion fails, generate a targeted repair or use cutout rig; numeric validation alone is not approval.
