/**
 * Cache v0.0.4 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache flush
 *   2. Expansion & remote-mining maintenance
 *   3. Spawn management (includes expansion/remote requests)
 *   4. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */

import { flushCache } from "./utils/cache";
import { runSpawnManager } from "./spawnManager";
import { runExpansionManager } from "./expansion";
import { runRemoteMiningManager } from "./remoteMining";
import { runHarvester } from "./roles/harvester";
import { runBuilder } from "./roles/builder";
import { runUpgrader } from "./roles/upgrader";
import { runClaimer } from "./roles/claimer";
import { runScout } from "./roles/scout";
import { runRemoteHarvester } from "./roles/remoteHarvester";
import { runRemoteHauler } from "./roles/remoteHauler";
import { CreepRole } from "./types";

/** Map role identifiers to their runner function. */
const ROLE_RUNNERS: Record<CreepRole, (creep: Creep) => void> = {
  harvester: runHarvester,
  builder: runBuilder,
  upgrader: runUpgrader,
  claimer: runClaimer,
  scout: runScout,
  remoteHarvester: runRemoteHarvester,
  remoteHauler: runRemoteHauler,
};

/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
export function loop(): void {
  // 1. Invalidate the per-tick cache
  flushCache();

  // 2. Run expansion maintenance (state transitions, intel)
  try {
    runExpansionManager();
  } catch (e) {
    // Swallow: an expansion error shouldn't kill the rest of the tick.
  }

  // 3. Run remote-mining maintenance (source evaluation, op lifecycle)
  try {
    runRemoteMiningManager();
  } catch (e) {
    // Swallow: a remote-mining error shouldn't kill the rest of the tick.
  }

  // 4. Run spawn management (decide what to spawn this tick)
  try {
    runSpawnManager();
  } catch (e) {
    // Swallow: a spawn error shouldn't kill the rest of the tick.
  }

  // 5. Dispatch each creep to its role runner
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    try {
      const role = creep.memory.role as CreepRole | undefined;
      if (role && ROLE_RUNNERS[role]) {
        ROLE_RUNNERS[role](creep);
      }
    } catch (e) {
      // Swallow: a single creep error shouldn't kill the rest of the tick.
    }
  }
}
