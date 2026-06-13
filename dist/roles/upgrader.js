"use strict";
/**
 * Cache — Upgrader role.
 *
 * Fills from the controller container (its dedicated supply) when present, then
 * the general energy pool, and upgrades the room controller. Controller upgrades
 * are what earn both RCL and GCL progress, so a healthy economy keeps several
 * upgraders busy — the target count scales with surplus (storage) energy.
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
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0)
        creep.memory.working = false;
    else if (!creep.memory.working && creep.store.getFreeCapacity() === 0)
        creep.memory.working = true;
    if (creep.memory.working) {
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
        return;
    }
    // Gather: prefer the controller container (adjacent, dedicated).
    const data = (0, roomData_1.getRoomData)(creep.room);
    const cc = data.controllerContainer;
    if (cc && cc.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(cc, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, cc);
        return;
    }
    // Waste prevention: when spawn+extensions are nearly full (>80%), pull from
    // them directly so harvested energy doesn't pile up behind a capped buffer.
    // This only fires when there's no controller container (the fast path above),
    // and only when there's no storage to absorb the surplus.
    if (!data.storage) {
        const spawnExt = [...data.spawns, ...data.extensions];
        const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
        const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
        if (totalCap > 0 && totalE > totalCap * 0.8) {
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