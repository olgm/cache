"use strict";
/**
 * Cache v0.1.1 — Remote harvester role.
 *
 * Moves to a remote source in an adjacent room and harvests energy.
 * Stays at the source and drops energy for the hauler to pick up.
 * Returns home if the source is depleted or the room is hostile.
 *
 * v0.1.1: Added inter-room path caching (25-tick reuse) to avoid
 * per-tick moveTo pathfinding.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRemoteHarvester = runRemoteHarvester;
// ---------------------------------------------------------------------------
// Path caching (same pattern as upgrader — avoids per-tick pathfinding)
// ---------------------------------------------------------------------------
const PATH_CACHE_TTL = 25;
function moveCached(creep, dest, key) {
    var _a;
    const ageKey = `rhv_pa_${key}`;
    const pathKey = `rhv_pp_${key}`;
    const mem = creep.memory;
    const age = (_a = mem[ageKey]) !== null && _a !== void 0 ? _a : 999;
    if (age > PATH_CACHE_TTL) {
        const path = creep.pos.findPathTo(dest, { maxOps: 200, ignoreCreeps: false });
        mem[pathKey] = Room.serializePath(path);
        mem[ageKey] = 0;
    }
    const cachedPath = mem[pathKey];
    if (cachedPath) {
        creep.moveByPath(Room.deserializePath(cachedPath));
    }
    else {
        creep.moveTo(dest);
    }
    mem[ageKey] = age + 1;
}
// ---------------------------------------------------------------------------
// Main role
// ---------------------------------------------------------------------------
function runRemoteHarvester(creep) {
    // If we don't have a source id, mark as dead weight
    if (!creep.memory.sourceId) {
        console.log(`RemoteHarvester ${creep.name}: no sourceId, suiciding.`);
        creep.suicide();
        return;
    }
    const source = Game.getObjectById(creep.memory.sourceId);
    // If source is gone or depleted, return home and suicide
    if (!source || source.energy === 0) {
        returnHome(creep);
        return;
    }
    // If we're not in the source room, move there
    if (creep.room.name !== source.room.name) {
        moveCached(creep, source.pos, `toSrc_${source.id}`);
        return;
    }
    // In the source room: harvest
    const result = creep.harvest(source);
    if (result === ERR_NOT_IN_RANGE) {
        moveCached(creep, source.pos, `nearSrc_${source.id}`);
    }
}
function returnHome(creep) {
    const homeRoom = creep.memory.homeRoom;
    if (!homeRoom) {
        creep.suicide();
        return;
    }
    if (creep.room.name !== homeRoom) {
        moveCached(creep, new RoomPosition(25, 25, homeRoom), "returnHome");
        return;
    }
    // Recycle at spawn or just suicide
    const spawns = creep.room.find(FIND_MY_SPAWNS);
    if (spawns.length > 0) {
        const ret = spawns[0].recycleCreep(creep);
        if (ret === ERR_NOT_IN_RANGE) {
            moveCached(creep, spawns[0].pos, "toSpawn");
        }
    }
    else {
        creep.suicide();
    }
}
//# sourceMappingURL=remoteHarvester.js.map