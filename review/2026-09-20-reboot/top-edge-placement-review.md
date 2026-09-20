# Top-row animal placement check

Current4174 normal Rainstone preparation, squirrel(5,0), donkey(6,0),185→145→90crowns. No state injection/source edits/build. Chrome1280×720 and844×390, viewport restored and own tab closed afterward.

**Material clipping confirmed at both sizes.** Top-row defender heads/ears extend above the battlefield boundary behind the top HUD. Their selected above-head chevrons are entirely outside the visible battlefield. Phone framing makes the available head area particularly cramped. These are legal placements, not a hypothetical clipping calculation.

Inspection still works: clicking the visible squirrel face/body selects Squirrel archer and matching damage/range in the tray; clicking the donkey tile selects Donkey trader and income text. Ground brackets remain visible. Therefore selection is possible, but complete character identity and the new primary selection indicator are lost at this row.

The requested central x5/x6 placements do not overlap the upper-left field heading or upper-right payout controls. This bounded check does not certify other top-row x positions.

Evidence: `after/top-edge-desktop-donkey.png`, `top-edge-desktop-squirrel.png`, `top-edge-phone-donkey.png`, `top-edge-phone-squirrel.png`. No speculative overall rescore. Preserve legal gameplay positions while reserving sufficient renderer headroom for the tallest selected animal plus marker.
