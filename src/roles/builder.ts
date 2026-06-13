/**
 * Cache — Builder role.
 *
 * Builds construction sites in a sensible order (spawn → tower → extension →
 * container → storage → road → rampart → wall), and when there is nothing to
 * build, performs light repairs the towers don't cover (decayed roads/containers
 * and freshly-built ramparts). Idle builders help upgrade so they never waste a
 * tick. Gathers energy from buffers (never from spawn/extensions).
 */

import { travel } from "../utils/movement";
import { getRoomData } from "../utils/roomData";
import { gatherEnergy } from "../utils/energy";

/** Lower number = built first. */
const BUILD_PRIORITY: Partial<Record<StructureConstant, number>> = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_TOWER]: 1,
  [STRUCTURE_EXTENSION]: 2,
  [STRUCTURE_CONTAINER]: 3,
  [STRUCTURE_STORAGE]: 4,
  [STRUCTURE_LINK]: 5,
  [STRUCTURE_ROAD]: 6,
  [STRUCTURE_RAMPART]: 7,
  [STRUCTURE_WALL]: 8,
};

/** Repair roads/containers once they drop below this fraction of max hits. */
const REPAIR_THRESHOLD = 0.5;
/** Target hits for freshly-built ramparts (towers maintain them beyond this). */
const RAMPART_FLOOR = 1000;

export function runBuilder(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  if (creep.room.name !== home) {
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) creep.memory.working = false;
  else if (!creep.memory.working && creep.store.getFreeCapacity() === 0) creep.memory.working = true;

  if (!creep.memory.working) {
    gatherEnergy(creep, getRoomData(creep.room));
    return;
  }

  // 1. Build the highest-priority construction site.
  const site = pickSite(creep);
  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) travel(creep, site, 3);
    return;
  }

  // 2. Repair what towers tend to neglect.
  const repair = pickRepair(creep);
  if (repair) {
    if (creep.repair(repair) === ERR_NOT_IN_RANGE) travel(creep, repair, 3);
    return;
  }

  // 3. Nothing to do — help upgrade.
  const ctrl = creep.room.controller;
  if (ctrl && ctrl.my) {
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
  }
}

function pickSite(creep: Creep): ConstructionSite | null {
  const sites = getRoomData(creep.room).constructionSites;
  if (sites.length === 0) return null;
  let best: ConstructionSite | null = null;
  let bestKey = Infinity;
  for (const s of sites) {
    const prio = BUILD_PRIORITY[s.structureType] ?? 9;
    // Tie-break by remaining work then range, folded into one comparable key.
    const key = prio * 1e6 + (s.progressTotal - s.progress);
    if (key < bestKey) {
      bestKey = key;
      best = s;
    }
  }
  return best;
}

function pickRepair(creep: Creep): Structure | null {
  // Decayed roads/containers first (these silently rot and break logistics).
  const decayed = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: (s) =>
      (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) &&
      s.hits < s.hitsMax * REPAIR_THRESHOLD,
  });
  if (decayed) return decayed;

  // Newly built ramparts that haven't reached a safe floor yet.
  const rampart = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < RAMPART_FLOOR,
  });
  return rampart;
}
