/**
 * Cache — Remote harvester role.
 *
 * Travels to an unowned adjacent room, harvests a source, and brings energy back
 * to the home room.  Uses the same travel helper as other roles so path reuse
 * works across ticks.
 *
 * Body: heavy on WORK + CARRY (2:1 ratio of CARRY to WORK), with enough MOVE
 * to stay mobile even on plains — a remote harvester must walk between rooms,
 * so move efficiency matters more than for a static miner.
 */

import { travel } from "../utils/movement";
import { getRoomData } from "../utils/roomData";

export function runRemoteHarvester(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  const targetRoom = creep.memory.targetRoom;

  if (!targetRoom) {
    // No target — this shouldn't happen; just idle.
    return;
  }

  // Toggle working state at capacity extremes.
  if (creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
  } else if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
  }

  if (creep.memory.working) {
    deliverHome(creep, home);
  } else {
    harvestRemote(creep, targetRoom);
  }
}

// ---------------------------------------------------------------------------
// Harvesting in the remote room
// ---------------------------------------------------------------------------

function harvestRemote(creep: Creep, targetRoom: string): void {
  // If not in the target room, travel there.
  if (creep.room.name !== targetRoom) {
    travel(creep, new RoomPosition(25, 25, targetRoom), 20);
    return;
  }

  // In the target room: find and harvest the assigned source.
  let source: Source | null = creep.memory.sourceId
    ? Game.getObjectById(creep.memory.sourceId)
    : null;

  // Self-heal: if the source is missing (room changed?), pick another.
  if (!source) {
    const sources = creep.room.find(FIND_SOURCES);
    if (sources.length > 0) {
      source = sources[0];
    }
    if (source) creep.memory.sourceId = source.id;
  }
  if (!source) return;

  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    travel(creep, source);
  }
}

// ---------------------------------------------------------------------------
// Delivery in the home room
// ---------------------------------------------------------------------------

function deliverHome(creep: Creep, home: string): void {
  // If not in the home room, travel there.
  if (creep.room.name !== home) {
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  const data = getRoomData(creep.room);

  // Priority delivery order: spawn/extensions → towers → storage.
  const spawnExt = [...data.spawns, ...data.extensions].filter(
    (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  );
  if (spawnExt.length > 0) {
    const target = creep.pos.findClosestByRange(spawnExt);
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, target);
      return;
    }
  }

  const tower = data.towers.find((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
  if (tower) {
    if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, tower);
    return;
  }

  if (data.storage && data.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    if (creep.transfer(data.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, data.storage);
    return;
  }

  // Everything full — upgrade controller rather than idle.
  const ctrl = creep.room.controller;
  if (ctrl) {
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
  }
}
