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
/**
 * Classify a single VISIBLE adjacent room for remote mining: returns its sources
 * that have at least one open adjacent tile, or `[]` if the room is off-limits.
 *
 * Off-limits = any owned controller (ours OR another player's), a room reserved
 * by another player, or a room holding hostiles / source-keeper lairs.
 *
 * Excluding rooms WE own is the fix for the W44N38 bootstrap starvation. A room
 * we own but have not yet given a spawn is a colony we are actively bootstrapping
 * with pioneers. Remote-mining it is counter-productive: (a) remoteHarvesters are
 * spawned from the home room AHEAD of pioneers (pioneers are only requested once
 * the economy + remoteHarvester targets are met), so an unmet remote target keeps
 * pioneers from ever spawning; and (b) the remoteHarvesters would contend with
 * those pioneers for the new room's own source energy. Once the room has a spawn
 * it runs its own static miners — it is never a remote-mining target either way.
 *
 * Pure given a visible room, so it is unit-tested directly (no getRoomData).
 */
export declare function scanRemoteRoom(targetRoom: Room): RemoteSource[];
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
