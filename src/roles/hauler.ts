/**
 * Cache — Hauler role (logistics).
 *
 * Ferries energy from source containers / dropped piles to where it is needed:
 * spawn & extensions first (so the colony keeps spawning), then towers, then the
 * controller container (upgrader supply), then storage as the overflow buffer.
 * Under attack, towers jump to the front of the queue.
 */

import { travel } from "../utils/movement";
import { getRoomData, RoomData } from "../utils/roomData";

export function runHauler(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  if (creep.room.name !== home) {
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  // Toggle collect/deliver at the capacity extremes.
  if (creep.store.getFreeCapacity() === 0) creep.memory.hauling = true;
  else if (creep.store[RESOURCE_ENERGY] === 0) creep.memory.hauling = false;

  const data = getRoomData(creep.room);

  if (creep.memory.hauling) deliver(creep, data);
  else collect(creep, data);
}

/** Pick up energy from the fullest source container or a dropped pile. */
function collect(creep: Creep, data: RoomData): void {
  // Dropped energy (drop-mining overflow) — grab the biggest pile.
  const piles = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50,
  });
  // Source containers with meaningful energy.
  const containers = data.sources
    .map((s) => s.container)
    .filter((c): c is StructureContainer => !!c && c.store[RESOURCE_ENERGY] >= 50);

  // Prefer whichever holds the most, to avoid containers overflowing.
  const bestContainer = containers.sort(
    (a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY],
  )[0];
  const bestPile = piles.sort((a, b) => b.amount - a.amount)[0];

  if (bestPile && (!bestContainer || bestPile.amount > bestContainer.store[RESOURCE_ENERGY])) {
    if (creep.pickup(bestPile) === ERR_NOT_IN_RANGE) travel(creep, bestPile);
    return;
  }
  if (bestContainer) {
    if (creep.withdraw(bestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, bestContainer);
    return;
  }

  // Nothing buffered yet: recover tombstones/ruins, else wait near a source.
  const tomb = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
    filter: (t) => t.store[RESOURCE_ENERGY] >= 50,
  });
  if (tomb) {
    if (creep.withdraw(tomb, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, tomb);
    return;
  }
  if (data.sources[0]) travel(creep, data.sources[0].source, 2);
}

/** Deliver to the highest-priority sink that still has room. */
function deliver(creep: Creep, data: RoomData): void {
  const target = chooseSink(creep, data);
  if (!target) {
    // Everything is full — sit on the storage/controller area rather than churn.
    if (data.storage) travel(creep, data.storage, 1);
    return;
  }
  if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, target);
}

function chooseSink(creep: Creep, data: RoomData): Structure | null {
  const spawnExt = [...data.spawns, ...data.extensions].filter(
    (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  );
  const towers = data.towers.filter((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

  // Under attack, keep towers topped up before anything else.
  if (data.hostiles.length > 0 && towers.length > 0) {
    return creep.pos.findClosestByRange(towers);
  }

  if (spawnExt.length > 0) return creep.pos.findClosestByRange(spawnExt);
  if (towers.length > 0) return creep.pos.findClosestByRange(towers);

  if (data.controllerContainer && data.controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    return data.controllerContainer;
  }
  if (data.storage && data.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return data.storage;
  return null;
}
