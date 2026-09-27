import { describe, expect, it } from "vitest";
import { CANONICAL_CONTENT } from "../src/config/configuration";
import {
  createWorkingDraft,
  createMap,
  createWave,
  setMapLayout,
  promoteWorkingWave,
  rebaseAfterPromotion,
  validateWorkingDraft,
} from "../src/workbench/working-draft";
const baseline = () => structuredClone(CANONICAL_CONTENT);
const draft = () => createWorkingDraft(baseline());
const fill = (working: ReturnType<typeof draft>) => {
  const wave = working.content.levels
    .find((l) => l.id === working.levelId)!
    .waves.find((w) => w.id === working.waveId)!;
  wave.packets = [
    { id: "first", groups: [{ id: "rats", kind: "raider", count: 3, gap: 1 }] },
  ];
  return working;
};
describe("single working draft", () => {
  it("migrates legacy content into an independent working copy", () => {
    const old = baseline();
    old.levels[0].waves[0].packets[0].groups[0].count = 7;
    const working = createWorkingDraft(baseline(), old);
    expect(working.content.levels[0].waves[0].packets[0].groups[0].count).toBe(
      7,
    );
    old.levels[0].name = "Changed";
    expect(working.content.levels[0].name).not.toBe("Changed");
    expect(working.base).toEqual(CANONICAL_CONTENT);
  });
  it("persists blank new maps and waves but refuses their promotion", () => {
    const working = createMap(
      draft(),
      "  Woodland  ",
      CANONICAL_CONTENT.levels[2].id,
      "woodland",
      "first",
    );
    const saved = validateWorkingDraft(JSON.parse(JSON.stringify(working)));
    expect(saved.content.levels.at(-1)).toMatchObject({
      name: "Woodland",
      requiresBossDefeat: false,
      waves: [{ id: "first", packets: [] }],
    });
    expect(() => promoteWorkingWave(baseline(), saved)).toThrow("Add enemies");
    const second = createWave(saved, "Second", "second");
    expect(second.waveId).toBe("second");
    expect(second.content.levels.at(-1)!.waves).toHaveLength(2);
    const promoted = promoteWorkingWave(baseline(), fill(second));
    expect(promoted.levels.at(-1)!.waves.map((w) => w.id)).toEqual(["second"]);
  });
  it("validates blank wave metadata and rejects invalid identities and collisions", () => {
    expect(() =>
      createMap(draft(), "", CANONICAL_CONTENT.levels[0].id, "new", "first"),
    ).toThrow("Map name");
    expect(() => createWave(draft(), "New", "space id")).toThrow("identity");
    expect(() =>
      createWave(draft(), "New", CANONICAL_CONTENT.levels[0].waves[0].id),
    ).toThrow("already exists");
    const working = createWave(draft(), "New", "new");
    working.content.levels[0].waves.at(-1)!.reward = -1;
    expect(() => validateWorkingDraft(working)).toThrow("reward");
    const existing = draft();
    existing.content.levels[0].waves[0].packets = [];
    expect(() => validateWorkingDraft(existing)).toThrow("existing wave");
  });
  it("changes layout only, retaining authored settings and waves", () => {
    const working = draft();
    working.content.levels[0].startCoins = 200;
    const changed = setMapLayout(working, CANONICAL_CONTENT.levels[1].id);
    expect(changed.content.levels[0].path).toEqual(
      CANONICAL_CONTENT.levels[1].path,
    );
    expect(changed.content.levels[0].waves).toEqual(
      working.content.levels[0].waves,
    );
    expect(changed.content.levels[0].startCoins).toBe(200);
  });
  it("promotes selected map metadata and wave while preserving unrelated disk scopes", () => {
    const working = draft();
    working.content.levels[0].startCoins += 1;
    working.content.levels[0].waves[0].reward += 1;
    working.content.levels[0].waves[1].reward += 2;
    working.content.levels[1].name = "Pending";
    working.content.enemies.raider.hp += 1;
    const disk = baseline();
    disk.levels[0].waves[2].reward += 3;
    disk.rules.initialSpawnDelay += 1;
    const result = promoteWorkingWave(disk, working);
    expect(result.levels[0].startCoins).toBe(
      working.content.levels[0].startCoins,
    );
    expect(result.levels[0].waves[0]).toEqual(
      working.content.levels[0].waves[0],
    );
    expect(result.levels[0].waves.slice(1)).toEqual(
      disk.levels[0].waves.slice(1),
    );
    expect(result.levels[1]).toEqual(disk.levels[1]);
    expect(result.enemies).toEqual(disk.enemies);
    expect(result.rules).toEqual(disk.rules);
  });
  it("refuses selected wave, map, and new identity drift without mutation", () => {
    for (const modify of [
      (disk: ReturnType<typeof baseline>) => disk.levels[0].startCoins++,
      (disk: ReturnType<typeof baseline>) => disk.levels[0].waves[0].reward++,
    ]) {
      const disk = baseline();
      modify(disk);
      const before = structuredClone(disk);
      expect(() => promoteWorkingWave(disk, draft())).toThrow(
        "changed in game config",
      );
      expect(disk).toEqual(before);
    }
    const working = fill(createWave(draft(), "New", "new"));
    const disk = baseline();
    disk.levels[0].waves.push(
      structuredClone(working.content.levels[0].waves.at(-1)!),
    );
    expect(() => promoteWorkingWave(disk, working)).toThrow(
      "changed in game config",
    );
  });
  it("rebase keeps pending wave and catalog edits and fresh unrelated disk changes", () => {
    const working = draft();
    working.content.levels[0].waves[0].reward++;
    working.content.levels[0].waves[1].reward += 2;
    working.content.enemies.raider.hp++;
    const disk = baseline();
    disk.levels[1].name = "External update";
    const promoted = promoteWorkingWave(disk, working);
    const rebased = rebaseAfterPromotion(working, promoted);
    expect(rebased.base).toEqual(promoted);
    expect(rebased.content.levels[1].name).toBe("External update");
    expect(rebased.content.levels[0].waves[1]).toEqual(
      working.content.levels[0].waves[1],
    );
    expect(rebased.content.enemies.raider).toEqual(
      working.content.enemies.raider,
    );
    expect(promoteWorkingWave(promoted, rebased)).toEqual(promoted);
  });
  it("does not promote removing the required boss from a boss map", () => {
    const working = draft();
    const bossMap = working.content.levels.find((l) => l.requiresBossDefeat)!;
    const bossWave = bossMap.waves.find((w) =>
      w.packets.some((p) => p.groups.some((g) => g.kind === "boss")),
    )!;
    working.levelId = bossMap.id;
    working.waveId = bossWave.id;
    for (const packet of bossWave.packets)
      for (const group of packet.groups)
        if (group.kind === "boss") group.kind = "raider";
    expect(() => promoteWorkingWave(baseline(), working)).toThrow(
      "requires a boss",
    );
  });
});
