"use strict";
/**
 * Cache v0.0.3 — Claimer role.
 *
 * Moves to the target room (stored in creep.memory.targetRoom) and claims
 * the controller.  Once the claim succeeds the creep flags itself as done
 * (creep.memory.claimed = true) and the expansion manager can move on.
 *
 * After claiming the creep switches to upgrading the new controller to
 * kick-start GCL progress in the new room.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runClaimer = runClaimer;
const expansion_1 = require("../expansion");
function runClaimer(creep) {
    // If we already claimed, help upgrade the new room's controller.
    if (creep.memory.claimed) {
        const ctrl = creep.room.controller;
        if (ctrl && ctrl.my) {
            if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
                creep.moveTo(ctrl);
            }
        }
        else {
            // Try to move back towards a spawn room (simple: head to any owned room)
            returnToSpawn(creep);
        }
        return;
    }
    const targetRoom = creep.memory.targetRoom;
    if (!targetRoom) {
        // No target — suicide or idle
        console.log(`Claimer ${creep.name} has no target room.`);
        return;
    }
    // Move to target room
    if (creep.room.name !== targetRoom) {
        // Record intel as we travel
        (0, expansion_1.recordScoutIntel)(creep.room.name);
        const exitDir = creep.room.findExitTo(targetRoom);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
            const exitPos = creep.pos.findClosestByRange(exitDir);
            if (exitPos)
                creep.moveTo(exitPos);
        }
        return;
    }
    // We are in the target room — record intel
    (0, expansion_1.recordScoutIntel)(creep.room.name);
    const ctrl = creep.room.controller;
    if (!ctrl) {
        console.log(`Claimer ${creep.name}: no controller in ${targetRoom}.`);
        creep.memory.claimed = true;
        return;
    }
    // If already ours, we're done claiming
    if (ctrl.my) {
        creep.memory.claimed = true;
        return;
    }
    // Claim it
    const result = creep.claimController(ctrl);
    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(ctrl);
    }
    else if (result === OK) {
        creep.memory.claimed = true;
        creep.say("claimed!");
    }
    else if (result === ERR_GCL_NOT_ENOUGH) {
        // We can't claim yet — wait and upgrade instead to signal presence
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
            creep.moveTo(ctrl);
        }
    }
}
/** Naively move back towards any spawn room. */
function returnToSpawn(creep) {
    for (const name in Game.spawns) {
        const spawn = Game.spawns[name];
        if (creep.room.name === spawn.room.name)
            return; // already there
        const exitDir = creep.room.findExitTo(spawn.room.name);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
            const exitPos = creep.pos.findClosestByRange(exitDir);
            if (exitPos)
                creep.moveTo(exitPos);
            return;
        }
    }
}
//# sourceMappingURL=claimer.js.map