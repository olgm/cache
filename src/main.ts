/**
 * Cache v0.0.5 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache & census flush
 *   2. Expansion & remote-mining maintenance
 *   3. Spawn management (includes expansion/remote requests)
 *   4. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */

import { flushCache } from "./utils/cache";
import { flushCensus, ensureCensus } from "./utils/creepCensus";
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
  // 1. Invalidate the per-tick caches
  flushCache();
  flushCensus();

  // 2. Build creep census once (single Game.creeps pass) before
  //    any module asks for it — avoids lazy builds mid-tick.
  ensureCensus();

  // 3. Run expansion maintenance (state transitions, intel)
  try {
    runExpansionManager();
  } catch (e) {
    // Swallow: an expansion error shouldn't kill the rest of the tick.
  }

  // 4. Run remote-mining maintenance (source evaluation, op lifecycle)
  try {
    runRemoteMiningManager();
  } catch (e) {
    // Swallow: a remote-mining error shouldn't kill the rest of the tick.
  }

  // 5. Run spawn management (decide what to spawn this tick)
  try {
    runSpawnManager();
  } catch (e) {
    // Swallow: a spawn error shouldn't kill the rest of the tick.
  }

  // 6. Dispatch each creep to its role runner
  //    NOTE: This is a second Game.creeps pass. The census above
  //    already did one pass. This second pass is for role dispatch
  //    which can't be merged because spawn/expansion managers need
  //    the census data *before* creep actions.
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
