(() => {
  const ideas = window.STORMWATCH_IDEAS;
  const categories = [
    ["all", "All ideas"],
    ["background", "Background art"],
    ["map", "Maps"],
    ["interface", "User interface"],
    ["character", "Characters"],
  ];
  const pageSize = 6;
  const element = (id) => document.getElementById(id);
  const art = element("art");
  let category = "all";
  let filtered = ideas;
  let selected = 0;
  let previewStart = 0;

  function readSelection() {
    const requested = new URLSearchParams(location.search).get("category");
    category = categories.some(([id]) => id === requested) ? requested : "all";
    filtered =
      category === "all"
        ? ideas
        : ideas.filter((idea) => idea.categories.includes(category));
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      id = "";
    }
    selected = Math.max(
      0,
      filtered.findIndex((idea) => idea.id === id),
    );
    previewStart = Math.floor(selected / pageSize) * pageSize;
    show();
  }

  function select(id, nextCategory = category) {
    const url = new URL(location.href);
    if (nextCategory === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);
    url.hash = id || "";
    if (url.href !== location.href) history.pushState(null, "", url);
    readSelection();
  }

  function showPreviews() {
    const strip = element("thumbnails");
    const focusedPreview = strip.contains(document.activeElement)
      ? document.activeElement.getAttribute("aria-label")
      : null;
    strip.replaceChildren();
    filtered.slice(previewStart, previewStart + pageSize).forEach((idea) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "thumbnail";
      button.setAttribute("aria-label", `View ${idea.title}`);
      button.setAttribute(
        "aria-pressed",
        String(idea.id === filtered[selected]?.id),
      );
      const image = document.createElement("img");
      image.src = idea.asset;
      image.alt = "";
      image.loading = "lazy";
      const title = document.createElement("span");
      title.textContent = idea.title;
      button.append(image, title);
      button.addEventListener("click", () => select(idea.id));
      strip.append(button);
    });
    if (focusedPreview) {
      [...strip.children]
        .find((button) => button.getAttribute("aria-label") === focusedPreview)
        ?.focus({ preventScroll: true });
    }
    element("preview-range").textContent = filtered.length
      ? `Previews ${previewStart + 1}–${Math.min(previewStart + pageSize, filtered.length)} of ${filtered.length}`
      : "No previews";
    element("preview-previous").disabled = previewStart === 0;
    element("preview-next").disabled =
      previewStart + pageSize >= filtered.length;
  }

  function show() {
    for (const button of element("categories").children)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      );
    const idea = filtered[selected];
    element("previous").disabled = element("next").disabled =
      filtered.length < 2;
    element("original").hidden = !idea;
    element("image-error").hidden = true;
    if (!idea) {
      element("title").textContent = "No ideas in this category yet";
      for (const id of ["description", "source", "kind", "counter"])
        element(id).textContent = "";
      showPreviews();
      return;
    }
    art.src = idea.asset;
    art.alt = `${idea.title}: ${idea.description}`;
    element("original").href = idea.asset;
    element("title").textContent = idea.title;
    element("description").textContent = idea.description;
    element("kind").textContent =
      idea.kind === "concept" ? "Concept study" : "Existing art";
    element("source").textContent = idea.source.session
      ? `From ${idea.source.label} · Chat ${idea.source.session}`
      : `From ${idea.source.label} · ${idea.source.file}`;
    element("counter").textContent = `${selected + 1} / ${filtered.length}`;
    document.title = `${idea.title} · Stormwatch ideas`;
    showPreviews();
  }

  categories.forEach(([id, label]) => {
    const count =
      id === "all"
        ? ideas.length
        : ideas.filter((idea) => idea.categories.includes(id)).length;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = id;
    button.textContent = `${label} · ${count}`;
    button.addEventListener("click", () => {
      const matching =
        id === "all"
          ? ideas
          : ideas.filter((idea) => idea.categories.includes(id));
      const current = filtered[selected];
      select(
        matching.find((idea) => idea.id === current?.id)?.id || matching[0]?.id,
        id,
      );
    });
    element("categories").append(button);
  });
  function move(direction) {
    if (filtered.length)
      select(
        filtered[(selected + direction + filtered.length) % filtered.length].id,
      );
  }
  element("previous").addEventListener("click", () => move(-1));
  element("next").addEventListener("click", () => move(1));
  for (const [id, direction] of [
    ["preview-previous", -1],
    ["preview-next", 1],
  ])
    element(id).addEventListener("click", () => {
      previewStart = Math.max(
        0,
        Math.min(
          Math.floor((filtered.length - 1) / pageSize) * pageSize,
          previewStart + direction * pageSize,
        ),
      );
      showPreviews();
    });
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  art.addEventListener("error", () => {
    element("image-error").hidden = false;
  });
  window.addEventListener("hashchange", readSelection);
  window.addEventListener("popstate", readSelection);
  readSelection();
})();
