"use strict";
/**
 * Cache — shared energy acquisition.
 *
 * Used by generalist consumers (builders, upgraders) to fill up from the best
 * available source. Order is chosen to keep the colony healthy: free/cheap
 * energy first (dropped, tombstones, ruins), then buffers (storage, source
 * containers), and finally a direct-harvest fallback so a creep is NEVER idle
 * during the early bootstrap when no buffers exist yet.
 *
 * Deliberately does NOT pull from spawns/extensions — that energy is reserved
 * for spawning, and draining it would stall creep production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatherEnergy = gatherEnergy;
const movement_1 = require("./movement");
const MIN_PICKUP = 50;
/** True if the creep issued a gather action (move/withdraw/pickup/harvest). */
function gatherEnergy(creep, data) {
    // 1. Dropped energy — cheapest, and it would otherwise decay.
    const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= MIN_PICKUP,
    });
    if (dropped) {
        if (creep.pickup(dropped) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, dropped);
        return true;
    }
    // 2. Tombstones / ruins.
    const tomb = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
        filter: (t) => t.store[RESOURCE_ENERGY] >= MIN_PICKUP,
    });
    if (tomb) {
        if (creep.withdraw(tomb, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, tomb);
        return true;
    }
    const ruin = creep.pos.findClosestByRange(FIND_RUINS, {
        filter: (r) => r.store[RESOURCE_ENERGY] >= MIN_PICKUP,
    });
    if (ruin) {
        if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ruin);
        return true;
    }
    // 3. Storage.
    if (data.storage && data.storage.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(data.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, data.storage);
        return true;
    }
    // 4. Source containers (fullest first).
    const containers = data.sources
        .map((s) => s.container)
        .filter((c) => !!c && c.store[RESOURCE_ENERGY] >= MIN_PICKUP)
        .sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
    if (containers.length > 0) {
        const c = containers[0];
        if (creep.withdraw(c, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, c);
        return true;
    }
    // 5. Fallback: harvest an active source directly (bootstrap generalist).
    const src = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
    if (src) {
        if (creep.harvest(src) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, src);
        return true;
    }
    return false;
}
//# sourceMappingURL=energy.js.map