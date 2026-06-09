"use strict";
/**
 * Cache v0.0.1 — Upgrader role.
 * Withdraws energy from spawn/extensions and upgrades the room controller.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpgrader = runUpgrader;
function runUpgrader(creep) {
    if (creep.store[RESOURCE_ENERGY] === 0) {
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_SPAWN ||
                s.structureType === STRUCTURE_EXTENSION) &&
                s.store[RESOURCE_ENERGY] > 0,
        });
        if (target) {
            if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
        return;
    }
    const ctrl = creep.room.controller;
    if (ctrl) {
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
            creep.moveTo(ctrl);
        }
    }
}
//# sourceMappingURL=upgrader.js.map