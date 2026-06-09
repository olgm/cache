/**
 * Cache v0.0.1 — Harvester role.
 * Finds an energy source in its room and harvests from it.
 */

import { cached } from "../utils/cache";

export function runHarvester(creep: Creep): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    // Deliver to spawn or extensions
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: s =>
        (s.structureType === STRUCTURE_SPAWN ||
          s.structureType === STRUCTURE_EXTENSION) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
    return;
  }

  // Harvest from nearest source
  const source = cached(`source:${creep.room.name}`, () =>
    creep.pos.findClosestByPath(FIND_SOURCES)
  );
  if (source) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
  }
}
