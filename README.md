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
