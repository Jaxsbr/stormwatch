# 01 — Make the chapter playable and keep each child's progress separate

Status: needs-triage

Scope: historical Day 1 prerequisite reference, excluded from the active Day 2-onward spec. Completion is not verified by the owner's scheduling assumption. Do not start this ticket automatically as part of that spec.

Depends on: owner acceptance of `../spec.md`

Implement a three-map campaign layout, explicit reward definitions, and two local player slots. Preserve the legacy save in slot one, including completed Lantern/Rainstone stars; derive Turtle access from a prior Rainstone victory. Keep best stars and settings intact. Do not reset existing progress to simulate a new player. Profile two supplies the fresh-flow check.

Use content/reward data to declare tower availability and upgrade/advantage entitlements. Enforce actual entitlements at attempt creation and available commands. A newly created profile starts with only Map 1, base Squirrel, and no advantages. Generic rewards support Squirrel upgrade after Map 1, Turtle after Map 2, and Reach/Longer Nets after the boss. Provide Continue from victories; do not grant unimplemented rewards in intermediate candidate builds. Avoid showing an unfinished third map as playable until its content is integrated.

Fix map labels that currently hardcode “Complete Lantern Pass,” the two-node positioning, and the first-watch briefing on every no-card map. Preview only relevant tools/threats and the upcoming lesson. One applicable earned advantage gets an equipped summary with a None option; two get a real choice. Longer Nets is unavailable on Squirrel-only maps.

Establish a concrete way for the owner to open the candidate on a tablet on day one. The configured Git remote currently returns Repository not found. Identify the working delivery option; do not create a public deployment or change a destination without authorization. A local-network preview requires the hosting laptop to remain awake and running; state this limitation.

Done when fresh and legacy progress survive reload, player slots are independent, unlocks are enforced, the layout works in landscape tablet/laptop sizes, and the candidate's family-device access requirements are known. Test meaningful migration/progression paths and report actual tablet access as unverified until tried on the device. Record evidence in `../progress.md`.
