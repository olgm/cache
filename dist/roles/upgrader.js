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
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpgrader = runUpgrader;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
const energy_1 = require("../utils/energy");
function runUpgrader(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
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
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
        return;
    }
    const data = (0, roomData_1.getRoomData)(creep.room);
    const cc = data.controllerContainer;
    // Gather: prefer the controller container (adjacent, dedicated).
    if (cc && cc.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(cc, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, cc);
        return;
    }
    // Controller container exists but is empty.
    if (cc) {
        // Before parking, check whether spawn/extensions are flooding with energy
        // (>75 % full).  If so, drain them directly instead of sitting idle waiting
        // for a hauler that may be behind or dead — every tick the upgrader isn't
        // upgrading is a tick of wasted control-point potential.  Only park when
        // there is nowhere else to get energy.
        if (!data.storage) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0 && totalE > totalCap * 0.75) {
                const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
                if (src) {
                    if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        (0, movement_1.travel)(creep, src);
                    return;
                }
            }
        }
        // No surplus to drain — park beside the controller container so the
        // upgrader is right there when a hauler delivers.
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
//# sourceMappingURL=upgrader.js.map