import { describe, expect, it, vi } from "vitest";
import { BattleArt, battleArtDemand } from "../src/render/battle-art";
import { lanternPass } from "../src/content/lantern-pass";
import type { CutoutResource } from "../src/render/cutout";
import type { EnemyKind, LevelDef } from "../src/sim/types";

function encounter(
  enemy: EnemyKind,
  defenders: LevelDef["availableTowers"] = ["bolt"],
) {
  return {
    ...lanternPass,
    availableTowers: defenders,
    waves: [
      { title: "Test", reward: 0, groups: [{ kind: enemy, count: 1, gap: 1 }] },
    ],
  };
}

describe("BattleArt", () => {
  it("loads only the encounter roster, with usable views first", async () => {
    const ids: string[] = [];
    const level = encounter("raider");
    const art = new BattleArt(level, (id) => {
      ids.push(id);
      return {
        ready: Promise.resolve(),
        definition: { id },
        dispose: vi.fn(),
      } as unknown as CutoutResource;
    });
    await art.ready;
    expect(battleArtDemand(level).enemies).toEqual(["raider"]);
    expect(ids).toEqual([
      "squirrel-side-defender-v1",
      "rat-rig-v3",
      "rat-front-rig-v3",
      "rat-rear-rig-v3",
    ]);
    expect(art.defender("bolt").definition?.id).toBe(ids[0]);
    expect(art.enemy("raider", "front").definition?.id).toBe(ids[2]);
    expect(() => art.enemy("runner", "side")).toThrow("absent from encounter");
    art.dispose();
  });

  it("owns boss expressions and disposes every selected resource once", async () => {
    const resources: Array<{ dispose: ReturnType<typeof vi.fn> }> = [];
    const art = new BattleArt(encounter("boss", ["net"]), (id) => {
      const resource = {
        ready: Promise.resolve(),
        definition: { id },
        dispose: vi.fn(),
      };
      resources.push(resource);
      return resource as unknown as CutoutResource;
    });
    await art.ready;
    expect(resources).toHaveLength(8);
    expect(art.enemy("boss", "side", 2).definition?.id).toBe(
      "badger-side-raging-v1",
    );
    expect(art.enemy("boss", "rear", 2).definition?.id).toBe(
      "badger-rear-rig-v1",
    );
    art.dispose();
    art.dispose();
    expect(
      resources.every((resource) => resource.dispose.mock.calls.length === 1),
    ).toBe(true);
  });

  it("surfaces load failure through readiness", async () => {
    const art = new BattleArt(
      encounter("raider"),
      (id) =>
        ({
          ready:
            id === "rat-rig-v3"
              ? Promise.reject(new Error("missing image"))
              : Promise.resolve(),
          dispose: vi.fn(),
        }) as unknown as CutoutResource,
    );
    await expect(art.ready).rejects.toThrow(
      "Battle art rat-rig-v3 failed: Error: missing image",
    );
    art.dispose();
  });

  it("does not report a retired attempt as ready", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const art = new BattleArt(
      encounter("raider"),
      () =>
        ({
          ready: pending,
          dispose: vi.fn(),
        }) as unknown as CutoutResource,
    );
    art.dispose();
    finish();
    await expect(art.ready).rejects.toThrow("disposed while loading");
  });
});
