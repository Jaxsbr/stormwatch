# Glossary

| Term                             | Meaning in Stormwatch                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Attempt                          | One fresh playthrough of an encounter; its wallet and towers reset on retry.                                                                                       |
| Encounter / level                | A map, fixed trail and sequence of waves.                                                                                                                          |
| Wave                             | A manually started group of raiders, ending when no queued or living enemy remains.                                                                                |
| Wave lesson                      | A readable introduction to an enemy behavior, followed by a chance to practice it and later meet it alongside familiar threats; exact pacing is a design decision. |
| Threat tell                      | A visual cue that shows when an enemy ability is about to affect the battle, so the player can understand and respond to it.                                       |
| Preparation                      | Planning before wave 1; after a wave clears, a short countdown begins and can be skipped. Pause freezes the countdown.                                             |
| Crowns                           | Attempt currency used for structures and upgrades.                                                                                                                 |
| Wave reward                      | Fixed crowns granted once when a wave is cleared; it is independent of savings and elapsed time.                                                                   |
| Discovery unlock                 | A persistent capability earned by victory or a later boss, such as the ability to upgrade Squirrels.                                                               |
| Leak                             | An enemy reaches the end of the trail and removes village hearts.                                                                                                  |
| Splash                           | Damage to enemies within a radius of a stone impact.                                                                                                               |
| Slow                             | Temporary movement reduction from nets.                                                                                                                            |
| Matchup                          | The way a tower role performs against an enemy behavior; each has a distinctive role, while multiple towers can remain useful through different trade-offs.        |
| Combat feedback                  | Visual, animation, and audio cues that show an attack, hit, status effect, leak, or reward outcome.                                                                |
| Advantage                        | An earned prebattle modifier for the whole attempt; the picker appears only after advantages have been discovered.                                                 |
| Billboard / camera-facing sprite | Flat image in the 3D world that always faces the camera.                                                                                                           |
| 2.5D                             | Here, actual 3D terrain combined with flat illustrated entities and a fixed view.                                                                                  |
| Orthographic                     | Projection without perspective size reduction over distance.                                                                                                       |
| Isometric feel                   | Angled overview showing the ground and two sides; the camera is not a rotatable perspective view.                                                                  |
| Atlas                            | Multiple images packed in one texture; UV rectangles select a figure.                                                                                              |
| UV / crop bounds                 | Coordinates identifying which part of a texture appears on an object.                                                                                              |
| Alpha                            | Pixel transparency; an opaque background is not a transparent cutout.                                                                                              |
| Anchor / pivot                   | Position on a sprite placed at its world coordinate, near the feet here.                                                                                           |
| Occlusion                        | One object hiding another; must not make playable tiles inaccessible.                                                                                              |
| Grounding shadow                 | Soft mark below a sprite that visually connects it to the terrain.                                                                                                 |
| Silhouette                       | Readable outer shape, especially at small mobile sizes.                                                                                                            |
| Fixed timestep                   | Equal-duration simulation updates, independent of display refresh.                                                                                                 |
| p95 frame interval               | 95% of recorded frame intervals are at or below this duration.                                                                                                     |
| Stress fixture                   | Artificial crowded scene for performance testing, distinct from a normal match.                                                                                    |
| ADR                              | Architectural decision record explaining context, choice and consequences.                                                                                         |
