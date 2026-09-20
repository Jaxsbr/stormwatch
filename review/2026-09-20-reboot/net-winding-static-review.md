# Net winding static assembly review

Technical compositing only, no generation or runtime changes. Current approved base/operator preserved. Comparison PNG shows current launcher on LEFT and separated candidate on RIGHT.

The initial proposed drum scale0.55 was too small: it floated in a large empty bay and left conspicuous exposed spindle lengths. Refined drum scale0.78 relative to frame fills the bay, with stationary frame bearings masking the drum rim/spindle ends. Crank scale increased0.70→0.80 to keep handgrip readable. Entire frame assembly shifted20 base-source pixels down to keep its upper net edge under the operator hands and near the original launcher silhouette.

Recommended values:
- Frame pivot[620,325],overall scale0.44; base-image target[345,360], equivalent base-pivot-relative restPosition[5,30] with Y up.
- Drum pivot[255,350],relative scale0.78,overall0.3432; attach frame[620,325]. Draw behind frame.
- Crank pivot[105,180],relative scale0.80,overall0.352; attach frame[620,490]. Draw above frame.

The frame is NOT visibly too broad. Candidate occupied horizontal span is approximately the same as original (about420 base-source pixels), comfortably within the approved platform. Candidate is slightly more compact vertically and keeps the fixed overhead platform architecture.

Caveats: this verifies only rest assembly. Rotation extremes/aiming and hand contact need runtime review. Do not rotate the whole rope cylinder in screen plane as a wheel; the design reads as a cylindrical windlass, so use subtle winding/shaft motion while the separate crank visibly turns. Frame must occlude drum edges throughout motion.

Evidence: after/net-winding-assembly-candidate.png (initial), after/net-winding-assembly-refined.png (recommended), after/net-winding-assembly-refined-comparison.png (left current/right candidate).
