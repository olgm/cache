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

### 2026-06-15 19:08 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps and energy to room W43N38 to fix its underdeveloped RCL and bring upgrade throughput in line with healthy baselines.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 18:13 UTC — Focus upgraders on W43N38 controller

Direct upgrade creeps to room W43N38 whose controller level lags behind, improving RCL progression.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 17:12 UTC — Route more upgraders to W43N38 controller

Shift additional upgrade creeps to room W43N38 to accelerate its lagging RCL progression back toward healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 16:11 UTC — Prioritize W43N38 controller upgrading

Redirect upgraders to room W43N38 where the RCL sub-score is lagging behind healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 81/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 15:04 UTC — Add harvesters and haulers to boost W43N38 throughput

Deploy additional harvester and hauler creeps in room W43N38 to fix low energy throughput and strengthen the early-game economy.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-15 14:04 UTC — Prioritize upgraders in room W43N38

Redirect spawning priorities to send more upgraders to W43N38, whose controller level lags behind and needs focused upgrade throughput.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 81/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 13:11 UTC — Focus upgraders on underdeveloped W43N38 controller

Redirect upgrade priority to room W43N38 whose RCL lags behind healthy levels, ensuring more dedicated upgraders work that controller.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 10:33 UTC — Add harvesters and haulers to W43N38

Deploy additional harvester and hauler creeps in room W43N38 to raise energy throughput and fix the low economy sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 67/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-14 13:28 UTC — Route upgraders to underdeveloped W43N38 controller

Redirect upgrade creeps toward room W43N38 whose controller lags behind, aiming to lift its RCL sub-score back to healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 82/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-14 12:25 UTC — Focus upgraders on W43N38 controller

Redirect upgrade energy to room W43N38 where the RCL sub-score is below healthy, prioritizing its underdeveloped controller for faster room level progression.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 82/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-14 09:35 UTC — Add harvesters and haulers to W43N38

Deploy additional harvester and hauler creeps in room W43N38 to increase low energy throughput and boost the economy sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 63/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-14 08:44 UTC — Prioritize W43N38 controller upgraders for early RCL growth

Shift creeps toward dedicated upgrading in room W43N38 to improve its underdeveloped controller and lift the RCL sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 82/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-14 07:25 UTC — Add harvesters and haulers to W43N38

Increase the number of harvesters and haulers in room W43N38 to improve energy throughput and economy scores.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 63/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-14 06:35 UTC — Add dedicated hauler role to room W43N38

Introduce a hauler creep role to move energy from harvesters to spawn and controller, fixing W43N38's low energy throughput.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 63/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-14 05:33 UTC — Focus upgraders on underdeveloped W43N38 controller

Redirect upgrade energy and creep attention to room W43N38 where the RCL sub-score lags, bringing it in line with the colony's economic baseline.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 82/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-14 04:33 UTC — Focus upgraders on underleveled controller W43N38

Redirect additional upgraders to room W43N38 to accelerate its lagging controller level and improve the RCL sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 82/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-14 02:27 UTC — Deploy remote mining in W43N38

Add harvesters and haulers to W43N38 to increase its energy throughput from underperforming sources.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** remote-mining weakness (`remote-mining`)
- **Eval score:** 45/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy

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
