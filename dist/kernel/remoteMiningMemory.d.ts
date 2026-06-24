/**
 * Cache — Remote mining memory.
 *
 * Per-room memory for the remote mining subsystem: intel on adjacent rooms
 * and their viable sources.
 */
export interface RemoteSource {
    id: Id<Source>;
    room: string;
    openSlots: number;
}
export interface RemoteRoomIntel {
    lastScan: number;
    viableSources: RemoteSource[];
}
export interface RemoteMiningMemory {
    lastScan: number;
    intel: Record<string, RemoteRoomIntel>;
}
/** Ensure remote mining memory exists for a room. */
export declare function ensureRemoteMiningMemory(roomName: string): RemoteMiningMemory;
