/**
 * Cache — Hauler role (logistics).
 *
 * Ferries energy from source containers / dropped piles to where it is needed:
 * spawn & extensions first (so the colony keeps spawning), then towers, then the
 * controller container (upgrader supply), then storage as the overflow buffer.
 * Under attack, towers jump to the front of the queue.
 *
 * Coordination: haulers reserve their target container so two don't converge on
 * the same one — the first to claim it gets it, others pick a different source.
 * The threshold for collection is dynamic: when no container has ≥25 energy, the
 * hauler picks the fullest available and waits there, eliminating the idle gap
 * that low-WORK miners create during early-game.
 *
 * Target selection is proximity-weighted: among containers above threshold the
 * hauler picks the CLOSEST one with enough energy, not just the fullest — this
 * cuts travel time and raises throughput.
 */

import { travel } from "../utils/movement";
import { getRoomData, RoomData } from "../utils/roomData";
import { pickSiteByPriority } from "./builder";

// ---------------------------------------------------------------------------
// Shared reservation state (per-tick, so haulers coordinate within this tick)
// ---------------------------------------------------------------------------
let _reservedTick = -1;
const _reservedContainers = new Set<string>();

/** Minimum energy a pile or container must have to be worth a trip. */
const MIN_PICKUP = 25;

/**
 * During a source-pipeline outage (every source container dry — a miner gap or a
 * full economy collapse) a hauler should ferry energy from STORAGE to the spawn
 * so the colony keeps spawning. Without this, storage — the colony's largest
 * buffer — cannot fuel recovery (`collect` otherwise only pulls from source
 * containers / piles / tombstones), so a 0-miner collapse escaped only on luck:
 * residual container energy (the 2026-06-27 near-death). True iff storage has
 * energy AND a non-storage sink (spawn / extensions / towers) needs it. Pure +
 * exported for unit testing.
 */
export function shouldRefillFromStorage(storageEnergy: number, spawnExtTowerFree: number): boolean {
  return storageEnergy > 0 && spawnExtTowerFree > 0;
}

/** Build the set of container IDs that other haulers have already claimed. */
function buildReservedSet(me: string): Set<string> {
  if (_reservedTick !== Game.time) {
    _reservedContainers.clear();
    _reservedTick = Game.time;
    for (const name in Game.creeps) {
      const c = Game.creeps[name];
      if (c.name === me) continue;
      if (c.memory.role !== "hauler") continue;
      const tc = c.memory.targetContainer;
      if (tc) _reservedContainers.add(tc);
    }
  }
  return _reservedContainers;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runHauler(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  if (creep.room.name !== home) {
    creep.memory.targetContainer = undefined;
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  // Toggle collect/deliver at the capacity extremes.
  if (creep.store.getFreeCapacity() === 0) {
    creep.memory.hauling = true;
    creep.memory.targetContainer = undefined; // done collecting
  } else if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.hauling = false;
  }

  const data = getRoomData(creep.room);

  if (creep.memory.hauling) deliver(creep, data);
  else collect(creep, data);
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

/** Pick up energy from a source container or dropped pile. */
function collect(creep: Creep, data: RoomData): void {
  const reserved = buildReservedSet(creep.name);

  // --- Dropped energy (drop-mining overflow) — grab the closest pile. ---
  const piles = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50,
  }).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));

  // --- Source containers: skip ones reserved by another hauler. ---
  const candidates = data.sources
    .map((s) => s.container)
    .filter((c): c is StructureContainer => !!c && !reserved.has(c.id));

  // Dynamic threshold: prefer ≥ 50, but if nothing qualifies, take ANY energy
  // so the hauler doesn't idle while a container slowly fills from low-WORK miners.
  let qualified = candidates.filter((c) => c.store[RESOURCE_ENERGY] >= 50);
  if (qualified.length === 0 && candidates.length > 0) {
    qualified = candidates.filter((c) => c.store[RESOURCE_ENERGY] > 0);
  }

  // Pick the CLOSEST container above threshold to cut travel time.
  // Travel dominates the hauler's cycle; a closer container with "enough"
  // energy always beats a fuller one 10 tiles farther away.
  const bestContainer = qualified.sort(
    (a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b),
  )[0];

  const bestPile = piles.sort((a, b) => b.amount - a.amount)[0];

  // Prefer the pile if it beats the container, otherwise take the container.
  if (bestPile && (!bestContainer || bestPile.amount > bestContainer.store[RESOURCE_ENERGY])) {
    creep.memory.targetContainer = undefined;
    if (creep.pickup(bestPile) === ERR_NOT_IN_RANGE) travel(creep, bestPile);
    return;
  }

  if (bestContainer) {
    // Claim this container so other haulers skip it.
    creep.memory.targetContainer = bestContainer.id;
    // Also add to the in-tick reservation so a second hauler in the SAME tick
    // that hasn't run yet also avoids it.
    _reservedContainers.add(bestContainer.id);
    if (creep.withdraw(bestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      travel(creep, bestContainer);
    }
    return;
  }

  // No container energy at all: recover tombstones/ruins, else wait near a source.
  creep.memory.targetContainer = undefined;
  const tomb = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
    filter: (t) => t.store[RESOURCE_ENERGY] >= 50,
  });
  if (tomb) {
    if (creep.withdraw(tomb, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, tomb);
    return;
  }

  // Source pipeline is dry — ferry from STORAGE to keep the spawn running so the
  // colony can recover (a miner gap or a full collapse). Gated on NO source
  // container holding ANY energy: reaching here does NOT by itself mean containers
  // are empty — `bestContainer` is also null when every container is merely
  // reserved by another hauler (at RCL5 there are more haulers than containers, so
  // surplus collectors routinely find them all reserved). Draining storage in that
  // normal case would needlessly empty the buffer, so require a true outage first.
  // Delivery routes spawn/extensions/towers before storage, so this never loops
  // energy back into storage.
  const anySourceEnergy = data.sources.some(
    (s) => s.container && s.container.store[RESOURCE_ENERGY] > 0,
  );
  if (!anySourceEnergy && data.storage) {
    const spawnExtTowerFree = [...data.spawns, ...data.extensions, ...data.towers].reduce(
      (sum, s) => sum + s.store.getFreeCapacity(RESOURCE_ENERGY),
      0,
    );
    if (shouldRefillFromStorage(data.storage.store[RESOURCE_ENERGY], spawnExtTowerFree)) {
      creep.memory.targetContainer = undefined;
      if (creep.withdraw(data.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, data.storage);
      return;
    }
  }

  if (data.sources[0]) travel(creep, data.sources[0].source, 2);
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/** Deliver to the highest-priority sink that still has room. */
function deliver(creep: Creep, data: RoomData): void {
  const target = chooseSink(creep, data);
  if (!target) {
    // Everything is full — try to put the energy to work rather than idling.
    if (dumpSurplus(creep, data)) return;
    // Truly nothing to do: park near storage / controller.
    if (data.storage) travel(creep, data.storage, 1);
    return;
  }
  if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, target);
}

function chooseSink(creep: Creep, data: RoomData): Structure | null {
  const spawnExtAll = [...data.spawns, ...data.extensions];
  const spawnExt = spawnExtAll.filter(
    (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  );
  const totalSpawnExtFree = spawnExt.reduce(
    (sum, s) => sum + s.store.getFreeCapacity(RESOURCE_ENERGY),
    0,
  );
  const towers = data.towers.filter((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

  // Under attack, keep towers topped up before anything else.
  if (data.hostiles.length > 0 && towers.length > 0) {
    return creep.pos.findClosestByRange(towers);
  }

  const carriedEnergy = creep.store[RESOURCE_ENERGY];

  // GCL push: at low GCL every control point gates multi-room expansion.
  // Route energy to the controller container aggressively, but keep
  // spawn AND extensions alive (they enable spawning bigger creeps).
  // The spawn runs first in the tick order, so spawning always claims its
  // energy before we fill the controller container.
  const gclPush = Game.gcl.level <= 2;
  if (gclPush && data.controllerContainer && data.controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    // Fill spawn + extensions first if they have a meaningful deficit.
    // "Meaningful" = at least one structure has room for the hauler's cargo,
    // or total free ≥ 200 (prevents spawning stalls).
    const spawnExtFree = [...data.spawns, ...data.extensions].reduce(
      (sum, s) => sum + s.store.getFreeCapacity(RESOURCE_ENERGY),
      0,
    );
    if (spawnExtFree >= Math.min(carriedEnergy, 200)) {
      const target = creep.pos.findClosestByRange(
        [...data.spawns, ...data.extensions].filter(
          (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        ),
      );
      if (target) return target;
    }
    // Spawn & extensions are reasonably full — route to the controller container.
    return data.controllerContainer;
  }

  // Spawn & extensions are the colony heartbeat, but routing a full hauler to
  // an extension that needs only 5 energy starves the controller and wastes
  // travel ticks.  Only prioritise spawns/extensions when there is a
  // meaningful deficit: total free capacity ≥ the hauler's carried energy, or
  // at least 200 (so spawning never stalls even with tiny haulers).
  const meaningfulDeficit = totalSpawnExtFree >= Math.max(200, carriedEnergy * 0.5);

  if (spawnExt.length > 0 && meaningfulDeficit) {
    return creep.pos.findClosestByRange(spawnExt);
  }

  // Controller container before towers: controller upgrades fuel GCL, which
  // unlocks multi-room expansion.  Towers only need energy for defence — at
  // early-game threat levels the tower's 500e reserve is rarely drawn.
  if (data.controllerContainer && data.controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    return data.controllerContainer;
  }
  if (towers.length > 0) return creep.pos.findClosestByRange(towers);

  if (data.storage && data.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return data.storage;
  return null;
}

/**
 * All normal sinks are full — dump surplus into something useful so the hauler's
 * carry capacity isn't wasted. Returns true if energy was spent.
 */
function dumpSurplus(creep: Creep, data: RoomData): boolean {
  // 1. Fill construction sites (cheapest way to convert surplus into progress).
  //    Build in BUILD_PRIORITY order (towers/storage before extensions/roads), not
  //    just the nearest site, so surplus also advances the critical structures.
  const site = pickSiteByPriority(creep.pos, data.constructionSites);
  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) travel(creep, site);
    return true;
  }

  // 2. Upgrade the controller — any energy spent here is never wasted.
  const ctrl = creep.room.controller;
  if (ctrl) {
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
    return true;
  }

  // 3. Repair the most damaged non-wall structure (walls eat energy too fast).
  const repairs = creep.room.find(FIND_STRUCTURES, {
    filter: (s) =>
      s.hits < s.hitsMax * 0.5 &&
      s.structureType !== STRUCTURE_WALL &&
      s.structureType !== STRUCTURE_RAMPART,
  });
  if (repairs.length > 0) {
    const target = creep.pos.findClosestByRange(repairs);
    if (target && creep.repair(target) === ERR_NOT_IN_RANGE) travel(creep, target);
    return true;
  }

  return false;
}
