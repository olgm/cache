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

function runRoom(room: Room, census: Census): void {
  const data = getRoomData(room);
  const idleSpawns = data.spawns.filter((s) => !s.spawning);
  if (idleSpawns.length === 0) return;

  const targets = roleTargets(data, census.byRoom[room.name] || {});

  // Per-tick reservations so two idle spawns don't duplicate a role / source.
  const reserved: Record<string, number> = {};
  const reservedSources = new Set<string>();

  for (const spawn of idleSpawns) {
    // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
    if (needsEmergency(room.name, census, reserved)) {
      if (spawnEmergency(spawn, room, data)) bump(reserved, "harvester");
      continue;
    }

    // 2. Economy roles, by priority.
    const role = pickEconomyRole(targets, census, room.name, reserved);
    if (role) {
      if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources)) {
        bump(reserved, role);
      }
      continue;
    }

    // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
    const req = getExpansionSpawnRequest(room, data);
    if (req && data.energyAvailable >= bodyCost(req.body)) {
      spawnRequest(spawn, req);
    }
  }
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

function pickEconomyRole(
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

function trySpawnRole(
  spawn: StructureSpawn,
  room: Room,
  data: RoomData,
  role: CreepRole,
  census: Census,
  reserved: Record<string, number>,
  reservedSources: Set<string>,
): boolean {
  const body = bodyForRole(role, data.energyCapacity, data.rcl);
  if (data.energyAvailable < bodyCost(body)) return false; // wait for a full-size creep

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
