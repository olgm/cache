"use strict";
/**
 * Cache v0.0.1 — Builder role.
 * Builds construction sites; repairs when nothing to build.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuilder = runBuilder;
function runBuilder(creep) {
    if (creep.store[RESOURCE_ENERGY] === 0) {
        // Withdraw from spawn or extensions
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
    // Build nearest construction site
    const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (site) {
        if (creep.build(site) === ERR_NOT_IN_RANGE) {
            creep.moveTo(site);
        }
        return;
    }
    // Fallback: repair a damaged structure under 50% (optional, avoid idle)
    const toRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.hits < s.hitsMax * 0.5 && s.structureType !== STRUCTURE_WALL,
    });
    if (toRepair) {
        if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) {
            creep.moveTo(toRepair);
        }
    }
}
//# sourceMappingURL=builder.js.map