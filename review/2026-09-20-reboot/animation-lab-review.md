# Animation lab review

Page: `/review/2026-09-20-reboot/animation-lab.html` on Vite port4173. Chrome extension,1280×900 viewport. Original manifests and full cell rectangles preserved, pivot0.5/0.92; no frame trimming, resizing by silhouette, alignment repair or interpolation. Rat110px cell at10fps; tower150px cell at14fps; second row2×. Tower non-looping action repeats solely for inspection.

Visible controls tested: Pause, Reset, Step one frame, Record8seconds, DownloadWebM. Actual MediaRecorder canvas capture is `animation-candidates-8s.webm`,2,323,499bytes,1280×620,VP9,requested30fps,8second recording timer. SHA256 `091d140e2e07d93009c83e68a311380ef7b6302b89425bc2b22fcaa860d657f9`. Downloaded through visible Chrome link then copied into project. This is lab footage, not game footage and not proof of smoothness.

Inspected actual running canvas and stepped frame1→4; saved `animation-frame-1.png` and `animation-frame-4.png`. Browser tool observation is sampled images, not continuous temporal perception. Motion smoothness, cadence, seam feel and input latency therefore remain unassessed despite successful playback and recording. A human/continuous-video-capable reviewer can inspect the recording.

## Findings

- Rat identity/costume remains recognizably stable. Poses genuinely differ, unlike old rigid bobbing. At2×, position and apparent body scale vary; planted boot ground differs by about17sourcepixels across originalcells (~4.2px at110pxcell). Frame1→4 shifts torso left and raises feet relative to fixed marker. The same visible near-leg-leading configuration appears in several intended opposite-half poses. Do not pass grounded alternating gait yet.
- Tower base broadly maintains position; actual silhouette bottom is~0.975cellheight, below descriptor0.92pivot. Use one sheet-level pivot correction to bottom/foot anchor, not per-frame silhouette scaling. Frame4 release changes operator/bow; true mechanical sequence and seam need continuous review. Frame8 does not exactly matchframe1.
- Numeric nondivisibility is harmless because exact443/444pixelrects are used. Do not reject solely for1774×887dimensions.

## Targeted native retry

Requested a native edit of rat source preserving identity/poses and locking scale, torso horizontal anchor and planted soles at92%baseline. Output `assets/source/reboot/rat-walk-alignment-retry.png`, original native output `exec-3ef19b86-ad27-4c07-999e-f78b98be6aa9.png`. Actual local bottoms bycell:418,419,416,414,410,410,404,404. The requested baseline consistency was not achieved (15pxrange). Visual pose sequence remains very similar; this retry is not selected or imported over the original. Numeric report `rat-retry-inspection.json`.

Concrete next correction: annotate actual planted-foot contact anchors for eachframe, then apply translation-only offsets in descriptor/import tooling while keeping a single scale. A boundingboxbottom is an imperfect proxy because liftedtoe/tail can dominate; inspect contact manually. If gait remains same-foot repetition after anchoring, prefer a cutout rig with alternating legs, or generate targeted opposite-leg poses. Do not claim a reliable eight-pose gait from this sheet alone. Original imports remain unreviewed.

## Translation-only anchor pass

Added manually estimated localpixel anchors to manifests. Rat x follows torso/hip center, y follows lowest planted boot sole: (238,415),(241,415),(231,407),(242,408),(224,408),(237,409),(231,400),(241,398). Tower stable pedestal center/base: (221,432) for allframes. These are reviewed approximate image landmarks, not automated boundingbox scaling. Entire cell rectangles remain fixed; each frame uses the same pixel-to-world scale. Original/corrected toggle keeps the comparison explicit.

Consecutive-pose structure: rat1→2 compresses weight and brings legs together;2→3 lifts the prominent near leg;3→4 extends that same near leg forward. Frames5→6→7→8 repeat substantially the same near-leg contact/passing/extension configuration rather than switching near/far leg roles. In particular1vs5 and3vs7 expose the same leading leg. Therefore this is closer to two variations of a four-pose shuffle than a reliable alternating eight-frame walk. Translation fixes ground alignment but cannot fix leg topology. Identity remains recognizable; tail curvature/torso position differ and second-half poses are not exact duplicates.

Tower1→2 operator draws;2→3 bow shape changes strongly;3→4 releases with raised hand;4→5 operator recoils;5→6 reload lever action;6→7 settles;7→8 is nearrest but8→1 changes bow orientation. Readable distinct action poses exist, but bow-shape deformation is stronger than convincing elastic flex in some transitions. Treat as candidate proof, not final polished machinery.

Corrected recording: `animation-anchored-8s.webm`,2,271,377bytes,VP9,1280×620,8secondtimer,requested30fps. SHA256 `6c52ddeeb3243f354888163e404ce6902db1767317f34134306c614fe63e43d3`. Captured via visible Record button and Download link. `anchored-frame-1.png` and `anchored-frame-5.png` are the opposite-contact comparison: same near leg leads in both, so the alternating-gait gate fails. Ground/base alignment is improved. Recommendation: do not treat the rat as a finished walk; use as pipeline proof only. Tower action can serve as candidate mechanical animation proof with its known seam/deformation limitation.
