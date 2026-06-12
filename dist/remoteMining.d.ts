/**
 * Cache v0.1.3 — Remote-mining manager.
 *
 * Drives exploitation of sources in adjacent (non-owned) rooms:
 *   1. Evaluate adjacent rooms for viable remote sources (use expansion intel).
 *   2. When a viable source is found, transition to "active" and request
 *      remoteHarvester + remoteHauler spawns.
 *   3. Maintain the right number of creeps per remote source; withdraw when
 *      a remote room becomes hostile or depletes.
 *
 * State persisted in Memory.remoteMining.
 *
 * v0.1.3 — Productivity-aware: deactivates ops that haven't hauled in 1500
 * ticks. Uses creep census instead of per-function O(n) scans.
 *
 * Design constraints:
 *   - Only adjacent rooms (range 1) for now — keeps pathing cheap.
 *   - Allow 1 remote op at GCL 1 (bootstrap the energy economy).
 *   - Scale body plans to room energy capacity.
 *   - Track energy harvested per remote op for effectiveness metrics.
 *   - Re-evaluate each active remote every 300 ticks to catch changes
 *     (hostile incursion, source drained, etc.).
 */
import { CreepRole } from "./types";
export interface RemoteSpawnRequest {
    role: CreepRole;
    body: BodyPartConstant[];
    priority: number;
    /** Source id for remoteHarvester, room name for remoteHauler. */
    targetId?: string;
    /** Home room name (where the hauler delivers). */
    homeRoom?: string;
}
/**
 * Run remote-mining maintenance each tick.
 * Called from the main loop *before* spawn management.
 *
 * Evaluates new remote sources and maintains existing operations.
 */
export declare function runRemoteMiningManager(): void;
/**
 * Return a spawn request for remote mining, or null if none needed.
 * Called by the spawn manager when normal targets are met.
 *
 * Checks each active remote op for missing harvesters/haulers.
 * Uses energy-aware body selection based on room capacity.
 */
export declare function getRemoteMiningSpawnRequest(): RemoteSpawnRequest | null;
/**
 * Called by the spawn manager after a remote creep is successfully spawned,
 * so we can store source/target info in its memory.
 */
export declare function onRemoteMiningSpawn(role: CreepRole, creepName: string, targetId?: string, homeRoom?: string): void;
/**
 * Return the number of active remote ops.
 */
export declare function activeRemoteOpCount(): number;
