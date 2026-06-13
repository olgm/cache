/**
 * Cache — Pioneer role.
 *
 * Bootstraps a freshly-claimed room: travels there, mines the local sources, and
 * builds construction sites — most importantly the first spawn (placed by the
 * construction planner). When there's nothing to build it upgrades the
 * controller so the room doesn't downgrade. Once the room has its own spawn the
 * expansion manager stops sending pioneers and the new colony runs itself.
 */

import { travel, travelToRoom } from "../utils/movement";

export function runPioneer(creep: Creep): void {
  const target = creep.memory.targetRoom;

  if (target && creep.room.name !== target) {
    travelToRoom(creep, target);
    return;
  }

  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) creep.memory.working = false;
  else if (!creep.memory.working && creep.store.getFreeCapacity() === 0) creep.memory.working = true;

  if (!creep.memory.working) {
    const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
    if (source) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) travel(creep, source);
    }
    return;
  }

  // Build the spawn first, then anything else.
  const sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
  const spawnSite = sites.find((s) => s.structureType === STRUCTURE_SPAWN);
  const site = spawnSite || sites[0];
  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) travel(creep, site, 3);
    return;
  }

  const ctrl = creep.room.controller;
  if (ctrl && ctrl.my) {
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
  }
}
