import { escapeHtml } from "./html";
import { ENEMIES, TOWERS } from "../content/catalog";
import type { CardId, EnemyKind, LevelDef } from "../sim/types";

const advantages: Record<
  Exclude<CardId, "none">,
  { value: string; label: string; accessible: string; crop: [number, number] }
> = {
  reach: {
    value: "+18%",
    label: "more range",
    accessible: "All defenses shoot 18% farther",
    crop: [0, 565],
  },
  nets: {
    value: "+50%",
    label: "longer slows",
    accessible: "Turtle trapper slows last 50% longer",
    crop: [1115, 515],
  },
  thrift: {
    value: "−20%",
    label: "upgrade cost",
    accessible: "All defense upgrades cost 20% less",
    crop: [1630, 542],
  },
};

const enemyTraits: Record<EnemyKind, string> = {
  raider: "Periodic shield · half damage",
  runner: "Runs fast",
  armored: "Blocks damage",
  boss: "Boss · tough & armored",
};
const enemyArt: Record<EnemyKind, string> = {
  raider: "rat",
  runner: "weasel",
  armored: "boar",
  boss: "badger",
};

/** First encounter order, excluding unused/empty wave groups. */
export function encounterEnemies(level: LevelDef): EnemyKind[] {
  return [
    ...new Set(
      level.waves.flatMap((wave) =>
        wave.groups
          .filter((group) => group.count > 0)
          .map((group) => group.kind),
      ),
    ),
  ];
}

export function advantageScreen(
  level: LevelDef,
  cards: CardId[],
  selected: CardId,
  assistAvailable = false,
) {
  const defenders = (level.availableTowers ?? ["bolt", "stone", "net"])
    .map((kind) => TOWERS[kind].name)
    .join(", ");
  const firstWatch =
    level.id === "lantern-pass" && !level.availableTowers?.includes("net");
  return `<main class="advantage-screen" aria-labelledby="encounter-title">
    <header class="encounter-heading"><h1 id="encounter-title">${escapeHtml(level.name)}</h1></header>
    <div class="briefing-content">
    <section class="encounter-roster" aria-labelledby="roster-title">
      <h2 id="roster-title">On the trail</h2>
      <ul>${encounterEnemies(level)
        .map(
          (kind) => `<li>
        <img src="${import.meta.env.BASE_URL}art/v2/${enemyArt[kind]}-rig-v1/body.webp" alt="" draggable="false">
        <div><strong>${ENEMIES[kind].name}</strong><span>${kind === "raider" && !level.waves.some((w) => w.groups.some((g) => g.kind === "raider" && g.shieldEnabled !== false)) ? "Shield off" : kind === "runner" && level.waves.some((w) => w.groups.some((g) => g.kind === "runner" && g.evasionCycle)) ? "Runs fast · periodic evade" : enemyTraits[kind]}</span></div>
      </li>`,
        )
        .join("")}</ul>
    </section>
    ${
      cards.length
        ? `<section class="advantage-choice" aria-labelledby="advantage-title">
      <h2 id="advantage-title">${cards.length === 1 ? "Equipped advantage" : "Choose one advantage"}</h2>
      ${cards.length === 1 ? "<p>Your earned aid is ready for this encounter. Choose No advantage to leave it behind.</p>" : ""}
      <div class="advantage-options" role="group" aria-labelledby="advantage-title">
        <button class="advantage-option no-advantage" data-action="card:none" aria-pressed="${selected === "none"}"><strong>No advantage</strong><span>Play with your usual defenders</span></button>
        ${cards
          .map((id) => {
            const {
              value,
              label,
              accessible,
              crop: [x, width],
            } = advantages[id as Exclude<CardId, "none">];
            return `<button class="advantage-option" data-action="card:${id}" aria-pressed="${selected === id}" aria-label="${accessible}">
            <svg class="advantage-art" viewBox="${x} 0 ${width} 724" aria-hidden="true" focusable="false"><defs><clipPath id="advantage-clip-${id}"><rect x="${x}" y="0" width="${width}" height="724"/></clipPath></defs><image clip-path="url(#advantage-clip-${id})" href="${import.meta.env.BASE_URL}art/v2/advantage-icons-v1/atlas.webp" width="2172" height="724"/></svg>
            <span class="advantage-effect"><strong>${value}</strong><span>${label}</span></span>
          </button>`;
          })
          .join("")}
      </div>
    </section>`
        : `<section class="first-watch-brief"><strong>${firstWatch ? "First watch" : "Ready for the crossing"}</strong><p>${firstWatch ? "Begin with the Squirrel archer. More defenders and advantages are discovered as the expedition continues." : `Available defenders: ${defenders}. Watch the threats above and choose where to build.`}</p></section>`
    }
    </div>
    <nav class="advantage-actions" aria-label="Encounter navigation">
      <button class="game-art-button" data-action="map">Back</button>
      <button class="game-art-button game-art-button--primary" data-action="begin">Play</button>
      ${assistAvailable ? '<button class="game-art-button" data-action="assist">Easier retry</button>' : ""}
    </nav>
  </main>`;
}
