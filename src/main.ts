/**
 * Cache v0.0.1 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache flush
 *   2. Spawn management
 *   3. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */

import { flushCache } from "./utils/cache";
import { runSpawnManager } from "./spawnManager";
import { runHarvester } from "./roles/harvester";
import { runBuilder } from "./roles/builder";
import { runUpgrader } from "./roles/upgrader";
import { CreepRole } from "./types";

/** Map role identifiers to their runner function. */
const ROLE_RUNNERS: Record<CreepRole, (creep: Creep) => void> = {
  harvester: runHarvester,
  builder: runBuilder,
  upgrader: runUpgrader,
};

/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
export function loop(): void {
  // 1. Invalidate the per-tick cache
  flushCache();

  // 2. Run spawn management (decide what to spawn this tick)
  try {
    runSpawnManager();
  } catch (e) {
    // Swallow: a spawn error shouldn't kill the rest of the tick.
  }

  // 3. Dispatch each creep to its role runner
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
