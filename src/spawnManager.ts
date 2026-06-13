/**
 * Cache v0.0.5 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 *
 * v0.0.5: Uses creep census (single Game.creeps pass) instead of
 * per-role countRole() loops. Eliminates 3 redundant iterations.
 */

import {
  CreepRole,
  TIER1_BODIES,
  TARGET_COUNTS,
  ROLE_PRIORITY,
  BODY_COST,
  EXPANSION_BODIES,
  REMOTE_BODIES,
} from "./types";
import { getExpansionSpawnRequest, onExpansionSpawn } from "./expansion";
import {
  getRemoteMiningSpawnRequest,
  onRemoteMiningSpawn,
} from "./remoteMining";
import { getCensus } from "./utils/creepCensus";

/** Compute the total energy cost of a body plan. */
function bodyCost(body: BodyPartConstant[]): number {
  let total = 0;
  for (const part of body) {
    total += BODY_COST[part];
  }
  return total;
}

/**
 * Choose the next creep role to spawn.
 * Returns null when all target counts are met.
 * Uses the pre-built creep census (no Game.creeps iteration).
 */
function pickRole(): CreepRole | null {
  const census = getCensus();
  let bestRole: CreepRole | null = null;
  let bestPriority = Infinity;

  for (const role of ["harvester", "builder", "upgrader"] as CreepRole[]) {
    const current = census.roleCounts[role] ?? 0;
    if (current >= TARGET_COUNTS[role]) continue;

    const priority = ROLE_PRIORITY[role];
    if (priority < bestPriority) {
      bestPriority = priority;
      bestRole = role;
    }
  }

  return bestRole;
}

/** Unique incremental id for creep naming. */
let nextId = 1;

/**
 * Try to spawn an expansion or remote-mining creep.
 * Returns true if a spawn was queued.
 */
function trySpawnSpecial(spawn: StructureSpawn): boolean {
  // 1. Expansion (claimer/scout)
  const expReq = getExpansionSpawnRequest();
  if (expReq) {
    const cost = bodyCost(expReq.body);
    if (spawn.room.energyAvailable >= cost) {
      const name = `${expReq.role}_${nextId++}_${Game.time}`;
      const ret = spawn.spawnCreep(expReq.body, name, {
        memory: { role: expReq.role },
      });
      if (ret === OK) {
        onExpansionSpawn(expReq.role, name);
        return true;
      }
    }
  }

  // 2. Remote mining (remoteHarvester / remoteHauler)
  const remoteReq = getRemoteMiningSpawnRequest();
  if (remoteReq) {
    const cost = bodyCost(remoteReq.body);
    if (spawn.room.energyAvailable >= cost) {
      const name = `${remoteReq.role}_${nextId++}_${Game.time}`;
      const ret = spawn.spawnCreep(remoteReq.body, name, {
        memory: { role: remoteReq.role },
      });
      if (ret === OK) {
        onRemoteMiningSpawn(
          remoteReq.role,
          name,
          remoteReq.targetId,
          remoteReq.homeRoom,
        );
        return true;
      }
    }
  }

  return false;
}

/**
 * Run the spawn manager for a single spawn.
 * Attempts to spawn the highest-priority missing creep.
 */
function runSpawn(spawn: StructureSpawn): void {
  if (spawn.spawning) return; // already busy

  // First: satisfy base roles (harvester, builder, upgrader)
  const role = pickRole();
  if (role) {
    const body = TIER1_BODIES[role];
    if (!body) return;
    const cost = bodyCost(body);
    if (spawn.room.energyAvailable < cost) return; // not enough energy

    const name = `${role[0].toUpperCase()}${role.slice(1)}_${nextId++}_${Game.time}`;
    const ret = spawn.spawnCreep(body, name, {
      memory: { role },
    });

    if (ret === OK) {
      // Successfully queued.
    }
    return;
  }

  // Base roles satisfied — try expansion / remote-mining spawns
  trySpawnSpecial(spawn);
}

/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
export function runSpawnManager(): void {
  for (const name in Game.spawns) {
    runSpawn(Game.spawns[name]);
  }
}
