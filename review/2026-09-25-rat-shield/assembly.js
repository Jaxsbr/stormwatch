const VIEW_IDS = {
  side: ["rat-rig-v1", "rat-rig-v2"],
  front: ["rat-front-rig-v1", "rat-front-rig-v2"],
  rear: ["rat-rear-rig-v1", "rat-rear-rig-v2"],
};
const STORAGE = "stormwatch-rat-assembly-draft-v1";
const STAGE = { x: 220, y: 305, scale: 0.45 };
const fields = ["x", "y", "rotation", "scale", "layer"];
const names = { body: "Body", freeArm: "Free arm", shieldArm: "Shield arm", shield: "Shield", nearLeg: "Near leg", farLeg: "Far leg" };
const $ = (id) => document.getElementById(id);
const rigs = {};
let view = "side", selected = "freeArm", dragging = null;
let saved;
try { saved = JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { saved = {}; }
const offsets = saved && typeof saved === "object" ? saved : {};

function defaultPose(part, direction) {
  return { x: 0, y: 0, rotation: part.id === "freeArm" ? ({ side: 43, front: 37, rear: 20 })[direction] : 0, scale: 100, layer: part.z };
}
function pose(part) {
  const base = defaultPose(part, view);
  const stored = offsets[view]?.[part.id];
  if (!stored || typeof stored !== "object") return base;
  for (const key of fields) if (!Number.isFinite(stored[key])) return base;
  return { ...base, ...stored };
}
function persist() {
  localStorage.setItem(STORAGE, JSON.stringify(offsets));
  $("output").value = JSON.stringify({ format: "stormwatch-rat-assembly-v1", units: "source pixels and degrees", views: Object.fromEntries(Object.entries(VIEW_IDS).map(([direction, ids]) => [direction, { rig: ids[1], parts: Object.fromEntries((rigs[direction]?.candidate.def.parts || []).map(part => [part.id, direction === view ? pose(part) : { ...defaultPose(part, direction), ...offsets[direction]?.[part.id] }])) }])) }, null, 2);
}
async function loadRig(id) {
  const base = id.endsWith("-v2") ? "/review/2026-09-25-rat-shield/assets" : "/art/v2";
  const response = await fetch(`${base}/${id}/rig.json`);
  if (!response.ok) throw new Error(`${id}: ${response.status}`);
  const def = await response.json();
  const images = Object.fromEntries(await Promise.all(def.parts.map(async (part) => {
    const img = new Image(); img.src = `/${part.texture}`; await img.decode();
    return [part.id, img];
  })));
  return { def, images };
}
function origin(part, rig) {
  const root = rig.def.parts.find((p) => !p.attachTo);
  if (!part.attachTo) return { x: STAGE.x, y: STAGE.y };
  const [, anchor] = part.attachTo.split(".");
  const [x, y] = root.attachments[anchor];
  return { x: STAGE.x + (x - root.pivot[0]) * STAGE.scale, y: STAGE.y + (y - root.pivot[1]) * STAGE.scale };
}
function geometry(part, rig, editable) {
  const adjust = editable ? pose(part) : { x: 0, y: 0, rotation: 0, scale: 100, layer: part.z };
  const center = origin(part, rig);
  return { x: center.x + adjust.x * STAGE.scale, y: center.y + adjust.y * STAGE.scale, rotation: adjust.rotation * Math.PI / 180, size: STAGE.scale * part.scale * adjust.scale / 100, layer: adjust.layer };
}
function paintPart(ctx, part, rig, editable, highlight = false) {
  const img = rig.images[part.id], g = geometry(part, rig, editable);
  ctx.save();ctx.translate(g.x, g.y);ctx.rotate(g.rotation);ctx.scale(g.size, g.size);
  ctx.drawImage(img, -part.pivot[0], -part.pivot[1], part.rect[2], part.rect[3]);
  if (highlight) {
    ctx.strokeStyle = "#efbe62";ctx.lineWidth = 2 / g.size;
    ctx.strokeRect(-part.pivot[0], -part.pivot[1], part.rect[2], part.rect[3]);
  }
  ctx.restore();
  if (highlight) { ctx.beginPath();ctx.arc(g.x, g.y, 4, 0, 2 * Math.PI);ctx.fillStyle = "#efbe62";ctx.fill(); }
}
function paint(canvas, rig, editable) {
  const ctx = canvas.getContext("2d");ctx.clearRect(0,0,canvas.width,canvas.height);
  const ordered = [...rig.def.parts].sort((a,b) => geometry(a,rig,editable).layer - geometry(b,rig,editable).layer);
  for (const part of ordered) paintPart(ctx,part,rig,editable,editable && $("guides").checked && part.id === selected);
  if (editable && Number($("overlay").value)) {
    ctx.save();ctx.globalAlpha = Number($("overlay").value) / 100;
    const original = rigs[view].original;
    for (const part of [...original.def.parts].sort((a,b) => a.z - b.z)) paintPart(ctx,part,original,false);
    ctx.restore();
  }
}
function render() {
  if (!rigs[view]) return;
  paint($("original"), rigs[view].original, false);
  paint($("candidate"), rigs[view].candidate, true);
  for (const button of $("views").querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.view === view));
  for (const button of $("parts").querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.part === selected));
  persist();
}
function selectPart(id) {
  selected = id;$("part").value = id;
  const part = rigs[view].candidate.def.parts.find((item) => item.id === id);
  const values = pose(part);
  for (const field of fields) {
    const value = field === "scale" ? values[field] : values[field];
    $(field).value = value;$(field + "Number").value = value;
  }
  render();
}
function setupView() {
  $("part").replaceChildren();$("parts").replaceChildren();
  for (const part of rigs[view].candidate.def.parts) {
    const option = new Option(names[part.id] || part.id, part.id);$("part").add(option);
    const button = document.createElement("button");button.textContent = names[part.id] || part.id;button.dataset.part = part.id;button.onclick = () => selectPart(part.id);$("parts").append(button);
  }
  selectPart(selected in rigs[view].candidate.images ? selected : "body");
}
function edit(field, raw) {
  const part = rigs[view].candidate.def.parts.find((item) => item.id === selected);
  const min = Number($(field).min), max = Number($(field).max);
  const value = Math.max(min, Math.min(max, Number(raw)));
  if (!Number.isFinite(value)) return;
  offsets[view] ??= {};offsets[view][selected] = { ...pose(part), [field]: value };
  $(field).value = value;$(field + "Number").value = value;render();
}
function point(event) {
  const rect = $("candidate").getBoundingClientRect();
  return { x: (event.clientX - rect.left) * 440 / rect.width, y: (event.clientY - rect.top) * 430 / rect.height };
}
function hitPart(part, pt) {
  const g = geometry(part, rigs[view].candidate, true), dx = pt.x - g.x, dy = pt.y - g.y;
  const x = (dx * Math.cos(g.rotation) + dy * Math.sin(g.rotation)) / g.size + part.pivot[0];
  const y = (-dx * Math.sin(g.rotation) + dy * Math.cos(g.rotation)) / g.size + part.pivot[1];
  return x >= 0 && y >= 0 && x <= part.rect[2] && y <= part.rect[3];
}
$("candidate").addEventListener("pointerdown", (event) => {
  const pt = point(event), rig = rigs[view].candidate;
  const hit = [...rig.def.parts].sort((a,b) => geometry(b,rig,true).layer - geometry(a,rig,true).layer).find((part) => hitPart(part,pt));
  if (hit) selectPart(hit.id);
  dragging = pt;$("candidate").setPointerCapture(event.pointerId);
});
$("candidate").addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const pt = point(event), part = rigs[view].candidate.def.parts.find((item) => item.id === selected);
  const current = pose(part), dx = (pt.x - dragging.x) / STAGE.scale, dy = (pt.y - dragging.y) / STAGE.scale;
  offsets[view] ??= {};offsets[view][selected] = { ...current, x: Math.round(current.x + dx), y: Math.round(current.y + dy) };
  dragging = pt;selectPart(selected);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) $("candidate").addEventListener(type, () => { dragging = null; });
$("part").onchange = (event) => selectPart(event.target.value);
$("guides").onchange = render;
for (const field of fields) for (const id of [field, field + "Number"]) $(id).addEventListener("input", (event) => edit(field,event.target.value));
$("overlay").oninput = (event) => { $("overlayNumber").value = event.target.value;render(); };
$("overlayNumber").oninput = (event) => { $("overlay").value = event.target.value;render(); };
$("resetPart").onclick = () => { delete offsets[view]?.[selected];selectPart(selected);$("status").textContent = `Reset ${names[selected] || selected}.`; };
$("resetView").onclick = () => { delete offsets[view];setupView();$("status").textContent = `Reset ${view} view.`; };
$("copy").onclick = async () => { try { await navigator.clipboard.writeText($("output").value);$("status").textContent = "Copied settings for all three views."; } catch { $("output").select();$("status").textContent = "Select and copy the JSON text."; } };
$("download").onclick = () => { const blob = new Blob([$("output").value],{type:"application/json"}), url = URL.createObjectURL(blob), link = document.createElement("a");link.href=url;link.download="rat-assembly-settings.json";link.click();setTimeout(() => URL.revokeObjectURL(url),1000);$("status").textContent="Downloaded settings for all three views."; };
for (const direction of Object.keys(VIEW_IDS)) {
  const button = document.createElement("button");button.textContent=direction[0].toUpperCase()+direction.slice(1);button.dataset.view=direction;
  button.onclick=()=>{view=direction;setupView();};$("views").append(button);
}
try {
  await Promise.all(Object.entries(VIEW_IDS).map(async ([direction,[original,candidate]]) => { const [oldRig,newRig]=await Promise.all([loadRig(original),loadRig(candidate)]);rigs[direction]={original:oldRig,candidate:newRig}; }));
  setupView();
} catch (error) { $("status").textContent=`Could not load rat art: ${error.message}`; }
