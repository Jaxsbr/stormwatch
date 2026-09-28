// Four-direction review board, selected by the owner from prototype option B.
// Uses the actual game renderer; no alternate poses, layers or artwork.
import * as THREE from "three";
import { CutoutResource } from "/src/render/cutout.ts";
import { DefenderRig } from "/src/render/defender-rig.ts";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const animals = { squirrel: "bolt", turtle: "net", skunk: "stone" };
const directions = {
  N: ["rear", false],
  E: ["side", false],
  W: ["side", true],
  S: ["front", false],
};
let animal = Object.hasOwn(animals, params.get("tower"))
  ? params.get("tower")
  : "squirrel";
let frame = Math.max(0, Math.trunc(Number(params.get("frame")) || 0));
let playing = !params.has("frame");
let elapsed = 0;
let content;
const resources = new Map();
const rigs = new Map();
const renderer = new THREE.WebGLRenderer({
  canvas: $("render"),
  antialias: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-2, 2, 2.5, -1, 0.1, 100);
camera.position.z = 10;
const panels = [...document.querySelectorAll("[data-dir]")];

function rigFor(dir) {
  const [view, mirrored] = directions[dir];
  const id = `${animal}-${view}-defender-v1`;
  if (!resources.has(id)) resources.set(id, new CutoutResource(id));
  const resource = resources.get(id);
  if (!resource.definition) return null;
  const key = `${id}:${mirrored}`;
  if (!rigs.has(key)) rigs.set(key, new DefenderRig(resource, 2, mirrored));
  return rigs.get(key);
}
function sync() {
  $("tower").value = animal;
  $("play").textContent = playing ? "Pause" : "Play";
  const url = new URL(location.href);
  url.search = new URLSearchParams({
    tower: animal,
    ...(!playing ? { frame: String(frame) } : {}),
  });
  history.replaceState(null, "", url);
}
$("tower").onchange = () => {
  animal = $("tower").value;
  frame = 0;
  elapsed = 0;
  sync();
};
$("play").onclick = () => {
  playing = !playing;
  sync();
};
document.addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    (e.target === document.body || e.target === $("render"))
  ) {
    e.preventDefault();
    $("play").click();
  }
});

function draw() {
  const stage = $("stage");
  const rect = renderer.domElement.getBoundingClientRect();
  const width = stage.clientWidth,
    height = stage.clientHeight;
  if (
    renderer.domElement.width !==
      Math.floor(width * renderer.getPixelRatio()) ||
    renderer.domElement.height !== Math.floor(height * renderer.getPixelRatio())
  )
    renderer.setSize(width, height, false);
  renderer.setScissorTest(false);
  renderer.setClearColor("#24372b");
  renderer.clear();
  renderer.setScissorTest(true);
  const interval = content.towers[animals[animal]].interval;
  const count = Math.ceil(interval * 30);
  frame %= count;
  const age = frame / 30;
  const actors = panels.map((panel) => ({
    panel,
    rig: rigFor(panel.dataset.dir),
  }));
  const ready = actors.every((actor) => actor.rig);
  $("loading").hidden = ready;
  // Keep all four panels at the same scale, while fitting the widest view.
  const bounds = actors.map(({ rig }) => rig?.bounds());
  const widest = Math.max(
    2.5,
    ...bounds.map((b) => (b ? b.right - b.left + 0.6 : 0)),
  );
  actors.forEach(({ panel, rig }, i) => {
    if (!rig) return;
    const r = panel.getBoundingClientRect();
    const b = bounds[i];
    const aspect = r.width / r.height;
    const worldHeight = Math.max(3.25, widest / aspect),
      worldWidth = worldHeight * aspect;
    const centerX = (b.left + b.right) / 2;
    camera.left = centerX - worldWidth / 2;
    camera.right = centerX + worldWidth / 2;
    camera.top = 1 + worldHeight / 2;
    camera.bottom = 1 - worldHeight / 2;
    camera.updateProjectionMatrix();
    rig.update(age, Math.max(0, interval - age), 1000);
    const x = r.left - rect.left,
      y = rect.bottom - r.bottom;
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.setClearColor(i % 2 ? "#293d30" : "#26392d");
    renderer.clear();
    scene.add(rig.group);
    renderer.render(scene, camera);
    scene.remove(rig.group);
    panel.querySelector("output").textContent =
      `F${String(frame).padStart(2, "0")} · ${age.toFixed(3)}s after shot`;
  });
  renderer.setScissorTest(false);
}
try {
  const response = await fetch("/game-content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Game content could not be loaded.");
  content = await response.json();
  frame %= Math.ceil(content.towers[animals[animal]].interval * 30);
  sync();
  let previous = performance.now();
  function animate(now) {
    const dt = Math.min(0.1, (now - previous) / 1000);
    previous = now;
    if (playing && $("loading").hidden) {
      elapsed += dt * 30;
      const steps = Math.floor(elapsed);
      frame += steps;
      elapsed -= steps;
    }
    draw();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
} catch (error) {
  $("loading").textContent = `${error.message} Reload to try again.`;
}
