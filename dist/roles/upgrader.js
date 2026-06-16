"use strict";
/**
 * Cache — Upgrader role.
 *
 * Fills from the controller container (its dedicated supply) when present, then
 * the general energy pool, and upgrades the room controller. Controller upgrades
 * are what earn both RCL and GCL progress, so a healthy economy keeps several
 * upgraders busy — the target count scales with surplus (storage) energy.
 *
 * Key design: when the controller container exists, the upgrader parks beside it
 * even when empty — walking across the room to a source container costs ticks
 * that are better spent waiting for the next hauler delivery.  The controller
 * container is the most efficient supply path because haulers bring energy right
 * to the upgrader's workstation.
 *
 * Starvation guard: if the upgrader has been parked at the controller container
 * for too long without energy arriving (haulers are behind or dead), it times
 * out and gathers from elsewhere rather than idling forever.  The idle counter
 * resets as soon as the creep picks up any energy, even a single tick's worth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpgrader = runUpgrader;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
const energy_1 = require("../utils/energy");
/**
 * Max ticks an upgrader will park beside an empty controller container before
 * falling back to the general energy pool.  A typical hauler cycle is ~25-40
 * ticks, so 50 gives one full cycle of slack.
 */
const PARK_TIMEOUT = 50;
/** Minimum energy in a nearby dropped pile / tombstone worth grabbing. */
const MIN_NEARBY = 50;
function runUpgrader(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
        creep.memory.upgraderIdleTicks = undefined; // reset idle counter during transit
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    const ctrl = creep.room.controller;
    if (!ctrl || !ctrl.my)
        return;
    // Upgrade whenever the creep has energy; gather only when empty.
    // The old full/empty toggle could trap upgraders in a futile gather loop
    // when energy was scarce — they'd never reach full carry and never upgrade.
    // The simple "upgrade on any energy" pattern ensures every joule picked up
    // is converted to control points without delay.
    if (creep.store[RESOURCE_ENERGY] > 0) {
        // Reset the starvation counter: energy arrived.
        creep.memory.upgraderIdleTicks = undefined;
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
        return;
    }
    const data = (0, roomData_1.getRoomData)(creep.room);
    const cc = data.controllerContainer;
    // Gather: prefer the controller container (adjacent, dedicated).
    if (cc && cc.store[RESOURCE_ENERGY] > 0) {
        creep.memory.upgraderIdleTicks = undefined; // energy is here, reset idle counter
        if (creep.withdraw(cc, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, cc);
        return;
    }
    // Controller container exists but is empty.
    if (cc) {
        // Always drain spawn/extensions when they are >50 % full — the energy is
        // already harvested and sitting idle; converting it to control points
        // immediately is better than waiting for a hauler route that may be slow
        // or stalled.  The spawn manager runs BEFORE creep dispatch, so spawning
        // always claims its energy first.
        if (!data.storage) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0 && totalE > totalCap * 0.5) {
                const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
                if (src) {
                    if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        (0, movement_1.travel)(creep, src);
                    return;
                }
            }
        }
        // Before parking, grab any energy that happens to be right here — dropped
        // piles, tombstones, or ruins within 5 tiles of the controller container.
        // These are free energy that requires negligible travel and no pathfinding.
        if (grabNearbyEnergy(creep, cc.pos))
            return;
        // Starvation guard: if the upgrader has been parked here for too long
        // without any energy arriving, the haulers are behind or dead.  Fall back
        // to the general energy pool rather than idling forever — every tick the
        // controller isn't being upgraded is a tick of wasted GCL/RCL progress.
        const idleTicks = creep.memory.upgraderIdleTicks || 0;
        if (idleTicks >= PARK_TIMEOUT) {
            (0, energy_1.gatherEnergy)(creep, data);
            return;
        }
        creep.memory.upgraderIdleTicks = idleTicks + 1;
        // Park beside the controller container so the upgrader is right there
        // when a hauler delivers.
        (0, movement_1.travel)(creep, cc);
        return;
    }
    // No controller container: use the general energy pool.  The waste-
    // prevention path drains spawn/extensions when they're flooding (>50 %
    // full), which is faster than walking to a source in the bootstrap phase.
    if (!data.storage) {
        const spawnExt = [...data.spawns, ...data.extensions];
        const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
        const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
        if (totalCap > 0 && totalE > totalCap * 0.5) {
            const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
            if (src) {
                if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    (0, movement_1.travel)(creep, src);
                return;
            }
        }
    }
    (0, energy_1.gatherEnergy)(creep, data);
}
/**
 * Pick up nearby dropped energy, tombstones, or ruins within range 5 of `pos`.
 * Returns true if energy was found and an action was taken.
 */
function grabNearbyEnergy(creep, pos) {
    const dropped = pos.findInRange(FIND_DROPPED_RESOURCES, 5, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= MIN_NEARBY,
    });
    if (dropped.length > 0) {
        // Take the biggest pile.
        const best = dropped.sort((a, b) => b.amount - a.amount)[0];
        if (creep.pickup(best) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    const tomb = pos.findInRange(FIND_TOMBSTONES, 5, {
        filter: (t) => t.store[RESOURCE_ENERGY] >= MIN_NEARBY,
    });
    if (tomb.length > 0) {
        const best = tomb.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])[0];
        if (creep.withdraw(best, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    const ruin = pos.findInRange(FIND_RUINS, 5, {
        filter: (r) => r.store[RESOURCE_ENERGY] >= MIN_NEARBY,
    });
    if (ruin.length > 0) {
        const best = ruin.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])[0];
        if (creep.withdraw(best, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    return false;
}
//# sourceMappingURL=upgrader.js.map