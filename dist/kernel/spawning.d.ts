/**
 * Cache — Spawn manager (per-room, prioritized, self-healing).
 *
 * For each owned room with a free spawn it spawns the highest-priority missing
 * creep, sizing the body to the room's full energy capacity (so creeps grow with
 * the colony) and waiting until that body is affordable rather than producing
 * runts. The exception is the emergency path: if the room's energy-delivery
 * pipeline has collapsed (no harvesters AND no miners-or-haulers), it
 * immediately spawns a self-sufficient harvester sized to whatever energy is on
 * hand — the safety net that lets a colony recover from a wipe.
 */
import { CreepRole } from "../types";
import { RoleTargets } from "../config";
import { Census } from "../utils/census";
import { RoomData } from "../utils/roomData";
/**
 * Ring-buffer capture of a NON-OK spawnCreep result so a SILENT spawn failure
 * leaves a trace. Every spawnCreep call site funnels its return code here: OK is
 * ignored (no news is good news); a non-OK code (ERR_RCL_NOT_ENOUGH,
 * ERR_GCL_NOT_ENOUGH, ERR_BUSY, ERR_NAME_EXISTS, …) is appended to
 * Memory.spawnErrors (newest-wins, capped at SPAWN_ERROR_CAP). The stats writer
 * folds this into Memory.stats so SPARSE/the Overseer can see WHY a room stopped
 * spawning — the "second room won't spawn" thesis previously left no signal at
 * all. Additive + defensive: it only touches Memory and runs inside the spawn
 * manager's per-room try/catch, so it can never break a tick. Exported for tests.
 */
export declare function recordSpawnResult(room: string, role: string, code: ScreepsReturnCode): void;
export declare function runSpawnManager(): void;
/**
 * Pick the highest-priority role this room is under target on (or null if all
 * are satisfied). Exported for unit testing — it is the seam where the
 * ROLE_PRIORITY ordering decides whether builders ever get spawned ahead of the
 * upgrader fleet (see spawn-priority.test).
 *
 * Includes four starvation guards that prevent higher-priority roles from
 * consuming every spawn cycle forever:
 *
 * 1. Builder-starvation guard: when construction sites exist and zero builders
 *    are alive or reserved, builder priority is temporarily elevated to 1.5
 *    (above hauler at 2, below miner at 1) so at least one builder spawns.
 *
 * 2. Storage-emergency guard: when a room at RCL 4+ has no built storage, the
 *    builder corps is elevated to 1.5 until the FULL builder target is met
 *    (not just until the first builder), so the 2-3 builders needed for a
 *    30 000-energy storage actually materialise.
 *
 * 3. Bootstrapping-pioneer guard: when the expansion system is actively
 *    bootstrapping a claimed room with no spawn, pioneer priority is elevated
 *    to 1.2 (above storage-emergency builder at 1.5 and hauler at 2, below
 *    miner at 1) so pioneers are not starved by the home room's demands.
 *
 * 4. Upgrader-starvation guard: when GCL ≤ 2 (every control point gates
 *    multi-room expansion) and the upgrader corps is below a minimum floor
 *    (scaled by RCL), upgrader priority is temporarily elevated to 2.5 (above
 *    hauler at 2, below miner at 1) so at least the floor count of upgraders
 *    is maintained.  Without this, a hauler target that is perpetually 2-3
 *    short of its ceiling (the common RCL 5 state) consumes every spawn cycle
 *    and the upgrader count never reaches even its modest floor — control
 *    points flatline, GCL stalls, and the colony deadlocks.  Once the floor is
 *    reached the guard deactivates and normal ordering resumes.
 */
export declare function pickEconomyRole(targets: RoleTargets, census: Census, home: string, reserved: Record<string, number>): CreepRole | null;
/**
 * Spawn-energy budget for a normal economy creep.
 *
 * Capacity-sized (energyCapacityAvailable) in normal operation — bigger creeps
 * are more efficient, and a healthy hauler fleet keeps the spawn topped up so we
 * can afford them. But sized to energy ON HAND in two cases where waiting for a
 * full body would stall forever:
 *   - bootstrap: no source container yet, so the room cannot fill its capacity;
 *   - degraded: post-bootstrap but the hauler fleet has collapsed to zero, so
 *     energy no longer reaches the spawn (immediate trigger);
 *   - recovering: the spawn has been stalled (wanting an unaffordable creep) past
 *     SPAWN_STALL_LIMIT — the robust escape that also covers a partial collapse
 *     (e.g. one tiny hauler), where `degraded` has already switched off but the
 *     room still can't fill a capacity body. Without it the colony plateaus at a
 *     few creeps for hours (the observed RCL5 collapse: a full-capacity body of
 *     1800 was unaffordable, so nothing spawned and nothing recovered).
 * In all three, sizing to available lets the spawn produce a smaller creep NOW,
 * which restarts energy flow and recovers (mirrors the emergency-bootstrap path).
 */
export declare function economyBudget(data: RoomData, haulers: number, recovering: boolean): number;
