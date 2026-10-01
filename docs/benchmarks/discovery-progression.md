# Discovery progression comparison

## Scenario and environment

Compare the Rainstone Turtle discovery on the repository's pre-change
`main` commit `377ae75` and this change. Follow a Lantern victory with a
first Rainstone victory, repeat Rainstone, reload a legacy save, load two
profiles, and replay Lantern Pass. The benchmark is a deterministic state and
render check on macOS with Node and Vitest. It does not measure browser
performance or physical mobile behavior.

## Baseline

The source at `377ae75` had three encounter-ID result reward branches in
`src/main.ts`, three in the save victory writer, and two in old-save
derivation: **eight reward branches outside progression**. Replay roster
resolution also had one Turtle-specific condition. The result and save paths
computed rewards independently. The existing test suite checked many
individual outcomes, but did not verify the result card against the same
victory outcome that was persisted.

Reproduce the static baseline with:

```sh
git show 377ae75:src/main.ts | rg 'game.level.id ==='
git show 377ae75:src/persistence/save.ts | rg 'levelId ===|stars\["'
git show 377ae75:src/content/progression.ts | rg 'turtle'
```

## After

There are **zero encounter-ID reward branches outside progression** and zero
Turtle-specific replay conditions. Four approved discovery definitions in
`src/content/progression.ts` supply the entitlement and result meaning. A
single victory outcome supplies both the saved state and result cards. The
first-board completion condition remains there as a separate campaign outcome.

`tests/discovery-outcome.test.ts` is the stable CI regression check. Its
three scenarios assert:

| Path | Expected observable result |
| --- | --- |
| First Rainstone victory | One Turtle card and one saved Turtle entitlement |
| Repeat victory | No new card or duplicate entitlement |
| Legacy save reload | Squirrel and Turtle rights restored, no new card on replay |
| Second player | Fresh progress and first-attempt roster stay separate |
| Earlier Lantern replay | Earned Turtle joins the roster after Lantern completion |
| First-board victory | Two saved advantage entitlements and two cards only once |

The exact branch count is the primary measurement: **8 → 0** outside the
progression module, with the replay special case **1 → 0**. Median and p95 are
not applicable to these discrete counts; no latency improvement is claimed.
The practical limit is that this verifies the currently approved discoveries.
A future approved discovery should repeat the same player-flow test before
claiming that its presentation and persistence agree.
