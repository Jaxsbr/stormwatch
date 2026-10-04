import { loadRuntimeContent } from "../../src/config/runtime-content";

const status = document.querySelector<HTMLElement>("#status")!;
try {
  const preset =
    new URLSearchParams(location.search).get("preset") ?? "first-board";
  if (preset !== "first-board" && preset !== "all-maps")
    throw new Error("Unknown board review entry.");
  await loadRuntimeContent("/game-content.json");
  const [
    { CANONICAL_CONTENT },
    { PROFILES_KEY },
    { SAVE_KEY },
    { prepareBoardReviewProfile },
  ] = await Promise.all([
    import("../../src/config/configuration"),
    import("../../src/persistence/profiles"),
    import("../../src/persistence/save"),
    import("./board-review-profile"),
  ]);
  // This launcher is served only by the isolated feedback adapter. Fail closed
  // if its storage-key isolation is absent rather than writing ordinary saves.
  if (PROFILES_KEY !== "stormwatch.mosswater-feedback.profiles.v1")
    throw new Error("Open board review through the Mosswater feedback server.");
  const profiles = prepareBoardReviewProfile(
    CANONICAL_CONTENT,
    preset,
    localStorage.getItem(PROFILES_KEY),
    localStorage.getItem(SAVE_KEY),
  );
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  location.replace("/");
} catch (error) {
  status.textContent =
    error instanceof Error ? error.message : "Could not prepare board review.";
}
