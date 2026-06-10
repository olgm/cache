/**
 * Cache v0.0.4 — Expansion manager.
 *
 * Drives multi-room expansion:
 *   1. Scout adjacent rooms (even while GCL-locked) to gather intel.
 *   2. When GCL allows a new room, pick the best scouted target.
 *   3. Spawn a claimer to capture the target controller.
 *   4. After claiming, hand off to the normal spawn pipeline for bootstrapping.
 *
 * State machine persisted in Memory.expansion.
 *
 * v0.0.4 CPU optimisations:
 *   - ownedRoomCount cached per tick (called multiple times).
 *   - hasActiveClaimer / hasActiveScout cached per tick.
 *   - Expensive room scoring throttled to every 20 ticks.
 *   - pickTarget uses cached room structures instead of repeated find().
 */
import { CreepRole } from "./types";
/**
 * Return a spawn request the expansion module wants fulfilled this tick,
 * or null if no expansion spawn is needed.
 */
export interface ExpansionSpawnRequest {
    role: CreepRole;
    body: BodyPartConstant[];
    priority: number;
}
export declare function getExpansionSpawnRequest(): ExpansionSpawnRequest | null;
/**
 * Attach target room to a newly spawned claimer or scout.
 * Called by the spawn manager after a successful spawn.
 */
export declare function onExpansionSpawn(role: CreepRole, creepName: string): void;
/**
 * Record scout intel. Called by the scout role when it enters a room.
 */
export declare function recordScoutIntel(roomName: string): void;
/**
 * Run expansion-related maintenance each tick.
 * Called from the main loop.
 */
export declare function runExpansionManager(): void;
