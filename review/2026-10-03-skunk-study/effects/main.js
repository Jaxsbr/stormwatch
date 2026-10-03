const $ = (id) => document.getElementById(id);
const assets = {};
async function loadRig(id) {
  const def = await (await fetch(`/art/v2/${id}/rig.json`)).json();
  const parts = await Promise.all(
    def.parts
      .filter((p) => p.id !== "bodyGuard")
      .map(async (p) => {
        const image = new Image();
        image.src = "/" + p.texture;
        await image.decode();
        return { ...p, image };
      }),
  );
  return {
    parts: parts.sort((a, b) => a.z - b.z),
    root: def.parts.find((p) => !p.attachTo),
  };
}
[assets.rat, assets.weasel, assets.boar] = await Promise.all(
  ["rat-rig-v3", "weasel-rig-v1", "boar-rig-v1"].map(loadRig),
);
let time = 0,
  previous = performance.now(),
  playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
$("reduced").checked = !playing;
const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
function actor(ctx, rig, x, y, height) {
  const scale = height / rig.root.rect[3];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  for (const p of rig.parts) {
    let ax = 0,
      ay = 0;
    if (p.attachTo) {
      const [parent, key] = p.attachTo.split(".");
      const q = rig.parts.find((v) => v.id === parent),
        a = q.attachments[key];
      ax = (a[0] - q.pivot[0]) * q.scale;
      ay = (a[1] - q.pivot[1]) * q.scale;
    }
    ctx.drawImage(
      p.image,
      ax - p.pivot[0] * p.scale,
      ay - p.pivot[1] * p.scale,
      p.rect[2] * p.scale,
      p.rect[3] * p.scale,
    );
  }
  ctx.restore();
}
function puff(ctx, x, y, rx, ry, alpha, bright = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(${bright ? "191,255,62" : "116,211,38"},${alpha})`);
  g.addColorStop(0.5, `rgba(108,195,37,${alpha * 0.7})`);
  g.addColorStop(1, "rgba(64,120,24,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function gas(ctx, variant, x, y, t, front, fade) {
  const opacity = Number($("opacity").value) * fade;
  const phase = $("reduced").checked ? 0 : t;
  if (variant === 0) {
    for (let i = 0; i < 3; i++) {
      if ((i % 2 === 0) !== front) continue;
      const q = (phase * 0.45 + i / 3) % 1;
      const xx = x - 22 + i * 20 + Math.sin(q * 6 + i) * 5,
        yy = y - 12 - q * 40;
      ctx.strokeStyle = `rgba(166,245,58,${opacity * 0.72 * Math.sin(Math.PI * (0.1 + 0.8 * q))})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(xx, yy + 15);
      ctx.bezierCurveTo(xx - 14, yy + 5, xx + 12, yy, xx, yy - 13);
      ctx.stroke();
      puff(ctx, xx, yy + 6, 13, 20, opacity * 0.19);
    }
  }
  if (variant === 1) {
    for (let i = 0; i < 6; i++) {
      if ((i % 2 === 0) !== front) continue;
      const q = (phase * 0.35 + i * 0.17) % 1;
      const xx = x + Math.sin(i * 2.3 + q) * 24,
        yy = y - 9 - q * 42;
      puff(
        ctx,
        xx,
        yy,
        22 + q * 9,
        18 + q * 8,
        opacity * (front ? 0.46 : 0.72) * (1 - q * 0.6),
        i % 3 === 0,
      );
    }
  }
  if (variant === 2) {
    for (let i = 0; i < 4; i++) {
      if ((i % 2 === 0) !== front) continue;
      const q = (phase * 0.5 + i * 0.25) % 1;
      puff(
        ctx,
        x - 10 - q * 42,
        y - 12 - i * 4,
        26 - q * 10,
        9 + q * 3,
        opacity * (front ? 0.35 : 0.7) * (1 - q),
        i === 0,
      );
    }
  }
}
function draw(canvas, variant) {
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
  ctx.fillStyle = "#24382b";
  ctx.fillRect(0, 0, w, h);
  // Two clear lanes are only comparison staging, not new battlefield geometry.
  ctx.strokeStyle = "#596049";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.lineTo(w, h * 0.48);
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w, h * 0.82);
  ctx.stroke();
  const move = Math.max(0, time - 0.8) * w * 0.055;
  const poisoned = time >= 0.8 && time < 4.8,
    fade = 1 - smooth(4.45, 4.8, time);
  const entities = [
    {
      rig: assets.rat,
      x: w * 0.31 + move,
      y: h * 0.45,
      status: "",
      affected: true,
    },
    {
      rig: assets.weasel,
      x: w * 0.59 + move * 0.6,
      y: h * 0.45,
      status: "Evade",
    },
    {
      rig: assets.boar,
      x: w * 0.58 + move * 0.5,
      y: h * 0.79,
      status: "Immune",
    },
  ];
  if ($("crowd").checked)
    entities.push(
      {
        rig: assets.rat,
        x: w * 0.19 + move,
        y: h * 0.43,
        status: "",
        affected: true,
      },
      {
        rig: assets.rat,
        x: w * 0.39 + move,
        y: h * 0.47,
        status: "",
        affected: true,
      },
    );
  if (time > 2.6)
    entities.push({
      rig: assets.rat,
      x: w * 0.12 + (time - 2.6) * w * 0.07,
      y: h * 0.8,
      status: "Late arrival",
    });
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) {
    if (e.affected && poisoned) gas(ctx, variant, e.x, e.y, time, false, fade);
    actor(ctx, e.rig, e.x, e.y, 70);
    if (e.affected && poisoned) gas(ctx, variant, e.x, e.y, time, true, fade);
    ctx.textAlign = "center";
    ctx.font = "bold 11px system-ui";
    ctx.fillStyle = e.affected && poisoned ? "#cbfa70" : "#e1dfc0";
    // Owner selected visual-only poison status: no application or expiry label.
    const label = e.affected ? "" : e.status;
    ctx.fillText(label, e.x, e.y + 31);
  }
  const age = time - 0.8;
  if (age >= 0 && age < 0.85) {
    const q = age / 0.85,
      x = w * 0.34,
      y = h * 0.49,
      alpha = (1 - q) * 0.8;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const radius = (10 + q * 60) * ($("reduced").checked ? 0.6 : 1);
      puff(
        ctx,
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius * 0.5,
        variant === 1 ? 36 : 25,
        variant === 2 ? 15 : 25,
        alpha,
        i % 2 === 0,
      );
    }
  }
  ctx.fillStyle = "#b9c6b7";
  ctx.textAlign = "left";
  ctx.font = "11px system-ui";
  ctx.fillText("Impact stays here", 12, h * 0.59);
  ctx.strokeStyle = "#8fa078";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.34 - 5, h * 0.49);
  ctx.lineTo(w * 0.34 + 5, h * 0.49);
  ctx.moveTo(w * 0.34, h * 0.49 - 5);
  ctx.lineTo(w * 0.34, h * 0.49 + 5);
  ctx.stroke();
}
function sync() {
  $("play").textContent = playing ? "Pause" : "Play";
}
$("play").onclick = () => {
  playing = !playing;
  sync();
};
$("restart").onclick = () => {
  time = 0;
  playing = true;
  sync();
};
function seek(t) {
  time = t;
  playing = false;
  sync();
}
$("time").oninput = () => seek(Number($("time").value));
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
  if (playing) time = (time + dt * Number($("speed").value)) % 6;
  ["a", "b", "c"].forEach((id, i) => draw($(id), i));
  $("time").value = time;
  $("opacityValue").textContent =
    Math.round(Number($("opacity").value) * 100) + "%";
  $("status").textContent =
    `${time.toFixed(2)}s · ${time < 0.8 ? "Before impact" : time < 1.65 ? "Transient burst; poison attached" : time < 4.8 ? "Burst gone; gas follows affected Rats only" : "Poison expired; all attached gas gone"}`;
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
