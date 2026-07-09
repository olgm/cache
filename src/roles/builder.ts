/**
 * Cache — Builder role.
 *
 * Builds construction sites in a sensible order (spawn → tower → storage →
 * extension → container → road → rampart → wall), and when there is nothing to
 * build, performs light repairs the towers don't cover (decayed roads/containers
 * and freshly-built ramparts). Idle builders help upgrade so they never waste a
 * tick. Gathers energy from buffers (never from spawn/extensions).
 */

import { travel } from "../utils/movement";
import { getRoomData } from "../utils/roomData";
import { gatherEnergy } from "../utils/energy";

/**
 * Lower number = built first. Spawn always wins. Towers come next for defence.
 * Storage unlocks energy buffering and is the gate for multi-room expansion
 * (the expansion manager requires it), so it follows towers. Extensions and
 * containers come afterwards — extensions raise spawn capacity (bigger creeps),
 * containers unlock static mining and dedicated upgrader supply. Roads, ramparts
 * and walls are the lowest priority; builders only touch them when nothing else
 * needs attention.
 */
const BUILD_PRIORITY: Partial<Record<StructureConstant, number>> = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_TOWER]: 1,       // defence comes first
  [STRUCTURE_STORAGE]: 1.5,   // energy buffer + expansion gate — between tower (1)
                              // and extensions (3) for the shared pickSiteByPriority
                              // (hauler surplus-dump). The builder's own pickSite()
                              // elevates storage above the controller container (0.75)
                              // so a controller-container site doesn't permanently
                              // starve storage — see the special-case in pickSite().
  [STRUCTURE_EXTENSION]: 3,   // bigger creeps
  [STRUCTURE_CONTAINER]: 4,   // static mining + upgrader supply
  [STRUCTURE_LINK]: 5,
  [STRUCTURE_ROAD]: 6,
  [STRUCTURE_RAMPART]: 7,
  [STRUCTURE_WALL]: 8,
};

/**
 * The highest-priority construction site for `pos`: lowest BUILD_PRIORITY wins,
 * ties broken by proximity. Shared with the hauler's surplus-dump so that
 * opportunistic building (a hauler with nowhere to deliver) also advances towers
 * and storage first, instead of whatever site merely happens to be nearest.
 * (The builder's own pickSite adds bootstrap/controller-container nuance on top
 * of this base ordering.)
 */
export function pickSiteByPriority(
  pos: RoomPosition,
  sites: ConstructionSite[],
): ConstructionSite | null {
  let best: ConstructionSite | null = null;
  let bestKey = Infinity;
  for (const s of sites) {
    const prio = BUILD_PRIORITY[s.structureType] ?? 9;
    const key = prio * 1e6 + pos.getRangeTo(s); // priority dominates; range breaks ties
    if (key < bestKey) {
      bestKey = key;
      best = s;
    }
  }
  return best;
}

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

  // Fetch room data once — the per-tick cache makes subsequent calls in
  // pickSite / gatherEnergy free, and we need it both for the storage-emergency
  // fast path and the spawn-refill emergency below.
  const data = getRoomData(creep.room);

  // DEGRADED-CONTAINER GUARD: when the room has a source container but 0 miners
  // AND 0 haulers, the static-mining pipeline is broken — the container sits
  // empty because no miner fills it, and no hauler exists to move energy even if
  // it were full.  The builder must IDLE: if it harvests from the source (step 7
  // of gatherEnergy, since the container is empty and minSpawnDrain=200 blocks
  // withdraw), it competes with the harvesters for the limited 10 e/tick source
  // regen.  That competition starves the spawn of energy, and the spawn can
  // never accumulate the 150 e needed to spawn a [WORK,CARRY] miner — the exact
  // W44N38 deadlock (spawnStall 331, energy 111/300, 0 miners, 0 haulers).
  // Idling lets the harvesters push the full source output to the spawn, which
  // reaches 150 e in ~8 ticks so the spawn manager can spawn a miner and restart
  // static mining.  The guard lifts the instant a miner exists.
  {
    const containers = data.sources.filter((s) => s.container).length;
    if (containers > 0) {
      let miners = 0, haulers = 0;
      for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.homeRoom !== home) continue;
        if (c.memory.role === "miner") miners++;
        else if (c.memory.role === "hauler") haulers++;
        if (miners > 0 && haulers > 0) break;
      }
      if (miners === 0 && haulers === 0) return; // idle — let spawn accumulate
    }
  }

  // BOOTSTRAP: no source container exists yet.  Without containers, builders
  // must walk to gather energy, and every round-trip burns ~30 ticks.  The old
  // minEnergyToWork=1 meant builders gathered one tick's worth of energy per
  // trip — 30 ticks of travel for 1 tick of building (~3 % uptime).  Filling
  // to 80 % capacity per trip cuts round-trips by ~16×, raising uptime to
  // ~50 % and letting source containers actually finish before RCL 8.
  const bootstrapping = data.sources.every((s) => !s.container);

  // Storage is the single most expensive structure (30 000 energy).  When a
  // builder is targeting it, gather a full load before switching to "working"
  // mode — each trip should deposit as much energy as possible, because the
  // travel overhead on a 30 000-energy project is the dominant cost.  For
  // everything else the normal half-capacity toggle (empty ↔ full) is fine.
  const site = pickSite(creep);
  const targetingStorage = site ? site.structureType === STRUCTURE_STORAGE : false;
  const minEnergyToWork =
    targetingStorage || bootstrapping
      ? creep.store.getCapacity() * 0.8  // fill to 80 % before building in bootstrap / storage
      : 1; // normal: switch at first energy

  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
  } else if (!creep.memory.working && creep.store[RESOURCE_ENERGY] >= minEnergyToWork) {
    creep.memory.working = true;
  }

  if (!creep.memory.working) {
    // Fast gather from the spawn/extensions buffer when construction is
    // bottlenecked on builder travel.  Two cases:
    //
    // 1. Storage emergency (RCL ≥ 4, no storage, targeting storage): the
    //    buffer is centrally located near the storage site — every tick saved
    //    on gather travel is a tick spent on the 30 000-energy storage.
    //
    // 2. Bootstrap (no source containers, RCL ≥ 3): builders are constructing
    //    the source containers that unlock static mining.  Without this fast
    //    path, builders walk to sources for every gather cycle, burning ~30
    //    ticks per round-trip while the spawn/extensions buffer holds energy
    //    that harvesters are constantly refilling.  Drawing from the buffer
    //    cuts gather travel to near-zero and lets source containers complete
    //    in ~200 ticks instead of ~2500.
    //
    // Both paths require the buffer structure to have ≥ 50 energy to avoid
    // 1e micro-withdrawals that waste ticks.
    const fastGather =
      (targetingStorage && !data.storage && data.rcl >= 4) ||
      (bootstrapping && data.rcl >= 3);
    if (fastGather) {
      const buffer = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) =>
          (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
          s.store[RESOURCE_ENERGY] >= 50,
      });
      if (buffer) {
        if (creep.withdraw(buffer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, buffer);
        return;
      }
    }
    // SPAWN-DRAIN GUARD: when source containers exist (static mining active),
    // the builder must not withdraw from spawn/extensions.  Source containers
    // are the correct energy supply; draining the spawn starves creep
    // production and locks the room in a low-energy equilibrium where the
    // spawn can never accumulate enough to spawn a second builder (the live
    // W44N38: spawn at 66 e, 12 construction sites, builder drains spawn →
    // spawn stays at 66 forever).  Passing minSpawnDrain=200 effectively
    // disables step 6 for post-bootstrap rooms — the builder walks to source
    // containers or harvests directly, which is less efficient but does not
    // sabotage the colony's spawning.  Mirrors the upgrader guard from Cycle 17.
    const hasSourceContainers = data.sources.some((s) => s.container);
    gatherEnergy(creep, data, hasSourceContainers ? 200 : 50);
    return;
  }

  // ---- Spawn-refill emergency ----
  // When a room has zero harvesters (the delivery pipeline has collapsed), the
  // spawn cannot refill itself — it needs energy from creeps to spawn a new
  // harvester, but it cannot spawn a harvester without energy.  This deadlock
  // strands the room at spawnStall → ∞ with 0 energy throughput (the live
  // W44N38 at RCL 3 with spawnStall 1099 and energyHarvested 0).
  //
  // A builder already in the room can break the deadlock: it gathers energy
  // from sources via the normal gatherEnergy path, then transfers it to the
  // spawn instead of building.  Once the spawn holds ≥200 energy (the minimum
  // harvester body), the spawn manager's emergency path spawns a harvester,
  // the harvester begins mining + refilling, and the room recovers.
  //
  // The guard deactivates as soon as at least one harvester exists, so the
  // builder resumes normal construction work once the crisis is resolved.
  if (data.spawns.length > 0) {
    let harvesterCount = 0;
    for (const name in Game.creeps) {
      const c = Game.creeps[name];
      if (c.memory.role === "harvester" && c.memory.homeRoom === home) harvesterCount++;
    }
    if (harvesterCount === 0) {
      const emptySpawn = data.spawns.find((s) => s.store[RESOURCE_ENERGY] < 200);
      if (emptySpawn) {
        if (creep.transfer(emptySpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          travel(creep, emptySpawn);
        }
        return;
      }
    }
  }

  // Re-fetch the site after gathering (it may have changed).
  const buildSite = pickSite(creep);

  // 1. Build the highest-priority construction site.
  if (buildSite) {
    if (creep.build(buildSite) === ERR_NOT_IN_RANGE) travel(creep, buildSite, 3);
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
  const data = getRoomData(creep.room);
  const sites = data.constructionSites;
  if (sites.length === 0) return null;
  // BOOTSTRAP: until the room has a source container, build containers FIRST —
  // ahead of extensions. Extensions raise energyCapacity, which (with a depleted
  // workforce) just deepens the "can't fill the spawn" hole; a source container
  // instead unlocks static mining and a steady energy stream. Once any container
  // exists, fall back to the normal economy-first order (extensions compound).
  const bootstrapping = data.sources.every((s) => !s.container);
  // PARTIAL BOOTSTRAP: some sources have containers but others don't.  Each
  // uncovered source is the room's single biggest economic lever — a dedicated
  // miner on a containerized source produces 10 e/tick vs the ~4 e/tick from
  // two harvesters on the same source, a 150 % income boost per source.  The
  // second source container must be built BEFORE the controller container,
  // roads, and everything else, because it raises total room income by 40-50 %
  // and that surplus funds every other structure.  Elevate its priority to the
  // same level as full bootstrap (0.5).
  const partialBootstrap = !bootstrapping && data.sources.some((s) => !s.container);
  // After bootstrap, the controller container is the next critical unlock: it
  // gives upgraders a dedicated supply beside the controller, roughly doubling
  // their uptime and the colony's control-point throughput.  Bump its priority
  // above extensions so builders finish it before adding energyCapacity.
  const controllerContainerSite = !bootstrapping
    ? findControllerContainerSite(creep, data)
    : null;
  let best: ConstructionSite | null = null;
  let bestKey = Infinity;
  for (const s of sites) {
    let prio = BUILD_PRIORITY[s.structureType] ?? 9;
    // A container site for a source that still lacks one — during full or
    // partial bootstrap, this is the highest economic priority (0.5).
    const isSourceContainerSite =
      s.structureType === STRUCTURE_CONTAINER &&
      data.sources.some((sd) => !sd.container && s.pos.inRangeTo(sd.source.pos, 1));
    if ((bootstrapping || partialBootstrap) && isSourceContainerSite) {
      prio = 0.5; // before extensions, before controller container, before storage
    } else if (s.structureType === STRUCTURE_STORAGE) {
      prio = 0.6; // after source containers, before controller container
    } else if (s === controllerContainerSite) {
      prio = 0.75; // after storage, before extensions
    }
    // Tie-break by remaining work then range, folded into one comparable key.
    const key = prio * 1e6 + (s.progressTotal - s.progress);
    if (key < bestKey) {
      bestKey = key;
      best = s;
    }
  }
  return best;
}

/**
 * Find the construction site (if any) for a container within range 3 of the
 * controller that isn't a source container — the controller container that will
 * become the upgraders' dedicated supply.
 */
function findControllerContainerSite(creep: Creep, data: import("../utils/roomData").RoomData): ConstructionSite | null {
  const ctrl = creep.room.controller;
  if (!ctrl) return null;
  // Fast path: data.constructionSites is already scanned; filter in JS.
  for (const s of data.constructionSites) {
    if (s.structureType !== STRUCTURE_CONTAINER) continue;
    if (!s.pos.inRangeTo(ctrl.pos, 3)) continue;
    // Exclude source containers (they're within range 1 of a source).
    if (data.sources.some((sd) => s.pos.inRangeTo(sd.source.pos, 1))) continue;
    return s;
  }
  return null;
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
