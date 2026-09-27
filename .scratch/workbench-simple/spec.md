# One workspace, one draft, direct promotion

Status: resolved

Replace the workbench's Tune/Test/Experiments navigation with one visual authoring workspace. Keep one automatically saved browser draft; migrate the most recent valid legacy revision without destroying the archived experiment store. Playtest uses the current selected wave, normal difficulty, legitimate first-arrival capabilities. Headless run/compare/search tools remain available to agents outside the UI.

Promote writes selected wave plus selected map settings into local recipes.json via a loopback, same-origin development endpoint. It validates the result, prevents stale selected-scope overwrites and writes atomically. Other waves, maps and global catalogs remain unchanged. New maps use an existing map's shape and suitable defaults; add named waves with no enemies until authored. Blank drafts save, but cannot play/promote. Map layout can be changed to an existing map. New promoted maps appear in the campaign and persist progress.

Keep direct visual manipulation and snapping. Provide concise map/wave selectors, creation forms, Playtest and Promote, automatic draft status and a small optional map settings disclosure. No revision picker, automated test UI, export/promotion instructions or scenario forms. Retain CLI modules and tests. Verify persistence, scoped promotion, stale refusal, map/wave creation, browser interactions and production boundary. Local commits only; no push or PR.
