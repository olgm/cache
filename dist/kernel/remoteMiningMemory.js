"use strict";
/**
 * Cache — Remote mining memory.
 *
 * Per-room memory for the remote mining subsystem: intel on adjacent rooms
 * and their viable sources.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRemoteMiningMemory = ensureRemoteMiningMemory;
/** Ensure remote mining memory exists for a room. */
function ensureRemoteMiningMemory(roomName) {
    if (!Memory.rooms)
        Memory.rooms = {};
    if (!Memory.rooms[roomName])
        Memory.rooms[roomName] = {};
    const roomMem = Memory.rooms[roomName];
    if (!roomMem.remoteMining) {
        roomMem.remoteMining = { lastScan: 0, intel: {} };
    }
    return roomMem.remoteMining;
}
//# sourceMappingURL=remoteMiningMemory.js.map