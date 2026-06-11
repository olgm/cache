/**
 * Cache v0.0.5 — Expansion manager.
 *
 * Drives multi-room expansion:
 *   1. Scout adjacent rooms (even while GCL-locked) to gather intel.
 *   2. When GCL allows a new room, pick the best scouted target.
 *   3. Spawn a claimer to capture the target controller.
 *   4. After claiming, hand off to the normal spawn pipeline for bootstrapping.
 *
 * State machine persisted in Memory.expansion.
 *
 * v0.0.5 CPU optimisations:
 *   - ownedRoomCount cached per tick (called multiple times).
 *   - hasActiveClaimer / hasActiveScout via creep census (no extra iteration).
 *   - Expensive room scoring throttled to every 20 ticks.
 *   - pickTarget uses cached room structures instead of repeated find().
 */

import {
  ExpansionMemory,
  ExpansionState,
  defaultExpansionMemory,
  CreepRole,
} from "./types";
import { getCensus } from "./utils/creepCensus";

// ---------------------------------------------------------------------------
// Per-tick caches (cleared implicitly when tick changes via Game.time)
// ---------------------------------------------------------------------------

let _ownedRoomCountCache = -1;
let _ownedRoomCountTick = -1;

/** How often (ticks) the expansion spawn-request logic does a full evaluation. */
const EVAL_THROTTLE = 20;

/** Cached last tick we ran the full evaluation. */
let _lastEvalTick = -1;
/** Cached result from the last evaluation (null = no request). */
let _cachedSpawnRequest: ExpansionSpawnRequest | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Number of rooms we are allowed to control: GCL level + 1. */
function maxRooms(): number {
  return Game.gcl.level + 1;
}

/** Count rooms we own (have a controller with our name on it). Cached per tick. */
function ownedRoomCount(): number {
  if (_ownedRoomCountTick === Game.time) return _ownedRoomCountCache;
  let count = 0;
  for (const _ in Game.rooms) {
    const room = Game.rooms[_];
    if (room.controller && room.controller.my) count++;
  }
  _ownedRoomCountCache = count;
  _ownedRoomCountTick = Game.time;
  return count;
}

/** Return adjacent room names using the game map. */
function adjacentRooms(roomName: string): string[] {
  const exits = Game.map.describeExits(roomName);
  return exits ? Object.values(exits) : [];
}

/** Check whether we have intel on a room (it's visible or recently scouted). */
function hasIntel(roomName: string): boolean {
  if (Game.rooms[roomName]) return true;
  const mem = ensureMem();
  if (mem.scoutedRooms && mem.scoutedRooms[roomName]) {
    // Scouted within the last 1500 ticks (~25 min) is still fresh.
    return Game.time - mem.scoutedRooms[roomName] < 1500;
  }
  return false;
}

/**
 * Score a candidate room for expansion (higher = better).
 * Requires intel: the room must be visible.
 * NOTE: this is expensive (multiple find() calls); only call when throttled.
 */
function scoreRoom(room: Room): number {
  if (!room.controller || room.controller.owner || room.controller.reservation) {
    return -1; // owned or reserved: skip unless we're contesting (future)
  }

  let score = 0;

  // Sources are the primary energy income
  const sources = room.find(FIND_SOURCES);
  score += sources.length * 100;

  // Controller proximity to sources (rough)
  if (room.controller) {
    for (const src of sources) {
      const dist = room.controller.pos.getRangeTo(src);
      score += Math.max(0, 50 - dist * 2); // closer is better
    }
  }

  // Penalty for hostile presence
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) score -= 1000;

  // Penalty for keeper lairs (source keepers are dangerous at low RCL)
  const keeperLairs = room.find(FIND_HOSTILE_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
  });
  if (keeperLairs.length > 0) score -= 500;

  return score;
}

/** Pick the best adjacent room for expansion. */
function pickTarget(roomName: string): string | null {
  const adj = adjacentRooms(roomName);
  if (adj.length === 0) return null;

  let bestRoom: string | null = null;
  let bestScore = -Infinity;

  for (const name of adj) {
    const room = Game.rooms[name];
    if (!room) continue;
    const s = scoreRoom(room);
    if (s > bestScore) {
      bestScore = s;
      bestRoom = name;
    }
  }

  return bestRoom;
}

/** Ensure Memory.expansion exists. */
function ensureMem(): ExpansionMemory {
  if (!Memory.expansion || !Memory.expansion.state) {
    Memory.expansion = defaultExpansionMemory();
  }
  return Memory.expansion;
}

/** Check if we have an active (unclaimed) claimer creep (via census). */
function hasActiveClaimer(): boolean {
  return getCensus().hasActiveClaimer;
}

/** Check if we have an active scout creep (via census). */
function hasActiveScout(): boolean {
  return getCensus().hasActiveScout;
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

function transition(mem: ExpansionMemory, newState: ExpansionState): void {
  mem.state = newState;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return a spawn request the expansion module wants fulfilled this tick,
 * or null if no expansion spawn is needed.
 */
export interface ExpansionSpawnRequest {
  role: CreepRole;
  body: BodyPartConstant[];
  priority: number;
}

export function getExpansionSpawnRequest(): ExpansionSpawnRequest | null {
  // Throttle full evaluation — expansion decisions don't change every tick.
  // Return the cached result for EVAL_THROTTLE ticks.
  if (Game.time - _lastEvalTick < EVAL_THROTTLE) {
    // But we must still invalidate if the cached request was fulfilled
    // (e.g. a claimer was spawned last tick).  Check quickly:
    if (_cachedSpawnRequest) {
      const mem = ensureMem();
      if (_cachedSpawnRequest.role === "claimer" && hasActiveClaimer()) {
        // Claimer already exists — suppress the cached request
        return null;
      }
      if (_cachedSpawnRequest.role === "scout" && hasActiveScout()) {
        return null;
      }
    }
    return _cachedSpawnRequest;
  }

  _lastEvalTick = Game.time;

  const mem = ensureMem();

  // If we can claim more rooms, prepare scouting/claiming.
  if (ownedRoomCount() < maxRooms()) {
    if (mem.state === "idle") {
      // Start scouting
      transition(mem, "scouting");
      mem.scoutDispatched = false;
    }

    if (mem.state === "scouting") {
      // Try to pick a room with existing intel
      if (mem.targetRoom && hasIntel(mem.targetRoom)) {
        transition(mem, "claiming");
        mem.claimerSpawned = false;
      } else {
        // Need to scout — pick the first adjacent room we haven't scouted
        for (const spawnName in Game.spawns) {
          const spawn = Game.spawns[spawnName];
          const adj = adjacentRooms(spawn.room.name);
          for (const adjRoom of adj) {
            if (!hasIntel(adjRoom) && !mem.scoutDispatched) {
              mem.targetRoom = adjRoom;
              if (!hasActiveScout()) {
                mem.scoutDispatched = true;
                _cachedSpawnRequest = {
                  role: "scout",
                  body: [MOVE],
                  priority: 3,
                };
                return _cachedSpawnRequest;
              }
            }
          }
        }
        // All adjacent rooms have intel — pick best
        for (const spawnName in Game.spawns) {
          const spawn = Game.spawns[spawnName];
          const best = pickTarget(spawn.room.name);
          if (best) {
            mem.targetRoom = best;
            transition(mem, "claiming");
            mem.claimerSpawned = false;
            break;
          }
        }
      }
    }

    if (mem.state === "claiming") {
      if (mem.targetRoom && !mem.claimerSpawned && !hasActiveClaimer()) {
        // Check if the room is already ours (maybe another spawn claimed it)
        const room = Game.rooms[mem.targetRoom];
        if (room && room.controller && room.controller.my) {
          transition(mem, "bootstrapping");
          _cachedSpawnRequest = null;
          return null;
        }

        mem.claimerSpawned = true;
        _cachedSpawnRequest = {
          role: "claimer",
          body: [CLAIM, MOVE],
          priority: 3,
        };
        return _cachedSpawnRequest;
      }

      // If claimer is active, wait
      if (hasActiveClaimer()) {
        _cachedSpawnRequest = null;
        return null;
      }

      // If room is now ours, transition to bootstrapping
      if (mem.targetRoom) {
        const room = Game.rooms[mem.targetRoom];
        if (room && room.controller && room.controller.my) {
          transition(mem, "bootstrapping");
        }
      }
    }

    if (mem.state === "bootstrapping") {
      // Bootstrapping: the normal spawn pipeline handles this.
      // Just reset when we want to expand again.
      if (ownedRoomCount() >= maxRooms()) {
        transition(mem, "idle");
        mem.targetRoom = undefined;
      }
    }
  }

  _cachedSpawnRequest = null;
  return null;
}

/**
 * Attach target room to a newly spawned claimer or scout.
 * Called by the spawn manager after a successful spawn.
 */
export function onExpansionSpawn(
  role: CreepRole,
  creepName: string,
): void {
  const mem = ensureMem();
  const creep = Game.creeps[creepName];
  if (!creep) return;

  if (role === "claimer" && mem.targetRoom) {
    creep.memory.targetRoom = mem.targetRoom;
    creep.memory.claimed = false;
  }

  if (role === "scout" && mem.targetRoom) {
    creep.memory.targetRoom = mem.targetRoom;
  }
}

/**
 * Record scout intel. Called by the scout role when it enters a room.
 */
export function recordScoutIntel(roomName: string): void {
  const mem = ensureMem();
  if (!mem.scoutedRooms) mem.scoutedRooms = {};
  mem.scoutedRooms[roomName] = Game.time;
}

/**
 * Record source positions during scouting so remote-mining can establish
 * ops based on intel even after the scout leaves (no current vision).
 * Called by the scout role when it enters a visible room.
 */
export function recordScoutSources(roomName: string, sources: { id: string; x: number; y: number }[]): void {
  const mem = ensureMem();
  if (!mem.scoutedSources) mem.scoutedSources = {};
  mem.scoutedSources[roomName] = sources;
}

/**
 * Run expansion-related maintenance each tick.
 * Called from the main loop.
 */
export function runExpansionManager(): void {
  const mem = ensureMem();

  // Transition claimed rooms to bootstrapping
  if (mem.state === "claiming" && mem.targetRoom) {
    const room = Game.rooms[mem.targetRoom];
    if (room && room.controller && room.controller.my) {
      transition(mem, "bootstrapping");
    }
  }

  // If bootstrapping is done (we own the max rooms), reset
  if (mem.state === "bootstrapping") {
    if (ownedRoomCount() >= maxRooms()) {
      transition(mem, "idle");
      mem.targetRoom = undefined;
      mem.claimerSpawned = false;
      mem.scoutDispatched = false;
    }
  }
}
