# Ideas catalogue

This is Stormwatch’s durable visual brainstorming archive. Preserve useful variants
even when another option is chosen. Inclusion records an idea, not production-art
approval. This standalone page opens directly from disk and stays outside the game
build and runtime content.

## Automatic commit-time capture

Use `$catalogue-session-art` after generating art, or to sweep one or multiple
session IDs supplied by the user. It archives every generated variation, including
rejected options, and deduplicates across the selected sessions and this catalogue.
Its full workflow lives in the installed skill. If the skill is unavailable, follow
the import steps below for every selected session and report the missing skill.

For a flagged image with known originating sessions, sweep those sessions for
all generated art before resolving the staged image. A successful Git check is
not proof that unstaged or rejected variants were archived. Session sweeps also
apply when no generated images were committed. Keep scope to explicitly supplied
sessions or the current art task; report unresolved origins rather than scan all
unrelated chats.

The pre-commit hook checks added, modified and renamed staged `.png`, `.jpg` and
`.jpeg` files, including uppercase extensions. It blocks unreviewed images and
points here so humans and agents perform the same review. It checks the Git index;
unstaged catalogue edits cannot satisfy a commit. Existing unchanged images are
reviewed when they next change, rather than forcing a historical import.

For each flagged image, inspect the staged version and choose:

- **Capture:** useful game art, concept variations and visual references belong
  in the catalogue. Follow the import steps below and stage both the copied asset
  and `catalogue.js`. Identical staged image bytes already present in a staged
  catalogue asset are recognized automatically, even at another source path.
- **Exclude:** test fixtures, diagnostic screenshots or other images without
  reusable art value can stay outside the catalogue. After staging the image, run
  `node ideas-catalogue/check-staged.mjs --exclude "path/to/image.png" --reason "Diagnostic screenshot; no new art idea"`
  with a specific reason, then stage `ideas-catalogue/capture-decisions.json`.
  Decisions bind to the staged image’s path and SHA-256; changing its bytes requires
  a fresh capture or exclusion. Keep reasons brief and free of private details.

Run `npm run ideas:check-staged` to repeat the gate before retrying the commit.
The hook reviews metadata and captures but does not generate images, make visual
judgments or stage files automatically. For partially staged images, import the
staged bytes rather than a different working-tree version. A temporary copy can be
made with `git show ':path/to/image.png' > /tmp/stormwatch-staged-image.png`.

`npm install` enables the Husky hook through the package’s `prepare` script. Keep
the hook scoped to this capture gate; the root project checks remain separate.

## Importing a chat or existing art

1. Read every requested chat, including its generated-image outputs and earlier
   turns. Inventory every generated variation; distinguish generated outputs from
   reference images. Inspect the images to identify their subjects. If an output is
   unavailable, report the missing item rather than substitute new art.
2. Copy every requested original into `assets/`. Preserve whole concept sheets,
   native resolution and transparency. Existing art is a snapshot, so future game
   edits do not rewrite archived ideas. Deduplicate identical bytes; keep distinct
   variations across all requested sessions. Derived character assemblies must record their input assets and
   assembly method in the entry.
3. Add metadata through `import.mjs` using a temporary JSON batch. Each entry has
   `id` (stable lowercase slug), `title`, `description` (a sentence or keywords),
   `kind` (`concept` or `existing`), `categories` (one or more of `background`,
   `map`, `interface`, `character`), `image` (local input path), and `source` with
   `label`, `file` (original filename or repository-relative path) and, for chat
   imports, `session` (chat ID). The importer copies originals, records hashes and
   dimensions, and appends entries. Input paths are relative to the batch file.
   Keep machine paths and chat transcripts in the temporary batch only.
   Tag whole study sheets with every category they visibly contain; a sheet with
   scenery, an expedition board and navigation belongs in all three categories.
4. Run `node ideas-catalogue/import.mjs /path/to/import-batch.json`, then
   `node ideas-catalogue/verify.mjs`. Inspect the added pages in the browser and
   check both navigation directions. Finish only when every requested image is
   accounted for, all assets resolve, and captions identify subject and origin.

`catalogue.js` is the metadata source of truth: a classic script containing
`window.STORMWATCH_IDEAS = [ … ];`, preceded by `// prettier-ignore`. Preserve
that comment and keep the array JSON-compatible after the assignment.
This format supports `file://` without fetch, a server or module imports. Commit
the page, metadata and its local assets together.

## Modifying the viewer

Favour uncropped image display over text. Show one idea at a time, a brief caption,
origin, position count, and large Previous/Next buttons. Keep keyboard arrows,
wraparound navigation and stable `#idea-id` links. Clicking the image opens the
full-size local asset. Category filters narrow both navigation and thumbnail
previews. Show up to six clickable previews at a time with separate preview-page
buttons; on narrow screens the strip scrolls horizontally. Keep the selected
preview marked, category counts visible and category selection in the URL query
so reload and browser Back restore the view. Keep browser assets relative and
dependency-free.

Verify changes by opening `index.html` directly and checking a wide concept sheet,
a transparent character, first/last wraparound within a category, preview paging,
thumbnail selection, browser Back, a category/hash link and a narrow viewport.
Use the root project checks when changing code. Keep catalogue work bounded to
this directory; promoting archived ideas into gameplay follows the project’s
separate art approval and content authoring contracts.
