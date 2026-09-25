import { rolldown } from "rolldown";

const bundle = await rolldown({ input: "tools/challenge-baseline.ts" });
const { output } = await bundle.generate({ format: "esm" });
await bundle.close();
const script = output.find((item) => item.type === "chunk")?.code;
if (!script) throw new Error("Challenge baseline bundle was empty");
try {
  await import(
    `data:text/javascript;base64,${Buffer.from(script).toString("base64")}`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
