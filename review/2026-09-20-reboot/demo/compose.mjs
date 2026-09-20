// Rebuild the review montage from named, unmodified source captures.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const manifest = JSON.parse(await fs.readFile(path.join(here, "shots.json"), "utf8"));
const output = path.join(here, "assembled");
await fs.mkdir(output, { recursive: true });
for (const [index, shot] of manifest.shots.entries()) {
  const source = path.resolve(root, shot.source);
  const filters = [];
  if (shot.crop) filters.push(`crop=${shot.crop.join(":")}`);
  filters.push("scale=1280:720:force_original_aspect_ratio=decrease", "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x142825", "setsar=1", "fps=30", "format=yuv420p");
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  if (shot.still) args.push("-loop", "1");
  if (shot.start) args.push("-ss", String(shot.start));
  args.push("-i", source, "-t", String(shot.seconds), "-vf", filters.join(","), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", path.join(output, `${index}.mp4`));
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}
await fs.writeFile(path.join(output, "concat.txt"), manifest.shots.map((_, index) => `file '${index}.mp4'\n`).join(""));
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(output, "concat.txt"), "-c", "copy", "-movflags", "+faststart", path.join(here, manifest.output)], { stdio: "inherit" });
console.log(path.join(here, manifest.output));
