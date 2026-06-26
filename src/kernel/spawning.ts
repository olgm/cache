/**
 * Cache — Spawn manager (per-room, prioritized, self-healing).
 *
 * For each owned room with a free spawn it spawns the highest-priority missing
 * creep, sizing the body to the room's full energy capacity (so creeps grow with
 * the colony) and waiting until that body is affordable rather than producing
 * runts. The exception is the emergency path: if the room's energy-delivery
 * pipeline has collapsed (no harvesters AND no miners-or-haulers), it
 * immediately spawns a self-sufficient harvester sized to whatever energy is on
 * hand — the safety net that lets a colony recover from a wipe.
 */

import { BODY_COST, CreepRole } from "../types";
import { bodyForRole, roleTargets, ROLE_PRIORITY, RoleTargets } from "../config";
import { buildCensus, Census, roleCount } from "../utils/census";
import { getRoomData, myRooms, RoomData } from "../utils/roomData";
import { getExpansionSpawnRequest, SpawnRequest } from "../expansion";
import {
  getRemoteMiningSpawnRequest,
  remoteHarvesterTargetForRoom,
  pickRemoteSource,
  ensureRemoteMiningMemory,
} from "./remoteMining";

let nextId = 0;

function bodyCost(body: BodyPartConstant[]): number {
  let c = 0;
  for (const p of body) c += BODY_COST[p];
  return c;
}

export function runSpawnManager(): void {
  const census = buildCensus();
  for (const room of myRooms()) {
    try {
      runRoom(room, census);
    } catch (e) {
      console.log(`CACHE spawn error in ${room.name}: ${(e as Error)?.message}`);
    }
  }
}

/**
 * Consecutive ticks the spawn may want a creep it cannot afford before it gives
 * up waiting and builds a smaller, affordable one. Long enough that a healthy
 * room's normal refill wait never trips it; short enough to escape a population
 * collapse in minutes rather than hours.
 */
const SPAWN_STALL_LIMIT = 50;

function runRoom(room: Room, census: Census): void {
  const data = getRoomData(room);
  // A spawn that is mid-build is making progress — never count it as stalled.
  if (data.spawns.some((s) => s.spawning)) room.memory.spawnStall = 0;
  const idleSpawns = data.spawns.filter((s) => !s.spawning);
  if (idleSpawns.length === 0) return;

  const targets = roleTargets(data, census.byRoom[room.name] || {});

  // Merge the remoteHarvester target into the economy role targets so it competes
  // by priority (priority 3, between hauler and builder) instead of being gated
  // behind a fully-satisfied economy.  Without this, the spawn loop never reaches
  // step 3 (remote mining) when any economy role is under target — the common
  // case where upgraders are perpetually 1-2 below their desired count, blocking
  // remoteHarvester spawning forever.
  const remoteTarget = remoteHarvesterTargetForRoom(room);
  if (remoteTarget > 0) targets.remoteHarvester = remoteTarget;

  // Per-tick reservations so two idle spawns don't duplicate a role / source.
  const reserved: Record<string, number> = {};
  const reservedSources = new Set<string>();

  // Recovery: the spawn has wanted a creep it could not afford for too long
  // (a hauler/population collapse). Size bodies to energy on hand until it gets
  // going again, so it never idles forever waiting for a body it can't fund.
  const recovering = (room.memory.spawnStall || 0) >= SPAWN_STALL_LIMIT;

  // Did the spawn want an economy creep this tick but fail to afford it?
  let stuck = false;
  for (const spawn of idleSpawns) {
    // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
    if (needsEmergency(room.name, census, reserved)) {
      if (spawnEmergency(spawn, room, data)) bump(reserved, "harvester");
      else stuck = true;
      continue;
    }

    // 2. Economy roles + remoteHarvester, by priority.
    const role = pickEconomyRole(targets, census, room.name, reserved);
    if (role) {
      if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering)) {
        bump(reserved, role);
      } else {
        stuck = true;
      }
      continue;
    }

    // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
    const req = getExpansionSpawnRequest(room, data);
    if (req && data.energyAvailable >= bodyCost(req.body)) {
      spawnRequest(spawn, req);
    }
  }

  // Count consecutive stalled ticks; any successful spawn (or nothing wanted)
  // clears it. Crossing SPAWN_STALL_LIMIT flips on recovery sizing next tick.
  room.memory.spawnStall = stuck ? (room.memory.spawnStall || 0) + 1 : 0;
}

// ---------------------------------------------------------------------------
// Emergency bootstrap
// ---------------------------------------------------------------------------

/**
 * True when no one can refill the spawn: there are zero harvesters AND
 * (zero miners OR zero haulers). In either case energy stops reaching the spawn,
 * so we must spawn a self-sufficient harvester immediately.
 */
function needsEmergency(home: string, census: Census, reserved: Record<string, number>): boolean {
  const harvesters = roleCount(census, home, "harvester") + (reserved.harvester || 0);
  if (harvesters > 0) return false;
  const miners = roleCount(census, home, "miner") + (reserved.miner || 0);
  const haulers = roleCount(census, home, "hauler") + (reserved.hauler || 0);
  return miners === 0 || haulers === 0;
}

function spawnEmergency(spawn: StructureSpawn, room: Room, data: RoomData): boolean {
  // Size to energy ON HAND (don't wait for capacity we can't fill).
  const budget = Math.max(BODY_COST.work + BODY_COST.carry + BODY_COST.move, data.energyAvailable);
  const body = bodyForRole("harvester", budget, data.rcl);
  if (data.energyAvailable < bodyCost(body)) return false;
  return spawn.spawnCreep(body, name("harvester"), {
    memory: { role: "harvester", homeRoom: room.name, bootstrap: true },
  }) === OK;
}

// ---------------------------------------------------------------------------
// Economy roles
// ---------------------------------------------------------------------------

/**
 * Pick the highest-priority role this room is under target on (or null if all
 * are satisfied). Exported for unit testing — it is the seam where the
 * ROLE_PRIORITY ordering decides whether builders ever get spawned ahead of the
 * upgrader fleet (see spawn-priority.test).
 */
export function pickEconomyRole(
  targets: RoleTargets,
  census: Census,
  home: string,
  reserved: Record<string, number>,
): CreepRole | null {
  const roles = (Object.keys(targets) as CreepRole[]).filter((r) => (targets[r] || 0) > 0);
  roles.sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b]);
  for (const role of roles) {
    const want = targets[role] || 0;
    const have = roleCount(census, home, role) + (reserved[role] || 0);
    if (have < want) return role;
  }
  return null;
}

/**
 * Spawn-energy budget for a normal economy creep.
 *
 * Capacity-sized (energyCapacityAvailable) in normal operation — bigger creeps
 * are more efficient, and a healthy hauler fleet keeps the spawn topped up so we
 * can afford them. But sized to energy ON HAND in two cases where waiting for a
 * full body would stall forever:
 *   - bootstrap: no source container yet, so the room cannot fill its capacity;
 *   - degraded: post-bootstrap but the hauler fleet has collapsed to zero, so
 *     energy no longer reaches the spawn (immediate trigger);
 *   - recovering: the spawn has been stalled (wanting an unaffordable creep) past
 *     SPAWN_STALL_LIMIT — the robust escape that also covers a partial collapse
 *     (e.g. one tiny hauler), where `degraded` has already switched off but the
 *     room still can't fill a capacity body. Without it the colony plateaus at a
 *     few creeps for hours (the observed RCL5 collapse: a full-capacity body of
 *     1800 was unaffordable, so nothing spawned and nothing recovered).
 * In all three, sizing to available lets the spawn produce a smaller creep NOW,
 * which restarts energy flow and recovers (mirrors the emergency-bootstrap path).
 */
export function economyBudget(data: RoomData, haulers: number, recovering: boolean): number {
  const bootstrapping = data.sources.every((s) => !s.container);
  const degraded = !bootstrapping && haulers === 0;
  if (bootstrapping || degraded || recovering) {
    return Math.max(BODY_COST.work + BODY_COST.carry + BODY_COST.move, data.energyAvailable);
  }
  return data.energyCapacity;
}

function trySpawnRole(
  spawn: StructureSpawn,
  room: Room,
  data: RoomData,
  role: CreepRole,
  census: Census,
  reserved: Record<string, number>,
  reservedSources: Set<string>,
  recovering: boolean,
): boolean {
  // Size the body to what the colony can actually fund right now (see
  // economyBudget): capacity-sized in normal operation, but sized to energy on
  // hand during bootstrap, a hauler collapse, or a prolonged stall.
  //
  // CRITICAL FALLBACK: when the capacity budget produces a body the spawn cannot
  // yet afford, we retry with an available-energy budget immediately instead of
  // waiting for the 50-tick stall recovery.  The stall counter is reset every
  // time ANY creep spawns (e.g. replacing a dying builder), so a room that can
  // always fund a 300e builder but never an 1800e upgrader would cycle forever
  // — the spawn would never reach recovery and zero upgraders would be spawned
  // (the observed "RCL 5, 0 upgraders" pathology).
  const haulers = roleCount(census, room.name, "hauler") + (reserved.hauler || 0);
  const budget = economyBudget(data, haulers, recovering);
  let body = bodyForRole(role, budget, data.rcl);
  if (data.energyAvailable < bodyCost(body)) {
    // Fall back to an available-energy body: a smaller creep NOW is infinitely
    // better than an idle spawn waiting for capacity it may never reach.
    body = bodyForRole(role, data.energyAvailable, data.rcl);
  }
  if (data.energyAvailable < bodyCost(body)) return false; // can't afford even the minimal body

  const memory: CreepMemory = { role, homeRoom: room.name };

  if (role === "miner") {
    const sid = pickFreeContainerSource(data, census, reservedSources);
    if (!sid) return false;
    memory.sourceId = sid;
    reservedSources.add(sid);
  }

  return spawn.spawnCreep(body, name(role), { memory }) === OK;
}

/** A source with a container but no miner assigned (and not reserved this tick). */
function pickFreeContainerSource(
  data: RoomData,
  census: Census,
  reservedSources: Set<string>,
): Id<Source> | null {
  for (const sd of data.sources) {
    if (!sd.container) continue;
    const id = sd.source.id;
    if ((census.minersBySource[id] || 0) > 0) continue;
    if (reservedSources.has(id)) continue;
    return id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function spawnRequest(spawn: StructureSpawn, req: SpawnRequest): void {
  spawn.spawnCreep(req.body, name(req.memory.role), { memory: req.memory });
}

function name(role: CreepRole): string {
  return `${role}_${Game.time}_${nextId++}`;
}

function bump(reserved: Record<string, number>, role: string): void {
  reserved[role] = (reserved[role] || 0) + 1;
}
