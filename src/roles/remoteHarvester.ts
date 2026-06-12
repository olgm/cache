/**
 * Cache v0.1.1 — Remote harvester role.
 *
 * Moves to a remote source in an adjacent room and harvests energy.
 * Stays at the source and drops energy for the hauler to pick up.
 * Returns home if the source is depleted or the room is hostile.
 *
 * v0.1.1: Added inter-room path caching (25-tick reuse) to avoid
 * per-tick moveTo pathfinding.
 */

// ---------------------------------------------------------------------------
// Path caching (same pattern as upgrader — avoids per-tick pathfinding)
// ---------------------------------------------------------------------------

const PATH_CACHE_TTL = 25;

function moveCached(creep: Creep, dest: RoomPosition, key: string): void {
  const ageKey = `rhv_pa_${key}`;
  const pathKey = `rhv_pp_${key}`;
  const mem = creep.memory as Record<string, unknown>;
  const age = (mem[ageKey] as number) ?? 999;

  if (age > PATH_CACHE_TTL) {
    const path = creep.pos.findPathTo(dest, {
      maxOps: 200,
      ignoreCreeps: false,
    });
    mem[pathKey] = Room.serializePath(path);
    mem[ageKey] = 0;
  }

  const cachedPath = mem[pathKey] as string | undefined;
  if (cachedPath) {
    creep.moveByPath(Room.deserializePath(cachedPath));
  } else {
    creep.moveTo(dest);
  }

  mem[ageKey] = (age as number) + 1;
}

// ---------------------------------------------------------------------------
// Main role
// ---------------------------------------------------------------------------

export function runRemoteHarvester(creep: Creep): void {
  // If we don't have a source id, mark as dead weight
  if (!creep.memory.sourceId) {
    console.log(`RemoteHarvester ${creep.name}: no sourceId, suiciding.`);
    creep.suicide();
    return;
  }

  let source = Game.getObjectById(creep.memory.sourceId);

  // Handle fallback/unknown source ids — when the remote-mining module
  // established an op from scout intel without exact source positions.
  // In that case we look up the first visible source when we enter the room.
  if (!source && creep.memory.targetRoom) {
    const sourcesInRoom = creep.room.find(FIND_SOURCES);
    if (sourcesInRoom.length > 0) {
      source = sourcesInRoom[0];
      // Update memory so we don't re-scan every tick
      creep.memory.sourceId = source.id;
    }
  }

  // If source is gone (destroyed or room changed), return home.
  // Do NOT return home just because energy is 0 — sources regenerate.
  if (!source) {
    returnHome(creep);
    return;
  }

  // Source is regenerating: wait (no action needed, save CPU)
  if (source.energy === 0) return;

  // If we're not in the source room, move there
  if (creep.room.name !== source.room.name) {
    moveCached(creep, source.pos, `toSrc_${source.id}`);
    return;
  }

  // In the source room: harvest, prefer transferring to nearby hauler
  if (creep.store.getFreeCapacity() === 0) {
    // Try direct transfer to a hauler in range 1 — avoids decay loss
    const hauler = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: (c) =>
        c.memory.role === "remoteHauler" &&
        c.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    if (hauler.length > 0) {
      creep.transfer(hauler[0], RESOURCE_ENERGY);
      return;
    }
    // No hauler nearby — drop on ground for later pickup
    creep.drop(RESOURCE_ENERGY);
    return;
  }
  const result = creep.harvest(source);
  if (result === ERR_NOT_IN_RANGE) {
    moveCached(creep, source.pos, `nearSrc_${source.id}`);
  }
}

function returnHome(creep: Creep): void {
  const homeRoom = creep.memory.homeRoom;
  if (!homeRoom) {
    creep.suicide();
    return;
  }

  if (creep.room.name !== homeRoom) {
    moveCached(creep, new RoomPosition(25, 25, homeRoom), "returnHome");
    return;
  }

  // Recycle at spawn or just suicide
  const spawns = creep.room.find(FIND_MY_SPAWNS);
  if (spawns.length > 0) {
    const ret = spawns[0].recycleCreep(creep);
    if (ret === ERR_NOT_IN_RANGE) {
      moveCached(creep, spawns[0].pos, "toSpawn");
    }
  } else {
    creep.suicide();
  }
}
