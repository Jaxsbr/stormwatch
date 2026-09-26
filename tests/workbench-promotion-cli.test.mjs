import { it, expect } from "vitest";
import { CANONICAL_CONTENT } from "../src/config/configuration.ts";
import { forkDraft, exportExperiments } from "../src/workbench/drafts.ts";
const bundle = () => ({
  schemaVersion: 1,
  revisions: [forkDraft(CANONICAL_CONTENT, "test-draft", "CLI experiment")],
  scenarios: [],
  traces: [],
  results: [],
});
it("previews and atomically applies only canonical content in a disposable workspace, preserving it on errors", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rm } =
    await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const workspace = await mkdtemp(join(tmpdir(), "stormwatch-promotion-"));
  try {
    await mkdir(join(workspace, "src/content"), { recursive: true });
    const destination = join(workspace, "src/content/recipes.json");
    const original = JSON.stringify(CANONICAL_CONTENT);
    await writeFile(destination, original);
    const experiments = bundle();
    const revision = experiments.revisions[0];
    revision.content.levels[0].startCoins += 8;
    const exportFile = join(workspace, "export.json");
    const selectionFile = join(workspace, "selection.json");
    await writeFile(exportFile, exportExperiments(experiments));
    await writeFile(
      selectionFile,
      JSON.stringify({ levels: [revision.content.levels[0].id] }),
    );
    const args = [
      "tools/promote-workbench.mjs",
      exportFile,
      revision.id,
      selectionFile,
      "--workspace",
      workspace,
    ];
    const output = execFileSync(process.execPath, args, { encoding: "utf8" });
    expect(output).toContain("candidateIdentity");
    expect(await readFile(destination, "utf8")).toBe(original);
    execFileSync(process.execPath, [...args, "--apply"], { encoding: "utf8" });
    const accepted = await readFile(destination, "utf8");
    expect(JSON.parse(accepted).levels[0].startCoins).toBe(
      revision.content.levels[0].startCoins,
    );
    expect(() =>
      execFileSync(process.execPath, [...args, "--apply"], { stdio: "pipe" }),
    ).toThrow();
    expect(await readFile(destination, "utf8")).toBe(accepted);
    await writeFile(exportFile, '{"schemaVersion":99}');
    expect(() =>
      execFileSync(process.execPath, [...args, "--apply"], { stdio: "pipe" }),
    ).toThrow();
    expect(await readFile(destination, "utf8")).toBe(accepted);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
