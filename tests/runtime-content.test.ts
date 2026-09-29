import { afterEach, expect, it, vi } from "vitest";

afterEach(() => vi.resetModules());
it("loads promoted waves, catalogs, rules and new map save IDs before game imports", async () => {
  vi.resetModules();
  const { CANONICAL_CONTENT } = await import("../src/config/configuration");
  const content = structuredClone(CANONICAL_CONTENT);
  const first = content.levels[0].waves[0];
  first.packets = [
    {
      id: "runtime",
      repeat: 4,
      groups: [
        { id: "rats", kind: "raider", count: 5, gap: 1.75, delayBefore: 5 },
      ],
    },
  ];
  content.levels.push({
    ...structuredClone(content.levels[0]),
    id: "runtime-map",
    name: "Runtime map",
  });
  content.enemies.raider.hp = 71;
  content.towers.bolt.cost = 43;
  content.rules.normalLives = 16;
  content.abilityDefaults!.bossRage = {
    angrySpeedScale: 1.4,
    ragingSpeedScale: 1.9,
  };
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(content)));
  const { loadRuntimeContent } = await import("../src/config/runtime-content");
  await loadRuntimeContent("./game-content.json", request);
  expect(request).toHaveBeenCalledWith("./game-content.json", {
    cache: "no-store",
  });
  const { LEVELS } = await import("../src/content/levels");
  const { Game } = await import("../src/sim/game");
  const { ENEMIES, TOWERS } = await import("../src/content/catalog");
  const { parseSave } = await import("../src/persistence/save");
  const { compileSpawnSchedule } = await import("../src/sim/spawn-schedule");
  const schedule = compileSpawnSchedule(LEVELS[0].waves[0]);
  expect(schedule).toHaveLength(20);
  expect(schedule.filter((_, i) => i % 5 === 0).map((s) => s.at)).toEqual([
    5.7, 19.45, 33.2, 46.95,
  ]);
  expect(new Game(LEVELS[0]).bossRage).toEqual({
    angrySpeedScale: 1.4,
    ragingSpeedScale: 1.9,
  });
  expect(ENEMIES.raider.hp).toBe(71);
  expect(TOWERS.bolt.cost).toBe(43);
  expect(new Game(LEVELS[0], "none", false, 42).state.lives).toBe(16);
  expect(
    parseSave(JSON.stringify({ version: 2, stars: { "runtime-map": 2 } }))
      .stars["runtime-map"],
  ).toBe(2);
});
it("rejects unavailable or invalid content instead of silently playing a bundled old wave", async () => {
  const { loadRuntimeContent } = await import("../src/config/runtime-content");
  await expect(
    loadRuntimeContent(
      "./game-content.json",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("", { status: 503 })),
    ),
  ).rejects.toThrow();
  await expect(
    loadRuntimeContent(
      "./game-content.json",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("{}")),
    ),
  ).rejects.toThrow();
});
