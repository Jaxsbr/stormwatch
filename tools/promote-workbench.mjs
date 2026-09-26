// Local-only writer. Usage: npm run workbench:promote -- export.json revision-id selection.json [--apply]
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const workspaceIndex = args.indexOf("--workspace");
const workspace =
  workspaceIndex < 0 ? root : resolve(args[workspaceIndex + 1] ?? "");
if (workspaceIndex >= 0) args.splice(workspaceIndex, 2);
const [exportPath, revisionId, selectionPath, flag] = args;
if (
  !exportPath ||
  !revisionId ||
  !selectionPath ||
  (flag && flag !== "--apply")
) {
  console.error(
    "Usage: npm run workbench:promote -- export.json revision-id selection.json [--apply]",
  );
  process.exitCode = 1;
} else {
  const server = await createServer({
    root,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });
  let temporary;
  try {
    const { importExperiments } = await server.ssrLoadModule(
      "/src/workbench/drafts.ts",
    );
    const { previewPromotion, verifyPromotionIdentity } =
      await server.ssrLoadModule("/src/workbench/promotion.ts");
    const file = resolve(workspace, "src/content/recipes.json");
    const original = await readFile(file, "utf8");
    const baseline = JSON.parse(original);
    const bundle = importExperiments(
      await readFile(resolve(exportPath), "utf8"),
    );
    const revision = bundle.revisions.find((entry) => entry.id === revisionId);
    if (!revision) throw new Error(`Unknown revision ${revisionId}`);
    const selection = JSON.parse(
      await readFile(resolve(selectionPath), "utf8"),
    );
    const preview = previewPromotion(baseline, revision, selection);
    for (const levelId of selection.levels ?? [])
      verifyPromotionIdentity(preview, revision, levelId);
    console.log(
      JSON.stringify(
        {
          revisionId,
          baseIdentity: preview.baseIdentity,
          candidateIdentity: preview.candidateIdentity,
          changes: preview.changes,
        },
        null,
        2,
      ),
    );
    if (flag === "--apply") {
      // Validate before writing; stage alongside the destination for atomic replacement.
      temporary = `${file}.promotion-${process.pid}.tmp`;
      await writeFile(
        temporary,
        `${JSON.stringify(preview.content, null, 2)}\n`,
        { flag: "wx" },
      );
      if ((await readFile(file, "utf8")) !== original)
        throw new Error(
          "Accepted recipe changed during promotion; retry from the new baseline.",
        );
      await rename(temporary, file);
      temporary = undefined;
      console.log(
        "Applied selected authored content. Run check, test and build before accepting; no commit or publication was made.",
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    if (temporary) await unlink(temporary).catch(() => {});
    await server.close();
  }
}
