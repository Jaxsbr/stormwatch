import { execFileSync } from "node:child_process";

/** Local build provenance; source archives without Git disclose their limitation. */
export function engineRevision() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "development-unversioned";
  }
}
