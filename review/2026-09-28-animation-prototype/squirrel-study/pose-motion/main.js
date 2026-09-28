// Whole-pose atlas playback. No runtime cutout limbs, scaling tricks or socket overlays.
const $ = (id) => document.getElementById(id);
const image = new Image();
image.src = "./atlas.png";
await image.decode();
const content = await (await fetch("/game-content.json")).json();
const interval = content.towers.bolt.interval;
const anchors = [
  [
    [230.5, 506],
    [220.5, 505],
    [219.5, 506],
    [220, 506],
  ],
  [
    [189, 476],
    [190, 476],
    [187, 476],
    [188.5, 476],
  ],
];
// Measured alpha-component bounds; generated art slightly crosses nominal cells.
const rects = [
  [
    [16, 14, 362, 494],
    [391, 15, 363, 492],
    [766, 15, 370, 492],
    [1151, 15, 370, 493],
  ],
  [
    [42, 522, 351, 467],
    [427, 524, 344, 465],
    [806, 524, 347, 465],
    [1193, 524, 342, 466],
  ],
];
const canvases = [$("south"), $("north")];
let time = 0,
  playing = true,
  previous = performance.now();
function frameAt(t) {
  return t < 0.36 ? 0 : t < 0.74 ? 1 : t < 0.85 ? 2 : 3;
}
function sync() {
  $("play").textContent = playing ? "Pause" : "Play";
}
$("play").onclick = () => {
  playing = !playing;
  sync();
};
$("time").oninput = () => {
  time = Number($("time").value);
  playing = false;
  sync();
};
document.querySelectorAll("[data-time]").forEach(
  (button) =>
    (button.onclick = () => {
      time = Number(button.dataset.time);
      playing = false;
      sync();
    }),
);
function draw(canvas, row, frame) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const figureHeight = $("small").checked
    ? 112
    : Math.min(h - 100, w * 0.95, 490);
  const scale = figureHeight / (row === 0 ? 490 : 462);
  const [ax, ay] = anchors[row][frame];
  // Per-frame registration at the boot baseline, not per-frame sprite resizing.
  const dx = w / 2 - ax * scale,
    dy = (h + figureHeight) / 2 - ay * scale;
  const [sx, sy, sw, sh] = rects[row][frame];
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    dx + (sx - frame * 384) * scale,
    dy + (sy - row * 512) * scale,
    sw * scale,
    sh * scale,
  );
  // A separate review projectile leaves at release. North only appears beyond
  // the head; it never draws across the back. South is seen almost end-on.
  const age = (time - 0.74) * interval;
  if (age >= 0 && age < 0.15) {
    ctx.save();
    ctx.strokeStyle = "#e9d5a8";
    ctx.fillStyle = "#c7c6af";
    ctx.lineWidth = Math.max(1, scale * 1.4);
    if (row === 0) {
      const progress = age / 0.15;
      const x = w / 2 - 12 * scale,
        y = dy + 238 * scale + progress * 45 * scale;
      const radius = (4 + progress * 5) * scale;
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius * 0.65, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius * 0.65, y);
      ctx.closePath();
      ctx.fill();
    } else {
      const x = w / 2 - 8 * scale,
        y = dy + 25 * scale - age * 900 * scale;
      ctx.globalAlpha = 1 - age / 0.15;
      ctx.beginPath();
      ctx.moveTo(x, y + 20 * scale);
      ctx.lineTo(x, y);
      ctx.lineTo(x - 4 * scale, y + 6 * scale);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4 * scale, y + 6 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }
}
function tick(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (playing) time = (time + (dt * Number($("speed").value)) / interval) % 1;
  const frame = frameAt(time);
  canvases.forEach((canvas, row) => draw(canvas, row, frame));
  $("time").value = time;
  $("status").textContent =
    `${["Ready / early draw", "Loaded hold", "Release / follow-through", "Recovery"][frame]} · ${(time * interval).toFixed(3)}s · keyframe ${frame + 1}/4`;
  document
    .querySelectorAll("[data-time]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(!playing && frameAt(Number(b.dataset.time)) === frame),
      ),
    );
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
