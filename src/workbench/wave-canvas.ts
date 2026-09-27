import type { LevelRecipe, WaveRecipe } from "../config/configuration";
import type { EnemyKind } from "../sim/types";
import {
  editWave,
  layoutWave,
  type VisualGroup,
  type WaveEdit,
} from "./wave-graph";

interface Selection {
  packetId: string;
  groupId: string;
}
interface Snapshot {
  wave: WaveRecipe;
  selection: Selection | null;
}
interface CanvasState {
  wave: WaveRecipe;
  selection: Selection | null;
  zoom: number;
  past: Snapshot[];
  future: Snapshot[];
  openSections?: string[];
}
const states = new Map<string, CanvasState>();
/** Explicit discard or loading another experiment starts a new editing history. */
export function clearWaveCanvasHistory(): void {
  states.clear();
}
const kinds: EnemyKind[] = ["raider", "runner", "armored", "boss"];
const names: Record<EnemyKind, string> = {
  raider: "Rat raider",
  runner: "Fleet weasel",
  armored: "Shield boar",
  boss: "Roadwarden",
};
const images: Record<EnemyKind, string> = {
  raider: "/art/v2/rat-rig-v3/body.webp",
  runner: "/art/v2/weasel-rig-v1/body.webp",
  armored: "/art/v2/boar-rig-v1/body.webp",
  boss: "/art/v2/badger-rig-v1/body.webp",
};
const clone = (wave: WaveRecipe) => structuredClone(wave);
const same = (a: WaveRecipe, b: WaveRecipe) =>
  JSON.stringify(a) === JSON.stringify(b);
const seconds = (n: number) => `${Number(n.toFixed(2))}s`;
const snap = (n: number) => Math.round(n * 20) / 20;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

function editError(error: unknown, change: WaveEdit): string {
  const detail =
    error instanceof Error ? error.message : "This edit is not valid.";
  if (detail.includes("nondecreasing"))
    return "These enemies would arrive out of order. Shorten their stagger or add more spacing.";
  if (detail === "Invalid wave group") {
    if (change.type === "stagger")
      return "Those arrivals exceed the batch spacing. Pull the last enemy back toward its batch.";
    if (change.type === "duration")
      return "That spacing is too short for the batch. Stretch its timing or shorten its stagger.";
    return "This change conflicts with the group's timing. Adjust spacing or staggering first.";
  }
  return detail;
}

export function mountWaveCanvas(
  host: HTMLElement,
  options: {
    level: LevelRecipe;
    wave: WaveRecipe;
    initialDelay: number;
    onChange: (wave: WaveRecipe) => void;
  },
): {
  refresh: (
    wave: WaveRecipe,
    level?: LevelRecipe,
    initialDelay?: number,
  ) => void;
  dispose: () => void;
} {
  const key = `${options.level.id}/${options.wave.id}`;
  let state = states.get(key);
  if (!state || !same(state.wave, options.wave)) {
    state = {
      wave: clone(options.wave),
      selection: null,
      zoom: 1,
      past: [],
      future: [],
    };
    states.set(key, state);
  }
  const model = state;
  let message =
    "Select an enemy group. Drag its body to add a wait; use its handles to shape the rhythm.";
  let scale = 30;
  let gesture: {
    pointer: number;
    x: number;
    y: number;
    scale: number;
    original: WaveRecipe;
    selection: Selection | null;
    node: VisualGroup;
    action: string;
    moved: boolean;
    candidate: WaveRecipe;
  } | null = null;
  let disposed = false;
  const location = () => {
    const packetIndex = model.wave.packets.findIndex(
      (p) => p.id === model.selection?.packetId,
    );
    const groupIndex =
      model.wave.packets[packetIndex]?.groups.findIndex(
        (g) => g.id === model.selection?.groupId,
      ) ?? -1;
    return packetIndex >= 0 && groupIndex >= 0
      ? { packetIndex, groupIndex }
      : null;
  };
  const snapshot = (): Snapshot => ({
    wave: clone(model.wave),
    selection: model.selection ? { ...model.selection } : null,
  });
  function commit(next: WaveRecipe, label: string, before = snapshot()) {
    if (same(before.wave, next)) {
      render();
      return;
    }
    model.past.push(before);
    if (model.past.length > 100) model.past.shift();
    model.future = [];
    model.wave = clone(next);
    message = label;
    options.onChange(clone(next));
    render();
  }
  function apply(change: WaveEdit, label: string) {
    const selection = location();
    if (!selection) return;
    try {
      const next = editWave(
        options.level,
        model.wave,
        options.initialDelay,
        selection,
        change,
      );
      const before = snapshot();
      if (change.type === "add")
        model.selection = {
          packetId: model.wave.packets[selection.packetIndex].id,
          groupId: change.id,
        };
      else if (change.type === "add-sequence")
        model.selection = { packetId: change.id, groupId: change.groupId };
      else if (change.type === "remove") {
        const packet =
          next.packets[
            Math.min(selection.packetIndex, next.packets.length - 1)
          ];
        model.selection = {
          packetId: packet.id,
          groupId:
            packet.groups[
              Math.min(selection.groupIndex, packet.groups.length - 1)
            ].id,
        };
      }
      commit(next, label, before);
    } catch (error) {
      message = `Cannot change: ${editError(error, change)}`;
      render();
    }
  }
  function history(redo: boolean) {
    const from = redo ? model.future : model.past;
    const entry = from.pop();
    if (!entry) return;
    (redo ? model.past : model.future).push(snapshot());
    model.wave = clone(entry.wave);
    model.selection = entry.selection;
    message = redo ? "Change restored." : "Change undone.";
    options.onChange(clone(model.wave));
    render();
  }
  function select(node: VisualGroup) {
    const packet = model.wave.packets[node.packetIndex];
    model.selection = {
      packetId: packet.id,
      groupId: packet.groups[node.groupIndex].id,
    };
  }
  const button = (action: string, text: string, disabled = false) =>
    `<button type="button" data-wg-action="${action}" ${disabled ? "disabled" : ""}>${text}</button>`;
  const pair = (label: string, value: string, action: string) =>
    `<div class="wg-control"><span>${label}</span><strong>${value}</strong><button type="button" data-wg-action="${action}-down" aria-label="Decrease ${label}">−</button><button type="button" data-wg-action="${action}-up" aria-label="Increase ${label}">+</button></div>`;
  function render() {
    if (disposed) return;
    if (host.querySelector(".wg-toolbar"))
      model.openSections = [
        ...host.querySelectorAll<HTMLDetailsElement>("details"),
      ]
        .filter((detail) => detail.open)
        .map((detail) => detail.querySelector("summary")?.textContent ?? "");
    const focused = host.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).closest<HTMLElement>(
          "[data-wg-action], [data-wg-node]",
        )
      : null;
    const focusedAction = focused?.dataset.wgAction;
    const focusedNode = focused?.dataset.wgNode;
    const focusedDrag = focused?.dataset.wgDrag;
    const scroll =
      host.querySelector<HTMLElement>(".wg-scroll")?.scrollLeft ?? 0;
    let layout;
    try {
      layout = layoutWave(options.level, model.wave, options.initialDelay);
    } catch (error) {
      host.innerHTML = `<p class="wg-message">${escape(error instanceof Error ? error.message : "Invalid wave")}</p>`;
      return;
    }
    if (!gesture)
      scale =
        Math.max(
          1.5,
          (Math.max(host.clientWidth, 320) - 210) / Math.max(layout.end, 8),
        ) * model.zoom;
    const width = Math.max(host.clientWidth - 8, 130 + layout.end * scale + 70);
    const selected = location();
    const node = layout.nodes.find(
      (n) =>
        n.packetIndex === selected?.packetIndex &&
        n.groupIndex === selected?.groupIndex &&
        n.repeatIndex === 0,
    );
    const packet = selected
      ? model.wave.packets[selected.packetIndex]
      : undefined;
    const group = selected ? packet?.groups[selected.groupIndex] : undefined;
    let ticks = "";
    const tickStep = Math.max(1, Math.ceil(55 / scale));
    for (let t = 0; t <= layout.end; t += tickStep)
      ticks += `<span class="wg-tick" style="left:${120 + t * scale}px">${t}s</span>`;
    const visibleKinds = kinds.filter((kind) =>
      layout.nodes.some((node) => node.kind === kind),
    );
    const lanes = visibleKinds
      .map(
        (kind, i) =>
          `<div class="wg-lane" style="top:${100 + i * 64}px"><span class="wg-lane-label"><img src="${images[kind]}" alt=""/>${names[kind]}</span></div>`,
      )
      .join("");
    const sequences = layout.sequences
      .map(
        (s) =>
          `<div class="wg-sequence" style="left:${120 + s.start * scale}px;width:${Math.max(44, (s.handoff - s.start) * scale)}px"><span>Sequence ${s.packetIndex + 1}</span> ${button(`select-sequence:${s.packetIndex}`, `×${s.repeat}`)}${selected?.packetIndex === s.packetIndex ? `<button class="wg-handle wg-repeat" data-wg-drag="repeat" data-wg-node="${layout.nodes.findIndex((n) => n.packetIndex === s.packetIndex)}" aria-label="Drag to change repeat count">↔ repeats</button>` : ""}</div>`,
      )
      .join("");
    const repeatRestHandles = selected
      ? layout.nodes
          .filter(
            (n) =>
              n.packetIndex === selected.packetIndex &&
              n.groupIndex === 0 &&
              n.repeatIndex === 1,
          )
          .map((n) => {
            const source = model.wave.packets[n.packetIndex];
            const rest = source.repeatDelayBefore ?? 0;
            const midpoint =
              n.start - (source.groups[0].delayBefore ?? 0) - rest / 2;
            return `<button class="wg-handle wg-repeat-rest" style="left:${120 + midpoint * scale - 22}px;top:70px" data-wg-node="${layout.nodes.indexOf(n)}" data-wg-drag="rest" aria-label="Drag extra wait between repeats">↔ rest ${seconds(rest)}</button>`;
          })
          .join("")
      : "";
    const nodes = layout.nodes
      .map((n, index) => {
        const chosen =
          selected?.packetIndex === n.packetIndex &&
          selected.groupIndex === n.groupIndex;
        const top = 104 + visibleKinds.indexOf(n.kind) * 64;
        const arrivals = n.spawns
          .map(
            (spawn) =>
              `<i class="wg-arrival" style="left:${(spawn.at - n.start) * scale}px" title="Arrival ${seconds(spawn.at)}"></i>`,
          )
          .join("");
        return `<div class="wg-node ${n.repeatIndex > 0 ? "wg-echo" : ""} ${chosen ? "wg-selected" : ""}" style="left:${120 + n.start * scale}px;top:${top}px;width:${Math.max(1, (Math.max(n.handoff, n.lastSpawn) - n.start) * scale)}px"><div class="wg-band">${arrivals}<span class="wg-tail" style="left:${(n.lastSpawn - n.start) * scale}px;width:${Math.max(0, (n.handoff - n.lastSpawn) * scale)}px"></span></div><button class="wg-node-head" data-wg-node="${index}" data-wg-drag="move" aria-label="${names[n.kind]}, ${n.count} enemies, starts ${seconds(n.start)}, ${n.repeatIndex ? `linked repeat ${n.repeatIndex + 1}` : "drag to change wait"}"><img src="${images[n.kind]}" alt=""/><strong>${n.count}</strong></button>${chosen ? `<button class="wg-handle wg-duration" style="left:${(n.handoff - n.start) * scale}px" data-wg-node="${index}" data-wg-drag="duration" aria-label="Drag timing cursor to change batch spacing">↔ time</button><button class="wg-handle wg-count" data-wg-node="${index}" data-wg-drag="count" aria-label="Drag up to add enemies">↕ count</button>` : ""}</div>`;
      })
      .join("");
    const flow = layout.nodes
      .slice(1)
      .map((next, i) => {
        const previous = layout.nodes[i];
        const x1 = 120 + previous.handoff * scale;
        const x2 = 120 + next.start * scale;
        const y1 = 156 + visibleKinds.indexOf(previous.kind) * 64;
        const y2 = 156 + visibleKinds.indexOf(next.kind) * 64;
        return `<path d="M ${x1} ${y1} L ${x2} ${y2}"/>`;
      })
      .join("");
    let inspector = `<p class="wg-guide">The connected groups form one arrival order. Moving a group shifts later arrivals. Lighter copies share the same pattern.</p>`;
    if (node && packet && group) {
      const detailScale = Math.max(
        40,
        Math.min(160, 360 / Math.max(node.gap * 2, 1)),
      );
      const firstSize = Math.min(node.batchSize, node.count);
      const local = Array.from(
        { length: firstSize },
        (_, i) =>
          `<button class="wg-detail-enemy" style="left:${32 + i * node.stagger * detailScale}px;top:${34 + i * 12}px" ${i === firstSize - 1 && firstSize > 1 ? `data-wg-node="${layout.nodes.indexOf(node)}" data-wg-drag="stagger"` : ""} aria-label="${i === firstSize - 1 && firstSize > 1 ? "Drag last enemy to spread arrivals within every batch" : names[node.kind]}"><img src="${images[node.kind]}" alt=""/></button>`,
      ).join("");
      inspector = `<section class="wg-inspector"><div class="wg-inspector-heading"><img src="${images[node.kind]}" alt=""/><div><h3>${names[node.kind]} · ${node.count} enemies</h3><p>Sequence ${node.packetIndex + 1}${node.repeatIndex ? ` · linked copy ${node.repeatIndex + 1}` : ""}${(packet.repeat ?? 1) > 1 ? ` · edits apply to all ${packet.repeat} repeats` : " · one pattern"}</p></div></div><div class="wg-detail" style="position:relative;min-height:130px"><span>${firstSize > 1 ? "Shape one batch · drag its last enemy to spread arrivals" : "Drag ↕ per batch up to form pairs, then spread their arrivals"}</span>${local}<button class="wg-handle wg-batch" style="position:absolute;left:0;top:76px" data-wg-node="${layout.nodes.indexOf(node)}" data-wg-drag="batch" aria-label="Drag up to increase enemies per batch">↕ per batch</button><button class="wg-handle" style="position:absolute;left:${32 + node.gap * detailScale}px;top:46px" data-wg-node="${layout.nodes.indexOf(node)}" data-wg-drag="gap" aria-label="Drag next batch to change spacing">↔ next batch</button></div><details class="wg-precise"><summary>Precise timing &amp; counts</summary><div class="wg-controls">${pair("Enemies", String(node.count), "count")}${pair("Per batch", String(node.batchSize), "batch")}${pair("Batch spacing", seconds(node.gap), "gap")}${pair("Within batch", seconds(node.stagger), "stagger")}${pair("Wait before", seconds(group.delayBefore ?? 0), "wait")}${pair("Pattern repeats", String(packet.repeat ?? 1), "repeat")}${pair("Extra repeat rest", seconds(packet.repeatDelayBefore ?? 0), "rest")}<button class="wg-handle wg-rest" data-wg-node="${layout.nodes.indexOf(node)}" data-wg-drag="rest" aria-label="Drag extra repeat rest">↔ extra rest</button></div></details><p>Timing strips show elapsed time; shaded tails include final batch spacing. The number means enemies.${node.lastSpawn > node.handoff ? " This batch finishes after its spacing cursor; the following wait preserves arrival order." : ""}</p><details><summary>Arrange or remove groups</summary><div class="wg-controls">${button("earlier", "Move before", selected!.groupIndex === 0)}${button("later", "Move after", selected!.groupIndex === packet.groups.length - 1)}${button("remove", "Remove group")}${button("sequence-earlier", "Sequence before", selected!.packetIndex === 0)}${button("sequence-later", "Sequence after", selected!.packetIndex === model.wave.packets.length - 1)}</div></details><div class="wg-palette"><span>Add after this group</span>${kinds.map((kind) => `<button data-wg-action="add:${kind}"><img src="${images[kind]}" alt=""/>${names[kind]}</button>`).join("")}</div><details><summary>Start a new sequence after this one</summary><div class="wg-palette">${kinds.map((kind) => `<button data-wg-action="new:${kind}"><img src="${images[kind]}" alt=""/>${names[kind]}</button>`).join("")}</div></details></section>`;
    }
    host.innerHTML = `<div class="wg-toolbar"><strong>Shape the arrival rhythm</strong><div class="wg-history">${button("undo", "↶ Undo", !model.past.length)}${button("redo", "↷ Redo", !model.future.length)}</div><div class="wg-zoom">${button("fit", "Fit")}${button("zoom-out", "− Zoom")}${button("zoom-in", "+ Zoom")}</div></div><p class="wg-guide">Click a group to reveal handles. Drag ↔ for time, ↕ for enemy count. Arrow keys adjust wait and count. Escape cancels a drag.</p><div class="wg-scroll"><div class="wg-stage" style="position:relative;width:${width}px;min-height:${132 + visibleKinds.length * 64}px"><div class="wg-ruler">${ticks}</div>${sequences}${lanes}<svg class="wg-flow" width="${width}" height="${100 + visibleKinds.length * 64 + 12}" aria-hidden="true">${flow}</svg>${nodes}${repeatRestHandles}</div></div><p class="wg-message ${message.startsWith("Limit:") || message.startsWith("Cannot change:") ? "wg-error" : ""}" role="status" aria-live="polite">${escape(message)}</p>${inspector}`;
    for (const detail of host.querySelectorAll<HTMLDetailsElement>("details"))
      detail.open =
        model.openSections?.includes(
          detail.querySelector("summary")?.textContent ?? "",
        ) ?? false;
    const scroller = host.querySelector<HTMLElement>(".wg-scroll");
    if (scroller) scroller.scrollLeft = scroll;
    if (!gesture) {
      const focusTarget = focusedAction
        ? Array.from(
            host.querySelectorAll<HTMLElement>("[data-wg-action]"),
          ).find((item) => item.dataset.wgAction === focusedAction)
        : focusedNode !== undefined
          ? Array.from(
              host.querySelectorAll<HTMLElement>("[data-wg-node]"),
            ).find(
              (item) =>
                item.dataset.wgNode === focusedNode &&
                item.dataset.wgDrag === focusedDrag,
            )
          : undefined;
      focusTarget?.focus({ preventScroll: true });
    }
  }
  function click(event: MouseEvent) {
    if (gesture) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-wg-action], [data-wg-node]",
    );
    if (!target) return;
    event.stopPropagation();
    if (target.dataset.wgNode !== undefined) {
      const node = layoutWave(options.level, model.wave, options.initialDelay)
        .nodes[Number(target.dataset.wgNode)];
      if (node) {
        select(node);
        render();
      }
      return;
    }
    const action = target.dataset.wgAction!;
    if (action === "undo" || action === "redo") {
      history(action === "redo");
      return;
    }
    if (action === "fit" || action.startsWith("zoom-")) {
      model.zoom =
        action === "fit"
          ? 1
          : Math.max(
              0.5,
              Math.min(8, model.zoom * (action === "zoom-in" ? 1.5 : 1 / 1.5)),
            );
      render();
      return;
    }
    if (action.startsWith("select-sequence:")) {
      const pi = Number(action.split(":")[1]);
      const p = model.wave.packets[pi];
      model.selection = { packetId: p.id, groupId: p.groups[0].id };
      render();
      return;
    }
    const loc = location();
    if (!loc) return;
    const p = model.wave.packets[loc.packetIndex],
      g = p.groups[loc.groupIndex];
    if (action.startsWith("new:")) {
      apply(
        {
          type: "add-sequence",
          kind: action.split(":")[1] as EnemyKind,
          id: `sequence-${crypto.randomUUID()}`,
          groupId: `group-${crypto.randomUUID()}`,
        },
        "New sequence added.",
      );
      return;
    }
    if (action === "sequence-earlier" || action === "sequence-later") {
      apply(
        {
          type: "sequence-reorder",
          direction: action === "sequence-earlier" ? -1 : 1,
        },
        "Sequence order changed.",
      );
      return;
    }
    if (action.startsWith("add:")) {
      apply(
        {
          type: "add",
          kind: action.split(":")[1] as EnemyKind,
          id: `group-${crypto.randomUUID()}`,
        },
        "Enemy group added.",
      );
      return;
    }
    if (action === "earlier" || action === "later") {
      apply(
        { type: "reorder", direction: action === "earlier" ? -1 : 1 },
        "Group order changed.",
      );
      return;
    }
    if (action === "remove") {
      apply({ type: "remove" }, "Enemy group removed.");
      return;
    }
    const up = action.endsWith("-up"),
      delta = up ? 1 : -1,
      type = action.replace(/-(up|down)$/, "");
    const changes: Record<string, WaveEdit> = {
      count: { type: "count", count: Math.max(1, g.count + delta) },
      batch: { type: "batch", size: Math.max(1, (g.batchSize ?? 1) + delta) },
      gap: {
        type: "duration",
        seconds:
          snap(Math.max(0.05, g.gap + delta * 0.25)) *
          Math.ceil(g.count / (g.batchSize ?? 1)),
      },
      stagger: {
        type: "stagger",
        seconds: snap(Math.max(0, (g.batchStagger ?? 0) + delta * 0.05)),
      },
      wait: { type: "move", delta: delta * 0.5 },
      repeat: { type: "repeat", count: Math.max(1, (p.repeat ?? 1) + delta) },
      rest: {
        type: "repeat-rest",
        seconds: snap(Math.max(0, (p.repeatDelayBefore ?? 0) + delta * 0.5)),
      },
    };
    if (changes[type]) apply(changes[type], "Arrival rhythm updated.");
  }
  function down(event: PointerEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-wg-drag]",
    );
    if (!target || event.button !== 0 || gesture) return;
    event.stopPropagation();
    const node = layoutWave(options.level, model.wave, options.initialDelay)
      .nodes[Number(target.dataset.wgNode)];
    if (!node) return;
    const wasSelected =
      location()?.packetIndex === node.packetIndex &&
      location()?.groupIndex === node.groupIndex;
    if (
      !["repeat", "rest"].includes(target.dataset.wgDrag!) ||
      location()?.packetIndex !== node.packetIndex
    )
      select(node);
    if (!wasSelected && target.dataset.wgDrag === "move") {
      render();
      return;
    }
    gesture = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scale,
      original: clone(model.wave),
      selection: model.selection ? { ...model.selection } : null,
      node,
      action: target.dataset.wgDrag!,
      moved: false,
      candidate: clone(model.wave),
    };
    host.tabIndex = -1;
    host.focus({ preventScroll: true });
    host.setPointerCapture(event.pointerId);
    event.preventDefault();
    render();
  }
  function move(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    event.stopPropagation();
    event.preventDefault();
    const dx = event.clientX - gesture.x,
      dy = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
    gesture.moved = true;
    const n = gesture.node,
      p = gesture.original.packets[n.packetIndex],
      g = p.groups[n.groupIndex];
    let change: WaveEdit;
    switch (gesture.action) {
      case "rest":
        change = {
          type: "repeat-rest",
          seconds: snap(
            Math.max(0, (p.repeatDelayBefore ?? 0) + dx / gesture.scale),
          ),
        };
        break;
      case "batch":
        change = {
          type: "batch",
          size: Math.max(1, n.batchSize - Math.round(dy / 12)),
        };
        break;
      case "count":
        change = {
          type: "count",
          count: Math.max(1, n.count - Math.round(dy / 10)),
        };
        break;
      case "repeat":
        change = {
          type: "repeat",
          count: Math.max(1, (p.repeat ?? 1) + Math.round(dx / 44)),
        };
        break;
      case "stagger": {
        const localScale = Math.max(
          40,
          Math.min(160, 360 / Math.max(n.gap * 2, 1)),
        );
        change = {
          type: "stagger",
          seconds: snap(
            Math.max(
              0,
              n.stagger +
                dx /
                  localScale /
                  Math.max(1, Math.min(n.count, n.batchSize) - 1),
            ),
          ),
        };
        break;
      }
      case "gap": {
        const localScale = Math.max(
          40,
          Math.min(160, 360 / Math.max(n.gap * 2, 1)),
        );
        change = {
          type: "duration",
          seconds:
            Math.max(0.05, snap(n.gap + dx / localScale)) *
            Math.ceil(n.count / n.batchSize),
        };
        break;
      }
      case "duration":
        change = {
          type: "duration",
          seconds: Math.max(
            0.05,
            snap(n.handoff - n.start + dx / gesture.scale),
          ),
        };
        break;
      default:
        change = {
          type: "move",
          delta: snap(Math.max(-(g.delayBefore ?? 0), dx / gesture.scale)),
        };
        break;
    }
    try {
      const next = editWave(
        options.level,
        gesture.original,
        options.initialDelay,
        n,
        change,
      );
      gesture.candidate = next;
      model.wave = next;
      message =
        "Preview · release to keep this change. Later groups follow the edited rhythm.";
    } catch (error) {
      gesture.candidate = clone(gesture.original);
      model.wave = clone(gesture.original);
      message = `Limit: ${editError(error, change)}`;
    }
    render();
  }
  function finish(event?: PointerEvent, cancel = false) {
    if (!gesture || (event && event.pointerId !== gesture.pointer)) return;
    const active = gesture;
    gesture = null;
    if (host.hasPointerCapture(active.pointer))
      host.releasePointerCapture(active.pointer);
    model.wave = clone(active.original);
    if (cancel) {
      message = "Drag cancelled.";
      render();
    } else if (active.moved)
      commit(active.candidate, "Arrival rhythm changed · Undo is available.", {
        wave: active.original,
        selection: active.selection,
      });
    else render();
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (gesture) finish(undefined, true);
      else {
        model.selection = null;
        render();
      }
      event.preventDefault();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      if (gesture) finish(undefined, true);
      history(event.shiftKey);
      event.preventDefault();
      return;
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-wg-node]",
    );
    if (
      !target ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    const n = layoutWave(options.level, model.wave, options.initialDelay).nodes[
      Number(target.dataset.wgNode)
    ];
    if (!n) return;
    select(n);
    event.preventDefault();
    event.stopPropagation();
    const sign = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
    const amount = event.shiftKey ? 1 : 0.05;
    const p = model.wave.packets[n.packetIndex];
    let change: WaveEdit;
    switch (target.dataset.wgDrag) {
      case "count":
        change = { type: "count", count: Math.max(1, n.count + sign) };
        break;
      case "batch":
        change = { type: "batch", size: Math.max(1, n.batchSize + sign) };
        break;
      case "repeat":
        change = { type: "repeat", count: Math.max(1, (p.repeat ?? 1) + sign) };
        break;
      case "rest":
        change = {
          type: "repeat-rest",
          seconds: snap(
            Math.max(0, (p.repeatDelayBefore ?? 0) + sign * amount),
          ),
        };
        break;
      case "duration":
        change = {
          type: "duration",
          seconds: snap(Math.max(0.05, n.handoff - n.start + sign * amount)),
        };
        break;
      case "gap":
        change = {
          type: "duration",
          seconds:
            snap(Math.max(0.05, n.gap + sign * amount)) *
            Math.ceil(n.count / n.batchSize),
        };
        break;
      case "stagger":
        change = {
          type: "stagger",
          seconds: snap(Math.max(0, n.stagger + sign * amount)),
        };
        break;
      default:
        change =
          event.key === "ArrowUp" || event.key === "ArrowDown"
            ? { type: "count", count: Math.max(1, n.count + sign) }
            : { type: "move", delta: sign * (event.shiftKey ? 1 : 0.1) };
        break;
    }
    apply(change, "Arrival rhythm updated.");
  }
  host.addEventListener("click", click);
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerup", finish);
  const cancel = (e: PointerEvent) => finish(e, true);
  host.addEventListener("pointercancel", cancel);
  host.addEventListener("keydown", keydown);
  let renderedWidth = host.clientWidth;
  const resizeObserver = new ResizeObserver(() => {
    if (!gesture && Math.abs(host.clientWidth - renderedWidth) > 0.5) {
      renderedWidth = host.clientWidth;
      render();
    }
  });
  resizeObserver.observe(host);
  render();
  return {
    refresh(wave, level, initialDelay) {
      if (gesture) return;
      const geometryChanged =
        (level !== undefined &&
          JSON.stringify(level) !== JSON.stringify(options.level)) ||
        (initialDelay !== undefined && initialDelay !== options.initialDelay);
      if (level) options.level = level;
      if (initialDelay !== undefined) options.initialDelay = initialDelay;
      if (same(model.wave, wave)) {
        if (geometryChanged) render();
        return;
      }
      model.past.push(snapshot());
      if (model.past.length > 100) model.past.shift();
      model.wave = clone(wave);
      model.future = [];
      message = "Visual rhythm refreshed from the edited recipe.";
      render();
    },
    dispose() {
      resizeObserver.disconnect();
      if (gesture) finish(undefined, true);
      disposed = true;
      host.removeEventListener("click", click);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", finish);
      host.removeEventListener("pointercancel", cancel);
      host.removeEventListener("keydown", keydown);
    },
  };
}
