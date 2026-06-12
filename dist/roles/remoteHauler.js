"use strict";
/**
 * Cache v0.1.1 — Remote hauler role.
 *
 * Moves between a home room and a remote room, picking up dropped energy
 * from remote harvesters and delivering it to spawn/extension/storage.
 *
 * v0.1.1 CPU optimisations:
 *   - Uses room-level cached structure list + findClosestByRange instead of
 *     per-creep findClosestByPath in the home room (big CPU saving).
 *   - Caches inter-room paths in creep memory (25-tick reuse).
 *   - Uses findClosestByRange for dropped energy instead of findClosestByPath.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRemoteHauler = runRemoteHauler;
const cache_1 = require("../utils/cache");
// ---------------------------------------------------------------------------
// Haul tracking — update the remote op so we can measure throughput
// ---------------------------------------------------------------------------
function recordHaul(roomName, amount) {
    var _a, _b;
    const ops = (_a = Memory.remoteMining) === null || _a === void 0 ? void 0 : _a.ops;
    if (!ops || !ops[roomName])
        return;
    ops[roomName].totalHauled = ((_b = ops[roomName].totalHauled) !== null && _b !== void 0 ? _b : 0) + amount;
    ops[roomName].lastHaulTick = Game.time;
}
// ---------------------------------------------------------------------------
// Path caching (same pattern as upgrader — avoids per-tick pathfinding)
// ---------------------------------------------------------------------------
const PATH_CACHE_TTL = 25;
function moveCached(creep, dest, key) {
    var _a;
    const ageKey = `rh_pa_${key}`;
    const pathKey = `rh_pp_${key}`;
    const mem = creep.memory;
    const age = (_a = mem[ageKey]) !== null && _a !== void 0 ? _a : 999;
    if (age > PATH_CACHE_TTL) {
        const path = creep.pos.findPathTo(dest, {
            maxOps: 200,
            ignoreCreeps: false,
        });
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
function runRemoteHauler(creep) {
    const targetRoom = creep.memory.targetRoom;
    const homeRoom = creep.memory.homeRoom;
    if (!targetRoom || !homeRoom) {
        console.log(`RemoteHauler ${creep.name}: missing target/home room, suiciding.`);
        creep.suicide();
        return;
    }
    // Phase tracking
    if (creep.store.getFreeCapacity() === 0) {
        creep.memory.hauling = true;
    }
    else if (creep.store.getUsedCapacity() === 0) {
        creep.memory.hauling = false;
    }
    if (creep.memory.hauling) {
        // --- DELIVER ENERGY HOME ---
        if (creep.room.name !== homeRoom) {
            moveCached(creep, new RoomPosition(25, 25, homeRoom), "home");
            return;
        }
        // Use room-level cached structure list + creep-local findClosestByRange
        // to avoid per-creep findClosestByPath (pathfinding is expensive).
        const sinks = (0, cache_1.roomStructures)(creep.room, cache_1.F_ENERGY_SINK);
        if (sinks.length === 0) {
            // Also check tower + storage (not in F_ENERGY_SINK)
            const tsinks = (0, cache_1.cached)(`rh_tsink_${creep.room.name}`, () => creep.room
                .find(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_TOWER ||
                    s.structureType === STRUCTURE_STORAGE) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            })
                .concat(creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN ||
                    s.structureType === STRUCTURE_EXTENSION) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            })));
            if (tsinks.length > 0) {
                const t = creep.pos.findClosestByRange(tsinks);
                if (t) {
                    if (creep.transfer(t, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        moveCached(creep, t.pos, `deliver_${t.id}`);
                    }
                }
            }
            return;
        }
        const target = creep.pos.findClosestByRange(sinks);
        if (target) {
            const carried = creep.store.getUsedCapacity(RESOURCE_ENERGY);
            const result = creep.transfer(target, RESOURCE_ENERGY);
            if (result === OK && carried > 0) {
                // Track throughput for the remote op (amount = what we just delivered)
                const delivered = carried - creep.store.getUsedCapacity(RESOURCE_ENERGY);
                recordHaul(targetRoom, delivered);
            }
            else if (result === ERR_NOT_IN_RANGE) {
                moveCached(creep, target.pos, `deliver_${target.id}`);
            }
        }
    }
    else {
        // --- COLLECT ENERGY FROM REMOTE ROOM ---
        if (creep.room.name !== targetRoom) {
            moveCached(creep, new RoomPosition(25, 25, targetRoom), "remote");
            return;
        }
        // Priority 1: dropped energy on the ground
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0,
        });
        if (dropped) {
            if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                moveCached(creep, dropped.pos, `pickup_${dropped.id}`);
            }
            return;
        }
        // Priority 2: harvester carrying energy — move near it so it can transfer
        const harvester = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === "remoteHarvester" &&
                c.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
        });
        if (harvester) {
            // If in range 1, the harvester will transfer to us next tick
            if (creep.pos.getRangeTo(harvester) <= 1) {
                // Wait — harvester will transfer when it's full or on its next action
                return;
            }
            moveCached(creep, harvester.pos, `nearHrv_${harvester.id}`);
            return;
        }
        // Nothing to collect: return home to save CPU and avoid idle risk
        moveCached(creep, new RoomPosition(25, 25, homeRoom), "homeIdle");
        return;
    }
}
//# sourceMappingURL=remoteHauler.js.map