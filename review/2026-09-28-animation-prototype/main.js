// Throwaway review prototype: A close-up, B direction comparison, C frame storyboard.
// The actual DefenderRig and canonical cadence are shared with the game.
import * as THREE from "three";
import { CutoutResource } from "/src/render/cutout.ts";
import { DefenderRig } from "/src/render/defender-rig.ts";

const $ = (id) => document.getElementById(id);
const revision = __STORMWATCH_ENGINE_REVISION__;
const content = await fetch("/game-content.json", { cache: "no-store" }).then(
  (r) => {
    if (!r.ok) throw new Error("Could not load canonical game content");
    return r.json();
  },
);
const animals = { squirrel: "bolt", turtle: "net", skunk: "stone" };
const directions = {
  N: ["North", "rear", false],
  E: ["East", "side", false],
  S: ["South", "front", false],
  W: ["West", "side", true],
};
const variants = {
  A: [
    "Close-up",
    "Inspect one direction",
    "Pause, then click a problem spot to mark it.",
  ],
  B: [
    "Direction board",
    "Compare all four directions",
    "All directions share the same moment. Click one to mark a spot.",
  ],
  C: [
    "Frame storyboard",
    "Read the motion frame by frame",
    "Six moments across the attack. Click a panel to inspect that exact pose.",
  ],
};
const params = new URLSearchParams(location.search);
const number = (v, fallback, min, max) =>
  v === null || !Number.isFinite(Number(v))
    ? fallback
    : Math.max(min, Math.min(max, Number(v)));
const state = {
  animal: Object.hasOwn(animals, params.get("tower"))
    ? params.get("tower")
    : "squirrel",
  dir: Object.hasOwn(directions, params.get("dir")) ? params.get("dir") : "N",
  variant: Object.hasOwn(variants, params.get("variant"))
    ? params.get("variant")
    : "A",
  level: params.get("level") === "2" ? 2 : 1,
  diagnostic: ["normal", "ghost", "arms", "equipment"].includes(
    params.get("view"),
  )
    ? params.get("view")
    : "normal",
  zoom: number(params.get("zoom"), 1, 0.7, 2),
  frame: Math.round(number(params.get("frame"), 0, 0, 300)),
  speed: 0.25,
  playing: !params.has("frame"),
};
const interval = () =>
  content.towers[animals[state.animal]].interval *
  (state.level === 2 ? content.rules.upgradeIntervalScale : 1);
// Include the last pre-shot sample; the release itself is frame zero of the next cycle.
const frames = () => Math.ceil(interval() * 30);
const frameTime = (frame = state.frame) => frame / 30;
const asset = (dir = state.dir) =>
  `${state.animal}-${directions[dir][1]}-defender-v1`;
const human = (animal) => animal[0].toUpperCase() + animal.slice(1);
const initialPose = (animal, dir) => ({
  animal,
  dir,
  level: 1,
  frame: 0,
  zoom: 1,
  diagnostic: "normal",
  variant: "A",
});
let notes = [
  {
    id: "SW-A01",
    pose: initialPose("squirrel", "N"),
    part: "bow",
    observed: "When facing north, the bow shows behind the squirrel’s back.",
    wanted: "",
    reported: true,
    resolved: false,
  },
  {
    id: "SW-A02",
    pose: initialPose("turtle", "N"),
    part: "payload",
    observed:
      "When facing north, the net appears behind the shell, then disappears.",
    wanted: "",
    reported: true,
    resolved: false,
  },
  {
    id: "SW-A03",
    pose: initialPose("turtle", "E"),
    part: "drawArm",
    observed:
      "From the side, the turtle’s arm seems to bend backwards. Review both sides and find the exact moment.",
    wanted: "",
    reported: true,
    resolved: false,
  },
];
let pin = null;
let draftPose = null;
let accumulator = 0;
let lastTime = performance.now();
let toastTimeout;
let dirty = false;
function toast(message) {
  $("toast").textContent = message;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => ($("toast").textContent = ""), 4500);
}
function pose() {
  return {
    animal: state.animal,
    dir: state.dir,
    level: state.level,
    frame: state.frame,
    zoom: state.zoom,
    diagnostic: state.diagnostic,
    variant: state.variant,
  };
}
function poseText(p) {
  return `${human(p.animal)} · ${directions[p.dir][0]} · frame ${p.frame} · ${(p.frame / 30).toFixed(3)}s after shot · level ${p.level}`;
}
function poseURL(p = pose()) {
  const url = new URL(location.href);
  url.search = new URLSearchParams({
    variant: p.variant,
    tower: p.animal,
    dir: p.dir,
    frame: String(p.frame),
    level: String(p.level),
    zoom: String(p.zoom),
    view: p.diagnostic,
  }).toString();
  return url;
}
function updateURL() {
  history.replaceState(null, "", poseURL());
}
function markDirty() {
  dirty = true;
  $("export").firstChild.textContent = "Save notes file • ";
}
const resources = new Map();
const rigs = new Map();
function getRig(dir) {
  const id = asset(dir);
  if (!resources.has(id)) resources.set(id, new CutoutResource(id));
  const resource = resources.get(id);
  if (!resource.definition) return null;
  const key = `${id}:${directions[dir][2]}`;
  if (!rigs.has(key))
    rigs.set(key, new DefenderRig(resource, 2, directions[dir][2]));
  return rigs.get(key);
}
const renderer = new THREE.WebGLRenderer({
  canvas: $("render"),
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor("#26392d");
const camera = new THREE.OrthographicCamera(-2, 2, 2.5, -1.5, 0.1, 100);
camera.position.set(0, 0, 10);
const scene = new THREE.Scene();
let tiles = [];
function framing(rect, dir) {
  const bounds = getRig(dir)?.bounds();
  const aspect = rect.width / rect.height;
  const height =
    Math.max(
      3.25,
      bounds ? (bounds.right - bounds.left + 0.6) / aspect : 3.25,
    ) / state.zoom;
  return {
    height,
    width: height * aspect,
    centerX: bounds ? (bounds.left + bounds.right) / 2 : 0,
  };
}
function setTiles() {
  const configs =
    state.variant === "B"
      ? ["N", "E", "W", "S"].map((dir) => ({ dir, fixed: null }))
      : state.variant === "C"
        ? Array.from({ length: 6 }, (_, i) => ({
            dir: state.dir,
            fixed: Math.round((i * (frames() - 1)) / 5),
          }))
        : [{ dir: state.dir, fixed: null }];
  $("tiles").replaceChildren();
  $("tiles").dataset.variant = state.variant;
  tiles = configs.map((config, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "tile";
    el.setAttribute(
      "aria-label",
      `${directions[config.dir][0]} ${config.fixed === null ? "live pose" : `frame ${config.fixed}`} — mark a problem`,
    );
    el.innerHTML =
      '<span class="tile-title"></span><span class="tile-selected"></span><span class="tile-time"></span><span class="pin" hidden></span>';
    el.addEventListener("click", (e) => {
      state.playing = false;
      accumulator = 0;
      state.dir = config.dir;
      if (config.fixed !== null) state.frame = config.fixed;
      const rect = el.getBoundingClientRect();
      pin = {
        x:
          e.detail === 0
            ? 0.5
            : Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y:
          e.detail === 0
            ? 0.5
            : Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
        tile: index,
      };
      const frame = framing(rect, config.dir);
      pin.worldX = frame.centerX + (pin.x - 0.5) * frame.width;
      pin.worldY = 1 + (0.5 - pin.y) * frame.height;
      draftPose = pose();
      sync(false);
      draw();
      $("note-context").textContent = `${poseText(draftPose)} · marked spot`;
    });
    $("tiles").append(el);
    return { ...config, el };
  });
}
function sync(rebuild = true) {
  state.frame = Math.min(state.frame, frames() - 1);
  document.body.dataset.variant = state.variant;
  for (const id of ["tower", "level", "diagnostic", "speed", "zoom"])
    $(id).value = id === "tower" ? state.animal : String(state[id]);
  document
    .querySelectorAll("[data-dir]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.dir === state.dir)),
    );
  $("variant-name").textContent =
    `${state.variant} · ${variants[state.variant][0]}`;
  $("view-title").textContent = variants[state.variant][1];
  $("view-help").textContent = variants[state.variant][2];
  $("play").textContent = state.playing ? "Pause" : "Play";
  $("zoom-label").textContent = `${state.zoom.toFixed(1)}×`;
  $("timeline").max = frames() - 1;
  if (rebuild) setTiles();
  syncTime();
  updateURL();
}
function syncTime() {
  $("timeline").value = state.frame;
  $("timecode").textContent =
    `F${String(state.frame).padStart(2, "0")} / ${frames() - 1} · ${frameTime().toFixed(3)}s / ${interval().toFixed(2)}s`;
  $("pose-details").textContent =
    `${asset()}${directions[state.dir][2] ? " · mirrored" : ""} · ${state.diagnostic === "normal" ? "game layers" : "DIAGNOSTIC VIEW"} · ${revision}`;
  if (!draftPose)
    $("note-context").textContent = state.playing
      ? "Pause or click a spot to capture a pose."
      : poseText(pose());
}
function clearCapture() {
  pin = null;
  draftPose = null;
}
function projectedPin(rect, dir) {
  if (!Number.isFinite(pin?.worldX) || !Number.isFinite(pin?.worldY))
    return pin;
  const frame = framing(rect, dir);
  return {
    x: 0.5 + (pin.worldX - frame.centerX) / frame.width,
    y: 0.5 - (pin.worldY - 1) / frame.height,
  };
}
function pauseAt(frame) {
  const fromStoryboard = state.variant === "C";
  if (fromStoryboard) state.variant = "A";
  state.playing = false;
  accumulator = 0;
  state.frame = (frame + frames()) % frames();
  clearCapture();
  sync(fromStoryboard);
}
function draw() {
  const rect = $("stage").getBoundingClientRect();
  const width = $("stage").clientWidth,
    height = $("stage").clientHeight;
  if (
    renderer.domElement.width !==
      Math.round(width * renderer.getPixelRatio()) ||
    renderer.domElement.height !== Math.round(height * renderer.getPixelRatio())
  )
    renderer.setSize(width, height, false);
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  let ready = true;
  tiles.forEach((tile, i) => {
    const r = tile.el.getBoundingClientRect();
    const x = r.left - rect.left - 1,
      y = height - (r.bottom - rect.top - 1);
    const rig = getRig(tile.dir);
    if (!rig) {
      ready = false;
      return;
    }
    const f = tile.fixed ?? state.frame;
    const age = f / 30;
    rig.update(age, Math.max(0, interval() - age), 1000);
    // Diagnostic display only; original rig and descriptor files are never modified.
    for (const child of rig.group.children) {
      if (child.material) child.material.opacity = 1;
      if (child.isMesh) child.visible = state.diagnostic !== "equipment";
      if (child.isLine && state.diagnostic === "arms") child.visible = false;
    }
    for (const [id, sprite] of rig.cutout.parts) {
      if (id === "holdArm" || id === "drawArm") {
        sprite.visible = false;
        continue;
      }
      const naturallyVisible = id !== "payload" || age > 0.3;
      sprite.visible =
        naturallyVisible &&
        (state.diagnostic === "arms"
          ? false
          : state.diagnostic === "equipment"
            ? id !== "body"
            : true);
      if (id === "body" && state.diagnostic === "ghost")
        sprite.material.opacity = 0.18;
    }
    // update() sets arrow visibility; it leaves bowstring visibility implicit.
    if (rig.cutout.parts.has("bow") && state.diagnostic !== "arms") {
      const lines = rig.group.children.filter((c) => c.isLine);
      // CutoutInstance owns two empty legacy lines; DefenderRig owns the last two.
      lines.at(-2).visible = true;
      lines.at(-1).visible = age > 0.18;
    }
    const frame = framing(r, tile.dir),
      worldHeight = frame.height,
      worldWidth = frame.width;
    camera.left = frame.centerX - worldWidth / 2;
    camera.right = frame.centerX + worldWidth / 2;
    camera.top = 1 + worldHeight / 2;
    camera.bottom = 1 - worldHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.setClearColor(i % 2 ? "#293b30" : "#26372d");
    renderer.clear();
    scene.add(rig.group);
    renderer.render(scene, camera);
    scene.remove(rig.group);
    tile.el.querySelector(".tile-title").textContent =
      `${directions[tile.dir][0].toUpperCase()} ${tile.dir === "W" ? "· MIRRORED SIDE" : `· ${directions[tile.dir][1].toUpperCase()}`}`;
    tile.el.querySelector(".tile-time").textContent =
      `F${String(f).padStart(2, "0")} · ${age.toFixed(3)}s after shot`;
    tile.el.querySelector(".tile-selected").textContent =
      tile.dir === state.dir &&
      (tile.fixed === null || tile.fixed === state.frame)
        ? "SELECTED"
        : "";
    const marker = tile.el.querySelector(".pin");
    marker.hidden = !pin || pin.tile !== i;
    if (pin?.tile === i) {
      const position = projectedPin(r, tile.dir);
      marker.style.left = `${position.x * 100}%`;
      marker.style.top = `${position.y * 100}%`;
    }
  });
  $("loading").hidden = ready;
  renderer.setScissorTest(false);
}
function animate(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (state.playing && state.variant !== "C") {
    accumulator += dt * state.speed * 30;
    const steps = Math.floor(accumulator);
    if (steps) {
      state.frame = (state.frame + steps) % frames();
      accumulator -= steps;
      syncTime();
    }
  }
  draw();
  requestAnimationFrame(animate);
}
function snapshot() {
  draw();
  const source = renderer.domElement;
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height + 78;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#142219";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(source, 0, 78);
  ctx.fillStyle = "#e6c276";
  ctx.font = "bold 16px system-ui";
  ctx.fillText(poseText(pose()), 18, 28);
  ctx.fillStyle = "#b2c4b6";
  ctx.font = "12px system-ui";
  ctx.fillText(
    `${asset()} | ${state.diagnostic} | ${state.zoom.toFixed(1)}× | ${revision}`,
    18,
    53,
  );
  const stage = $("render").getBoundingClientRect();
  const ratio = source.width / stage.width;
  tiles.forEach((tile, i) => {
    const rect = tile.el.getBoundingClientRect(),
      x = (rect.left - stage.left) * ratio,
      y = (rect.top - stage.top) * ratio + 78;
    ctx.fillStyle = "#d2ded3";
    ctx.font = `${12 * ratio}px system-ui`;
    ctx.fillText(
      `${directions[tile.dir][0]} · F${tile.fixed ?? state.frame}`,
      x + 14 * ratio,
      y + 25 * ratio,
    );
    if (pin?.tile === i) {
      const position = projectedPin(rect, tile.dir);
      const px = x + position.x * rect.width * ratio,
        py = y + position.y * rect.height * ratio;
      ctx.strokeStyle = "#ffdb87";
      ctx.lineWidth = 2 * ratio;
      ctx.beginPath();
      ctx.arc(px, py, 13 * ratio, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 5 * ratio, py);
      ctx.lineTo(px + 5 * ratio, py);
      ctx.moveTo(px, py - 5 * ratio);
      ctx.lineTo(px, py + 5 * ratio);
      ctx.stroke();
    }
  });
  return out.toDataURL("image/png");
}
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function imageDownload(note) {
  const a = document.createElement("a");
  a.href = note.image;
  a.download = `${note.id}-${note.pose.animal}-${note.pose.dir}-F${note.pose.frame}.png`;
  a.click();
}
function transfer(mode, text = "") {
  const importing = mode === "import";
  $("transfer-title").textContent = importing
    ? "Open saved notes"
    : "Share feedback";
  $("transfer-help").textContent = importing
    ? "Choose a notes file, or paste the contents of a saved notes file below. Existing notes will be kept."
    : "Copy this text into our chat. It includes the tower, direction, frame and your requested changes. You can also select and copy the text manually.";
  $("transfer-text").value = text;
  $("transfer-text").readOnly = !importing;
  $("choose-file").hidden = !importing;
  $("transfer-action").textContent = importing
    ? "Open pasted notes"
    : "Copy text";
  $("transfer-action").onclick = importing
    ? () => importNotes($("transfer-text").value)
    : async () => {
        $("transfer-text").select();
        try {
          await navigator.clipboard.writeText($("transfer-text").value);
          toast("Copied to clipboard.");
        } catch {
          toast("Text selected. Press ⌘C or Ctrl+C to copy.");
        }
      };
  $("transfer").showModal();
  if (!importing) $("transfer-text").select();
}
function copy(text) {
  transfer("copy", text);
}
$("transfer-close").onclick = () => $("transfer").close();
$("choose-file").onclick = () => $("import-file").click();

function feedback() {
  return [
    "# Stormwatch animation review",
    `Renderer revision: ${revision}`,
    "Frame rate: 30 samples/second. Times are seconds after a shot.",
    ...notes.map(
      (n) =>
        `\n## ${n.id} · ${human(n.pose.animal)} · ${directions[n.pose.dir][0]} · ${n.part}\nStatus: ${n.resolved ? "resolved" : "open"}${n.reported ? " · initial report; frame not yet identified" : ""}\n${n.reported ? "Starting direction only; frame 0 is not evidence of the reported issue." : poseText(n.pose)}\nView: ${n.pose.diagnostic}; zoom ${n.pose.zoom}×; asset ${n.pose.animal}-${directions[n.pose.dir][1]}-defender-v1\n${n.pin ? `Marked spot: ${(n.pin.x * 100).toFixed(1)}% across, ${(n.pin.y * 100).toFixed(1)}% down the panel.\n` : ""}Observed: ${n.observed}\nWanted: ${n.wanted || "Needs discussion"}\nPose: ${poseURL(n.pose)}${n.revision ? `\nCaptured revision: ${n.revision}; interval ${n.interval}s` : ""}`,
    ),
  ].join("\n");
}
function renderNotes() {
  $("note-count").textContent = notes.length;
  $("note-list").replaceChildren();
  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.dataset.resolved = note.resolved;
    const title = document.createElement("h4");
    title.textContent = `${note.id} · ${human(note.pose.animal)} / ${directions[note.pose.dir][0]}`;
    const text = document.createElement("p");
    text.textContent = note.observed;
    const meta = document.createElement("p");
    meta.className = "note-meta";
    meta.textContent = `${note.part} · ${note.reported ? "Initial report · find the frame" : `F${note.pose.frame} · ${(note.pose.frame / 30).toFixed(3)}s · ${note.pose.diagnostic}`}${note.resolved ? " · resolved" : ""}`;
    const actions = document.createElement("div");
    actions.className = "note-actions";
    const addAction = (label, fn) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = fn;
      actions.append(b);
    };
    addAction("Inspect pose", () => {
      Object.assign(state, note.pose, { playing: false });
      accumulator = 0;
      pin = note.pin ? { ...note.pin } : null;
      draftPose = pose();
      sync();
      draw();
      $("note-context").textContent =
        `${note.id} · ${note.reported ? "Starting direction; find the problem frame." : poseText(note.pose)}`;
      $("part").value = note.part;
      $("stage").scrollIntoView({ behavior: "smooth", block: "center" });
      if (note.revision && note.revision !== revision)
        toast(
          "This note was captured on another revision; its saved PNG preserves the original appearance.",
        );
    });
    if (note.image) addAction("Save PNG", () => imageDownload(note));
    addAction(note.resolved ? "Reopen" : "Resolve", () => {
      note.resolved = !note.resolved;
      markDirty();
      renderNotes();
    });
    addAction("Delete", () => {
      notes = notes.filter((n) => n !== note);
      markDirty();
      renderNotes();
    });
    card.append(title, text);
    if (note.wanted) {
      const wanted = document.createElement("p");
      wanted.textContent = `Wanted: ${note.wanted}`;
      wanted.style.marginTop = "6px";
      card.append(wanted);
    }
    card.append(meta, actions);
    $("note-list").append(card);
  }
}
$("note-form").onsubmit = (e) => {
  e.preventDefault();
  if (!$("observed").value.trim()) return;
  if (!$("loading").hidden) {
    toast("Wait for the artwork to load before capturing a note.");
    return;
  }
  state.playing = false;
  sync(false);
  if (!draftPose) draftPose = pose();
  const id = `SW-A${String(Math.max(0, ...notes.map((n) => Number(n.id.slice(4)) || 0)) + 1).padStart(2, "0")}`;
  notes.push({
    id,
    pose: pose(),
    part: $("part").value,
    observed: $("observed").value.trim(),
    wanted: $("wanted").value.trim(),
    pin: pin ? { ...pin } : null,
    image: snapshot(),
    revision,
    interval: interval(),
    reported: false,
    resolved: false,
  });
  $("observed").value = "";
  $("wanted").value = "";
  markDirty();
  renderNotes();
  toast(
    `${id} saved with the exact pose and a PNG. Save the notes file to keep it.`,
  );
};
for (const id of ["observed", "wanted"]) {
  $(id).addEventListener("focus", () => {
    state.playing = false;
    accumulator = 0;
    draftPose = pose();
    sync(false);
    $("note-context").textContent =
      `${poseText(draftPose)}${pin ? " · marked spot" : ""}`;
  });
}
$("tower").onchange = () => {
  state.animal = $("tower").value;
  $("part").value = state.animal === "squirrel" ? "bow" : "payload";
  state.frame = 0;
  accumulator = 0;
  clearCapture();
  sync();
};
document.querySelectorAll("[data-dir]").forEach(
  (b) =>
    (b.onclick = () => {
      state.dir = b.dataset.dir;
      clearCapture();
      sync();
    }),
);
$("level").onchange = () => {
  state.level = Number($("level").value);
  state.frame = 0;
  accumulator = 0;
  clearCapture();
  sync();
};
$("diagnostic").onchange = () => {
  state.diagnostic = $("diagnostic").value;
  clearCapture();
  sync(false);
};
$("zoom").oninput = () => {
  state.zoom = Number($("zoom").value);
  clearCapture();
  sync(false);
};
$("speed").onchange = () => {
  state.speed = Number($("speed").value);
  sync(false);
};
$("play").onclick = () => {
  if (state.variant === "C") {
    state.variant = "A";
    clearCapture();
    state.playing = true;
    sync();
  } else {
    state.playing = !state.playing;
    clearCapture();
    sync(false);
  }
};
$("previous").onclick = () => pauseAt(state.frame - 1);
$("next").onclick = () => pauseAt(state.frame + 1);
$("timeline").oninput = () => {
  if (state.variant === "C") {
    state.variant = "A";
    setTiles();
  }
  pauseAt(Number($("timeline").value));
};
function changeVariant(delta) {
  const keys = Object.keys(variants);
  state.variant =
    keys[(keys.indexOf(state.variant) + delta + keys.length) % keys.length];
  if (state.variant === "C") state.playing = false;
  clearCapture();
  sync();
}
$("variant-prev").onclick = () => changeVariant(-1);
$("variant-next").onclick = () => changeVariant(1);
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, [contenteditable]")) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    changeVariant(e.key === "ArrowLeft" ? -1 : 1);
  }
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    $("play").click();
  }
});
$("copy-pose").onclick = () => {
  state.playing = false;
  sync(false);
  copy(poseURL().toString());
};
$("copy-notes").onclick = () => copy(feedback());
$("export").onclick = () => {
  download(
    "stormwatch-animation-notes.json",
    JSON.stringify(
      {
        schema: "stormwatch-animation-review-v1",
        revision,
        savedAt: new Date().toISOString(),
        notes,
      },
      null,
      2,
    ),
    "application/json",
  );
  dirty = false;
  $("export").firstChild.textContent = "Save notes file ";
  toast("Download requested. Check your downloads for the notes file.");
};
$("import").onclick = () => transfer("import");
$("import-file").onchange = async () => {
  const file = $("import-file").files[0];
  if (file) importNotes(await file.text());
  $("import-file").value = "";
};
function importNotes(text) {
  try {
    const data = JSON.parse(text);
    const valid =
      data.schema === "stormwatch-animation-review-v1" &&
      Array.isArray(data.notes) &&
      data.notes.every(
        (n) =>
          n &&
          /^SW-A\d+$/.test(n.id) &&
          n.pose &&
          Object.hasOwn(animals, n.pose.animal) &&
          Object.hasOwn(directions, n.pose.dir) &&
          Object.hasOwn(variants, n.pose.variant) &&
          [1, 2].includes(n.pose.level) &&
          Number.isInteger(n.pose.frame) &&
          n.pose.frame >= 0 &&
          n.pose.frame < 300 &&
          Number.isFinite(n.pose.zoom) &&
          n.pose.zoom >= 0.7 &&
          n.pose.zoom <= 2 &&
          ["normal", "ghost", "arms", "equipment"].includes(
            n.pose.diagnostic,
          ) &&
          typeof n.observed === "string" &&
          typeof n.wanted === "string" &&
          typeof n.part === "string" &&
          (!n.image || /^data:image\/png;base64,/.test(n.image)) &&
          (!n.pin ||
            [n.pin.x, n.pin.y].every(
              (v) => Number.isFinite(v) && v >= 0 && v <= 1,
            )),
      );
    if (!valid)
      throw new Error("This is not a valid animation review notes file.");
    const merged = new Map(notes.map((n) => [n.id, n]));
    // Keep existing local work: differing notes with a reused ID receive a new ID.
    for (const n of data.notes) {
      const current = merged.get(n.id);
      if (!current) merged.set(n.id, n);
      else if (JSON.stringify(current) !== JSON.stringify(n)) {
        n.id = `SW-A${String(Math.max(...[...merged.keys()].map((k) => Number(k.slice(4)))) + 1).padStart(2, "0")}`;
        merged.set(n.id, n);
      }
    }
    notes = [...merged.values()];
    renderNotes();
    markDirty();
    $("transfer").close();
    toast("Notes opened. Existing notes have been kept.");
  } catch (error) {
    toast(error.message);
  }
}
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
$("part").value = state.animal === "squirrel" ? "bow" : "payload";
sync();
renderNotes();
requestAnimationFrame(animate);
