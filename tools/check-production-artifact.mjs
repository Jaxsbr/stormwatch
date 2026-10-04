import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const forbiddenPath =
  /(?:^|\/)(?:qa|workbench|review|fixtures?|drafts?|scenarios?|research|tools)(?:[./-]|$)|heartbeat/i;
const forbiddenCode =
  /mosswater-feedback|prepareBoardReviewProfile|Recorded legal finale build diverged|review-recording|MediaRecorder|profileTiming|frameProfile|stormwatch-workbench|artificial stress fixture|showLoadReport|Run attribution diagnostic|Download evidence|Object\.defineProperty\(window,["']stormwatch/;

export async function checkProductionArtifact(directory = "dist") {
  const root = resolve(directory);
  let fileCount = 0;
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      const name = relative(root, path).replaceAll("\\", "/");
      if (forbiddenPath.test(name))
        throw new Error(`Utility artifact in production: ${name}`);
      if (entry.isDirectory()) await walk(path);
      else {
        fileCount++;
        if (/\.(?:html|js|css|json)$/.test(name)) {
          const source = await readFile(path, "utf8");
          if (forbiddenCode.test(source))
            throw new Error(`Utility code in production: ${name}`);
        }
      }
    }
  }
  await walk(root);
  const html = await readFile(resolve(root, "index.html"), "utf8");
  if (/\b(?:src|href)=["']\/assets\//.test(html))
    throw new Error("Game assets must retain Pages subpath-relative URLs");
  return fileCount;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const count = await checkProductionArtifact(process.argv[2]);
  console.log(`Production boundary verified across ${count} files.`);
}
