"use strict";
/**
 * Cache — Expansion manager (gated, correct).
 *
 * Drives a SECOND room only once the home colony can clearly afford it. The
 * old version wedged itself (claiming an unreachable room at GCL1, claimer never
 * able to claim); this one is hard-gated and self-validating:
 *
 *   gate: ownedRooms < GCL (the real claim limit) AND a mature base
 *         (RCL >= 4 with a storage = genuine energy surplus).
 *
 * Flow: idle → scouting (a scout maps adjacent rooms) → claiming (a claimer
 * takes the best adjacent controller) → bootstrapping (pioneers build the new
 * room's first spawn; the construction planner places the spawn site) → idle.
 *
 * At GCL1 / RCL3 (the current live colony) the gate is closed, so this stays
 * dormant and can never wedge — the corrupt legacy state is reset on migration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordIntel = recordIntel;
exports.runExpansionManager = runExpansionManager;
exports.getExpansionSpawnRequest = getExpansionSpawnRequest;
const types_1 = require("./types");
const roomData_1 = require("./utils/roomData");
const census_1 = require("./utils/census");
const config_1 = require("./config");
/** How long cached intel stays usable for target selection. */
const INTEL_TTL = 5000;
/** Pioneers to send to bootstrap a freshly-claimed room. */
const PIONEERS_PER_ROOM = 3;
// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------
function ensureMem() {
    if (!Memory.expansion || !Memory.expansion.state || !Memory.expansion.intel) {
        Memory.expansion = (0, types_1.defaultExpansionMemory)();
    }
    return Memory.expansion;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function adjacentRooms(roomName) {
    const exits = Game.map.describeExits(roomName);
    return exits ? Object.values(exits) : [];
}
function ownedRoomCount() {
    return (0, roomData_1.myRooms)().length;
}
/** The most developed owned room with a spawn — our expansion base. */
function pickBaseRoom() {
    var _a, _b, _c, _d;
    let best = null;
    for (const room of (0, roomData_1.myRooms)()) {
        if (room.find(FIND_MY_SPAWNS).length === 0)
            continue;
        if (!best || ((_b = (_a = room.controller) === null || _a === void 0 ? void 0 : _a.level) !== null && _b !== void 0 ? _b : 0) > ((_d = (_c = best.controller) === null || _c === void 0 ? void 0 : _c.level) !== null && _d !== void 0 ? _d : 0))
            best = room;
    }
    return best;
}
/** Gate: room headroom AND a mature, energy-rich base. */
function expansionUnlocked(base) {
    if (ownedRoomCount() >= Game.gcl.level)
        return false; // claim limit = GCL
    if (!base.controller || base.controller.level < 4)
        return false;
    if (!base.storage)
        return false;
    return true;
}
/** Record intel about a visible room (called by scouts/claimers and the manager). */
function recordIntel(room) {
    const mem = ensureMem();
    const ctrl = room.controller;
    const keeperLairs = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
    });
    const intel = {
        sources: room.find(FIND_SOURCES).length,
        owner: ctrl && ctrl.owner ? ctrl.owner.username : undefined,
        reserved: !!(ctrl && ctrl.reservation),
        hostile: room.find(FIND_HOSTILE_CREEPS).length > 0 || keeperLairs.length > 0,
        lastSeen: Game.time,
    };
    mem.intel[room.name] = intel;
    mem.scoutedRooms[room.name] = Game.time;
}
/** Pick the best adjacent room to claim from cached intel. */
function pickTarget(base) {
    const mem = ensureMem();
    let best = null;
    let bestScore = 0;
    for (const name of adjacentRooms(base.name)) {
        const intel = mem.intel[name];
        if (!intel || Game.time - intel.lastSeen > INTEL_TTL)
            continue;
        if (intel.owner || intel.reserved || intel.hostile)
            continue;
        if (intel.sources === 0)
            continue;
        const score = intel.sources * 100;
        if (score > bestScore) {
            bestScore = score;
            best = name;
        }
    }
    return best;
}
function globalRoleCount(role) {
    return (0, census_1.buildCensus)().global[role] || 0;
}
function pioneersFor(targetRoom) {
    let n = 0;
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role === "pioneer" && c.memory.targetRoom === targetRoom)
            n++;
    }
    return n;
}
// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
function runExpansionManager() {
    const mem = ensureMem();
    const base = pickBaseRoom();
    // Dormant / gated off: keep state clean so nothing can wedge.
    if (!base || !expansionUnlocked(base)) {
        if (mem.state !== "idle") {
            mem.state = "idle";
            mem.targetRoom = undefined;
        }
        return;
    }
    // Opportunistically record intel on any visible adjacent rooms.
    for (const name of adjacentRooms(base.name)) {
        const r = Game.rooms[name];
        if (r)
            recordIntel(r);
    }
    // Self-heal: a target that isn't adjacent to the base (legacy corruption)
    // is invalid unless we're already bootstrapping it.
    if (mem.targetRoom && mem.state !== "bootstrapping" && !adjacentRooms(base.name).includes(mem.targetRoom)) {
        mem.targetRoom = undefined;
        mem.state = "idle";
    }
    switch (mem.state) {
        case "idle":
            mem.state = "scouting";
            break;
        case "scouting": {
            const adj = adjacentRooms(base.name);
            const haveAll = adj.every((r) => mem.intel[r] && Game.time - mem.intel[r].lastSeen < INTEL_TTL);
            if (haveAll) {
                const target = pickTarget(base);
                if (target) {
                    mem.targetRoom = target;
                    mem.state = "claiming";
                }
                else {
                    mem.state = "idle"; // nothing worth claiming nearby; retry later
                }
            }
            break;
        }
        case "claiming": {
            const room = mem.targetRoom ? Game.rooms[mem.targetRoom] : undefined;
            if (room && room.controller && room.controller.my)
                mem.state = "bootstrapping";
            break;
        }
        case "bootstrapping": {
            const room = mem.targetRoom ? Game.rooms[mem.targetRoom] : undefined;
            if (!room || !room.controller || !room.controller.my) {
                mem.state = "idle";
                mem.targetRoom = undefined;
                break;
            }
            if (room.find(FIND_MY_SPAWNS).length > 0) {
                // New room stands on its own — done expanding for now.
                mem.state = "idle";
                mem.targetRoom = undefined;
            }
            break;
        }
    }
}
// ---------------------------------------------------------------------------
// Spawn requests (consumed by the spawn manager, base room only)
// ---------------------------------------------------------------------------
function getExpansionSpawnRequest(room, data) {
    const mem = ensureMem();
    const base = pickBaseRoom();
    if (!base || room.name !== base.name || !expansionUnlocked(base))
        return null;
    switch (mem.state) {
        case "scouting":
            if (globalRoleCount("scout") === 0) {
                return { role: "scout", body: (0, config_1.scoutBody)(), memory: { role: "scout", homeRoom: base.name } };
            }
            return null;
        case "claiming": {
            if (!mem.targetRoom)
                return null;
            const target = Game.rooms[mem.targetRoom];
            if (target && target.controller && target.controller.my)
                return null;
            if (globalRoleCount("claimer") === 0) {
                return {
                    role: "claimer",
                    body: (0, config_1.claimerBody)(data.energyCapacity),
                    memory: { role: "claimer", homeRoom: base.name, targetRoom: mem.targetRoom },
                };
            }
            return null;
        }
        case "bootstrapping": {
            if (!mem.targetRoom)
                return null;
            if (pioneersFor(mem.targetRoom) < PIONEERS_PER_ROOM) {
                return {
                    role: "pioneer",
                    body: (0, config_1.pioneerBody)(data.energyCapacity),
                    memory: { role: "pioneer", homeRoom: base.name, targetRoom: mem.targetRoom },
                };
            }
            return null;
        }
        default:
            return null;
    }
}
//# sourceMappingURL=expansion.js.map