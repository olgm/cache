"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRemoteMiningMemory = void 0;
exports.scanRemoteRoom = scanRemoteRoom;
exports.pickRemoteSource = pickRemoteSource;
exports.runRemoteMiningManager = runRemoteMiningManager;
exports.remoteHarvesterTargetForRoom = remoteHarvesterTargetForRoom;
exports.getRemoteMiningSpawnRequest = getRemoteMiningSpawnRequest;
const remoteMiningMemory_1 = require("./remoteMiningMemory");
Object.defineProperty(exports, "ensureRemoteMiningMemory", { enumerable: true, get: function () { return remoteMiningMemory_1.ensureRemoteMiningMemory; } });
const roomData_1 = require("../utils/roomData");
const config_1 = require("../config");
const REMOTE_SCAN_INTERVAL = 50;
const INTEL_TTL = 3000;
/**
 * Maximum remoteHarvesters per home room, scaled by the number of viable
 * sources found in adjacent rooms.  A 2-source room can feed 4 remoteHarvesters
 * (2 per source), which the old flat cap of 2 left on the table — halving the
 * energy throughput from remote mining.  The ceiling of 4 per home room keeps
 * the spawn budget manageable.
 */
function maxRemoteHarvesters(sourceCount) {
    return Math.min(sourceCount * 2, 4);
}
/** Gate: home room must have static mining running and no active spawn-stall. */
function remoteMiningUnlocked(room) {
    if (!room.controller || room.controller.level < 4)
        return false;
    const data = (0, roomData_1.getRoomData)(room);
    // At least one source container running (static mining is active).
    if (!data.sources.some((s) => s.container))
        return false;
    // Don't remote-mine while the spawn is stalled.
    if ((room.memory.spawnStall || 0) > 20)
        return false;
    return true;
}
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
function scanRemoteRoom(targetRoom) {
    const ctrl = targetRoom.controller;
    if (ctrl && ctrl.owner)
        return []; // owned by anyone — see note above
    if (ctrl && ctrl.reservation)
        return []; // reserved by another player
    const hostiles = targetRoom.find(FIND_HOSTILE_CREEPS).length > 0;
    const keeperLairs = targetRoom.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
    }).length > 0;
    if (hostiles || keeperLairs)
        return [];
    // Gather all sources with at least one open adjacent tile.
    const terrain = targetRoom.getTerrain();
    const viableSources = [];
    for (const source of targetRoom.find(FIND_SOURCES)) {
        let openSlots = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0)
                    continue;
                const x = source.pos.x + dx;
                const y = source.pos.y + dy;
                if (x < 0 || x > 49 || y < 0 || y > 49)
                    continue;
                if (terrain.get(x, y) !== TERRAIN_MASK_WALL)
                    openSlots++;
            }
        }
        if (openSlots > 0) {
            viableSources.push({ id: source.id, room: targetRoom.name, openSlots });
        }
    }
    return viableSources;
}
/** Scan adjacent rooms and cache viable sources. */
function scanAdjacent(room, mem) {
    const exits = Game.map.describeExits(room.name);
    if (!exits)
        return;
    for (const roomName of Object.values(exits)) {
        // Already have fresh intel.
        if (mem.intel[roomName] && Game.time - mem.intel[roomName].lastScan < INTEL_TTL)
            continue;
        const targetRoom = Game.rooms[roomName];
        if (!targetRoom)
            continue; // no visibility
        mem.intel[roomName] = { lastScan: Game.time, viableSources: scanRemoteRoom(targetRoom) };
    }
}
/** Count remoteHarvesters already spawned for a given remote source. */
function remoteHarvestersForSource(sourceId, homeRoom) {
    let n = 0;
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role !== "remoteHarvester")
            continue;
        if (c.memory.homeRoom !== homeRoom)
            continue;
        if (c.memory.sourceId === sourceId)
            n++;
    }
    return n;
}
/** Pick the best unassigned remote source for a given home room. */
function pickRemoteSource(homeRoom, mem) {
    let best = null;
    let bestScore = 0;
    for (const roomName in mem.intel) {
        const intel = mem.intel[roomName];
        if (Game.time - intel.lastScan > INTEL_TTL)
            continue;
        for (const rs of intel.viableSources) {
            const assigned = remoteHarvestersForSource(rs.id, homeRoom);
            if (assigned >= 2)
                continue; // max 2 per source
            const score = rs.openSlots * 100 - assigned * 50;
            if (score > bestScore) {
                bestScore = score;
                best = rs;
            }
        }
    }
    return best;
}
/** Desired number of remote harvesters for a home room. */
function remoteHarvesterTarget(room, mem) {
    if (!remoteMiningUnlocked(room))
        return 0;
    // Count total viable sources across all scouted rooms.
    let total = 0;
    for (const roomName in mem.intel) {
        const intel = mem.intel[roomName];
        if (Game.time - intel.lastScan > INTEL_TTL)
            continue;
        total += intel.viableSources.length;
    }
    if (total === 0)
        return 0;
    // Scale: up to 2 remoteHarvesters per viable source, capped at 4 per home
    // room.  The old flat cap of 2 starved remote mining at exactly half its
    // throughput potential when two viable sources exist.
    return maxRemoteHarvesters(total);
}
/**
 * Run the remote mining manager for all owned rooms.
 * Called from main.ts every tick (internally throttled).
 */
function runRemoteMiningManager() {
    for (const room of (0, roomData_1.myRooms)()) {
        try {
            runRoomRemoteMining(room);
        }
        catch (e) {
            console.log(`CACHE remoteMining error in ${room.name}: ${e === null || e === void 0 ? void 0 : e.message}`);
        }
    }
}
function runRoomRemoteMining(room) {
    const mem = (0, remoteMiningMemory_1.ensureRemoteMiningMemory)(room.name);
    // Throttled scan.
    if (Game.time - (mem.lastScan || 0) >= REMOTE_SCAN_INTERVAL) {
        scanAdjacent(room, mem);
        mem.lastScan = Game.time;
    }
    // Cleanup stale intel.
    for (const roomName in mem.intel) {
        if (Game.time - mem.intel[roomName].lastScan > INTEL_TTL * 2) {
            delete mem.intel[roomName];
        }
    }
}
/**
 * Return the target number of remote harvesters for a room.
 * Consumed by the spawn manager via roleTargets.
 */
function remoteHarvesterTargetForRoom(room) {
    const mem = (0, remoteMiningMemory_1.ensureRemoteMiningMemory)(room.name);
    return remoteHarvesterTarget(room, mem);
}
/**
 * Return a spawn request for a remoteHarvester if one is needed.
 * Returns null when no more remote harvesters are needed or no source is available.
 */
function getRemoteMiningSpawnRequest(room, census, reserved) {
    if (!remoteMiningUnlocked(room))
        return null;
    const mem = (0, remoteMiningMemory_1.ensureRemoteMiningMemory)(room.name);
    const target = remoteHarvesterTarget(room, mem);
    const current = (census.byRoom[room.name] && census.byRoom[room.name]["remoteHarvester"] || 0) +
        (reserved["remoteHarvester"] || 0);
    if (current >= target)
        return null;
    if (target === 0)
        return null;
    const source = pickRemoteSource(room.name, mem);
    if (!source)
        return null;
    const data = (0, roomData_1.getRoomData)(room);
    const body = (0, config_1.remoteHarvesterBody)(data.energyCapacity);
    return {
        body,
        memory: {
            role: "remoteHarvester",
            homeRoom: room.name,
            sourceId: source.id,
            targetRoom: source.room,
        },
    };
}
//# sourceMappingURL=remoteMining.js.map