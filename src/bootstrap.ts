import { loadRuntimeContent } from "./config/runtime-content";

async function start() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.textContent = "Loading Stormwatch…";
  try {
    await loadRuntimeContent(`${import.meta.env.BASE_URL}game-content.json`);
    await import("./main");
  } catch {
    app.replaceChildren();
    const message = document.createElement("p");
    message.textContent =
      "Stormwatch could not load its game configuration. Please try again.";
    const retry = document.createElement("button");
    retry.textContent = "Reload game";
    retry.onclick = () => location.reload();
    app.append(message, retry);
  }
}
void start();
