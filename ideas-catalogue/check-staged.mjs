import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const cataloguePath = "ideas-catalogue/catalogue.js";
const decisionsPath = "ideas-catalogue/capture-decisions.json";
const guidancePath = "ideas-catalogue/AGENTS.md";
const prefix = "// prettier-ignore\nwindow.STORMWATCH_IDEAS = ";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (cwd, args) =>
  execFileSync("git", args, { cwd, maxBuffer: 128 * 1024 * 1024 });

function stagedFiles(cwd) {
  const files = new Map();
  for (const record of git(cwd, ["ls-files", "--stage", "-z"])
    .toString()
    .split("\0")) {
    if (!record) continue;
    const tab = record.indexOf("\t");
    const [mode, oid, stage] = record.slice(0, tab).split(" ");
    if (stage === "0") files.set(record.slice(tab + 1), { mode, oid });
  }
  return files;
}

function readIndex(cwd, files, file) {
  const entry = files.get(file);
  return entry ? git(cwd, ["cat-file", "blob", entry.oid]) : null;
}

/** Evaluate exactly the index being committed, including partially staged files. */
export function auditStagedImages(cwd = process.cwd()) {
  const changed = git(cwd, [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMRT",
    "-z",
  ])
    .toString()
    .split("\0")
    .filter((file) => /\.(png|jpe?g)$/i.test(file));
  if (!changed.length) return { reviewed: [], pending: [] };
  const files = stagedFiles(cwd);
  const raw = readIndex(cwd, files, cataloguePath)?.toString();
  let ideas = [];
  if (raw) {
    if (!raw.startsWith(prefix))
      throw new Error(`Invalid staged ${cataloguePath}`);
    ideas = JSON.parse(raw.slice(prefix.length).trim().replace(/;$/, ""));
    if (!Array.isArray(ideas))
      throw new Error("Staged catalogue must contain an array.");
  }
  const decisions = JSON.parse(
    readIndex(cwd, files, decisionsPath)?.toString() ||
      '{"version":1,"exclusions":[]}',
  );
  if (decisions.version !== 1 || !Array.isArray(decisions.exclusions))
    throw new Error(`Invalid staged ${decisionsPath}`);
  const capturedHashes = new Set();
  for (const idea of ideas) {
    if (!/^assets\/[a-z0-9-]+\.(png|webp|jpe?g|gif)$/.test(idea.asset || ""))
      throw new Error(`Invalid catalogue asset: ${idea.asset}`);
    const bytes = readIndex(cwd, files, `ideas-catalogue/${idea.asset}`);
    if (!bytes || sha256(bytes) !== idea.sha256)
      throw new Error(
        `Stage the catalogue asset and matching metadata: ${idea.asset}`,
      );
    if (
      !idea.title ||
      !idea.description ||
      !idea.source?.label ||
      !idea.source?.file ||
      !Array.isArray(idea.categories) ||
      !idea.categories.length
    )
      throw new Error(`Incomplete catalogue entry: ${idea.id}`);
    capturedHashes.add(idea.sha256);
  }
  const reviewed = [],
    pending = [];
  for (const file of changed) {
    const entry = files.get(file);
    if (!entry || !["100644", "100755"].includes(entry.mode)) {
      pending.push({
        file,
        reason: "Stage a regular image file before reviewing it.",
      });
      continue;
    }
    const hash = sha256(readIndex(cwd, files, file));
    if (capturedHashes.has(hash))
      reviewed.push({ file, disposition: "captured" });
    else if (
      decisions.exclusions.some(
        (item) =>
          item.path === file &&
          item.sha256 === hash &&
          typeof item.reason === "string" &&
          item.reason.trim(),
      )
    )
      reviewed.push({ file, disposition: "excluded" });
    else pending.push({ file, sha256: hash });
  }
  return { reviewed, pending };
}

function recordExclusion(cwd, file, reason) {
  if (!file || !/\.(png|jpe?g)$/i.test(file) || !reason?.trim())
    throw new Error(
      'Usage: node ideas-catalogue/check-staged.mjs --exclude "path/to/image.png" --reason "Why this is not an art idea"',
    );
  const files = stagedFiles(cwd);
  const entry = files.get(file);
  if (!entry || !["100644", "100755"].includes(entry.mode))
    throw new Error(`Stage a regular image first: ${file}`);
  let decisions;
  try {
    decisions = JSON.parse(readFileSync(resolve(cwd, decisionsPath), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    decisions = { version: 1, exclusions: [] };
  }
  if (decisions.version !== 1 || !Array.isArray(decisions.exclusions))
    throw new Error("Invalid capture decisions format.");
  decisions.exclusions = decisions.exclusions.filter(
    (item) => item.path !== file,
  );
  decisions.exclusions.push({
    path: file,
    sha256: sha256(readIndex(cwd, files, file)),
    reason: reason.trim(),
  });
  writeFileSync(
    resolve(cwd, decisionsPath),
    `${JSON.stringify(decisions, null, 2)}\n`,
  );
  console.log(
    `Recorded image review for ${JSON.stringify(file)}. Stage ${decisionsPath} before committing.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    if (args.length) {
      if (
        args.length !== 4 ||
        args[0] !== "--exclude" ||
        args[2] !== "--reason"
      )
        throw new Error("Expected --exclude IMAGE --reason REASON.");
      recordExclusion(process.cwd(), args[1], args[3]);
    } else {
      console.log(
        `\nStormwatch automatically checks staged PNG/JPEG images to preserve art ideas.`,
      );
      console.log(
        `Humans and agents: follow ${guidancePath} to capture ideas or record an exclusion reason.`,
      );
      console.log(
        "Known art sessions: use $catalogue-session-art with one or multiple session IDs to archive all variations, including rejected options. Staged files cannot reveal those missing variants.",
      );
      const { reviewed, pending } = auditStagedImages();
      if (reviewed.length || pending.length) {
        for (const item of reviewed)
          console.log(`  ${item.disposition}: ${JSON.stringify(item.file)}`);
        for (const item of pending)
          console.error(
            `  REVIEW REQUIRED: ${JSON.stringify(item.file)}${item.reason ? ` — ${item.reason}` : ""}`,
          );
        if (pending.length) {
          console.error(
            `\nCommit blocked: review these images, then stage the catalogue assets/metadata or ${decisionsPath} and retry.`,
          );
          process.exitCode = 1;
        }
      } else console.log("No staged PNG/JPEG changes to review.");
    }
  } catch (error) {
    console.error(
      `Ideas capture check failed: ${error.message}\nRead ${guidancePath}.`,
    );
    process.exitCode = 1;
  }
}
