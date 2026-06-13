/**
 * Cache — Defender role.
 *
 * A melee fallback for when a room has hostiles but no tower (or the towers are
 * overwhelmed). Towers do the heavy lifting once built, so defenders are spawned
 * sparingly. Attacks the closest hostile; idles near the spawn otherwise.
 */

import { travel } from "../utils/movement";
import { getRoomData } from "../utils/roomData";

export function runDefender(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  if (creep.room.name !== home) {
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  const data = getRoomData(creep.room);
  const target = creep.pos.findClosestByRange(data.hostiles);
  if (target) {
    const range = creep.pos.getRangeTo(target);
    if (creep.getActiveBodyparts(RANGED_ATTACK) > 0 && range <= 3) creep.rangedAttack(target);
    if (creep.attack(target) === ERR_NOT_IN_RANGE) travel(creep, target, 1);
    return;
  }

  // No threat: rally on the spawn.
  if (data.spawns[0]) travel(creep, data.spawns[0], 2);
}
