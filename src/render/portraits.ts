import type { TowerKind } from "../sim/types";
import { artPath, defenderVisuals } from "../content/encounter-visuals";
export const towerPortrait = (kind: TowerKind) =>
  `<span class="portrait rig-portrait" data-tower-portrait="${kind}" aria-hidden="true"></span>`;
export async function paintTowerPortraits(root: ParentNode = document) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-tower-portrait]",
  )) {
    if (element.dataset.painted) continue;
    const kind = element.dataset.towerPortrait as TowerKind;
    const img = document.createElement("img");
    img.src = `${import.meta.env.BASE_URL}${artPath(defenderVisuals[kind].portrait)}`;
    img.alt = "";
    img.draggable = false;
    img.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;object-fit:contain";
    element.append(img);
    element.dataset.painted = "true";
  }
}
