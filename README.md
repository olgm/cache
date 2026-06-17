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

### 2026-06-17 17:16 UTC — Prioritize W43N38 controller upgrading

Redirect upgrade energy and creeps to room W43N38 whose RCL is underdeveloped relative to the colony baseline.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 14:35 UTC — Direct more upgraders to W43N38 controller

Assign additional dedicated upgraders to the underdeveloped W43N38 controller to raise its RCL sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 11:19 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps to room W43N38 where RCL has fallen below the healthy threshold.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 10:18 UTC — Focus upgraders on underdeveloped W43N38 controller

Shift additional creeps to upgrade duty in room W43N38 to correct its below-healthy RCL score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 09:20 UTC — Direct more upgraders to W43N38 controller

Redirect additional creeps to upgrade the underdeveloped controller in room W43N38, bringing its below-healthy RCL score back on track.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 08:38 UTC — Increase upgraders in room W43N38 for RCL growth

Increase the number of dedicated upgraders in room W43N38 to raise its underdeveloped controller level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 07:24 UTC — Focus upgraders on underdeveloped W43N38 controller

Redirect upgrade creeps to prioritize room W43N38 whose controller level lags, boosting RCL throughput in the early-game phase.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 06:38 UTC — Assign dedicated upgraders to room W43N38

Increase the number of creeps dedicated to upgrading room W43N38's controller to bring its RCL sub-score back to healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 05:18 UTC — Prioritize W43N38 controller upgrading

Redirect upgrading effort toward room W43N38 to address its underdeveloped controller and improve the RCL sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 04:15 UTC — Direct more upgraders to W43N38 controller

Reroute upgrade creeps to focus on room W43N38 where the RCL is lagging behind healthy thresholds.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 03:26 UTC — Prioritize W43N38 controller upgrade throughput

Redirect upgraders to room W43N38 to close its RCL gap and raise the underdeveloped controller's level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 02:35 UTC — Focus upgraders on underdeveloped room W43N38

Shift upgrade energy and creep allocation to room W43N38 where the controller level lags behind other rooms.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 01:15 UTC — Focus upgraders on underdeveloped room W43N38

Redirect upgrade creeps to W43N38 where the controller is behind, improving its RCL sub-score to match the rest of the colony.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 00:13 UTC — Add harvester/hauler creeps to W43N38

Spawn dedicated harvester and hauler creeps in room W43N38 to raise energy throughput and repair the below-healthy economy score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 71/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-16 23:16 UTC — Prioritize upgrader allocation to W43N38 controller

Direct more creeps and energy to upgrade the underdeveloped controller in room W43N38, whose RCL sub-score lags below healthy thresholds.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 22:15 UTC — Add dedicated harvester and hauler creeps for W43N38

Introduce specialized harvester and hauler creep roles to increase energy collection and transport throughput in room W43N38, addressing its low economy score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 67/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-16 21:32 UTC — Focus upgraders on room W43N38

Assign dedicated creep upgraders to the underdeveloped W43N38 controller to raise its RCL sub-score and close the upgrading gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 81/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 19:17 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps to room W43N38 to raise the controller level from its currently underdeveloped state.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 18:17 UTC — Focus upgraders on underdeveloped W43N38 controller

Redirect upgrade creeps to room W43N38 to accelerate its lagging room controller level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 17:18 UTC — Focus upgraders on W43N38 controller

Direct more upgrade creeps to room W43N38 to address its underdeveloped RCL.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 16:36 UTC — Focus upgraders on W43N38 controller

Redirect upgrade energy to room W43N38's underdeveloped controller to raise its RCL sub-score toward healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 15:35 UTC — Dedicate upgraders to room W43N38 controller

Redirect upgrade creeps to room W43N38 where the controller is underdeveloped and the RCL sub-score is below healthy.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 14:18 UTC — Prioritize W43N38 controller upgrading

Shift spawn priority and energy allocation to send more upgraders to room W43N38, where the RCL sub-score is below healthy and the controller is underdeveloped.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 13:21 UTC — Focus upgraders on W43N38 controller

Redirect upgrade energy to room W43N38 to raise its underdeveloped RCL and improve the control-point score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 10:15 UTC — Focus upgraders on W43N38 controller

Prioritize creep upgrade work in room W43N38 to raise its underdeveloped RCL and close the control-point gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 09:11 UTC — Focus upgraders on W43N38 underdeveloped controller

Redirect upgrade creeps to room W43N38 to raise its below-healthy RCL sub-score and boost control point growth.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 07:11 UTC — Focus upgraders on W43N38 underdeveloped controller

Redirect upgrade-focused creeps to room W43N38 where the controller level lags behind the rest of the colony.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 06:15 UTC — Add harvesters and haulers to W43N38

Deploy dedicated harvester and hauler creeps in room W43N38 to increase energy throughput and resolve the low logistics sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-16 05:14 UTC — Add hauler and harvester creeps to W43N38 economy

Deploy a dedicated hauler alongside an additional harvester in room W43N38 to increase energy throughput and improve the room's low economic score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 76/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-16 04:32 UTC — Focus upgraders on W43N38 controller

Redirect additional creeps to upgrade room W43N38's controller to bring its RCL sub-score back to a healthy level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 03:12 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps to room W43N38 to raise its below-healthy room control level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-16 01:20 UTC — Add harvesters and haulers to W43N38

Deploy additional harvester and hauler creeps in room W43N38 to fix low energy throughput and raise the economy sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-16 00:08 UTC — Add harvesters and haulers to W43N38

Deploy additional harvester and hauler creeps in room W43N38 to increase energy throughput and raise the economy sub-score above healthy threshold.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 76/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-15 23:04 UTC — Focus upgraders on underdeveloped room W43N38

Shift upgrader creep allocation toward room W43N38 to raise its below-healthy RCL and close the controller upgrade gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 22:25 UTC — Focus upgraders on W43N38 controller

Redirect upgrading efforts to room W43N38 where the controller is underdeveloped and RCL sub-score is below healthy.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 81/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-15 21:03 UTC — Add harvester and hauler creep roles

Introduce dedicated harvester and hauler creep roles to increase energy throughput in room W43N38.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-15 20:14 UTC — Focus upgraders on W43N38 controller

Shift upgrade creep allocation toward room W43N38 to bring its underdeveloped RCL up to healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

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
<!-- SPARSE:CHANGELOG:END -->
