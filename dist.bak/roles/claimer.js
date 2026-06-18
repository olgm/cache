"use strict";
/**
 * Cache — Claimer role.
 *
 * Travels to its target room and claims the controller, then helps upgrade it
 * (signalling presence and starting RCL progress) until it expires. The
 * expansion gate guarantees GCL headroom before a claimer is ever spawned, so a
 * claim should always succeed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runClaimer = runClaimer;
const movement_1 = require("../utils/movement");
const expansion_1 = require("../expansion");
function runClaimer(creep) {
    const target = creep.memory.targetRoom;
    if (!target)
        return; // no target — let it expire harmlessly
    (0, expansion_1.recordIntel)(creep.room);
    if (creep.room.name !== target) {
        (0, movement_1.travelToRoom)(creep, target);
        return;
    }
    const ctrl = creep.room.controller;
    if (!ctrl)
        return;
    if (ctrl.my) {
        creep.memory.claimed = true;
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
        return;
    }
    const res = creep.claimController(ctrl);
    if (res === ERR_NOT_IN_RANGE) {
        (0, movement_1.travel)(creep, ctrl);
    }
    else if (res === OK) {
        creep.memory.claimed = true;
        creep.say("claimed");
    }
    else if (res === ERR_GCL_NOT_ENOUGH) {
        // Shouldn't happen behind the gate; reserve to hold the room meanwhile.
        if (creep.reserveController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl);
    }
}
//# sourceMappingURL=claimer.js.map