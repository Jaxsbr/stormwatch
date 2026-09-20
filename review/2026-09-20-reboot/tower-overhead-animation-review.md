# Overhead rig staged animation review

Static projection: user approved separately. Animation: **not accepted** in this capture.

Evidence: after/tower-overhead-firing.webm (fresh reload, root froze runtime edits during capture; canvas1280x660), after/tower-overhead-firing.png (8s frame), and after/tower-overhead-joints-contact.png (left bolt cropped at6fps over10s). The earlier tower-overhead-firing-superseded.webm is not acceptance evidence because runtime changed during that review window.

The stage used real Game simulation and the Start wave control, but this remains a staged test fixture, not ordinary player-session footage. Enemies visibly advance into the road immediately left of the bolt. Across the contact sequence the bow and operator retain the same pose; a moving string, loaded arrow and recoil are not visibly demonstrated. Therefore string-tip attachment and muzzle origin cannot be certified. Base remains stationary.

Chrome logs contain repeated THREE.WebGLRenderer warnings: Texture marked for update but no image data found. Investigate rig loading/static fallback and firing integration before repeating acceptance.

Pause screenshots A/B are byte-identical (SHA256 0064a80ba03773cc874f8885fa8ff3c2b24c593e280ab2756f3c12949c170c6c), but the wave had finished before pause. This only verifies static-frame stability, not freezing an active firing pose.
