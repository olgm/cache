/**
 * Cache v0.1.1 — Remote hauler role.
 *
 * Moves between a home room and a remote room, picking up dropped energy
 * from remote harvesters and delivering it to spawn/extension/storage.
 *
 * v0.1.1 CPU optimisations:
 *   - Uses room-level cached structure list + findClosestByRange instead of
 *     per-creep findClosestByPath in the home room (big CPU saving).
 *   - Caches inter-room paths in creep memory (25-tick reuse).
 *   - Uses findClosestByRange for dropped energy instead of findClosestByPath.
 */

import { cached, roomStructures, F_ENERGY_SINK } from "../utils/cache";

// ---------------------------------------------------------------------------
// Path caching (same pattern as upgrader — avoids per-tick pathfinding)
// ---------------------------------------------------------------------------

const PATH_CACHE_TTL = 25;

function moveCached(
  creep: Creep,
  dest: RoomPosition,
  key: string,
): void {
  const ageKey = `rh_pa_${key}`;
  const pathKey = `rh_pp_${key}`;
  const mem = creep.memory as Record<string, unknown>;
  const age = (mem[ageKey] as number) ?? 999;

  if (age > PATH_CACHE_TTL) {
    const path = creep.pos.findPathTo(dest, { maxOps: 200, ignoreCreeps: false });
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

export function runRemoteHauler(creep: Creep): void {
  const targetRoom = creep.memory.targetRoom;
  const homeRoom = creep.memory.homeRoom;

  if (!targetRoom || !homeRoom) {
    console.log(`RemoteHauler ${creep.name}: missing target/home room, suiciding.`);
    creep.suicide();
    return;
  }

  // Phase tracking
  if (creep.store.getFreeCapacity() === 0) {
    creep.memory.hauling = true;
  } else if (creep.store.getUsedCapacity() === 0) {
    creep.memory.hauling = false;
  }

  if (creep.memory.hauling) {
    // --- DELIVER ENERGY HOME ---
    if (creep.room.name !== homeRoom) {
      moveCached(creep, new RoomPosition(25, 25, homeRoom), "home");
      return;
    }

    // Use room-level cached structure list + creep-local findClosestByRange
    // to avoid per-creep findClosestByPath (pathfinding is expensive).
    const sinks = roomStructures(creep.room, F_ENERGY_SINK);
    if (sinks.length === 0) {
      // Also check tower + storage (not in F_ENERGY_SINK)
      const tsinks = cached(`rh_tsink_${creep.room.name}`, () =>
        creep.room
          .find(FIND_MY_STRUCTURES, {
            filter: (s) =>
              (s.structureType === STRUCTURE_TOWER ||
                s.structureType === STRUCTURE_STORAGE) &&
              s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
          })
          .concat(
            creep.room.find(FIND_MY_STRUCTURES, {
              filter: (s) =>
                (s.structureType === STRUCTURE_SPAWN ||
                  s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            }),
          ),
      );
      if (tsinks.length > 0) {
        const t = creep.pos.findClosestByRange(tsinks);
        if (t) {
          if (creep.transfer(t, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            moveCached(creep, t.pos, `deliver_${t.id}`);
          }
        }
      }
      return;
    }

    const target = creep.pos.findClosestByRange(sinks);
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveCached(creep, target.pos, `deliver_${target.id}`);
      }
    }
  } else {
    // --- COLLECT ENERGY FROM REMOTE ROOM ---
    if (creep.room.name !== targetRoom) {
      moveCached(creep, new RoomPosition(25, 25, targetRoom), "remote");
      return;
    }

    // Use findClosestByRange for dropped energy (much cheaper than findClosestByPath)
    const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
      filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0,
    });

    if (dropped) {
      if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
        moveCached(creep, dropped.pos, `pickup_${dropped.id}`);
      }
    }
    // else: no energy to pick up; wait — no movement needed, saving CPU
  }
}
