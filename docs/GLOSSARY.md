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
| Poison | Enemy-attached damage over time. Reapplication refreshes duration without stacking and retains the stronger active damage. Armor and shields do not prevent its damage. |
| Tough skin | Iron Boar’s permanent poison immunity; ordinary blast damage and net slowing remain effective. |
| Evasion                          | A visible, temporary Weasel state in which arriving projectiles miss; an existing slow remains in effect.                                                          |
| Rage | The Roadwarden’s damage-triggered cycle of anger, full rage and recovery; full rage becomes permanent at one-quarter health. Nets remain effective. |
| Rally | The Roadwarden’s temporary speed boost for nearby escorts; independent of his own rage. |
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

| Designer term | Meaning |
| --- | --- |
| Authored recipe | Canonical serializable encounter/wave/packet data compiled into runtime content. |
| Packet | An ordered recipe of enemy groups; optional repetition and preceding silence express wave rhythm. |
| Draft revision | An independently saved named content snapshot tied to its accepted baseline identity. |
| Scenario | Difficulty, progression, seed, resources and formation declared for a reproducible attempt. |
| Synthetic setup | An isolated wave or explicit resource/tool/formation override that makes no campaign-reachability claim. |
| Nominal spawn | Authored schedule time, distinct from the fixed tick at which the enemy appears. |
| Command trace | Legal command attempts recorded at fixed simulation ticks, including rejections. |
| Fixed-plan comparison | Baseline/candidate evidence using identical recorded commands and declared setup; invalidated commands remain visible. |
| Promotion | Explicit validated, scoped application of authored draft content to the canonical source; separate from saving, committing and deployment. |
