// Throwaway side-view motion study. No runtime animation is changed.
import * as T from "three";
import { CutoutResource, CutoutInstance } from "/src/render/cutout.ts";
import { DefenderRig } from "/src/render/defender-rig.ts";
import { DefenderArm } from "/src/render/defender-arm.ts";
const $ = (id) => document.getElementById(id),
  smooth = (a, b, x) => T.MathUtils.smoothstep(x, a, b);
const resource = new CutoutResource("squirrel-side-defender-v1");
const renderer = new T.WebGLRenderer({ canvas: $("canvas"), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene(),
  camera = new T.OrthographicCamera(-2, 2, 2.5, -0.5, 0.1, 100);
camera.position.z = 10;
let current,
  cutout,
  arms,
  body,
  baseVertices,
  lines,
  clock = 0,
  playing = true,
  previous = performance.now();
const content = await (await fetch("/game-content.json")).json();
const interval = content.towers.bolt.interval;
function init() {
  current = new DefenderRig(resource, 2);
  cutout = new CutoutInstance(resource, 2);
  arms = new Map(
    resource.definition.parts
      .filter((p) => p.joints?.elbow)
      .map((p) => {
        const arm = new DefenderArm(p, resource);
        cutout.parts.get(p.id).visible = false;
        cutout.group.add(arm.mesh);
        return [p.id, arm];
      }),
  );
  const def = resource.definition.parts.find((p) => p.id === "body");
  const geometry = new T.PlaneGeometry(def.rect[2], def.rect[3], 1, 12);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setXYZ(
      i,
      pos.getX(i) + def.rect[2] / 2 - def.pivot[0],
      pos.getY(i) + def.pivot[1] - def.rect[3] / 2,
      0,
    );
  baseVertices = Float32Array.from(pos.array);
  body = new T.Mesh(
    geometry,
    new T.MeshBasicMaterial({
      map: resource.textures.get("body"),
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  body.renderOrder = 1000.01;
  cutout.parts.get("body").visible = false;
  cutout.group.add(body);
  lines = [3, 5].map((n) => {
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints(
        Array.from({ length: n }, () => new T.Vector3()),
      ),
      new T.LineBasicMaterial({
        color: 0xf5dfab,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    line.frustumCulled = false;
    line.renderOrder = 1000.06;
    cutout.group.add(line);
    return line;
  });
}
function point(name) {
  const def = resource.definition.parts.find((p) => p.id === "bow"),
    bow = cutout.parts.get("bow"),
    p = def.string[name];
  return new T.Vector3(
    bow.position.x + ((p[0] - def.pivot[0]) * bow.scale.x) / def.rect[2],
    bow.position.y + ((def.pivot[1] - p[1]) * bow.scale.y) / def.rect[3],
    0,
  );
}
function setLine(line, points) {
  const p = line.geometry.attributes.position;
  points.forEach((v, i) => p.setXYZ(i, v.x, v.y, 0));
  p.needsUpdate = true;
}
function study(t) {
  cutout.reset(1000);
  const load = smooth(0.12, 0.6, t),
    snap = smooth(0.74, 0.79, t),
    settle = smooth(0.82, 1, t),
    tension = load * (1 - snap),
    follow = snap * (1 - settle);
  // A gentle continuous lean above the hips: boots stay exactly in place.
  const lean = -16 * tension + 7 * follow,
    pos = body.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = baseVertices[i * 3],
      y = baseVertices[i * 3 + 1];
    pos.setXYZ(i, x + lean * smooth(110, 330, y), y, 0);
  }
  pos.needsUpdate = true;
  const shoulder = (id) =>
    cutout.parts
      .get(id)
      .position.clone()
      .add(new T.Vector3(lean, 0, 0));
  const bow = cutout.parts.get("bow");
  bow.position.set(
    225 - 25 * tension + 6 * follow,
    330 + 110 * load * (1 - settle),
    0,
  );
  bow.position.copy(
    arms.get("holdArm").reach(shoulder("holdArm"), bow.position, 1000),
  );
  bow.scale.y *= 1 - 0.045 * tension;
  bow.scale.x *= 1 + 0.1 * tension;
  const brace = point("braceCenter"),
    drawn = point("drawCenter");
  drawn.x += 15;
  const stringHand = brace.clone().lerp(drawn, tension);
  const target = brace.clone().lerp(drawn, load * (1 - settle));
  target.x -= 27 * follow;
  target.y += 14 * follow;
  const hand = arms.get("drawArm").reach(shoulder("drawArm"), target, 1000);
  if (t < 0.74) stringHand.copy(hand);
  const vibration =
    t >= 0.79 ? Math.sin((t - 0.79) * 180) * 7 * Math.exp(-(t - 0.79) * 35) : 0;
  stringHand.x += vibration;
  setLine(lines[0], [point("tipNear"), stringHand, point("tipFar")]);
  const nock =
    t < 0.74 ? hand.clone() : new T.Vector3(-19.85 + (t - 0.74) * 6500, 440, 0);
  const tip = nock.clone().add(new T.Vector3(235, 0, 0));
  setLine(lines[1], [
    nock,
    tip,
    tip.clone().add(new T.Vector3(-22, 8, 0)),
    tip,
    tip.clone().add(new T.Vector3(-22, -8, 0)),
  ]);
  lines[1].visible = t >= 0.12 && t < 0.9;
  return t < 0.12
    ? "Rest"
    : t < 0.6
      ? "Draw · build tension"
      : t < 0.74
        ? "Full draw · hold effort"
        : t < 0.82
          ? "Release · string snaps, hand follows through"
          : "Recovery · settle";
}
function sync() {
  $("play").textContent = playing ? "Pause" : "Play";
}
$("play").onclick = () => {
  playing = !playing;
  sync();
};
$("time").oninput = () => {
  clock = Number($("time").value);
  playing = false;
  sync();
};
document.querySelectorAll("[data-time]").forEach(
  (b) =>
    (b.onclick = () => {
      clock = Number(b.dataset.time);
      playing = false;
      sync();
    }),
);
function render(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (!resource.definition) {
    requestAnimationFrame(render);
    return;
  }
  if (!current) init();
  if (playing) clock = (clock + (dt * Number($("speed").value)) / interval) % 1;
  $("time").value = clock;
  const label = study(clock);
  $("beat").textContent =
    `${label} · ${(clock * interval).toFixed(3)}s / ${interval.toFixed(2)}s cycle`;
  document
    .querySelectorAll("[data-time]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(!playing && Math.abs(clock - Number(b.dataset.time)) < 0.002),
      ),
    );
  // Phase-align current release to the proposed release at 74% of a cycle.
  const age = ((clock + 0.26) % 1) * interval;
  current.update(age, interval - age, 1000);
  const stage = document.querySelector("main"),
    w = stage.clientWidth,
    h = stage.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setScissorTest(true);
  for (let i = 0; i < 2; i++) {
    renderer.setViewport((i * w) / 2, 0, w / 2, h);
    renderer.setScissor((i * w) / 2, 0, w / 2, h);
    renderer.setClearColor(i ? "#2a4031" : "#22362a");
    renderer.clear();
    const height = $("small").checked ? (2 * h) / 112 : 2.8,
      aspect = w / 2 / h;
    camera.left = -0.25 - (height * aspect) / 2;
    camera.right = -0.25 + (height * aspect) / 2;
    camera.top = 1 + height / 2;
    camera.bottom = 1 - height / 2;
    camera.updateProjectionMatrix();
    const group = i ? cutout.group : current.group;
    scene.add(group);
    renderer.render(scene, camera);
    scene.remove(group);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
