import {
  BOARD_ILLUSTRATIONS,
  resolveBoards,
  type BoardDef,
} from "../content/boards";
import { escapeHtml as esc } from "../ui/html";
import { validateWorkingDraft, type WorkingDraft } from "./working-draft";

/** Authoring controls only. Campaign/profile storage never participates in Playtest. */
export function mountBoardEditor(
  host: HTMLElement,
  getDraft: () => WorkingDraft,
  update: (draft: WorkingDraft) => void,
  fail: (error: unknown) => void,
): void {
  const draft = getDraft(),
    boards = resolveBoards(draft.content);
  const selected =
    boards.find((board) => board.levelIds.includes(draft.levelId)) ?? boards[0];
  host.innerHTML = `<details class="ws-settings" id="board-settings"><summary>Board settings</summary><p>Board order controls travel; encounter order controls sequential unlocks. Promote wave includes its board settings. Use Promote all changes when moving encounters between boards or changing board order.</p><form id="board-form"><div class="ws-settings-grid"><label>Board<select name="board">${boards.map((board) => `<option value="${esc(board.id)}" ${board.id === selected.id ? "selected" : ""}>${esc(board.name)}</option>`).join("")}</select></label><label>Board name<input name="name" required/></label><label>Reviewed illustration<select name="illustration">${Object.keys(
    BOARD_ILLUSTRATIONS,
  )
    .map((id) => `<option value="${esc(id)}">${esc(id)}</option>`)
    .join(
      "",
    )}</select></label><label>Encounter identities in order<textarea name="members" required rows="4"></textarea></label><label>Move removed encounters to<select name="destination"></select></label><label>Board identities in travel order<textarea name="order" required rows="3"></textarea></label></div><p>Available encounters: ${draft.content.levels.map((level) => `${esc(level.id)} (${esc(level.name)})`).join(", ")}</p><label><input type="checkbox" name="spatial"/> Authored marker anchors</label><div id="board-anchors" class="ws-settings-grid"></div><button type="submit">Save board draft</button><button type="button" id="new-board">New board from selected map</button></form></details>`;
  const form = host.querySelector<HTMLFormElement>("#board-form")!;
  const field = <
    T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  >(
    name: string,
  ) => form.elements.namedItem(name) as T;
  const list = (name: string) =>
    field<HTMLTextAreaElement>(name)
      .value.split(/[\s,]+/)
      .filter(Boolean);
  const fill = () => {
    const board = boards.find(({ id }) => id === field("board").value)!;
    field("destination").innerHTML =
      '<option value="">Choose a destination if removing encounters</option>' +
      boards
        .filter(({ id }) => id !== board.id)
        .map(
          (other) =>
            `<option value="${esc(other.id)}">${esc(other.name)}</option>`,
        )
        .join("");
    field("name").value = board.name;
    field("illustration").value = board.visual.illustration;
    field("members").value = board.levelIds.join("\n");
    field("order").value = boards.map(({ id }) => id).join("\n");
    field<HTMLInputElement>("spatial").checked = !!board.visual.markers;
    anchors();
  };
  const anchors = () => {
    const board = boards.find(({ id }) => id === field("board").value)!;
    host.querySelector("#board-anchors")!.innerHTML = field<HTMLInputElement>(
      "spatial",
    ).checked
      ? list("members")
          .map(
            (id, i) =>
              `<fieldset><legend>${esc(id)}</legend>${(["x", "y"] as const).map((axis) => `<label>${axis === "x" ? "Across" : "Down"} (%)<input type="number" name="anchor-${i}-${axis}" min="0" max="100" step="any" required value="${board.visual.markers?.[id]?.[axis] ?? ""}"/></label>`).join("")}</fieldset>`,
          )
          .join("")
      : "";
  };
  field<HTMLSelectElement>("board").onchange = fill;
  field<HTMLInputElement>("spatial").onchange = anchors;
  field<HTMLTextAreaElement>("members").onchange = anchors;
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      const next = structuredClone(getDraft());
      next.content.boards = resolveBoards(next.content);
      const board = next.content.boards.find(
        ({ id }) => id === field("board").value,
      )!;
      board.name = field("name").value.trim();
      const previousMembers = [...board.levelIds];
      board.levelIds = list("members");
      for (const other of next.content.boards.filter(
        ({ id }) => id !== board.id,
      )) {
        for (const id of board.levelIds) {
          other.levelIds = other.levelIds.filter((member) => member !== id);
          if (other.visual.markers) delete other.visual.markers[id];
        }
      }
      const removed = previousMembers.filter(
        (id) => !board.levelIds.includes(id),
      );
      if (removed.length) {
        const destination = next.content.boards.find(
          ({ id }) => id === field("destination").value,
        );
        if (!destination || destination.id === board.id)
          throw new Error("Choose a destination for removed encounters");
        destination.levelIds.push(...removed);
        if (destination.visual.markers) {
          for (const id of removed) {
            const anchor = board.visual.markers?.[id];
            if (!anchor)
              throw new Error(
                "Set destination anchors before moving encounters to a spatial board",
              );
            destination.visual.markers[id] = structuredClone(anchor);
          }
        }
      }
      board.visual.illustration = field("illustration")
        .value as BoardDef["visual"]["illustration"];
      if (field<HTMLInputElement>("spatial").checked)
        board.visual.markers = Object.fromEntries(
          board.levelIds.map((id, i) => [
            id,
            {
              x: Number(field(`anchor-${i}-x`).value),
              y: Number(field(`anchor-${i}-y`).value),
            },
          ]),
        );
      else delete board.visual.markers;
      const order = list("order");
      if (
        order.length !== next.content.boards.length ||
        new Set(order).size !== order.length ||
        order.some((id) => !next.content.boards!.some((b) => b.id === id))
      )
        throw new Error("List every board identity exactly once");
      next.content.boards = order.map((id) =>
        next.content.boards!.find((board) => board.id === id)!,
      );
      update(validateWorkingDraft(next));
    } catch (cause) {
      fail(cause);
    }
  };
  host.querySelector<HTMLButtonElement>("#new-board")!.onclick = () => {
    const id = window.prompt("Stable board identity");
    if (!id) return;
    const name = window.prompt("Board name");
    if (!name) return;
    try {
      const next = structuredClone(getDraft());
      next.content.boards = resolveBoards(next.content);
      const previous = next.content.boards.find(({ levelIds }) =>
        levelIds.includes(next.levelId),
      );
      if (previous && previous.levelIds.length === 1)
        throw new Error("Keep at least one encounter on each board");
      if (previous) {
        previous.levelIds = previous.levelIds.filter(
          (levelId) => levelId !== next.levelId,
        );
        if (previous.visual.markers)
          delete previous.visual.markers[next.levelId];
      }
      next.content.boards.push({
        id,
        name,
        levelIds: [next.levelId],
        visual: { illustration: "expedition-map-v1" },
      });
      update(validateWorkingDraft(next));
    } catch (cause) {
      fail(cause);
    }
  };
  fill();
}
