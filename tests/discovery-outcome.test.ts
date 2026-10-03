import { expect, it } from "vitest";
import { LEVELS } from "../src/content/levels";
import { levelForAttempt } from "../src/content/progression";
import {
  freshSave,
  parseSave,
  recordVictoryOutcome,
} from "../src/persistence/save";
import { createProfile, loadProfiles } from "../src/persistence/profiles";
import { resultCard } from "../src/ui/game-chrome";

const result = {
  phase: "won" as const,
  stars: 2,
  goldEarned: 100,
  kills: 1,
  killsByKind: { raider: 1, runner: 0, armored: 0, boss: 0 },
};

it("grants a discovery once and shows exactly what the saved profile owns", () => {
  const alice = createProfile("alice", "Alice", "fox");
  const bob = createProfile("bob", "Bob", "rabbit");
  const lantern = recordVictoryOutcome(alice.progress, "lantern-pass", 2);
  expect(lantern.rewards).toEqual([{ kind: "tower-upgrade", tower: "bolt" }]);
  expect(resultCard(result, lantern.rewards)).toContain("Tower Upgrade");
  alice.progress = lantern.save;
  const first = recordVictoryOutcome(alice.progress, "rainstone-crossing", 2);
  alice.progress = first.save;
  expect(first.rewards).toEqual([{ kind: "tower-unlock", tower: "net" }]);
  expect(first.save.unlocked).toContain("turtle");
  expect(resultCard(result, first.rewards)).toContain("New Defender");

  const repeated = recordVictoryOutcome(
    alice.progress,
    "rainstone-crossing",
    3,
  );
  alice.progress = repeated.save;
  expect(repeated.rewards).toEqual([]);
  expect(resultCard(result, repeated.rewards)).not.toContain("New Defender");
  expect(repeated.save.unlocked.filter((id) => id === "turtle")).toHaveLength(
    1,
  );

  const profiles = loadProfiles(
    JSON.stringify({ version: 2, active: "alice", users: [alice, bob] }),
    null,
  );
  expect(profiles.users[0].progress.unlocked).toContain("turtle");
  expect(profiles.users[1].progress).toEqual(freshSave());
  expect(
    levelForAttempt(LEVELS[0], profiles.users[0].progress).availableTowers,
  ).toEqual(["bolt", "net"]);
  expect(
    levelForAttempt(LEVELS[0], profiles.users[1].progress).availableTowers,
  ).toEqual(["bolt"]);
});

it("derives promised legacy rewards without showing them as newly earned", () => {
  const oldSave = parseSave(
    JSON.stringify({
      version: 2,
      stars: { "lantern-pass": 2, "rainstone-crossing": 1 },
      unlocked: [],
    }),
  );
  expect(oldSave.unlocked).toEqual(["squirrel-upgrade", "turtle"]);
  const replay = recordVictoryOutcome(oldSave, "rainstone-crossing", 2);
  expect(replay.rewards).toEqual([]);
  expect(replay.save.unlocked).toEqual(["squirrel-upgrade", "turtle"]);
  expect(levelForAttempt(LEVELS[0], replay.save).availableTowers).toEqual([
    "bolt",
    "net",
  ]);
});

it("shows both first-board rewards only when both are newly granted", () => {
  const prepared = recordVictoryOutcome(
    recordVictoryOutcome(freshSave(), "lantern-pass", 1).save,
    "rainstone-crossing",
    1,
  ).save;
  const first = recordVictoryOutcome(prepared, "the-last-lantern", 1);
  expect(first.firstBoardComplete).toBe(true);
  expect(first.rewards).toEqual([
    { kind: "advantage-unlock", card: "reach" },
    { kind: "advantage-unlock", card: "nets" },
  ]);
  expect(first.rewards.map((reward) => reward.kind)).toHaveLength(2);
  const repeated = recordVictoryOutcome(first.save, "the-last-lantern", 2);
  expect(repeated.firstBoardComplete).toBe(false);
  expect(repeated.rewards).toEqual([]);
});
