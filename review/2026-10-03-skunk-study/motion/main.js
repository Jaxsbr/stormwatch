import * as T from "three";
import { CutoutResource, CutoutInstance } from "/src/render/cutout.ts";
import { DefenderArm } from "/src/render/defender-arm.ts";
const $ = (id) => document.getElementById(id);
const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
const point = (x, y) => new T.Vector3(x, y, 0);
const RELEASE = 0.66;
const resource = new CutoutResource("skunk-side-defender-v1");
const renderer = new T.WebGLRenderer({ canvas: $("canvas"), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene();
const camera = new T.OrthographicCamera();
camera.position.z = 10;
camera.near = 0.1;
camera.far = 100;
let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
$("reduced").checked = !playing;
let clock = 0,
  previous = performance.now();
const content = await (await fetch("/game-content.json")).json();
const interval = content.towers.stone.interval;
await resource.ready;
const texture = await new T.TextureLoader().loadAsync("./flask.png");
texture.colorSpace = T.SRGBColorSpace;
const cutout = new CutoutInstance(resource, 2);
const group = cutout.group;
const arms = new Map();
for (const p of resource.definition.parts.filter((p) => p.joints?.elbow)) {
  // Reuse the open supporting paw for the throwing arm in this isolated study.
  const drawing =
    p.id === "drawArm"
      ? {
          ...resource.definition.parts.find((part) => part.id === "holdArm"),
          scale: 0.88,
          z: 3,
        }
      : p;
  const arm = new DefenderArm(drawing, resource);
  arms.set(p.id, arm);
  cutout.parts.get(p.id).visible = false;
  group.add(arm.mesh);
}
cutout.parts.get("payload").visible = false;
const def = resource.definition.parts.find((p) => p.id === "body");
const geometry = new T.PlaneGeometry(def.rect[2], def.rect[3], 12, 20);
const positions = geometry.attributes.position;
for (let i = 0; i < positions.count; i++)
  positions.setXY(
    i,
    positions.getX(i) + def.rect[2] / 2 - def.pivot[0],
    positions.getY(i) + def.pivot[1] - def.rect[3] / 2,
  );
const original = Float32Array.from(positions.array);
const body = new T.Mesh(
  geometry,
  new T.MeshBasicMaterial({
    map: resource.textures.get("body"),
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: T.DoubleSide,
  }),
);
body.renderOrder = 1000.01;
cutout.parts.get("body").visible = false;
group.add(body);
function flask() {
  // Texture has transparent margins: visible diameter ~180 art units, matching approved sheet.
  const m = new T.Mesh(
    new T.PlaneGeometry(280, 264),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  m.renderOrder = 1000.025;
  group.add(m);
  return m;
}
const held = flask(),
  flying = flask();
const ready = point(25, 265),
  back = point(-195, 230),
  release = point(170, 315),
  follow = point(170, 355);
const offset = point(35, 75);
function transform(x, y, lean, dip) {
  const w = smooth(90, 500, y);
  return point(x + lean * w, y - dip * w);
}
function desired(t) {
  if (t < 0.12) return ready.clone();
  if (t < 0.48) return ready.clone().lerp(back, smooth(0.12, 0.48, t));
  if (t < 0.52) return back.clone();
  if (t < RELEASE) return back.clone().lerp(release, smooth(0.52, RELEASE, t));
  if (t < 0.76) return release.clone().lerp(follow, smooth(RELEASE, 0.76, t));
  return follow.clone().lerp(ready, smooth(0.76, 0.94, t));
}
function effort(t) {
  const load = smooth(0.12, 0.48, t) * (1 - smooth(0.52, RELEASE, t));
  const cast = smooth(0.52, RELEASE, t) * (1 - smooth(0.76, 0.94, t));
  return $("reduced").checked
    ? [0, 0]
    : [-9 * load + 7 * cast, 7 * load - 3 * cast];
}
function solveNear(t) {
  const [lean, dip] = effort(t),
    socket = cutout.rests.get("drawArm");
  return arms
    .get("drawArm")
    .reach(transform(socket.x, socket.y, lean, dip), desired(t), 1000);
}
function pose(t) {
  cutout.reset(1000);
  const [lean, dip] = effort(t);
  for (let i = 0; i < positions.count; i++) {
    const v = transform(original[i * 3], original[i * 3 + 1], lean, dip);
    positions.setXYZ(i, v.x, v.y, 0);
  }
  positions.needsUpdate = true;
  // Sample actual solved launch, then restore current arm: scrubbing is independent of frame history.
  const launch = solveNear(RELEASE).add(offset);
  const hand = solveNear(t);
  const support = point(140, 310)
    .lerp(point(242, 350), smooth(0.12, 0.45, t))
    .lerp(point(140, 310), smooth(0.78, 0.94, t));
  const socket = cutout.rests.get("holdArm");
  arms
    .get("holdArm")
    .reach(transform(socket.x, socket.y, lean, dip), support, 1000);
  const backWeight = smooth(0.12, 0.48, t) * (1 - smooth(0.52, RELEASE, t));
  const heldOffset = offset.clone().lerp(point(-30, 65), backWeight);
  held.position.copy(hand).add(heldOffset);
  const tilt = -0.25 * smooth(0.12, 0.48, t) * (1 - smooth(0.52, RELEASE, t));
  held.rotation.z = $("reduced").checked ? 0 : tilt;
  held.visible = t < RELEASE || t >= 0.88;
  held.material.opacity = t >= 0.88 ? smooth(0.88, 0.96, t) : 1;
  flying.visible = t >= RELEASE;
  if (flying.visible) {
    const u = (t - RELEASE) / (1 - RELEASE);
    flying.position.copy(launch).add(point(720 * u, 220 * u - 400 * u * u));
    flying.rotation.z = $("reduced").checked ? 0 : -2 * u;
    flying.material.opacity = 1 - smooth(0.8, 1, u);
  }
  const label =
    t < 0.12
      ? "Ready · cradle"
      : t < 0.52
        ? "Preparation · low backswing"
        : t < RELEASE
          ? "Swing · forward and up"
          : t < 0.76
            ? "Release · open and follow through"
            : t < 0.88
              ? "Recovery · return to belt"
              : "Reload · settle into ready";
  return label;
}
function sync() {
  $("play").textContent = playing ? "Pause" : "Play";
  $("play").setAttribute("aria-pressed", String(playing));
}
function seek(t) {
  clock = Math.max(0, Math.min(1, t));
  playing = false;
  sync();
}
$("play").onclick = () => {
  playing = !playing;
  sync();
};
$("time").oninput = () => seek(Number($("time").value));
$("back").onclick = () => seek(clock - 1 / (30 * interval));
$("next").onclick = () => seek(clock + 1 / (30 * interval));
for (const b of document.querySelectorAll("[data-time]"))
  b.onclick = () => seek(Number(b.dataset.time));
$("reduced").onchange = () => {
  if ($("reduced").checked) {
    playing = false;
    sync();
  }
};
sync();
function render(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (playing) clock = (clock + (dt * Number($("speed").value)) / interval) % 1;
  const label = pose(clock);
  $("time").value = clock;
  $("beat").textContent =
    `${label} · ${(clock * interval).toFixed(3)}s / ${interval.toFixed(2)}s · ${(clock * 100).toFixed(1)}%`;
  const stage = document.querySelector("main"),
    w = stage.clientWidth,
    h = stage.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setScissorTest(true);
  scene.add(group);
  for (let i = 0; i < 2; i++) {
    const sign = i ? -1 : 1;
    group.scale.x = Math.abs(group.scale.x) * sign;
    renderer.setViewport((i * w) / 2, 0, w / 2, h);
    renderer.setScissor((i * w) / 2, 0, w / 2, h);
    renderer.setClearColor(i ? "#263c2e" : "#213529");
    renderer.clear();
    const height = $("small").checked ? (2 * h) / 112 : 3.3,
      aspect = w / 2 / h,
      cx = -0.1 * sign;
    camera.left = cx - (height * aspect) / 2;
    camera.right = cx + (height * aspect) / 2;
    camera.top = 1 + height / 2;
    camera.bottom = 1 - height / 2;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  scene.remove(group);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
