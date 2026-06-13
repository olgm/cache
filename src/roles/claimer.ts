/**
 * Cache — Claimer role.
 *
 * Travels to its target room and claims the controller, then helps upgrade it
 * (signalling presence and starting RCL progress) until it expires. The
 * expansion gate guarantees GCL headroom before a claimer is ever spawned, so a
 * claim should always succeed.
 */

import { travel, travelToRoom } from "../utils/movement";
import { recordIntel } from "../expansion";

export function runClaimer(creep: Creep): void {
  const target = creep.memory.targetRoom;
  if (!target) return; // no target — let it expire harmlessly

  recordIntel(creep.room);

  if (creep.room.name !== target) {
    travelToRoom(creep, target);
    return;
  }

  const ctrl = creep.room.controller;
  if (!ctrl) return;

  if (ctrl.my) {
    creep.memory.claimed = true;
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
    return;
  }

  const res = creep.claimController(ctrl);
  if (res === ERR_NOT_IN_RANGE) {
    travel(creep, ctrl);
  } else if (res === OK) {
    creep.memory.claimed = true;
    creep.say("claimed");
  } else if (res === ERR_GCL_NOT_ENOUGH) {
    // Shouldn't happen behind the gate; reserve to hold the room meanwhile.
    if (creep.reserveController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl);
  }
}
