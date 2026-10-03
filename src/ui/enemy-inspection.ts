import type { EnemyDef, EnemyKind, LevelDef } from "../sim/types";
import { escapeHtml } from "./html";

/** Inspection describes the attempt's immutable enemy capabilities. */
export function enemyInspection(
  level: LevelDef,
  enemies: Record<EnemyKind, EnemyDef>,
) {
  const kinds = [
    ...new Set(
      level.waves.flatMap((w) =>
        w.groups.filter((g) => g.count > 0).map((g) => g.kind),
      ),
    ),
  ];
  return kinds
    .map((kind) => {
      const def = enemies[kind];
      const explanation =
        kind === "armored" && def.poisonImmune
          ? "Tough skin: permanently immune to poison. Armor reduces direct and blast damage. Skunk blasts still damage it; Turtle nets slow it normally. Invest in Squirrel damage and upgrades."
          : kind === "raider"
            ? "Shields reduce blast and direct damage while raised. Poison passes the shield."
            : kind === "runner"
              ? "Evade at bomb impact avoids blast and poison application. Once poison attaches, its ticks cannot be evaded."
              : kind === "boss"
                ? "Damage triggers independent rage. A rally speeds nearby escorts on the same route. Every Roadwarden must be defeated; one escaping ends the attempt."
                : "Armor reduces direct and blast damage. Turtle nets slow it.";
      return `<article class="enemy-inspection"><h3>${escapeHtml(def.name)}</h3><p>${escapeHtml(explanation)}</p></article>`;
    })
    .join("");
}
