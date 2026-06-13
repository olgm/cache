"use strict";
/**
 * Cache — Defender role.
 *
 * A melee fallback for when a room has hostiles but no tower (or the towers are
 * overwhelmed). Towers do the heavy lifting once built, so defenders are spawned
 * sparingly. Attacks the closest hostile; idles near the spawn otherwise.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDefender = runDefender;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
function runDefender(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    const data = (0, roomData_1.getRoomData)(creep.room);
    const target = creep.pos.findClosestByRange(data.hostiles);
    if (target) {
        const range = creep.pos.getRangeTo(target);
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && range <= 3)
            creep.rangedAttack(target);
        if (creep.attack(target) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, target, 1);
        return;
    }
    // No threat: rally on the spawn.
    if (data.spawns[0])
        (0, movement_1.travel)(creep, data.spawns[0], 2);
}
//# sourceMappingURL=defender.js.map