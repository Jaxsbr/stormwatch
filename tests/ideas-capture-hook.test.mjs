import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  renameSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { auditStagedImages } from "../ideas-catalogue/check-staged.mjs";

const directories = [];
const script = resolve("ideas-catalogue/check-staged.mjs");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "pipe" });
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "stormwatch-ideas-hook-"));
  directories.push(cwd);
  git(cwd, "init", "--quiet");
  return cwd;
}
function write(cwd, file, content) {
  mkdirSync(dirname(join(cwd, file)), { recursive: true });
  writeFileSync(join(cwd, file), content);
}
function capture(cwd, bytes) {
  write(cwd, "ideas-catalogue/assets/study.png", bytes);
  write(
    cwd,
    "ideas-catalogue/catalogue.js",
    `// prettier-ignore\nwindow.STORMWATCH_IDEAS = ${JSON.stringify([
      {
        id: "study",
        asset: "assets/study.png",
        title: "Study",
        description: "Woodland study.",
        categories: ["background"],
        source: { label: "Art study", file: "study.png" },
        sha256: hash(bytes),
      },
    ])};\n`,
  );
}
function commit(cwd) {
  return spawnSync(
    "git",
    [
      "-c",
      "user.name=Hook test",
      "-c",
      "user.email=hook-test@example.invalid",
      "commit",
      "-m",
      "Fixture",
    ],
    { cwd, encoding: "utf8" },
  );
}
afterEach(() => {
  for (const cwd of directories.splice(0))
    rmSync(cwd, { recursive: true, force: true });
});

it("ignores non-image changes and unchanged historical images", () => {
  const cwd = fixture();
  write(cwd, "historical.png", "old image");
  git(cwd, "add", ".");
  expect(commit(cwd).status).toBe(0);
  write(cwd, "notes.md", "Notes");
  write(cwd, "current.webp", "webp");
  git(cwd, "add", ".");
  expect(auditStagedImages(cwd)).toEqual({ reviewed: [], pending: [] });
});

it("flags PNG and JPEG variants with spaces, uppercase and newlines in filenames", () => {
  const cwd = fixture();
  const names = [
    "concept.PNG",
    "art study.JpG",
    "nested/image.jpeg",
    "line\nbreak.png",
  ];
  for (const name of names) write(cwd, name, name);
  git(cwd, "add", ".");
  expect(
    auditStagedImages(cwd)
      .pending.map((item) => item.file)
      .sort(),
  ).toEqual(names.sort());
});

it("recognizes staged catalogue copies by bytes across different source paths", () => {
  const cwd = fixture();
  capture(cwd, "same generated image");
  write(cwd, "concept.PNG", "same generated image");
  git(cwd, "add", ".");
  const result = auditStagedImages(cwd);
  expect(result.pending).toEqual([]);
  expect(result.reviewed).toHaveLength(2);
  expect(result.reviewed.every((item) => item.disposition === "captured")).toBe(
    true,
  );
});

it("does not let unstaged catalogue content or working-tree image bytes satisfy the gate", () => {
  const cwd = fixture();
  write(cwd, "concept.png", "staged original");
  git(cwd, "add", ".");
  write(cwd, "concept.png", "unstaged revision");
  capture(cwd, "unstaged revision");
  expect(auditStagedImages(cwd).pending[0].sha256).toBe(
    hash("staged original"),
  );
  git(cwd, "add", "ideas-catalogue");
  expect(auditStagedImages(cwd).pending.map((item) => item.file)).toEqual([
    "concept.png",
  ]);
});

it("requires a staged exclusion reason and invalidates it when the image changes", () => {
  const cwd = fixture();
  write(cwd, "capture.jpg", "screenshot");
  git(cwd, "add", ".");
  mkdirSync(join(cwd, "ideas-catalogue"));
  const decision = spawnSync(
    process.execPath,
    [script, "--exclude", "capture.jpg", "--reason", "Diagnostic screenshot"],
    { cwd, encoding: "utf8" },
  );
  expect(decision.status).toBe(0);
  expect(auditStagedImages(cwd).pending).toHaveLength(1);
  git(cwd, "add", "ideas-catalogue/capture-decisions.json");
  expect(auditStagedImages(cwd).reviewed).toEqual([
    { file: "capture.jpg", disposition: "excluded" },
  ]);
  write(cwd, "capture.jpg", "changed screenshot");
  git(cwd, "add", "capture.jpg");
  expect(auditStagedImages(cwd).pending).toHaveLength(1);
});

it("rejects a catalogue entry whose actual staged asset differs from its declared hash", () => {
  const cwd = fixture();
  capture(cwd, "original");
  write(cwd, "ideas-catalogue/assets/study.png", "different image");
  git(cwd, "add", ".");
  expect(() => auditStagedImages(cwd)).toThrow(
    "Stage the catalogue asset and matching metadata",
  );
});

it("reviews renamed images and permits deletion", () => {
  const cwd = fixture();
  write(cwd, "old.png", "image");
  git(cwd, "add", ".");
  expect(commit(cwd).status).toBe(0);
  renameSync(join(cwd, "old.png"), join(cwd, "new.png"));
  git(cwd, "add", "-A");
  expect(auditStagedImages(cwd).pending.map((item) => item.file)).toEqual([
    "new.png",
  ]);
  rmSync(join(cwd, "new.png"));
  git(cwd, "add", "-A");
  expect(auditStagedImages(cwd).pending).toEqual([]);
});

it("blocks a real fixture commit with actionable guidance and passes once the image is captured", () => {
  const cwd = fixture();
  write(
    cwd,
    ".hooks/pre-commit",
    `#!/bin/sh\nnode '${script.replaceAll("'", "'\\''")}'\n`,
  );
  execFileSync("chmod", ["+x", join(cwd, ".hooks/pre-commit")]);
  git(cwd, "config", "core.hooksPath", ".hooks");
  write(cwd, "study.png", "generated image");
  git(cwd, "add", ".");
  const blocked = commit(cwd);
  expect(blocked.status).not.toBe(0);
  expect(blocked.stderr + blocked.stdout).toContain(
    "ideas-catalogue/AGENTS.md",
  );
  expect(blocked.stderr + blocked.stdout).toContain(
    "automatically checks staged PNG/JPEG",
  );
  capture(cwd, "generated image");
  git(cwd, "add", ".");
  expect(commit(cwd).status).toBe(0);
});
