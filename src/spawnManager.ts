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
 *
 * When `starvingRemote` is true, only consider harvester (skip builder/upgrader)
 * to conserve energy for the remote harvester spawn.
 */
function pickRole(starvingRemote: boolean = false): CreepRole | null {
  const census = getCensus();
  let bestRole: CreepRole | null = null;
  let bestPriority = Infinity;

  const rolesToConsider: CreepRole[] = starvingRemote
    ? ["harvester"]
    : ["harvester", "builder", "upgrader"];

  for (const role of rolesToConsider) {
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
  // 1. Remote mining (remoteHarvester / remoteHauler) — produces energy, try first
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

  // 2. Expansion (claimer/scout)
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

  return false;
}

/**
 * Return true if any active remote op currently has zero harvesters.
 * Used to boost priority — an op with no harvester produces zero energy
 * and needs urgent attention.
 */
function remoteOpNeedsHarvester(): boolean {
  const ops = Memory.remoteMining?.ops;
  if (!ops) return false;
  for (const key in ops) {
    const op = ops[key];
    if (op.state !== "active") continue;
    // Check via census whether any harvester is assigned to this op's sources
    const census = getCensus();
    for (const src of op.sources) {
      if ((census.harvestersBySource[src.id] ?? 0) === 0) return true;
    }
  }
  return false;
}

/**
 * Run the spawn manager for a single spawn.
 * Attempts to spawn the highest-priority missing creep.
 *
 * Strategy: interleave base roles with remote-mining spawns.
 * If a remote op is starving (0 harvesters), remote spawns compete
 * every tick.  Otherwise, remote spawns compete every 3rd tick.
 * This avoids the chicken-and-egg deadlock where base roles never
 * fully satisfy and remote mining never starts.
 */
function runSpawn(spawn: StructureSpawn): void {
  if (spawn.spawning) return; // already busy

  const census = getCensus();
  const hasHarvester = (census.roleCounts["harvester"] ?? 0) > 0;
  const starvingRemote = remoteOpNeedsHarvester();

  // Allow remote-mining spawns to compete with base roles:
  //   - every tick if a remote op is starving (0 harvesters)
  //   - every 3rd tick otherwise (but only if we have a harvester)
  const tryRemoteNow =
    (starvingRemote && hasHarvester) ||
    (hasHarvester && Game.time % 3 === 0);

  if (tryRemoteNow) {
    if (trySpawnSpecial(spawn)) return;
  }

  // Satisfy base roles (harvester, builder, upgrader) —
  // but if a remote op is starving, only spawn harvesters (not builders/upgraders)
  // to preserve energy for the remote harvester.
  const role = pickRole(starvingRemote);
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
