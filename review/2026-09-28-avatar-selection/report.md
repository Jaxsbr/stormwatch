# Avatar selection regression

## Reproduction
Open Profile → New profile, then select Rabbit in a 768×1024 browser viewport.
Read the selected button's bounding rectangle and the active element.

Before the fix: button 58×63px; `document.activeElement.id` was `profile-name`.
Both the circular-target and non-input-focus checks failed. Selecting an avatar
called the whole-screen render, replacing the dialog and reopening it with
`showModal()`, which focused the nickname input. The inline avatar image also
left baseline space beneath it, producing the oval selection outline.

## Fix
Update `aria-pressed` on the existing buttons and focus the selected button with
`preventScroll`. Keep the dialog and nickname input mounted. Avatar controls
explicitly use `type="button"`. Square 58×58px grid buttons center the portraits
without inline baseline space.

## Verification
The original browser measurement now reports 58×58px and focus on `avatar:rabbit`.
All eight avatars were selected sequentially: each retained exactly one selected
button, button focus and the entered nickname `Scout`. Enter-key activation also
selected Fox without focusing the input. At 320×568 the dialog client and scroll
widths both measured 280px, and avatar targets remained 58×58px.

- [Tablet](tablet-768.png)
- [Narrow phone](narrow-320.png)

Type checks, formatting, all 265 tests and production build pass. Browser checks
verify focus and geometry, not the physical tablet keyboard. The physical-device
follow-up is to enter a nickname, dismiss the keyboard, and tap several avatars:
it should remain dismissed. No new unit test was added because the headless
simulation/persistence suite has no DOM/dialog focus seam; the browser sequence
exercises the actual event handler and native dialog instead.
