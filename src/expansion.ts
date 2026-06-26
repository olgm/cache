/**
 * Cache — Expansion manager (gated, correct).
 *
 * Drives a SECOND room only once the home colony can clearly afford it. The
 * old version wedged itself (claiming an unreachable room at GCL1, claimer never
 * able to claim); this one is hard-gated and self-validating:
 *
 *   scout gate:   RCL >= 3 (map neighbours early — cheap prep, runs in parallel
 *                 with upgrading; intel is ready the moment GCL unlocks).
 *   claim gate:   ownedRooms < GCL AND RCL >= 4 AND storage (mature surplus).
 *
 * Flow: idle → scouting (a scout maps adjacent rooms) → claiming (a claimer
 * takes the best adjacent controller) → bootstrapping (pioneers build the new
 * room's first spawn; the construction planner places the spawn site) → idle.
 *
 * Scouting is cheap (one MOVE part) and pays off later when GCL unlocks —
 * we arrive at GCL 2 with intel already in hand instead of starting blind.
 */

import {
  CreepRole,
  ExpansionMemory,
  RoomIntel,
  defaultExpansionMemory,
} from "./types";
import { RoomData, myRooms } from "./utils/roomData";
import { buildCensus } from "./utils/census";
import { scoutBody, claimerBody, pioneerBody } from "./config";

export interface SpawnRequest {
  role: CreepRole;
  body: BodyPartConstant[];
  memory: CreepMemory;
}

/** How long cached intel stays usable for target selection. */
const INTEL_TTL = 5000;
/** Pioneers to send to bootstrap a freshly-claimed room. */
const PIONEERS_PER_ROOM = 3;

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

function ensureMem(): ExpansionMemory {
  if (!Memory.expansion || !Memory.expansion.state || !Memory.expansion.intel) {
    Memory.expansion = defaultExpansionMemory();
  }
  return Memory.expansion;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function adjacentRooms(roomName: string): string[] {
  const exits = Game.map.describeExits(roomName);
  return exits ? Object.values(exits) : [];
}

function ownedRoomCount(): number {
  return myRooms().length;
}

/** The most developed owned room with a spawn — our expansion base. */
function pickBaseRoom(): Room | null {
  let best: Room | null = null;
  for (const room of myRooms()) {
    if (room.find(FIND_MY_SPAWNS).length === 0) continue;
    if (!best || (room.controller?.level ?? 0) > (best.controller?.level ?? 0)) best = room;
  }
  return best;
}

/** Gate: RCL ≥ 3 — scout early so intel is ready when GCL unlocks expansion. */
function scoutingUnlocked(base: Room): boolean {
  if (!base.controller || base.controller.level < 3) return false;
  return true;
}

/** Gate: room headroom AND a mature, energy-rich base — full expansion. */
function expansionUnlocked(base: Room): boolean {
  if (ownedRoomCount() >= Game.gcl.level) return false; // claim limit = GCL
  if (!base.controller || base.controller.level < 4) return false;
  if (!base.storage) return false;
  return true;
}

/** Record intel about a visible room (called by scouts/claimers and the manager). */
export function recordIntel(room: Room): void {
  const mem = ensureMem();
  const ctrl = room.controller;
  const keeperLairs = room.find(FIND_HOSTILE_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
  });
  const intel: RoomIntel = {
    sources: room.find(FIND_SOURCES).length,
    owner: ctrl && ctrl.owner ? ctrl.owner.username : undefined,
    reserved: !!(ctrl && ctrl.reservation),
    hostile: room.find(FIND_HOSTILE_CREEPS).length > 0 || keeperLairs.length > 0,
    lastSeen: Game.time,
  };
  mem.intel[room.name] = intel;
  mem.scoutedRooms[room.name] = Game.time;
}

/** Pick the best adjacent room to claim from cached intel. */
function pickTarget(base: Room): string | null {
  const mem = ensureMem();
  let best: string | null = null;
  let bestScore = 0;
  for (const name of adjacentRooms(base.name)) {
    const intel = mem.intel[name];
    if (!intel || Game.time - intel.lastSeen > INTEL_TTL) continue;
    if (intel.owner || intel.reserved || intel.hostile) continue;
    if (intel.sources === 0) continue;
    const score = intel.sources * 100;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}

function globalRoleCount(role: CreepRole): number {
  return buildCensus().global[role] || 0;
}

function pioneersFor(targetRoom: string): number {
  let n = 0;
  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    if (c.memory.role === "pioneer" && c.memory.targetRoom === targetRoom) n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export function runExpansionManager(): void {
  const mem = ensureMem();
  const base = pickBaseRoom();
  const canScout = base ? scoutingUnlocked(base) : false;
  const canExpand = base ? expansionUnlocked(base) : false;

  // Dormant / fully gated off: keep state clean so nothing can wedge.
  if (!base || (!canScout && !canExpand)) {
    if (mem.state !== "idle") {
      mem.state = "idle";
      mem.targetRoom = undefined;
    }
    return;
  }

  // Opportunistically record intel on any visible adjacent rooms.
  for (const name of adjacentRooms(base.name)) {
    const r = Game.rooms[name];
    if (r) recordIntel(r);
  }

  // Self-heal: a target that isn't adjacent to the base (legacy corruption)
  // is invalid unless we're already bootstrapping it.
  if (mem.targetRoom && mem.state !== "bootstrapping" && !adjacentRooms(base.name).includes(mem.targetRoom)) {
    mem.targetRoom = undefined;
    mem.state = "idle";
  }

  switch (mem.state) {
    case "idle":
      // Only enter scouting when we lack fresh intel on ≥1 adjacent room.
      if (canScout) {
        const adj = adjacentRooms(base.name);
        const haveAll = adj.length > 0 && adj.every(
          (r) => mem.intel[r] && Game.time - mem.intel[r].lastSeen < INTEL_TTL,
        );
        if (!haveAll) mem.state = "scouting";
      }
      break;

    case "scouting": {
      const adj = adjacentRooms(base.name);
      const haveAll = adj.every((r) => mem.intel[r] && Game.time - mem.intel[r].lastSeen < INTEL_TTL);
      if (haveAll) {
        if (canExpand) {
          const target = pickTarget(base);
          if (target) {
            mem.targetRoom = target;
            mem.state = "claiming";
          } else {
            mem.state = "idle"; // nothing worth claiming nearby; retry later
          }
        } else {
          // Intel gathered but not yet eligible to claim; stay idle until the
          // full expansion gate opens, then re-enter scouting with fresh intel.
          mem.state = "idle";
        }
      }
      break;
    }

    case "claiming": {
      if (!canExpand) {
        // Gate closed mid-claim (e.g. storage destroyed); abort.
        mem.state = "idle";
        mem.targetRoom = undefined;
        break;
      }
      const room = mem.targetRoom ? Game.rooms[mem.targetRoom] : undefined;
      if (room && room.controller && room.controller.my) mem.state = "bootstrapping";
      break;
    }

    case "bootstrapping": {
      const room = mem.targetRoom ? Game.rooms[mem.targetRoom] : undefined;
      if (!room || !room.controller || !room.controller.my) {
        mem.state = "idle";
        mem.targetRoom = undefined;
        break;
      }
      if (room.find(FIND_MY_SPAWNS).length > 0) {
        // New room stands on its own — done expanding for now.
        mem.state = "idle";
        mem.targetRoom = undefined;
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Spawn requests (consumed by the spawn manager, base room only)
// ---------------------------------------------------------------------------

export function getExpansionSpawnRequest(room: Room, data: RoomData): SpawnRequest | null {
  const mem = ensureMem();
  const base = pickBaseRoom();
  if (!base || room.name !== base.name) return null;

  // Scout: allowed as soon as scoutingUnlocked, independent of the expansion gate
  // (scouting is cheap prep; waiting until the gate opens wastes thousands of ticks).
  if (mem.state === "scouting") {
    if (globalRoleCount("scout") === 0) {
      return { role: "scout", body: scoutBody(), memory: { role: "scout", homeRoom: base.name } };
    }
    return null;
  }

  // Bootstrapping: a room we already OWN needs pioneers to build its first spawn.
  // This MUST proceed regardless of expansion gates (room cap, storage, etc.) —
  // the gate is for starting NEW expansions, not for completing one in progress.
  // Without this, a claimed room sits at RCL 1 forever with zero upgrading.
  if (mem.state === "bootstrapping") {
    if (!mem.targetRoom) return null;
    if (pioneersFor(mem.targetRoom) < PIONEERS_PER_ROOM) {
      return {
        role: "pioneer",
        body: pioneerBody(data.energyCapacity),
        memory: { role: "pioneer", homeRoom: base.name, targetRoom: mem.targetRoom },
      };
    }
    return null;
  }

  // Claiming requires the full expansion gate (room headroom + mature base).
  if (!expansionUnlocked(base)) return null;

  if (mem.state === "claiming") {
    if (!mem.targetRoom) return null;
    const target = Game.rooms[mem.targetRoom];
    if (target && target.controller && target.controller.my) return null;
    if (globalRoleCount("claimer") === 0) {
      return {
        role: "claimer",
        body: claimerBody(data.energyCapacity),
        memory: { role: "claimer", homeRoom: base.name, targetRoom: mem.targetRoom },
      };
    }
    return null;
  }

  return null;
}
