"use strict";
/**
 * Cache v0.0.3 — Scout role.
 *
 * Travels to the target room (creep.memory.targetRoom), records intel via
 * the expansion manager, and returns or scouts the next unknown adjacent
 * room.  Scouts are cheap MOVE-only creeps designed to be disposable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScout = runScout;
const expansion_1 = require("../expansion");
function runScout(creep) {
    let targetRoom = creep.memory.targetRoom;
    if (!targetRoom) {
        // No target — pick an unexplored adjacent room from our spawns.
        const next = findUnexploredAdjacent(creep);
        if (next) {
            creep.memory.targetRoom = next;
            targetRoom = next;
        }
        else {
            // Nothing to scout — suicide to free up CPU
            creep.suicide();
            return;
        }
    }
    // Record intel for the room we're in (including source positions)
    (0, expansion_1.recordScoutIntel)(creep.room.name);
    (0, expansion_1.recordScoutSources)(creep.room.name, creep.room.find(FIND_SOURCES).map(s => ({
        id: s.id,
        x: s.pos.x,
        y: s.pos.y,
    })));
    // Move to target
    if (creep.room.name !== targetRoom) {
        const exitDir = creep.room.findExitTo(targetRoom);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
            const exitPos = creep.pos.findClosestByRange(exitDir);
            if (exitPos)
                creep.moveTo(exitPos);
        }
        return;
    }
    // We arrived — record intel
    (0, expansion_1.recordScoutIntel)(targetRoom);
    // Pick next unexplored adjacent room
    creep.memory.targetRoom = undefined;
    targetRoom = undefined;
    const next = findUnexploredAdjacent(creep);
    if (next) {
        creep.memory.targetRoom = next;
        targetRoom = next;
    }
    else {
        // All adjacent rooms explored — head home
        returnToSpawn(creep);
    }
}
/** Find an adjacent room we haven't scouted yet from the creep's current room. */
function findUnexploredAdjacent(creep) {
    var _a;
    const mem = Memory.expansion;
    const scouted = (_a = mem === null || mem === void 0 ? void 0 : mem.scoutedRooms) !== null && _a !== void 0 ? _a : {};
    const exits = Game.map.describeExits(creep.room.name);
    if (!exits)
        return null;
    for (const roomName of Object.values(exits)) {
        if (!scouted[roomName] || Game.time - scouted[roomName] > 1500) {
            return roomName;
        }
    }
    return null;
}
/** Move back towards a spawn room. */
function returnToSpawn(creep) {
    for (const name in Game.spawns) {
        const spawn = Game.spawns[name];
        if (creep.room.name === spawn.room.name) {
            // Reached home — suicide to free up CPU
            creep.suicide();
            return;
        }
        const exitDir = creep.room.findExitTo(spawn.room.name);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
            const exitPos = creep.pos.findClosestByRange(exitDir);
            if (exitPos)
                creep.moveTo(exitPos);
            return;
        }
    }
    // No path? Just suicide.
    creep.suicide();
}
//# sourceMappingURL=scout.js.map