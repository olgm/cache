# C.A.C.H.E
**C**ore **A**lgorithmic **C**omputation **H**yper **E**ngine.

An autonomous, *self evolving* bot for [Screeps World](screeps.com).

<!-- SPARSE:ARCHITECTURE:START -->
## Architecture

_Auto-generated from the Cache source tree (22 modules)._

**Top level**
- `config.ts` — Cache — economy tunables: dynamic body builders + RCL-scaled role targets.
- `expansion.ts` — Cache — Expansion manager (gated, correct).
- `main.ts` — Cache v0.3.0 — Main loop.
- `stats.ts` — Cache — Memory.stats telemetry writer.
- `types.ts` — Cache v0.3.0 — Shared types, constants, and interfaces.

**`kernel/`**
- `kernel/construction.ts` — Cache — Construction planner (auto base-building).
- `kernel/spawning.ts` — Cache — Spawn manager (per-room, prioritized, self-healing).
- `kernel/towers.ts` — Cache — Tower control + safe-mode defense.

**`roles/`**
- `roles/builder.ts` — Cache — Builder role.
- `roles/claimer.ts` — Cache — Claimer role.
- `roles/defender.ts` — Cache — Defender role.
- `roles/harvester.ts` — Cache — Harvester role (generalist bootstrap).
- `roles/hauler.ts` — Cache — Hauler role (logistics).
- `roles/miner.ts` — Cache — Miner role (static container mining).
- `roles/pioneer.ts` — Cache — Pioneer role.
- `roles/scout.ts` — Cache — Scout role.
- `roles/upgrader.ts` — Cache — Upgrader role.

**`utils/`**
- `utils/cache.ts` — Cache v0.0.2 — Tick-scoped cache + room-level structure caching.
- `utils/census.ts` — Cache — creep census.
- `utils/energy.ts` — Cache — shared energy acquisition.
- `utils/movement.ts` — Cache — movement helpers.
- `utils/roomData.ts` — Cache — per-room, per-tick data snapshot.
<!-- SPARSE:ARCHITECTURE:END -->

<!-- SPARSE:CHANGELOG:START -->
## Changelog

### 2026-06-14 01:19 UTC — Prioritize controller upgrading to reach GCL 2

Redirect energy and creep labor toward the room controller to accelerate upgrade throughput and unlock the next Global Control Level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 57/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-14 00:19 UTC — Allocate more creeps to controller upgrading

Shift spawn priority and creep roles to increase controller upgrade throughput, directly addressing the low GCL sub-score in early game.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-13 23:18 UTC — Boost early-game controller upgrade throughput

Prioritize controller upgrading by reallocating creeps and energy to maximize upgrade-per-tick in the starting room while GCL is still 1.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-13 22:37 UTC — Prioritize controller upgrades to accelerate GCL growth

Shift worker energy allocation toward room controller upgrading to increase Global Control Level from 1 and unlock expansion opportunities.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-13 21:37 UTC — Prioritize controller upgrading to raise GCL

Shift creep task allocation to invest more energy into room controller upgrading so that Global Control Level climbs out of its current low plateau.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-13 20:20 UTC — Dedicate more creeps to controller upgrading

Reallocate spawn capacity to prioritize upgrader creeps over other roles, accelerating GCL growth from level 1 to enable expansion.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy

### 2026-06-13 19:00 UTC — Add remote harvesters and haulers for W43N38

Deploy dedicated remote harvester and hauler creeps to boost energy throughput from W43N38 sources.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** remote-mining weakness (`remote-mining`)
- **Eval score:** 45/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy

### 2026-06-13 18:00 UTC — Redirect energy to room controller upgrades

Shift creep task allocation so surplus energy flows into upgrading room controllers rather than idle stockpiling, directly addressing the low GCL score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** expansion weakness (`expansion`)
- **Eval score:** 68/100

**Why:** Global Control Level is low (gcl=1); prioritize controller upgrading to expand.

**Issues addressed:**
- eval: gcl sub-score below healthy
<!-- SPARSE:CHANGELOG:END -->
