import { expect, it } from "vitest";
import {
  CANONICAL_CONTENT,
  normalizeAbilities,
  resolveConfiguration,
  validateContent,
} from "../src/config/configuration";
import {
  createWorkingDraft,
  promoteWorkingWave,
  rebaseAfterPromotion,
  validateWorkingDraft,
} from "../src/workbench/working-draft";
import { Game } from "../src/sim/game";
import { ratShieldState } from "../src/sim/rat-shield";
import { weaselEvasionState } from "../src/sim/weasel-evasion";

const content = () => normalizeAbilities(structuredClone(CANONICAL_CONTENT));
it("uses the same shared timing across every enabled wave, ignoring legacy group variations", () => {
  const c = content();
  c.abilityDefaults = {
    ratShield: { upSeconds: 3, downSeconds: 5 },
    weaselEvade: { upSeconds: 2, downSeconds: 3 },
  };
  for (const level of c.levels)
    for (const wave of level.waves) {
      wave.abilities = { ratShield: true, weaselEvade: true };
      for (const packet of wave.packets)
        for (const group of packet.groups) {
          if (group.kind === "raider")
            group.shieldCycle = { upSeconds: 9, downSeconds: 1 };
        }
    }
  for (const level of c.levels)
    for (const wave of resolveConfiguration(c, level.id).level.waves)
      for (const group of wave.groups) {
        if (group.kind === "raider")
          expect(group.shieldCycle).toEqual(c.abilityDefaults.ratShield);
        if (group.kind === "runner")
          expect(group.evasionCycle).toEqual(c.abilityDefaults.weaselEvade);
      }
});
it("turns off shield mechanics and presentation and evade for every group and repeat in a wave", () => {
  const c = content();
  c.levels[0].waves[0].abilities = { ratShield: false, weaselEvade: false };
  c.levels[0].waves[0].packets = [
    {
      id: "pairs",
      repeat: 2,
      groups: [
        { id: "rat", kind: "raider", count: 1, gap: 0.1 },
        { id: "weasel", kind: "runner", count: 1, gap: 0.1 },
      ],
    },
  ];
  const snapshot = resolveConfiguration(c, c.levels[0].id);
  const game = new Game(snapshot.level, "none", false, 42, {
    configuration: snapshot,
  });
  game.startWave();
  for (let i = 0; i < 300; i++) {
    game.tick(1 / 30);
    for (const enemy of game.state.enemies) {
      expect(enemy.shieldRaised).toBe(false);
      if (enemy.kind === "raider")
        expect(
          ratShieldState(
            game.state.clock - enemy.spawnedAt,
            enemy.shieldCycle,
            enemy.shieldEnabled,
          ).raised,
        ).toBe(false);
      if (enemy.kind === "runner")
        expect(
          weaselEvasionState(
            game.state.clock - enemy.spawnedAt,
            enemy.evasionCycle,
          ).active,
        ).toBe(false);
    }
  }
  expect(game.state.enemies).toHaveLength(4);
});
it("migrates saved drafts without losing arrivals or disabled introductory evade", () => {
  const legacy = content();
  delete legacy.abilityDefaults;
  const wave = legacy.levels[0].waves[0];
  delete wave.abilities;
  wave.packets[0].groups[0].shieldCycle = { upSeconds: 6, downSeconds: 4 };
  const draft = validateWorkingDraft({
    schemaVersion: 1,
    base: legacy,
    content: legacy,
    levelId: legacy.levels[0].id,
    waveId: wave.id,
  });
  expect(draft.content.levels[0].waves[0].abilities).toEqual({
    ratShield: true,
    weaselEvade: false,
  });
  expect(
    draft.content.levels[0].waves[0].packets[0].groups[0].shieldCycle,
  ).toBeUndefined();
  expect(draft.content.levels[0].waves[0].packets[0].groups[0].count).toBe(
    wave.packets[0].groups[0].count,
  );
});
it("promotes global timing with wave switches, preserves unrelated waves, and rejects concurrent shared edits", () => {
  const c = content();
  const draft = createWorkingDraft(c);
  draft.content.abilityDefaults!.ratShield.upSeconds = 4;
  draft.content.levels[0].waves[0].abilities!.ratShield = false;
  const promoted = promoteWorkingWave(c, draft);
  expect(promoted.abilityDefaults!.ratShield.upSeconds).toBe(4);
  expect(promoted.levels[0].waves[0].abilities!.ratShield).toBe(false);
  expect(promoted.levels[0].waves[1]).toEqual(c.levels[0].waves[1]);
  c.abilityDefaults!.ratShield.upSeconds = 5;
  expect(() => promoteWorkingWave(c, draft)).toThrow(
    "Shared ability settings changed",
  );
  const rebased = rebaseAfterPromotion(draft, c);
  expect(() => promoteWorkingWave(c, rebased)).toThrow(
    "Shared ability settings changed",
  );
});
it("adopts external defaults when the draft has no shared edits, and validates timing and switches", () => {
  const c = content(),
    draft = createWorkingDraft(c);
  c.abilityDefaults!.weaselEvade.upSeconds = 4;
  expect(promoteWorkingWave(c, draft).abilityDefaults).toEqual(
    c.abilityDefaults,
  );
  c.abilityDefaults!.ratShield.upSeconds = 0;
  expect(() => validateContent(c)).toThrow();
});

it("migrates, promotes and reloads boss rage speed settings through the shared ability scope", () => {
  const c = content();
  delete c.abilityDefaults!.bossRage;
  const draft = createWorkingDraft(c);
  expect(draft.content.abilityDefaults!.bossRage).toEqual({
    angrySpeedScale: 1.35,
    ragingSpeedScale: 1.8,
  });
  draft.content.abilityDefaults!.bossRage = {
    angrySpeedScale: 1.5,
    ragingSpeedScale: 2,
  };
  const promoted = promoteWorkingWave(c, draft);
  const snapshot = resolveConfiguration(
    JSON.parse(JSON.stringify(promoted)),
    promoted.levels[2].id,
  );
  const game = new Game(snapshot.level, "none", false, 42, {
    configuration: snapshot,
  });
  expect(game.bossRage).toEqual({ angrySpeedScale: 1.5, ragingSpeedScale: 2 });
  expect(promoted.levels).toEqual(c.levels);
  promoted.abilityDefaults!.bossRage!.ragingSpeedScale = 1.1;
  expect(() => validateContent(promoted)).toThrow();
});
