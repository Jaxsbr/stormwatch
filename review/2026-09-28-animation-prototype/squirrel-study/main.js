// Throwaway side-view motion study. No runtime animation is changed.
import * as T from "three";
import { CutoutResource, CutoutInstance } from "/src/render/cutout.ts";
import { DefenderRig } from "/src/render/defender-rig.ts";
import { DefenderArm } from "/src/render/defender-arm.ts";
const $ = (id) => document.getElementById(id),
  smooth = (a, b, x) => T.MathUtils.smoothstep(x, a, b);
const resources = Object.fromEntries(
  ["side", "front", "rear"].map((view) => [
    view,
    new CutoutResource(`squirrel-${view}-defender-v1`),
  ]),
);
let view = "side",
  mirrored = false,
  resource = resources.side;
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
  caps = [],
  reflectedTextures = [],
  clock = 0,
  playing = true,
  previous = performance.now();
const content = await (await fetch("/game-content.json")).json();
const interval = content.towers.bolt.interval;
function init() {
  current = new DefenderRig(resource, 2, mirrored);
  cutout = new CutoutInstance(resource, 2);
  reflectedTextures = [];
  if (mirrored) {
    const bow = cutout.parts.get("bow");
    const texture = bow.material.map.clone();
    texture.repeat.x = -1;
    texture.offset.x = 1;
    bow.material.map = texture;
    bow.center.x = 1 - bow.center.x;
    reflectedTextures.push(texture);
  }
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
  caps = [];
  if (view === "rear")
    for (const [id, arm] of arms) {
      // A local shoulder overlap pass reveals the real arm at the painted socket;
      // the rest of the arm remains behind the body.
      const material = arm.mesh.material.clone();
      const anchor = cutout.parts.get(id).position;
      material.onBeforeCompile = (shader) => {
        shader.uniforms.socket = {
          value: new T.Vector2(anchor.x, anchor.y - 12),
        };
        shader.vertexShader =
          "varying vec2 socketPosition;\n" +
          shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nsocketPosition = position.xy;",
          );
        shader.fragmentShader =
          "uniform vec2 socket; varying vec2 socketPosition;\n" +
          shader.fragmentShader.replace(
            "#include <clipping_planes_fragment>",
            "#include <clipping_planes_fragment>\nif(length((socketPosition-socket)/vec2(30.,40.))>1.) discard;",
          );
      };
      const cap = new T.Mesh(arm.mesh.geometry, material);
      cap.frustumCulled = false;
      cap.renderOrder = 1000.015;
      cutout.group.add(cap);
      caps.push(cap);
    }
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
  if (view !== "side") return projectedStudy(t);
  const load = smooth(0.12, 0.6, t),
    snap = smooth(0.74, 0.79, t),
    settle = smooth(0.82, 1, t),
    tension = load * (1 - snap),
    follow = snap * (1 - settle);
  // A gentle continuous lean above the hips: boots stay exactly in place.
  const lean = -4 * load * (1 - settle),
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
  bow.position.set(190 + 50 * load * (1 - settle), 370, 0);
  bow.position.copy(
    arms.get("holdArm").reach(shoulder("holdArm"), bow.position, 1000),
  );
  bow.scale.y *= 1 - 0.045 * tension;
  bow.scale.x *= 1 + 0.1 * tension;
  const brace = point("braceCenter"),
    drawn = new T.Vector3(35, 370, 0);
  const stringHand = brace.clone().lerp(drawn, tension);
  // Lower, horizontal draw path; never follows the bow upward or forward.
  const target = new T.Vector3(
    T.MathUtils.lerp(94.1, 35, load * (1 - settle)),
    370,
    0,
  );
  target.x -= 10 * follow;
  const hand = arms.get("drawArm").reach(shoulder("drawArm"), target, 1000);
  if (t < 0.74) stringHand.copy(hand);
  const vibration =
    t >= 0.79 ? Math.sin((t - 0.79) * 180) * 7 * Math.exp(-(t - 0.79) * 35) : 0;
  stringHand.x += vibration;
  setLine(lines[0], [point("tipNear"), stringHand, point("tipFar")]);
  const nock =
    t < 0.74 ? hand.clone() : new T.Vector3(35 + (t - 0.74) * 6500, 370, 0);
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
function projectedReach(id, target) {
  const shoulder = cutout.parts.get(id).position;
  const compression = 0.72;
  const virtual = target
    .clone()
    .sub(shoulder)
    .divideScalar(compression)
    .add(shoulder);
  const result = arms.get(id).reach(shoulder, virtual, 1000);
  const vertices = arms.get(id).mesh.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++)
    vertices.setXY(
      i,
      shoulder.x + (vertices.getX(i) - shoulder.x) * compression,
      shoulder.y + (vertices.getY(i) - shoulder.y) * compression,
    );
  vertices.needsUpdate = true;
  return result.sub(shoulder).multiplyScalar(compression).add(shoulder);
}
function projectedStudy(t) {
  const rear = view === "rear";
  const load = smooth(0.12, 0.6, t),
    snap = smooth(0.74, 0.79, t),
    settle = smooth(0.82, 1, t);
  const hold = load * (1 - settle),
    tension = load * (1 - snap),
    follow = snap * (1 - settle);
  // The bow remains upright. Depth is represented by overlap and small projected
  // hand travel, not a 90-degree screen-plane rotation of the bow.
  const bow = cutout.parts.get("bow");
  bow.scale.x *= 0.38;
  bow.scale.y *= 1 - 0.045 * tension;
  bow.position.set(
    rear ? -130 : 65,
    (rear ? 410 : 355) + (rear ? 18 : -18) * hold,
    0,
  );
  bow.position.copy(projectedReach("holdArm", bow.position));
  const brace = point("braceCenter");
  const anchor = new T.Vector3(rear ? 65 : -25, rear ? 400 : 410, 0);
  const target = new T.Vector3(rear ? 65 : -25, rear ? 375 : 355, 0).lerp(
    anchor,
    hold,
  );
  target.x += (rear ? 9 : -9) * follow;
  const hand = projectedReach("drawArm", target);
  const stringHand = t < 0.74 ? hand : brace.clone().lerp(anchor, 1 - snap);
  setLine(lines[0], [point("tipNear"), stringHand, point("tipFar")]);
  // The departing arrow follows the projected facing direction, independently
  // of the upright bow. A rear shot becomes visible only beyond the silhouette.
  const direction = rear ? 1 : -1;
  const nock =
    t < 0.74
      ? hand.clone()
      : anchor.clone().add(new T.Vector3(0, direction * (t - 0.74) * 4300, 0));
  const tip = nock.clone().add(new T.Vector3(0, direction * 85, 0));
  setLine(lines[1], [
    nock,
    tip,
    tip.clone().add(new T.Vector3(-7, -direction * 16, 0)),
    tip,
    tip.clone().add(new T.Vector3(7, -direction * 16, 0)),
  ]);
  lines[1].visible = t >= 0.12 && t < 0.9;
  bow.renderOrder = rear ? 1000.005 : 1000.05;
  lines.forEach((line) => (line.renderOrder = rear ? 1000.006 : 1000.06));
  // Both rear arms stay on the forward side of the torso.
  if (rear) arms.forEach((arm) => (arm.mesh.renderOrder = 1000));
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
$("direction").onchange = () => {
  const value = $("direction").value;
  mirrored = value === "west";
  view = value === "west" ? "side" : value;
  resource = resources[view];
  current?.dispose();
  cutout?.dispose();
  arms?.forEach((a) => a.dispose());
  caps.forEach((cap) => cap.material.dispose());
  reflectedTextures.forEach((texture) => texture.dispose());
  body?.geometry.dispose();
  body?.material.dispose();
  lines?.forEach((l) => {
    l.geometry.dispose();
    l.material.dispose();
  });
  current = null;
};
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
    camera.left = (mirrored ? 0.25 : -0.25) - (height * aspect) / 2;
    camera.right = (mirrored ? 0.25 : -0.25) + (height * aspect) / 2;
    camera.top = 1 + height / 2;
    camera.bottom = 1 - height / 2;
    camera.updateProjectionMatrix();
    const group = i ? cutout.group : current.group;
    if (i) group.scale.x = Math.abs(group.scale.x) * (mirrored ? -1 : 1);
    scene.add(group);
    renderer.render(scene, camera);
    scene.remove(group);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
