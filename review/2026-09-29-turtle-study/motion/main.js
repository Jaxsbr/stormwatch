import * as T from "three";
import { CutoutResource, CutoutInstance } from "/src/render/cutout.ts";
import { DefenderRig } from "/src/render/defender-rig.ts";
import { DefenderArm } from "/src/render/defender-arm.ts";
const $ = (id) => document.getElementById(id);
const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
const resource = new CutoutResource("turtle-side-defender-v1");
const renderer = new T.WebGLRenderer({ canvas: $("canvas"), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new T.Scene(),
  camera = new T.OrthographicCamera();
camera.position.z = 10;
camera.near = 0.1;
camera.far = 100;
const content = await (await fetch("/game-content.json")).json();
const interval = content.towers.net.interval;
let cutout, current, body, original, arms, net, rim, weights;
let playing = true,
  clock = 0,
  previous = performance.now(),
  mirrored = false;
const material = (color) =>
  new T.MeshBasicMaterial({
    side: T.DoubleSide,
    color,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
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
  cutout.parts.get("payload").visible = false;
  const def = resource.definition.parts.find((p) => p.id === "body");
  const geo = new T.PlaneGeometry(def.rect[2], def.rect[3], 12, 20);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++)
    pos.setXY(
      i,
      pos.getX(i) + def.rect[2] / 2 - def.pivot[0],
      pos.getY(i) + def.pivot[1] - def.rect[3] / 2,
    );
  original = Float32Array.from(pos.array);
  body = new T.Mesh(
    geo,
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
  net = new T.Mesh(new T.BufferGeometry(), material(0xb39765));
  rim = new T.Mesh(new T.BufferGeometry(), material(0xe3c28b));
  for (const line of [net, rim]) {
    line.frustumCulled = false;
    line.renderOrder = 1000.045;
    cutout.group.add(line);
  }
  weights = Array.from({ length: 16 }, () => {
    const m = new T.Mesh(
      new T.CircleGeometry(8, 10),
      new T.MeshBasicMaterial({
        color: 0x9e8b65,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    m.renderOrder = 1000.05;
    cutout.group.add(m);
    return m;
  });
}
// One pose transform applies to the body AND shoulder sockets. Feet stay fixed.
function transform(x, y, lean, dip) {
  const w = smooth(90, 500, y);
  return new T.Vector3(x + lean * w, y - dip * w, 0);
}
function pose(t) {
  cutout.reset(1000);
  const load = smooth(0.12, 0.52, t),
    cast = smooth(0.57, 0.7, t),
    recover = smooth(0.82, 1, t);
  const effort = load * (1 - cast),
    follow = cast * (1 - recover);
  const lean = -24 * effort + 24 * follow,
    dip = 14 * effort - 5 * follow;
  const p = body.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = transform(original[i * 3], original[i * 3 + 1], lean, dip);
    p.setXYZ(i, v.x, v.y, 0);
  }
  p.needsUpdate = true;
  const hands = [];
  for (const [id, ready, back, out] of [
    ["drawArm", [55, 285], [-10, 315], [200, 425]],
    ["holdArm", [240, 300], [175, 335], [425, 435]],
  ]) {
    const at = new T.Vector3(...ready, 0)
      .lerp(new T.Vector3(...back, 0), load)
      .lerp(new T.Vector3(...out, 0), cast)
      .lerp(new T.Vector3(...ready, 0), recover);
    const socket = cutout.rests.get(id);
    const shoulder = transform(
      socket.x - (id === "drawArm" ? 20 : 0),
      socket.y + (id === "drawArm" ? 35 : 0),
      lean,
      dip,
    );
    const hand = arms.get(id).reach(shoulder, at, 1000);
    // Far arm stays behind torso; near arm lies in front.
    hands.push(hand);
  }
  drawNet(hands, t, smooth(0.7, 0.94, t));
  return t < 0.12
    ? "Gather · both hands support the net"
    : t < 0.57
      ? "Load · dip and shift back"
      : t < 0.7
        ? "Cast · body drives both hands forward"
        : t < 0.82
          ? "Release · net opens, hands follow through"
          : "Recover · settle and gather";
}
function rope(mesh, segments, width) {
  const vertices = [];
  for (let i = 0; i < segments.length; i += 6) {
    const x = segments[i],
      y = segments[i + 1],
      a = segments[i + 3],
      b = segments[i + 4];
    const len = Math.hypot(a - x, b - y) || 1,
      nx = ((-(b - y) / len) * width) / 2,
      ny = (((a - x) / len) * width) / 2;
    vertices.push(
      x + nx,
      y + ny,
      0,
      x - nx,
      y - ny,
      0,
      a + nx,
      b + ny,
      0,
      a + nx,
      b + ny,
      0,
      x - nx,
      y - ny,
      0,
      a - nx,
      b - ny,
      0,
    );
  }
  mesh.geometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(vertices, 3),
  );
}
function drawNet(hands, t, fly) {
  const a = hands[0],
    b = hands[1];
  const airborne = t >= 0.7 && t < 0.9;
  const releaseCenter = new T.Vector3(312.5, 430, 0);
  const center = airborne
    ? releaseCenter
        .clone()
        .add(new T.Vector3(500 * fly, 105 * Math.sin(fly * Math.PI), 0))
    : a.clone().lerp(b, 0.5);
  // A circular net folded into a hanging U between the two real solved grips.
  const radius = airborne ? T.MathUtils.lerp(105, 250, fly) : 1;
  function surface(u, v) {
    const held = (left, right) =>
      new T.Vector3(
        T.MathUtils.lerp(left.x, right.x, u) + (u - 0.5) * 35 * v,
        T.MathUtils.lerp(left.y, right.y, u) -
          (35 + v * 145) * Math.sin(Math.PI * u) -
          v * 25,
        0,
      );

    if (airborne) {
      const x = (u - 0.5) * 2,
        y = (v - 0.5) * 2;
      const diskX = x * Math.sqrt(1 - (y * y) / 2),
        diskY = y * Math.sqrt(1 - (x * x) / 2);
      const open = new T.Vector3(
        center.x + diskX * radius,
        center.y + diskY * radius * 0.56,
        0,
      );
      const folded = held(
        new T.Vector3(200, 425, 0),
        new T.Vector3(425, 435, 0),
      );
      folded.x += 500 * fly;
      folded.y += 105 * Math.sin(fly * Math.PI);
      return folded.lerp(open, smooth(0, 0.5, fly));
    }
    return new T.Vector3(
      T.MathUtils.lerp(a.x, b.x, u) + (u - 0.5) * 35 * v,
      T.MathUtils.lerp(a.y, b.y, u) -
        (35 + v * 145) * Math.sin(Math.PI * u) -
        v * 25,
      0,
    );
  }
  const seg = [];
  const n = 8;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j < n; j++) {
      for (const [u, v, du, dv] of [
        [i / n, j / n, 0, 1 / n],
        [j / n, i / n, 1 / n, 0],
      ]) {
        const p = surface(u, v),
          q = surface(u + du, v + dv);
        seg.push(p.x, p.y, 0, q.x, q.y, 0);
      }
    }
  rope(net, seg, 2.8);
  const border = [];
  for (let j = 0; j <= 48; j++) {
    let u, v;
    const q = j / 12;
    if (q <= 1) {
      u = q;
      v = 0;
    } else if (q <= 2) {
      u = 1;
      v = q - 1;
    } else if (q <= 3) {
      u = 3 - q;
      v = 1;
    } else {
      u = 0;
      v = 4 - q;
    }
    border.push(surface(u, v));
  }
  const edge = [];
  for (let i = 0; i < border.length - 1; i++)
    edge.push(...border[i].toArray(), ...border[i + 1].toArray());
  rope(rim, edge, 5);
  const alpha = airborne
    ? 1 - smooth(0.85, 0.9, t)
    : t >= 0.9
      ? smooth(0.9, 1, t)
      : 1;
  net.material.opacity = alpha;
  rim.material.opacity = alpha;
  weights.forEach((m, i) => {
    m.position.copy(border[i * 3]);
    m.material.opacity = alpha;
  });
}
$("direction").onchange = () => {
  mirrored = $("direction").value === "west";
  current?.dispose();
  current = new DefenderRig(resource, 2, mirrored);
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
for (const b of document.querySelectorAll("[data-time]"))
  b.onclick = () => {
    clock = Number(b.dataset.time);
    playing = false;
    sync();
  };
function render(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (!resource.definition) {
    requestAnimationFrame(render);
    return;
  }
  if (!cutout) init();
  if (playing) clock = (clock + (dt * Number($("speed").value)) / interval) % 1;
  $("time").value = clock;
  $("beat").textContent =
    `${pose(clock)} · ${(clock * interval).toFixed(3)}s / ${interval.toFixed(2)}s`;
  const age = ((clock + 0.3) % 1) * interval;
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
    const height = $("small").checked ? (2 * h) / 112 : 3.6,
      aspect = w / 2 / h;
    const cx = mirrored ? -0.6 : 0.6;
    camera.left = cx - (height * aspect) / 2;
    camera.right = cx + (height * aspect) / 2;
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
