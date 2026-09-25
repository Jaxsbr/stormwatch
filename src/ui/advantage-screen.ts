import { ENEMIES } from "../content/catalog";
import type { CardId, EnemyKind, LevelDef } from "../sim/types";

const advantages: Record<
  CardId,
  { value: string; label: string; accessible: string; crop: [number, number] }
> = {
  reach: {
    value: "+18%",
    label: "more range",
    accessible: "All defenses shoot 18% farther",
    crop: [0, 565],
  },
  supply: {
    value: "+45",
    label: "starting gold",
    accessible: "Start with 45 extra gold",
    crop: [565, 550],
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
  raider: "Raises shield · half damage",
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
) {
  return `<main class="advantage-screen" aria-labelledby="encounter-title">
    <h1 id="encounter-title">${level.name}</h1>
    <section class="encounter-roster" aria-labelledby="roster-title">
      <h2 id="roster-title">On the trail</h2>
      <ul>${encounterEnemies(level)
        .map(
          (kind) => `<li>
        <img src="${import.meta.env.BASE_URL}art/v2/${enemyArt[kind]}-rig-v1/body.webp" alt="" draggable="false">
        <div><strong>${ENEMIES[kind].name}</strong><span>${enemyTraits[kind]}</span></div>
      </li>`,
        )
        .join("")}</ul>
    </section>
    <section class="advantage-choice" aria-labelledby="advantage-title">
      <h2 id="advantage-title">Choose one advantage</h2>
      <div class="advantage-options" role="group" aria-labelledby="advantage-title">
        ${cards
          .map((id) => {
            const {
              value,
              label,
              accessible,
              crop: [x, width],
            } = advantages[id];
            return `<button class="advantage-option" data-action="card:${id}" aria-pressed="${selected === id}" aria-label="${accessible}">
            <svg class="advantage-art" viewBox="${x} 0 ${width} 724" aria-hidden="true" focusable="false"><defs><clipPath id="advantage-clip-${id}"><rect x="${x}" y="0" width="${width}" height="724"/></clipPath></defs><image clip-path="url(#advantage-clip-${id})" href="${import.meta.env.BASE_URL}art/v2/advantage-icons-v1/atlas.webp" width="2172" height="724"/></svg>
            <span class="advantage-effect"><strong>${value}</strong><span>${label}</span></span>
          </button>`;
          })
          .join("")}
      </div>
    </section>
    <nav class="advantage-actions" aria-label="Encounter navigation">
      <button class="game-art-button" data-action="map">Back</button>
      <button class="game-art-button game-art-button--primary" data-action="begin">Play</button>
    </nav>
  </main>`;
}
