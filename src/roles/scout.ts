/**
 * Cache v0.0.3 — Scout role.
 *
 * Travels to the target room (creep.memory.targetRoom), records intel via
 * the expansion manager, and returns or scouts the next unknown adjacent
 * room.  Scouts are cheap MOVE-only creeps designed to be disposable.
 */

import { recordScoutIntel } from "../expansion";

export function runScout(creep: Creep): void {
  let targetRoom = creep.memory.targetRoom;

  if (!targetRoom) {
    // No target — pick an unexplored adjacent room from our spawns.
    const next = findUnexploredAdjacent(creep);
    if (next) {
      creep.memory.targetRoom = next;
      targetRoom = next;
    } else {
      // Nothing to scout — suicide to free up CPU
      creep.suicide();
      return;
    }
  }

  // Record intel for the room we're in
  recordScoutIntel(creep.room.name);

  // Move to target
  if (creep.room.name !== targetRoom) {
    const exitDir = creep.room.findExitTo(targetRoom);
    if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
      const exitPos = creep.pos.findClosestByRange(exitDir);
      if (exitPos) creep.moveTo(exitPos);
    }
    return;
  }

  // We arrived — record intel
  recordScoutIntel(targetRoom);

  // Pick next unexplored adjacent room
  creep.memory.targetRoom = undefined;
  targetRoom = undefined;
  const next = findUnexploredAdjacent(creep);
  if (next) {
    creep.memory.targetRoom = next;
    targetRoom = next;
  } else {
    // All adjacent rooms explored — head home
    returnToSpawn(creep);
  }
}

/** Find an adjacent room we haven't scouted yet from the creep's current room. */
function findUnexploredAdjacent(creep: Creep): string | null {
  const mem = Memory.expansion;
  const scouted = mem?.scoutedRooms ?? {};

  const exits = Game.map.describeExits(creep.room.name);
  if (!exits) return null;

  for (const roomName of Object.values(exits)) {
    if (!scouted[roomName] || Game.time - scouted[roomName] > 1500) {
      return roomName;
    }
  }

  return null;
}

/** Move back towards a spawn room. */
function returnToSpawn(creep: Creep): void {
  for (const name in Game.spawns) {
    const spawn = Game.spawns[name];
    if (creep.room.name === spawn.room.name) {
      // Reached home — suicide to free up CPU
      creep.suicide();
      return;
    }
    const exitDir = creep.room.findExitTo(spawn.room.name);
    if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
      const exitPos = creep.pos.findClosestByRange(exitDir);
      if (exitPos) creep.moveTo(exitPos);
      return;
    }
  }
  // No path? Just suicide.
  creep.suicide();
}
