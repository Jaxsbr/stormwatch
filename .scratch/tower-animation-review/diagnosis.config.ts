import { defineConfig } from "vitest/config";
// Opt-in reproduction of unfixed artwork/pose defects; not the application suite.
export default defineConfig({
  test: { include: [".scratch/tower-animation-review/diagnosis.probe.ts"] },
});
