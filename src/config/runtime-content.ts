import { installRuntimeContent } from "./configuration";

/** Complete loading before importing the game, whose adapters derive catalogs and save IDs. */
export async function loadRuntimeContent(
  url: string,
  request: typeof fetch = fetch,
): Promise<void> {
  const response = await request(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Game configuration could not be loaded.");
  installRuntimeContent(await response.json());
}
