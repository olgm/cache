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
export function ensureRemoteMiningMemory(roomName: string): RemoteMiningMemory {
  if (!Memory.rooms) Memory.rooms = {};
  if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
  const roomMem = Memory.rooms[roomName] as Record<string, unknown>;
  if (!roomMem.remoteMining) {
    roomMem.remoteMining = { lastScan: 0, intel: {} };
  }
  return roomMem.remoteMining as RemoteMiningMemory;
}
