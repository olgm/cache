# C.A.C.H.E
**C**ore **A**lgorithmic **C**omputation **H**yper **E**ngine.

An autonomous, *self evolving* bot for [Screeps World](screeps.com).

<!-- SPARSE:ARCHITECTURE:START -->
## Architecture

_Auto-generated from the Cache source tree (25 modules)._

**Top level**
- `config.ts` — Cache — economy tunables: dynamic body builders + RCL-scaled role targets.
- `expansion.ts` — Cache — Expansion manager (gated, correct).
- `main.ts` — Cache v0.3.0 — Main loop.
- `stats.ts` — Cache — Memory.stats telemetry writer.
- `types.ts` — Cache v0.3.0 — Shared types, constants, and interfaces.

**`kernel/`**
- `kernel/construction.ts` — Cache — Construction planner (auto base-building).
- `kernel/remoteMining.ts` — Cache — Remote mining manager.
- `kernel/remoteMiningMemory.ts` — Cache — Remote mining memory.
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
- `roles/remoteHarvester.ts` — Cache — Remote harvester role.
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

### 2026-06-24 19:25 UTC — Fix storage construction to actually build structures

Repair the spawn/construction pipeline so that storage structures are actually produced and deployed, turning the dormant buffering code into an operational in-game capability.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** missing capability: storage / energy buffering (`storage`)
- **Eval score:** 72/100

**Why:** Cache has CODE for storage / energy buffering, but the live colony has none operational (rooms with storage: 0). The construction/spawn pipeline is not actually producing it — fix what prevents it from being built and used; do NOT re-add the code.

**Issues addressed:**
- roadmap: 'storage' expected since 'mid'
- live: coded but not built — rooms with storage: 0

### 2026-06-24 18:25 UTC — Focus upgrader spawns on underdeveloped W43N38

Increase upgrader creep allocation to room W43N38 to accelerate its lagging controller level and improve RCL parity.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 72/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-24 17:22 UTC — Add remote harvesters and haulers to W43N38

Deploy dedicated remote-mining creep roles to the W43N38 room to fix low energy throughput and raise the energy sub-score back to healthy levels.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** remote-mining weakness (`remote-mining`)
- **Eval score:** 63/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- cooldown: recently worked (−0.2)

### 2026-06-21 12:54 UTC — Fix construction pipeline to build and operate towers

Repair the builder/spawn logic so that towers are actually constructed and brought online, unlocking the existing tower defense code that is currently dormant.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** missing capability: tower defense (`defense`)
- **Eval score:** 86/100

**Why:** Cache has CODE for tower defense, but the live colony has none operational (towers built: 0). The construction/spawn pipeline is not actually producing it — fix what prevents it from being built and used; do NOT re-add the code.

**Issues addressed:**
- roadmap: 'defense' expected since 'early', 1 phase(s) overdue
- live: coded but not built — towers built: 0
- heuristic: combat readiness
- cooldown: recently worked (−0.2)

### 2026-06-21 09:56 UTC — Fix Spawn Pipeline To Build Towers

Repair the construction and spawning pipeline so that existing tower defense code actually gets towers built and operational in the colony.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** missing capability: tower defense (`defense`)
- **Eval score:** 86/100

**Why:** Cache has CODE for tower defense, but the live colony has none operational (towers built: 0). The construction/spawn pipeline is not actually producing it — fix what prevents it from being built and used; do NOT re-add the code.

**Issues addressed:**
- roadmap: 'defense' expected since 'early', 1 phase(s) overdue
- live: coded but not built — towers built: 0
- heuristic: combat readiness
- cooldown: recently worked (−0.2)

### 2026-06-21 07:11 UTC — Wire construction pipeline to build towers

Fix the spawn/construction pipeline so that tower structures actually get placed and built, turning the already-coded tower defense logic from dead code into operational defenses.

- **Model:** deepseek:v4-pro
- **Phase:** mid
- **Focus:** missing capability: tower defense (`defense`)
- **Eval score:** 86/100

**Why:** Cache has CODE for tower defense, but the live colony has none operational (towers built: 0). The construction/spawn pipeline is not actually producing it — fix what prevents it from being built and used; do NOT re-add the code.

**Issues addressed:**
- roadmap: 'defense' expected since 'early', 1 phase(s) overdue
- live: coded but not built — towers built: 0
- heuristic: combat readiness

### 2026-06-20 22:11 UTC — Add harvesters and haulers for W43N38 throughput

Deploy dedicated harvester and hauler creeps to Room W43N38 to increase energy collection and reduce logistics bottlenecks.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-20 19:10 UTC — Focus upgraders on W43N38 controller

Redirect additional upgrader creeps to room W43N38 where the controller is underdeveloped and RCL sub-score is below healthy.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 81/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 16:12 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps to room W43N38 where the controller RCL lags behind, addressing the rcl sub-score weakness.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 13:10 UTC — Assign more upgraders to W43N38 controller

Increase the number of dedicated upgrade creeps in room W43N38 to boost its underdeveloped RCL and close the upgrade throughput gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 10:11 UTC — Direct more upgraders to underdeveloped controller W43N38

Bias upgrade energy allocation toward room W43N38 where the controller is lagging, to raise its RCL and restore healthy progression.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 07:11 UTC — Focus upgraders on room W43N38 controller

Direct additional upgrade creeps to room W43N38 to raise its below-healthy RCL sub-score and address the controller underdevelopment.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 04:11 UTC — Prioritize W43N38 controller upgrades

Redirect upgrade energy toward room W43N38's underdeveloped controller to close the RCL gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-20 01:27 UTC — Add harvester and hauler creeps to W43N38

Deploy dedicated harvester and hauler creep roles in room W43N38 to fix low energy throughput and raise the economy sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 76/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-19 22:09 UTC — Prioritize upgrading in room W43N38

Redirect upgrade creep priority toward room W43N38 to address its under-leveled controller and improve RCL score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-19 19:11 UTC — Focus upgraders on underdeveloped W43N38 controller

Redirect upgrade creeps to room W43N38 to accelerate its lagging Room Control Level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-19 16:28 UTC — Prioritize W43N38 controller upgrades

Redirect upgrade creeps to room W43N38 where the controller RCL lags behind, fixing the rcl sub-score weakness.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-19 10:21 UTC — Add dedicated harvesters and haulers to W43N38

Deploy source-specific harvester and hauler creeps in room W43N38 to increase energy throughput and fix the low economy sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 76/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-19 07:21 UTC — Prioritize upgrading in room W43N38

Direct more creeps to upgrade the under-developed controller in room W43N38 to raise its RCL sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-19 04:21 UTC — Focus more upgraders on W43N38 controller

Room W43N38's RCL is below healthy; redirect additional creeps and energy to upgrade its controller.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-18 23:16 UTC — Add harvester/hauler pairs to W43N38 sources

Deploy dedicated harvester creeps at each source in room W43N38, paired with haulers to move energy to spawn/storage, raising energy throughput from its current sub-healthy level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 76/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-18 20:16 UTC — Route more upgraders to room W43N38

Redirect creep spawning or work assignments to increase the number of dedicated upgraders in room W43N38, lifting its lagging controller level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-18 17:35 UTC — Focus upgraders on W43N38 controller

Redirect upgrade creeps to room W43N38 to raise its underdeveloped RCL.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-18 05:16 UTC — Add harvesters and haulers to W43N38

Deploy dedicated harvester and hauler creeps in room W43N38 to increase energy throughput and raise the economy sub-score from below-healthy to sustainable levels.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** logistics weakness (`logistics`)
- **Eval score:** 62/100

**Why:** Room W43N38 energy throughput is low; add harvesters/haulers or sources.

**Issues addressed:**
- eval: energy sub-score below healthy
- heuristic: economy throughput

### 2026-06-18 02:17 UTC — Prioritize upgrading in room W43N38

Shift more creep energy toward upgrading the under-leveled controller in room W43N38 to close the RCL gap.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 23:15 UTC — Prioritize upgrades in room W43N38

Redirect additional upgraders to room W43N38 to accelerate its lagging controller level.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

### 2026-06-17 20:15 UTC — Focus upgraders on W43N38 to lift RCL

Redirect upgrade energy to room W43N38, where an underdeveloped controller is dragging down the rcl sub-score.

- **Model:** deepseek:v4-pro
- **Phase:** early
- **Focus:** upgrading weakness (`upgrading`)
- **Eval score:** 86/100

**Why:** Room W43N38 controller is underdeveloped; focus upgraders there.

**Issues addressed:**
- eval: rcl sub-score below healthy

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
<!-- SPARSE:CHANGELOG:END -->
