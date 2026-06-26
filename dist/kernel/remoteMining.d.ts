/**
 * Cache — Remote mining manager.
 *
 * Identifies unowned, unreserved sources in adjacent rooms and spawns dedicated
 * remoteHarvester creeps to mine them, hauling energy back to the home room.
 *
 * Gating: only activates when the home economy is mature enough to sustain the
 * extra spawn cost — RCL ≥ 4, at least one source container (so static mining
 * is running), and the spawn isn't stalled.
 *
 * Scouting is throttled (every REMOTE_SCAN_INTERVAL ticks) to keep CPU cheap.
 *
 * BOOTSTRAP: When no source-level intel exists for any adjacent room, we fall
 * back to the expansion manager's room-level intel (already gathered by scouts)
 * to pick a viable adjacent room, and let the remoteHarvester discover specific
 * sources on arrival.  This breaks the cold-start deadlock where scanAdjacent
 * requires in-room visibility but no creep has ever visited an adjacent room.
 */
import { ensureRemoteMiningMemory, RemoteMiningMemory, RemoteSource } from "./remoteMiningMemory";
import { buildCensus } from "../utils/census";
/** Pick the best unassigned remote source for a given home room. */
export declare function pickRemoteSource(homeRoom: string, mem: RemoteMiningMemory): RemoteSource | null;
export interface RemoteMiningSpawnRequest {
    body: BodyPartConstant[];
    memory: CreepMemory;
}
/**
 * Run the remote mining manager for all owned rooms.
 * Called from main.ts every tick (internally throttled).
 */
export declare function runRemoteMiningManager(): void;
/**
 * Return the target number of remote harvesters for a room.
 * Consumed by the spawn manager via roleTargets.
 */
export declare function remoteHarvesterTargetForRoom(room: Room): number;
/**
 * Return a spawn request for a remoteHarvester if one is needed.
 * Returns null when no more remote harvesters are needed or no source is available.
 */
export declare function getRemoteMiningSpawnRequest(room: Room, census: ReturnType<typeof buildCensus>, reserved: Record<string, number>): RemoteMiningSpawnRequest | null;
export { ensureRemoteMiningMemory };
