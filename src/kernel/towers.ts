/**
 * Cache — Tower control + safe-mode defense.
 *
 * Each owned room's towers: attack hostiles (focus-firing one target for kills),
 * else heal damaged friendly creeps, else perform conservative repairs (decayed
 * roads/containers, and ramparts/walls kept to a modest cap) only while the
 * tower has enough energy spare to not compromise defense.
 *
 * Safe mode is triggered only as a last resort — when a spawn is actually taking
 * damage and the room can't defend itself — to avoid burning the limited
 * activations on harmless intruders.
 */

import { myRooms, getRoomData, RoomData } from "../utils/roomData";

/** Don't repair below this tower energy (keep a defensive reserve). */
const TOWER_REPAIR_RESERVE = 500;
/** Repair roads/containers below this fraction of max hits. */
const DECAY_THRESHOLD = 0.6;
/** Maintain ramparts/walls up to this many hits (towers, not builders, hold the line). */
const BARRIER_TARGET = 20000;

export function runTowers(): void {
  for (const room of myRooms()) {
    try {
      const data = getRoomData(room);
      if (data.towers.length > 0) runRoomTowers(room, data);
      maybeSafeMode(room, data);
    } catch (e) {
      console.log(`CACHE tower error in ${room.name}: ${(e as Error)?.message}`);
    }
  }
}

function runRoomTowers(room: Room, data: RoomData): void {
  // 1. Attack — focus the hostile with the fewest hits (closest as tie-break).
  if (data.hostiles.length > 0) {
    const target = data.hostiles.reduce((best, h) =>
      h.hits < best.hits ? h : best,
    );
    for (const tower of data.towers) tower.attack(target);
    return;
  }

  // 2. Heal a damaged friendly creep.
  const wounded = room.find(FIND_MY_CREEPS, { filter: (c) => c.hits < c.hitsMax });
  if (wounded.length > 0) {
    const target = wounded[0];
    for (const tower of data.towers) {
      if (tower.store[RESOURCE_ENERGY] > TOWER_REPAIR_RESERVE) tower.heal(target);
    }
    return;
  }

  // 3. Repair (only with spare energy).
  for (const tower of data.towers) {
    if (tower.store[RESOURCE_ENERGY] <= TOWER_REPAIR_RESERVE) continue;
    const repair = pickRepairTarget(room);
    if (repair) tower.repair(repair);
  }
}

function pickRepairTarget(room: Room): Structure | null {
  // Decayed roads/containers first.
  const decayed = room.find(FIND_STRUCTURES, {
    filter: (s) =>
      (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) &&
      s.hits < s.hitsMax * DECAY_THRESHOLD,
  });
  if (decayed.length > 0) {
    return decayed.reduce((a, b) => (a.hits < b.hits ? a : b));
  }
  // Then barriers below the maintenance target.
  const barriers = room.find(FIND_STRUCTURES, {
    filter: (s) =>
      (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) &&
      s.hits < BARRIER_TARGET,
  });
  if (barriers.length > 0) {
    return barriers.reduce((a, b) => (a.hits < b.hits ? a : b));
  }
  return null;
}

/** Activate safe mode if a spawn is under real attack and we can't cope. */
function maybeSafeMode(room: Room, data: RoomData): void {
  const ctrl = room.controller;
  if (!ctrl || !ctrl.my) return;
  if (ctrl.safeMode || (ctrl.safeModeAvailable ?? 0) <= 0) return;
  if (ctrl.safeModeCooldown) return;
  if (data.hostiles.length === 0) return;

  // Real threat signal: an owned spawn (or storage) is taking structural damage.
  const spawnUnderAttack = data.spawns.some((s) => s.hits < s.hitsMax);
  const noDefense = data.towers.every((t) => t.store[RESOURCE_ENERGY] === 0) || data.towers.length === 0;

  if (spawnUnderAttack && noDefense) {
    const res = ctrl.activateSafeMode();
    if (res === OK) console.log(`CACHE: SAFE MODE activated in ${room.name} (spawn under attack)`);
  }
}
