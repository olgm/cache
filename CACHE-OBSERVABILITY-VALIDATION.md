# Cache spawn-observability — validation & operator deploy guide

**Bug #4, Tier 2 (gap a): capture silent spawn failures.** This branch adds
read-only observability to the LIVE bot so the Overseer can diagnose *why* a
spawn thesis failed instead of guessing. It is **NOT deployed** — uploading Cache
to the live colony is the highest-risk action in the system (there is a
documented live-colony collapse from a brittle cache change), so this deploy is an
explicit, watched, operator-approved decision. This doc is what you approve.

Filed / branched: 2026-07-06. Author: autonomous agent (bug #4 close-out).

---

## 1. What changed (design)

Every `spawnCreep` call site used to discard its return code (`… === OK`, or the
expansion path ignored it entirely). So a room that **tried and FAILED to spawn**
— the "second room won't spawn" thesis — left **no signal anywhere**. This fixes
that, additively.

### cache repo — branch `cache-spawn-observability` (base `09a3ade`)
- **`src/kernel/spawning.ts`** — new `recordSpawnResult(room, role, code)`: a
  bounded, newest-wins ring buffer. `OK` is ignored; a **non-OK** code
  (`ERR_RCL_NOT_ENOUGH`, `ERR_GCL_NOT_ENOUGH`, `ERR_BUSY`, `ERR_NAME_EXISTS`, …)
  is appended to `Memory.spawnErrors` (cap `SPAWN_ERROR_CAP = 10`). Wired into all
  **4 live spawn sites**: the inline expansion spawn (scout/claimer/pioneer — the
  critical expansion-failure path), the emergency harvester, the bootstrapping
  pioneer, and the economy `trySpawnRole`. The **dead** `spawnRequest()` helper is
  intentionally left untouched (it has no callers since the expansion spawn was
  inlined — see §6).
- **`src/stats.ts`** — `writeStats()` folds a **snapshot** of `Memory.spawnErrors`
  into `Memory.stats.spawnErrors`, plus a compact expansion summary
  `{ state, targetRoom, ownedRooms }` from `Memory.expansion`. Both are additive,
  omitted when empty.
- **`src/types.ts`** — `SpawnErrorEntry`, `SPAWN_ERROR_CAP`, `Memory.spawnErrors`,
  and the two new optional `CacheStats` leaves.

**Why a separate `Memory.spawnErrors`, not `Memory.stats.spawnErrors` directly?**
Cache does `Memory.stats = { … }` every tick (reassignment), which silently
discards anything written onto the old object (the documented 2026-06-14 landmine,
`agent.md` §5). So the ring buffer persists in a stable top-level slot and the
stats writer folds a **copy** of it into the per-tick blob.

**Why it can't brick the bot.** `recordSpawnResult` only touches `Memory` and runs
inside `runSpawnManager`'s per-room `try/catch`; the fold runs inside `writeStats`,
which its caller wraps in `try/catch`. Purely additive; a spawn-aware reader gains
signal, an unknown-field reader is unaffected.

### sparse repo — branch `cache-spawn-observability` (base `8f3bd58`, the Tier-1 deploy)
The **read side** (also *not* deployed; ship it with the cache change so the field
shape has one source of truth):
- **`src/screeps/types.ts`** — `ScreepsStats.spawnErrors?` + `ScreepsStats.expansion?`
  (optional/back-compat), and a `SpawnSample` type.
- **`src/screeps/client.ts`** — `parseStats` maps both, shallow-validated so a
  malformed leaf can never throw the whole parse; absent → `undefined`.
- **`Documentations/signatures.md`** — the pinned `ScreepsStats` contract updated.

> Note: even *without* the sparse read-side, the deployed Overseer (Tier 1) can
> already reach these leaves via `get_game_state what="memory" path="stats"` /
> `path="spawnErrors"` — `getMemoryPath` returns the raw subtree. The read-side is
> a convenience that surfaces them in the projected `ScreepsStats` the briefing prints.

---

## 2. What is tested / validated

- **cache `npm test`** — **+10** new tests in `test/spawn-errors.test.js`, all green:
  `OK` ignored; a non-OK code captured with `{room, role, code, tick}`; buffer
  initialised when absent; **newest-wins cap** at `SPAWN_ERROR_CAP`; `writeStats`
  folds a **well-formed** blob that **JSON round-trips**; the folded array is a
  **copy** (decoupled from the live buffer); expansion summary present/absent.
  Build green (`tsc`).
- **cache typecheck** — clean (`tsc --noEmit`).
- **sparse `npm test`** — **231 pass, 0 fail** (228 Tier-1 baseline + **3** read-side
  tests: maps spawnErrors+expansion; absent when unreported; malformed leaf coerced
  never throws). Typecheck clean.
- **Not run: a warm-slot trial.** The capture logic is proven deterministically by
  the unit tests (they *force* a non-OK return and assert capture). A live trial
  cannot easily *force* a spawn failure — a healthy run returns `OK` and records
  nothing — so it would mainly re-confirm "doesn't crash," which typecheck + green
  build + the additive/try-catch-wrapped design already cover. Per the task's
  explicit allowance, unit tests + this writeup stand in for the trial on a
  branch that is not being deployed. If you want a live smoke first, see §4b.

### Pre-existing, unrelated test failure (NOT from this change)
`test/build-order.test.js` → *"upgrader push is unrestricted once a controller
container supplies them"* fails on trunk **`09a3ade`** too (verified by stashing
this branch's changes and rebuilding trunk: 7 pass / 1 fail). It asserts
`roleTargets(...).upgrader >= 5` but gets `3` — a test-vs-code drift introduced by
the storage-emergency commits (`1c8716c` "cap upgraders at 3 … when storage is
missing at RCL 4+"). It lives in `config.ts` `roleTargets`, which this branch does
not touch. Left as-is (out of scope for observability; economy logic). Tracked
separately.

---

## 3. Rollback baselines (record before you deploy)

| Repo | Trunk before deploy | Notes |
| --- | --- | --- |
| cache | **`09a3ade`** | = `origin/main` = box `/opt/autoscreeps/cache` HEAD at filing. The live bot's last-known-good. |
| sparse | **`8f3bd58`** | Tier-1 (observability read levers) already deployed. Pre-Tier-1 baseline was `81c5c67`. |

---

## 4. Operator deploy procedure (approve, then execute — the watched step)

**Do this only when you are watching.** Loop must be **paused** (`sparse status` →
`loop idle`) throughout.

### 4a. Land the code (both repos)
```bash
# Review, then merge each branch to its main and push.
git -C cache  checkout main && git -C cache  merge --no-ff cache-spawn-observability && git -C cache  push origin main
git -C sparse checkout main && git -C sparse merge --no-ff cache-spawn-observability && git -C sparse push origin main

# On sea01: pull both. (Sparse read-side is inert until the cache upload below.)
ssh -i ~/.ssh/id_ed25519 root@170.39.227.131 '
  git -C /opt/autoscreeps/cache  pull --ff-only &&
  git -C /opt/autoscreeps/sparse pull --ff-only &&
  systemctl restart sparse.service        # picks up the read-side
'
```

### 4b. (Optional) warm-slot smoke BEFORE the live upload — no colony risk
Run the modified cache in a Stack trial on a warm slot and confirm it boots + writes
a well-formed blob (spawnErrors folds; expansion summary present; no crash over N
ticks). Use `run_experiment` / `abCompareN` pointed at `origin/cache-spawn-observability`
via the isolated-worktree `compileRef` path (see `sparse/src/agent/tools/experiment.ts`),
`scenario:'expansion-spawnless'`. This is `$0` on the local backend and does not
touch the colony.

### 4c. Upload dist to the live Screeps branch — THE risky step
```bash
# On sea01, with the loop paused and you watching. Build first (uploads read dist/):
ssh -i ~/.ssh/id_ed25519 root@170.39.227.131 '
  set -a; . /opt/autoscreeps/sparse/.env; set +a
  cd /opt/autoscreeps/sparse
  ./node_modules/.bin/tsx -e "
    import(\"./src/orchestrator/cache-deploy.ts\").then(async m => {
      await m.buildCache(\"/opt/autoscreeps/cache\");            // tsc -> dist/
      const mods = await m.readCacheModules(\"/opt/autoscreeps/cache\");
      const { uploadCode } = await import(\"./src/screeps/client.ts\");
      const r = await uploadCode(process.env.SCREEPS_BRANCH, mods);   // branch \"cache\"
      console.log(\"upload ok:\", r.ok);
    });
  "
'
```
(Equivalently, an Overseer cycle with `SPARSE_OVERSEER_ENABLED` will build + deploy
+ auto-watch — but the point here is a deliberate, watched manual upload.)

### 4d. WATCH (agent.md §7 seatbelt) — for ~10–15 min after upload
- `Memory.stats.tick` keeps **advancing** every poll (bot alive, not bricked).
- `getMemoryPath("stats")` shows `spawnErrors` populating **only on real failures**
  and an `expansion` summary; the blob stays well-formed.
- No new crash lines in the live console (`get_game_state what="console"`).
- Economy unharmed (bucket/rcl/income steady vs the pre-deploy sample).

### 4e. ROLLBACK if the bot bricks (tick frozen / crash loop)
```bash
# Force trunk back to the known-good and re-upload ITS dist (the ONE sanctioned
# force-push — recovering a bricked live bot; mirrors watchAndMaybeRollback / §7).
ssh -i ~/.ssh/id_ed25519 root@170.39.227.131 '
  set -a; . /opt/autoscreeps/sparse/.env; set +a
  git -C /opt/autoscreeps/cache reset --hard 09a3ade && git -C /opt/autoscreeps/cache push -f origin main
  cd /opt/autoscreeps/sparse && ./node_modules/.bin/tsx -e "
    import(\"./src/orchestrator/cache-deploy.ts\").then(async m => {
      await m.buildCache(\"/opt/autoscreeps/cache\");
      const mods = await m.readCacheModules(\"/opt/autoscreeps/cache\");
      const { uploadCode } = await import(\"./src/screeps/client.ts\");
      console.log(\"reverted upload ok:\", (await uploadCode(process.env.SCREEPS_BRANCH, mods)).ok);
    });"
'
# Sparse read-side is inert without the cache leaves; reverting sparse is optional
# (git reset --hard 81c5c67 + restart) but not required for colony safety.
```
Do **not** leave the loop running unattended right after this deploy — the
reversibility watch (`watchAndMaybeRollback`) only auto-reverts a *bricked* bot in
Overseer mode; a manual upload has no auto-watch.

---

## 5. Reachability recap (what's already live vs. what this deploy adds)

| Gap | Solved by | Status |
| --- | --- | --- |
| (b) `Memory.expansion` invisible | Tier 1 `getMemoryPath` | **DEPLOYED** (sparse `8f3bd58`) |
| (c) non-error console dropped | Tier 1 `readConsole` | **DEPLOYED** (sparse `8f3bd58`) |
| (a) silent spawn error codes | **this cache branch** | **BRANCHED, not deployed** |

After 4c, gap (a) is closed: `Memory.stats.spawnErrors` carries the real
`spawnCreep` failure codes, and the Overseer reads them (raw via `getMemoryPath`
today; in the projected `ScreepsStats` once the sparse read-side ships too).

## 6. Out-of-scope observations (tracked separately, NOT changed here)
- `spawning.ts` `spawnRequest()` is **dead code** (no callers since the expansion
  spawn was inlined). Left untouched.
- `getRemoteMiningSpawnRequest` is imported in `spawning.ts` but unused.
- `build-order.test.js` upgrader-cap test drift (see §2).
