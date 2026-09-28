# Local player identities

## Context
The owner requested replacing the two automatic player slots with named profiles and animal portraits.

## Decision
Profiles have stable ids, nicknames (1–24 characters), an avatar from eight generated woodland portraits, and independent local progress/settings. Remember the last selected profile. Require creation before playing on a fresh browser. Profile management shows the saved player list with a clear New profile action. Creation and editing use a modal overlay; deletion uses a separate confirmation overlay with red destructive controls. It supports selection, rename and avatar changes. Switching happens outside an attempt. Framed avatar badges with accessible nickname labels occupy reserved headings after the title; see decision 027. The title profile switcher and profile list keep visible nicknames.

Migrate populated old slots and the older single save without losing progress. Omit untouched automatic slots. Keep the existing storage key and legacy single save backup. These are local browser profiles with no server accounts.

## Consequences
Browser data clearing removes profiles. Deleting a profile removes its local progress; the UI explicitly confirms that action. Storage failure keeps the session usable and reports that persistence is unavailable.

## Verification
Focused tests cover fresh installation, migration, isolated progress, identity editing, last-player reload and malformed identity recovery. Run the project check, test and production build and inspect browser layouts.
