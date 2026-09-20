# Biome and UI asset review

Generated with native ImageGen using existing access. No API fallback, alpha substitution or repainting. Originals remain ignored in assets/source/reboot; runtime WebP, exact pipeline-generated prompts and manifests live in public/art/v2.

## woodland-clearing-v2

Visual asset inspection passed; in-game review pending. Broad clear meadow and dimensional forest framing, no grid or baked gameplay path. Upper-right fort more prominent than distant brief and occupies upper 25 percent. Foreground roots occupy lower 20–25 percent; keep active route above them. Green earth more saturated than riverbank.

Exact generation prompt: public/art/v2/woodland-clearing-v2/prompt.txt.

## rainstone-riverbank-v1

Visual asset inspection passed; in-game review pending. Distinct cool slate terrain, open center, mossy woodland edges and river confined to right edge. Foreground stones occupy lower 20–25 percent. A natural opening at upper left reads as entrance, not a baked central road. Fine ground texture may need subdued rendering behind small units.

Exact generation prompt: public/art/v2/rainstone-riverbank-v1/prompt.txt.

## timber-ui-frame-v1

Visual asset inspection passed; scaled UI review pending. Genuine alpha outside and through center; sampled center rectangle [280,200,1610,350] has 541073 pixels alpha 0 and 22427 pixels alpha 1/255, none higher. Native faint residual alpha retained unchanged. Suggested 9-slice inset [top,right,bottom,left]=[290,280,195,280], keeping lanterns within upper corner slices. Border is more detailed than icon-sized use permits; reserve for broad panels.

Exact generation prompt: public/art/v2/timber-ui-frame-v1/prompt.txt.

All assets passed pipeline inspect/import. These are asset-level reviews only, not acceptance of actual game presentation.
