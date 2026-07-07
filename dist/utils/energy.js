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
const expansion_1 = require("../expansion");
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
    // 3. Storage — but NOT while it is being accumulated as the expansion war
    //    chest (buildingExpansionReserve): that energy is reserved capital until
    //    the colony claims its next room, so draining it here would stop the
    //    buffer ever reaching EXPANSION_STORAGE_RESERVE and re-open the low-GCL
    //    deadlock. Collapse recovery has its own escape hatch in the hauler
    //    (shouldRefillFromStorage), so survival is never blocked by this lock.
    if (data.storage &&
        data.storage.store[RESOURCE_ENERGY] > 0 &&
        !(0, expansion_1.buildingExpansionReserve)(data.room)) {
        if (creep.withdraw(data.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, data.storage);
        return true;
    }
    // 4. Controller container — upgraders' dedicated supply, adjacent to the
    //    controller.  Haulers fill it after spawn/extensions, so it tends to
    //    have energy when the colony is running a surplus.
    if (data.controllerContainer && data.controllerContainer.store[RESOURCE_ENERGY] >= MIN_PICKUP) {
        if (creep.withdraw(data.controllerContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            (0, movement_1.travel)(creep, data.controllerContainer);
        }
        return true;
    }
    // 5. Source containers (fullest first).
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
    // 6. Bootstrap shared buffer: with no containers/storage yet (steps 3-5 found
    //    nothing), draw from spawn/extensions — but ONLY when the buffer has
    //    accumulated a meaningful amount (≥ 50 e).  Harvesters refill them at
    //    ~2-4 e/tick during bootstrap; withdrawing 1-10 e every tick prevents the
    //    spawn from ever reaching the 200 e needed for a new harvester, which is
    //    the energy-poverty death spiral (live W43N38: 1 e / 2300 capacity, 2
    //    harvesters, spawn can never afford a third).  A 50 e threshold matches
    //    the builder fast-gather path and MIN_PICKUP, and lets the spawn
    //    accumulate enough to spawn while still giving workers access when there
    //    is real surplus.  The spawn manager runs BEFORE creep dispatch each tick,
    //    so spawning always claims its energy first — workers only take what
    //    spawning left behind.
    const buffer = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
            s.store[RESOURCE_ENERGY] >= 50,
    });
    if (buffer) {
        if (creep.withdraw(buffer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, buffer);
        return true;
    }
    // 6. Last resort: harvest an active source directly.
    const src = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
    if (src) {
        if (creep.harvest(src) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, src);
        return true;
    }
    return false;
}
//# sourceMappingURL=energy.js.map