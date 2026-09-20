# Combat-map projection correction

The user rejected woodland v2 and riverbank v1 for landscape perspective. Prior asset-level acceptance was incorrect.

## Reference evidence

- reference/video-c.png (0:18, ice combat): path width stays visually consistent throughout the battlefield; upper blue/yellow tower around screen x777,y260 and lower counterpart x779,y358 have comparable sizes. Orange towers at upper right and lower right likewise have comparable scale. Ice cliffs along the upper edge show local raised surfaces/front faces, not a distant horizon.
- reference/video-d.png (0:25, dungeon combat): the ground and road fill the viewport; upper and lower route segments do not converge. The upper wall is a nearby perimeter barrier at map scale. No sky, skyline, vanishing point or background mountains.
- reference/video-b.png and video-e.png (0:11/0:33): close framing of the same grass battlefield shows upright objects with visible top surfaces and oval bases, while road and ground remain a flat consistently scaled map. These close shots must not be read as foreground distance scaling.
- video-a is the separate world-map screen and video-f is the arsenal UI; neither establishes combat camera projection.

## Enforced replacement rules

Use one orthographic elevated ground plane, with upright 3/4 props; keep physical prop/texture scale consistent at all screen y positions. Ground fills every edge. Show local relief through object front faces, top surfaces, overlap and local shading. Perimeter scenery may be cropped but cannot become giant foreground decoration. No horizon, sky, distant landmarks, atmospheric recession or perspective convergence. Keep an open broad central battlefield.

## Replacement

woodland-clearing-v3 passes this asset-level projection check. It has similarly sized lanterns and pine crowns at upper/lower edges, shallow local banks and no distant scene. Runtime and path/character readability review remain pending. Original PNG and exact native generation prompt retained. The shared template gained its biomeCamera rule during import; prompt.txt was corrected to retain the actual generated prompt (composition already contains all orthographic rules).

Riverbank v2 now follows the same checked projection and shared camera template. Woodland v3 projection subsequently received explicit user approval: “background is great now”. This does not approve tower perspective, animation or overall completion.

Cobblestone-material-v1 is a native square opaque painted stone swatch intended for runtime path clipping. Actual stone count is lower than requested, so scale it down in runtime. Opposite-edge mean RGB difference is 10.20/255 horizontally and 11.60/255 vertically; seamless repetition must be reviewed in-game, not assumed from prompt.
