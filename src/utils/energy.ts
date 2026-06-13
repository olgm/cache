/**
 * Cache — shared energy acquisition.
 *
 * Used by generalist consumers (builders, upgraders) to fill up from the best
 * available source. Order is chosen to keep the colony healthy: free/cheap
 * energy first (dropped, tombstones, ruins), then buffers (storage, source
 * containers), and finally a direct-harvest fallback so a creep is NEVER idle
 * during the early bootstrap when no buffers exist yet.
 *
 * Deliberately does NOT pull from spawns/extensions — that energy is reserved
 * for spawning, and draining it would stall creep production.
 */

import { RoomData } from "./roomData";
import { travel } from "./movement";

const MIN_PICKUP = 50;

/** True if the creep issued a gather action (move/withdraw/pickup/harvest). */
export function gatherEnergy(creep: Creep, data: RoomData): boolean {
  // 1. Dropped energy — cheapest, and it would otherwise decay.
  const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= MIN_PICKUP,
  });
  if (dropped) {
    if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) travel(creep, dropped);
    return true;
  }

  // 2. Tombstones / ruins.
  const tomb = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
    filter: (t) => t.store[RESOURCE_ENERGY] >= MIN_PICKUP,
  });
  if (tomb) {
    if (creep.withdraw(tomb, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, tomb);
    return true;
  }
  const ruin = creep.pos.findClosestByRange(FIND_RUINS, {
    filter: (r) => r.store[RESOURCE_ENERGY] >= MIN_PICKUP,
  });
  if (ruin) {
    if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, ruin);
    return true;
  }

  // 3. Storage.
  if (data.storage && data.storage.store[RESOURCE_ENERGY] > 0) {
    if (creep.withdraw(data.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, data.storage);
    return true;
  }

  // 4. Source containers (fullest first).
  const containers = data.sources
    .map((s) => s.container)
    .filter((c): c is StructureContainer => !!c && c.store[RESOURCE_ENERGY] >= MIN_PICKUP)
    .sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
  if (containers.length > 0) {
    const c = containers[0];
    if (creep.withdraw(c, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, c);
    return true;
  }

  // 5. Bootstrap shared buffer: with no containers/storage yet (steps 3-4 found
  //    nothing), draw from spawn/extensions. Harvesters refill them, and the
  //    spawn manager runs BEFORE creep dispatch each tick, so spawning always
  //    claims its energy first — workers only ever take the leftover. This is
  //    far more efficient than competing with harvesters for source tiles, and
  //    is what lets the first extensions actually get built at cap=300.
  const buffer = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (s) =>
      (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
      s.store[RESOURCE_ENERGY] > 0,
  });
  if (buffer) {
    if (creep.withdraw(buffer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, buffer);
    return true;
  }

  // 6. Last resort: harvest an active source directly.
  const src = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
  if (src) {
    if (creep.harvest(src) === ERR_NOT_IN_RANGE) travel(creep, src);
    return true;
  }

  return false;
}
