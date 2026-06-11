"use strict";
/**
 * Cache v0.1.0 — Upgrader role.
 *
 * Withdraws energy from the best available source (dropped → storage/container
 * → spawn/extensions) and upgrades the room controller.
 *
 * CPU optimisations:
 *   - Path caching (25-tick reuse) avoids per-tick pathfinding.
 *   - Cached room structure lookups replace findClosestByPath.
 *   - findClosestByRange used for final source selection within a room.
 *   - Dropped energy checked first (cheapest pickup, zero withdraw cost).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpgrader = runUpgrader;
const cache_1 = require("../utils/cache");
// ---------------------------------------------------------------------------
// Path caching — same pattern as remoteHarvester / remoteHauler
// ---------------------------------------------------------------------------
const PATH_CACHE_TTL = 25;
function moveCached(creep, dest, key) {
    var _a;
    const ageKey = `up_pa_${key}`;
    const pathKey = `up_pp_${key}`;
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
// Energy-source selection
// ---------------------------------------------------------------------------
/**
 * Find the best energy source for the upgrader, in priority order:
 *   1. Dropped energy (no withdraw cost, no structure dependency).
 *   2. Storage or container (large buffers, shared).
 *   3. Spawns and extensions (fallback, uses cached room structures).
 *
 * Uses findClosestByRange for CPU efficiency (no pathfinding here).
 */
function findEnergySource(creep) {
    // 1. Dropped energy — cheapest pickup
    const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY &&
            r.amount >= creep.store.getFreeCapacity(),
    });
    if (dropped)
        return dropped;
    // 2. Storage or container with energy
    const storeSrc = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_STORAGE ||
            s.structureType === STRUCTURE_CONTAINER) &&
            s.store[RESOURCE_ENERGY] > 0,
    });
    if (storeSrc)
        return storeSrc;
    // 3. Spawns & extensions (use room-level cached structure list)
    const sinks = (0, cache_1.roomStructures)(creep.room, (s) => (s.structureType === STRUCTURE_SPAWN ||
        s.structureType === STRUCTURE_EXTENSION) &&
        s.store[RESOURCE_ENERGY] > 0);
    if (sinks.length > 0) {
        return creep.pos.findClosestByRange(sinks);
    }
    return null;
}
// ---------------------------------------------------------------------------
// Main role
// ---------------------------------------------------------------------------
function runUpgrader(creep) {
    // If empty, refill from best source
    if (creep.store[RESOURCE_ENERGY] === 0) {
        const target = findEnergySource(creep);
        if (target) {
            if (target instanceof Resource) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    moveCached(creep, target.pos, `pickup_${target.id}`);
                }
            }
            else {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    moveCached(creep, target.pos, `withdraw_${target.id}`);
                }
            }
        }
        return;
    }
    // We have energy — upgrade the controller
    const ctrl = creep.room.controller;
    if (ctrl) {
        const result = creep.upgradeController(ctrl);
        if (result === ERR_NOT_IN_RANGE) {
            moveCached(creep, ctrl.pos, "ctrl");
        }
    }
}
//# sourceMappingURL=upgrader.js.map