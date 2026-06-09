/**
 * Cache v0.0.1 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 */

import {
  CreepRole,
  TIER1_BODIES,
  TARGET_COUNTS,
  ROLE_PRIORITY,
  BODY_COST,
} from "./types";

/** Compute the total energy cost of a body plan. */
function bodyCost(body: BodyPartConstant[]): number {
  let total = 0;
  for (const part of body) {
    total += BODY_COST[part];
  }
  return total;
}

/** Count living creeps assigned to a given role. */
function countRole(role: CreepRole): number {
  let n = 0;
  for (const name in Game.creeps) {
    if (Game.creeps[name].memory.role === role) {
      n++;
    }
  }
  return n;
}

/**
 * Choose the next creep role to spawn.
 * Returns null when all target counts are met.
 */
function pickRole(): CreepRole | null {
  let bestRole: CreepRole | null = null;
  let bestPriority = Infinity;

  for (const role of ["harvester", "builder", "upgrader"] as CreepRole[]) {
    const current = countRole(role);
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
 * Run the spawn manager for a single spawn.
 * Attempts to spawn the highest-priority missing creep.
 */
function runSpawn(spawn: StructureSpawn): void {
  if (spawn.spawning) return; // already busy

  const role = pickRole();
  if (!role) return; // all counts satisfied

  const body = TIER1_BODIES[role];
  const cost = bodyCost(body);

  if (spawn.room.energyAvailable < cost) return; // not enough energy

  const name = `${role[0].toUpperCase()}${role.slice(1)}_${nextId++}_${Game.time}`;
  const ret = spawn.spawnCreep(body, name, {
    memory: { role },
  });

  if (ret === OK) {
    // Successfully queued — log for debugging, no-op in production.
  }
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
