/**
 * Cache v0.2.0 — Remote scout role.
 *
 * Cheap MOVE-only creep dispatched by the remote-mining manager to
 * visit adjacent rooms and cache source info (knownSources) so that
 * remote ops can start even when the room goes dark.
 *
 * Behavior:
 *   1. Move to target room (creep.memory.targetRoom).
 *   2. On arrival, record all sources into Memory.remoteMining.knownSources.
 *   3. Pick the next unexplored adjacent room — or if none remain, return
 *      home and recycle/suicide.
 */

// ---------------------------------------------------------------------------
// Main role
// ---------------------------------------------------------------------------

export function runRemoteScout(creep: Creep): void {
  let targetRoom = creep.memory.targetRoom;

  if (!targetRoom) {
    // Pick an adjacent room we haven't cached source info for
    const next = pickUnexploredRoom(creep);
    if (next) {
      creep.memory.targetRoom = next;
      targetRoom = next;
    } else {
      // Nothing to scout — return home
      returnToSpawn(creep);
      return;
    }
  }

  // We are in a room — record source info for remote-mining
  recordKnownSources(creep.room.name);

  // Move to target room if not there yet
  if (creep.room.name !== targetRoom) {
    const exitDir = creep.room.findExitTo(targetRoom);
    if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
      const exitPos = creep.pos.findClosestByRange(exitDir);
      if (exitPos) creep.moveTo(exitPos);
    }
    return;
  }

  // Arrived — record sources, then pick next room
  recordKnownSources(targetRoom);
  creep.memory.targetRoom = undefined;

  const next = pickUnexploredRoom(creep);
  if (next) {
    creep.memory.targetRoom = next;
  } else {
    returnToSpawn(creep);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cache all source info from the current room into knownSources. */
function recordKnownSources(roomName: string): void {
  const room = Game.rooms[roomName];
  if (!room) return;

  // Ensure Memory.remoteMining exists
  if (!Memory.remoteMining) {
    Memory.remoteMining = { ops: {}, knownSources: {}, lastScoutTick: 0 };
  }
  if (!Memory.remoteMining.knownSources) {
    Memory.remoteMining.knownSources = {};
  }

  const sources = room.find(FIND_SOURCES);
  Memory.remoteMining.knownSources[roomName] = sources.map((src) => ({
    id: src.id,
    x: src.pos.x,
    y: src.pos.y,
    roomName: roomName,
    assignedHarvesters: 1,
    assignedHaulers: 1,
  }));
}

/** Pick an adjacent room we haven't cached source info for recently. */
function pickUnexploredRoom(creep: Creep): string | null {
  const knownSources = Memory.remoteMining?.knownSources ?? {};

  const exits = Game.map.describeExits(creep.room.name);
  if (!exits) return null;

  for (const roomName of Object.values(exits)) {
    // Skip rooms that are owned (don't trespass early-game)
    const room = Game.rooms[roomName];
    if (room && room.controller && room.controller.owner && !room.controller.my) {
      continue;
    }
    if (!knownSources[roomName] || Game.time - (knownSources[roomName] as unknown as number) > 1500) {
      return roomName;
    }
  }

  return null;
}

/** Move back towards a spawn room for recycling. */
function returnToSpawn(creep: Creep): void {
  for (const name in Game.spawns) {
    const spawn = Game.spawns[name];
    if (creep.room.name === spawn.room.name) {
      // Recycle at spawn
      const ret = spawn.recycleCreep(creep);
      if (ret === ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn.pos);
      }
      return;
    }
    const exitDir = creep.room.findExitTo(spawn.room.name);
    if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
      const exitPos = creep.pos.findClosestByRange(exitDir);
      if (exitPos) creep.moveTo(exitPos);
      return;
    }
  }
  creep.suicide();
}
