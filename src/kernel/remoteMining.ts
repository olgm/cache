/**
 * Cache — Remote mining manager.
 *
 * Identifies unowned, unreserved sources in adjacent rooms and spawns dedicated
 * remoteHarvester creeps to mine them, hauling energy back to the home room.
 *
 * Gating: only activates when the home economy is mature enough to sustain the
 * extra spawn cost — RCL ≥ 4, at least one source container (so static mining
 * is running), and the spawn isn't stalled.
 *
 * Scouting is throttled (every REMOTE_SCAN_INTERVAL ticks) to keep CPU cheap.
 */

import { ensureRemoteMiningMemory, RemoteMiningMemory, RemoteSource } from "./remoteMiningMemory";
import { buildCensus, homeRoomOf } from "../utils/census";
import { myRooms, getRoomData } from "../utils/roomData";
import { remoteHarvesterBody } from "../config";

const REMOTE_SCAN_INTERVAL = 100;
const INTEL_TTL = 3000;
const MAX_REMOTE_HARVESTERS_PER_ROOM = 2;

/** Gate: home room must have static mining running and no active spawn-stall. */
function remoteMiningUnlocked(room: Room): boolean {
  if (!room.controller || room.controller.level < 4) return false;
  const data = getRoomData(room);
  // At least one source container running (static mining is active).
  if (!data.sources.some((s) => s.container)) return false;
  // Don't remote-mine while the spawn is stalled.
  if ((room.memory.spawnStall || 0) > 20) return false;
  return true;
}

/** Scan adjacent rooms and cache viable sources. */
function scanAdjacent(room: Room, mem: RemoteMiningMemory): void {
  const exits = Game.map.describeExits(room.name);
  if (!exits) return;
  const adj = Object.values(exits);

  for (const roomName of adj) {
    // Already have fresh intel.
    if (mem.intel[roomName] && Game.time - mem.intel[roomName].lastScan < INTEL_TTL) continue;

    const targetRoom = Game.rooms[roomName];
    if (!targetRoom) continue; // no visibility

    const ctrl = targetRoom.controller;
    const owner = ctrl ? ctrl.owner : undefined;
    const reserved = ctrl ? !!ctrl.reservation : false;

    // Skip owned, reserved, or hostile rooms.
    if (owner || reserved) {
      mem.intel[roomName] = { lastScan: Game.time, viableSources: [] };
      continue;
    }

    const hostiles = targetRoom.find(FIND_HOSTILE_CREEPS).length > 0;
    const keeperLairs = targetRoom.find(FIND_HOSTILE_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
    }).length > 0;
    if (hostiles || keeperLairs) {
      mem.intel[roomName] = { lastScan: Game.time, viableSources: [] };
      continue;
    }

    // Gather all sources with at least one open adjacent tile.
    const sources = targetRoom.find(FIND_SOURCES);
    const terrain = targetRoom.getTerrain();
    const viableSources: RemoteSource[] = [];

    for (const source of sources) {
      // Count open tiles around the source.
      let openSlots = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const x = source.pos.x + dx;
          const y = source.pos.y + dy;
          if (x < 0 || x > 49 || y < 0 || y > 49) continue;
          if (terrain.get(x, y) !== TERRAIN_MASK_WALL) openSlots++;
        }
      }
      if (openSlots > 0) {
        viableSources.push({ id: source.id, room: roomName, openSlots });
      }
    }

    mem.intel[roomName] = { lastScan: Game.time, viableSources };
  }
}

/** Count remoteHarvesters already spawned for a given remote source. */
function remoteHarvestersForSource(sourceId: string, homeRoom: string): number {
  let n = 0;
  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    if (c.memory.role !== "remoteHarvester") continue;
    if (c.memory.homeRoom !== homeRoom) continue;
    if (c.memory.sourceId === sourceId) n++;
  }
  return n;
}

/** Pick the best unassigned remote source for a given home room. */
function pickRemoteSource(homeRoom: string, mem: RemoteMiningMemory): RemoteSource | null {
  let best: RemoteSource | null = null;
  let bestScore = 0;

  for (const roomName in mem.intel) {
    const intel = mem.intel[roomName];
    if (Game.time - intel.lastScan > INTEL_TTL) continue;
    for (const rs of intel.viableSources) {
      const assigned = remoteHarvestersForSource(rs.id, homeRoom);
      if (assigned >= 2) continue; // max 2 per source
      const score = rs.openSlots * 100 - assigned * 50;
      if (score > bestScore) {
        bestScore = score;
        best = rs;
      }
    }
  }
  return best;
}

/** Desired number of remote harvesters for a home room. */
function remoteHarvesterTarget(room: Room, mem: RemoteMiningMemory): number {
  if (!remoteMiningUnlocked(room)) return 0;

  // Count total viable sources across all scouted rooms.
  let total = 0;
  for (const roomName in mem.intel) {
    const intel = mem.intel[roomName];
    if (Game.time - intel.lastScan > INTEL_TTL) continue;
    total += intel.viableSources.length;
  }
  if (total === 0) return 0;

  // Scale: one remote harvester per viable source, capped at 2.
  // Remote harvesters are expensive; don't over-invest.
  return Math.min(total, MAX_REMOTE_HARVESTERS_PER_ROOM);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RemoteMiningSpawnRequest {
  body: BodyPartConstant[];
  memory: CreepMemory;
}

/**
 * Run the remote mining manager for all owned rooms.
 * Called from main.ts every tick (internally throttled).
 */
export function runRemoteMiningManager(): void {
  for (const room of myRooms()) {
    try {
      runRoomRemoteMining(room);
    } catch (e) {
      console.log(`CACHE remoteMining error in ${room.name}: ${(e as Error)?.message}`);
    }
  }
}

function runRoomRemoteMining(room: Room): void {
  const mem = ensureRemoteMiningMemory(room.name);

  // Throttled scan.
  if (Game.time - (mem.lastScan || 0) >= REMOTE_SCAN_INTERVAL) {
    scanAdjacent(room, mem);
    mem.lastScan = Game.time;
  }

  // Cleanup stale intel.
  for (const roomName in mem.intel) {
    if (Game.time - mem.intel[roomName].lastScan > INTEL_TTL * 2) {
      delete mem.intel[roomName];
    }
  }
}

/**
 * Return the target number of remote harvesters for a room.
 * Consumed by the spawn manager via roleTargets.
 */
export function remoteHarvesterTargetForRoom(room: Room): number {
  const mem = ensureRemoteMiningMemory(room.name);
  return remoteHarvesterTarget(room, mem);
}

/**
 * Return a spawn request for a remoteHarvester if one is needed.
 * Returns null when no more remote harvesters are needed or no source is available.
 */
export function getRemoteMiningSpawnRequest(
  room: Room,
  census: ReturnType<typeof buildCensus>,
  reserved: Record<string, number>,
): RemoteMiningSpawnRequest | null {
  if (!remoteMiningUnlocked(room)) return null;

  const mem = ensureRemoteMiningMemory(room.name);
  const target = remoteHarvesterTarget(room, mem);
  const current =
    (census.byRoom[room.name] && census.byRoom[room.name]["remoteHarvester"] || 0) +
    (reserved["remoteHarvester"] || 0);
  if (current >= target) return null;
  if (target === 0) return null;

  const source = pickRemoteSource(room.name, mem);
  if (!source) return null;

  const data = getRoomData(room);
  const body = remoteHarvesterBody(data.energyCapacity);

  return {
    body,
    memory: {
      role: "remoteHarvester",
      homeRoom: room.name,
      sourceId: source.id,
      targetRoom: source.room,
    },
  };
}

export { ensureRemoteMiningMemory };
